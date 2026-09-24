import Papa from 'papaparse'
import { categorizeTransaction, guessMerchant } from '../categories/categorize'
import type { ColumnMapping, ParseResult, ParseWarning, Transaction } from '../types'
import { isPiiColumn, mapColumns } from './columns'
import { detectDelimiter, parseAmount, parseDate } from './numbers'

const ENCODINGS = ['utf-8', 'windows-1250', 'iso-8859-2'] as const

async function decodeBuffer(buffer: ArrayBuffer): Promise<{ text: string; encoding: string }> {
  // Try UTF-8 first (with BOM), then Windows-1250 / ISO-8859-2 for Polish banks
  const bytes = new Uint8Array(buffer)

  // UTF-8 BOM
  if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    return { text: new TextDecoder('utf-8').decode(bytes), encoding: 'utf-8' }
  }

  for (const enc of ENCODINGS) {
    try {
      const text = new TextDecoder(enc, { fatal: enc === 'utf-8' }).decode(bytes)
      // Heuristic: if UTF-8 fatal failed we'd skip; for others check replacement spam
      const bad = (text.match(/\uFFFD/g) ?? []).length
      if (bad > 3) continue
      return { text, encoding: enc }
    } catch {
      continue
    }
  }

  return { text: new TextDecoder('utf-8').decode(bytes), encoding: 'utf-8' }
}

function sanitizeRaw(row: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(row)) {
    if (isPiiColumn(k)) continue
    // Drop long digit runs that look like accounts even in free text columns
    out[k] = String(v ?? '').replace(/\b[A-Z]{2}\d{2}[A-Z0-9]{10,}\b/g, '[IBAN]')
  }
  return out
}

function looksLikePersonName(name: string): boolean {
  const s = name.trim()
  if (!s) return false
  // Brand markers → merchant
  if (
    /\b(gmbh|ltd|llc|s\.?a\.?|sp\.?\s*z|inc|ag|oy|ab|bv|plc|paypal|uber|amazon|google|apple|sumup|zettle|revolut)\b/i.test(
      s,
    )
  ) {
    return false
  }
  // Two+ Capitalized words without digits/symbols often = person
  const parts = s.split(/\s+/).filter(Boolean)
  if (parts.length >= 2 && parts.length <= 4) {
    const allNames = parts.every((p) => /^[\p{L}][\p{L}'-]+$/u.test(p))
    const hasDigit = /\d/.test(s)
    if (allNames && !hasDigit) return true
  }
  return false
}

function displayMerchant(partner: string, type: string, description: string): string {
  const t = type.toLowerCase()
  if (
    looksLikePersonName(partner) ||
    t.includes('moneybeam') ||
    (t.includes('transfer') && looksLikePersonName(partner))
  ) {
    return 'Przelew prywatny'
  }
  if (partner.trim()) return partner.trim().slice(0, 64)
  return guessMerchant(description)
}

function pickDescription(
  row: Record<string, string>,
  mapping: ColumnMapping,
  merchant: string,
): string {
  const ref = mapping.description ? (row[mapping.description] ?? '').trim() : ''
  const type = (row['Type'] ?? row['type'] ?? '').trim()
  // Prefer payment reference when present; else type + merchant (no PII)
  if (ref) {
    // Scrub account-like numbers from reference
    return ref.replace(/\b\d{6,}\b/g, '[…]').slice(0, 120)
  }
  if (type) return `${type}: ${merchant}`.slice(0, 120)
  return merchant
}

function rowToTransaction(
  row: Record<string, string>,
  mapping: ColumnMapping,
  index: number,
): { tx?: Transaction; warning?: ParseWarning } {
  if (!mapping.date || !mapping.amount) {
    return { warning: { message: 'Brak wymaganych kolumn (data, kwota).', row: index } }
  }

  const dateRaw = row[mapping.date] ?? ''
  const amountRaw = row[mapping.amount] ?? ''
  const date = parseDate(dateRaw)
  const amount = parseAmount(amountRaw)

  if (!date) {
    return { warning: { message: `Nieparsowalna data: "${dateRaw}"`, row: index } }
  }
  if (amount === null) {
    return { warning: { message: `Nieparsowalna kwota: "${amountRaw}"`, row: index } }
  }

  const partner = mapping.merchant ? (row[mapping.merchant] ?? '') : ''
  const type = row['Type'] ?? ''
  const merchant = displayMerchant(partner, type, '')
  const description = pickDescription(row, mapping, merchant)
  const currency =
    (mapping.currency ? row[mapping.currency] : '') ||
    (/\(([A-Z]{3})\)/.exec(mapping.amount)?.[1] ?? 'EUR')

  // Type-based category hints before keyword rules
  let category = categorizeTransaction(description, `${merchant} ${partner}`, amount)
  const tl = type.toLowerCase()
  if (tl.includes('moneybeam') || tl === 'debit transfer') {
    if (amount < 0) category = 'transfers'
  }
  if (tl === 'credit transfer' && amount > 0) {
    category = 'income'
  }
  if (tl === 'fee') {
    category = 'other'
  }

  const tx: Transaction = {
    id: `tx-${index}-${date.toISOString().slice(0, 10)}-${amount}`,
    date,
    description,
    merchant,
    amount,
    currency: currency || 'EUR',
    category,
    raw: sanitizeRaw(row),
  }
  return { tx }
}

export async function parseBankCsv(file: File | Blob): Promise<ParseResult> {
  const buffer = await file.arrayBuffer()
  const { text, encoding } = await decodeBuffer(buffer)
  return parseBankCsvText(text, encoding)
}

export function parseBankCsvText(text: string, encoding = 'utf-8'): ParseResult {
  const delimiter = detectDelimiter(text)
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    delimiter,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  })

  const warnings: ParseWarning[] = []
  if (parsed.errors.length) {
    for (const err of parsed.errors.slice(0, 5)) {
      warnings.push({ message: err.message, row: err.row })
    }
  }

  const headers = parsed.meta.fields ?? []
  const columnMapping = mapColumns(headers)

  if (!columnMapping.date || !columnMapping.amount) {
    warnings.push({
      message:
        'Nie wykryto kolumn daty/kwoty. Oczekiwane m.in. "Booking Date" + "Amount (EUR)" albo "Data operacji" + "Kwota".',
    })
  }

  const transactions: Transaction[] = []
  parsed.data.forEach((row, i) => {
    const { tx, warning } = rowToTransaction(row, columnMapping, i + 2)
    if (warning) warnings.push(warning)
    if (tx) transactions.push(tx)
  })

  transactions.sort((a, b) => b.date.getTime() - a.date.getTime())

  return {
    transactions,
    warnings,
    detectedDelimiter: delimiter === '\t' ? 'tab' : delimiter,
    detectedEncoding: encoding,
    columnMapping,
  }
}
