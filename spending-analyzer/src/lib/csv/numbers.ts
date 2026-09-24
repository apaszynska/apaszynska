/** Detect delimiter from a text sample (semicolon vs comma vs tab). */
export function detectDelimiter(sample: string): ',' | ';' | '\t' {
  const firstLines = sample.split(/\r?\n/).slice(0, 5).join('\n')
  const counts = {
    ';': (firstLines.match(/;/g) ?? []).length,
    ',': (firstLines.match(/,/g) ?? []).length,
    '\t': (firstLines.match(/\t/g) ?? []).length,
  }
  const best = (Object.entries(counts) as [',' | ';' | '\t', number][]).sort(
    (a, b) => b[1] - a[1],
  )[0]
  return best && best[1] > 0 ? best[0] : ','
}

/**
 * Parse Polish / EU number formats:
 * - 1.234,56 / -1.234,56
 * - 1234,56
 * - 1,234.56 / -4.90
 * - (1234.56)
 */
export function parseAmount(raw: string): number | null {
  let s = raw.trim()
  if (!s) return null

  let negative = false
  if (s.startsWith('(') && s.endsWith(')')) {
    negative = true
    s = s.slice(1, -1).trim()
  }
  if (s.startsWith('+')) s = s.slice(1).trim()
  if (s.startsWith('-')) {
    negative = true
    s = s.slice(1).trim()
  }

  s = s.replace(/\s/g, '').replace(/[zł€$£]/gi, '')

  const hasComma = s.includes(',')
  const hasDot = s.includes('.')

  if (hasComma && hasDot) {
    // Decide decimal by last separator
    if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
      // 1.234,56
      s = s.replace(/\./g, '').replace(',', '.')
    } else {
      // 1,234.56
      s = s.replace(/,/g, '')
    }
  } else if (hasComma && !hasDot) {
    // 1234,56 or 1,234 (ambiguous) — treat comma as decimal if ≤2 digits after
    const parts = s.split(',')
    if (parts.length === 2 && parts[1].length <= 2) {
      s = `${parts[0]}.${parts[1]}`
    } else {
      s = s.replace(/,/g, '')
    }
  }

  const n = Number(s)
  if (Number.isNaN(n)) return null
  return negative ? -Math.abs(n) : n
}

/**
 * Parse common date formats: YYYY-MM-DD, DD.MM.YYYY, DD/MM/YYYY, DD-MM-YYYY
 */
export function parseDate(raw: string): Date | null {
  const s = raw.trim()
  if (!s) return null

  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
  if (iso) {
    const d = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]))
    return Number.isNaN(d.getTime()) ? null : d
  }

  const eu = /^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/.exec(s)
  if (eu) {
    const d = new Date(Number(eu[3]), Number(eu[2]) - 1, Number(eu[1]))
    return Number.isNaN(d.getTime()) ? null : d
  }

  const fallback = new Date(s)
  return Number.isNaN(fallback.getTime()) ? null : fallback
}
