import type { CategoryId } from '../types'
import { CATEGORY_RULES } from './rules'

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[*_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function matchesKeyword(haystack: string, keyword: string): boolean {
  const needle = normalizeText(keyword)
  if (!needle) return false
  return haystack.includes(needle)
}

/**
 * Assign a category using keyword/regex rules.
 * Positive amounts default toward income when no rule matches.
 */
export function categorizeTransaction(
  description: string,
  merchant: string,
  amount: number,
): CategoryId {
  const haystack = normalizeText(`${description} ${merchant}`)

  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some((kw) => matchesKeyword(haystack, kw))) {
      return rule.category
    }
    if (rule.patterns?.some((re) => re.test(`${description} ${merchant}`))) {
      return rule.category
    }
  }

  if (amount > 0) return 'income'
  return 'other'
}

export function guessMerchant(description: string): string {
  const cleaned = description
    .replace(/\s+/g, ' ')
    .replace(/^(zakup|płatność|platnosc|karta|blik|przelew)\s*[:\-–]?\s*/i, '')
    .trim()

  const withoutCity = cleaned.split(',')[0]?.trim() ?? cleaned
  const truncated = withoutCity.slice(0, 48).trim()
  return truncated || 'Nieznany'
}
