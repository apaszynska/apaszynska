import type { ColumnMapping } from '../types'

/** Header aliases → logical field (case-insensitive, trimmed). */
const ALIASES: Record<keyof ColumnMapping, string[]> = {
  date: [
    'booking date',
    'value date',
    'data operacji',
    'data księgowania',
    'data ksiegowania',
    'data transakcji',
    'data',
    'date',
    'bookingdate',
    'transaction date',
  ],
  description: [
    'payment reference',
    'tytuł',
    'tytul',
    'opis',
    'opis operacji',
    'description',
    'details',
    'title',
    'nazwa',
  ],
  merchant: [
    'partner name',
    'odbiorca',
    'nadawca',
    'kontrahent',
    'merchant',
    'nazwa odbiorcy',
    'payee',
    'partner',
  ],
  amount: [
    'amount (eur)',
    'amount (pln)',
    'kwota',
    'amount',
    'suma',
    'wartość',
    'wartosc',
    'kwota operacji',
  ],
  currency: [
    'original currency',
    'waluta',
    'currency',
    'ccy',
  ],
}

const PII_HEADER_PATTERNS = [
  /iban/i,
  /account\s*number/i,
  /nr\s*rachunku/i,
  /numer\s*rachunku/i,
  /pesel/i,
  /phone/i,
  /telefon/i,
  /address/i,
  /adres/i,
  /account\s*name/i,
]

export function isPiiColumn(header: string): boolean {
  return PII_HEADER_PATTERNS.some((re) => re.test(header))
}

function norm(h: string): string {
  return h.trim().toLowerCase().replace(/^"|"$/g, '')
}

/**
 * Map CSV headers to logical fields. First matching alias wins per field.
 * Prefers Booking Date over Value Date when both exist.
 */
export function mapColumns(headers: string[]): ColumnMapping {
  const normalized = headers.map((h) => ({ raw: h, key: norm(h) }))
  const mapping: ColumnMapping = {}

  for (const [field, aliases] of Object.entries(ALIASES) as [
    keyof ColumnMapping,
    string[],
  ][]) {
    for (const alias of aliases) {
      const hit = normalized.find((h) => h.key === alias)
      if (hit) {
        mapping[field] = hit.raw
        break
      }
    }
  }

  // Prefer Booking Date explicitly if present
  const booking = normalized.find((h) => h.key === 'booking date')
  if (booking) mapping.date = booking.raw

  return mapping
}
