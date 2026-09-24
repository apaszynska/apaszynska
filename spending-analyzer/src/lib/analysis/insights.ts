import { format } from 'date-fns'
import { pl } from 'date-fns/locale'
import { CATEGORIES, CATEGORY_ORDER } from '../categories/meta'
import type { CategoryId, PeriodFilter, SpendKind, Transaction } from '../types'

export function monthKey(d: Date): string {
  return format(d, 'yyyy-MM')
}

export function monthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number)
  const d = new Date(y, m - 1, 1)
  return format(d, 'LLLL yyyy', { locale: pl })
}

export function availableMonths(transactions: Transaction[]): string[] {
  const set = new Set(transactions.map((t) => monthKey(t.date)))
  return [...set].sort().reverse()
}

export function filterByPeriod(
  transactions: Transaction[],
  period: PeriodFilter,
): Transaction[] {
  if (period === 'all') return transactions
  return transactions.filter((t) => monthKey(t.date) === period)
}

export interface CategoryTotal {
  id: CategoryId
  label: string
  amount: number
  kind: SpendKind
  color: string
  share: number
}

export function expenseTransactions(transactions: Transaction[]): Transaction[] {
  return transactions.filter(
    (t) => t.amount < 0 && t.category !== 'income' && t.category !== 'transfers',
  )
}

/** All outflows including transfers (for raw totals if needed). */
export function outflowTransactions(transactions: Transaction[]): Transaction[] {
  return transactions.filter((t) => t.amount < 0 && t.category !== 'income')
}

export function incomeTotal(transactions: Transaction[]): number {
  return transactions.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0)
}

export function expenseTotal(transactions: Transaction[]): number {
  return expenseTransactions(transactions).reduce((s, t) => s + Math.abs(t.amount), 0)
}

export function totalsByCategory(transactions: Transaction[]): CategoryTotal[] {
  const expenses = expenseTransactions(transactions)
  const total = expenses.reduce((s, t) => s + Math.abs(t.amount), 0)
  const map = new Map<CategoryId, number>()

  for (const t of expenses) {
    map.set(t.category, (map.get(t.category) ?? 0) + Math.abs(t.amount))
  }

  return CATEGORY_ORDER.filter((id) => id !== 'income')
    .map((id) => {
      const amount = map.get(id) ?? 0
      const meta = CATEGORIES[id]
      return {
        id,
        label: meta.label,
        amount,
        kind: meta.kind,
        color: meta.color,
        share: total > 0 ? amount / total : 0,
      }
    })
    .filter((c) => c.amount > 0)
    .sort((a, b) => b.amount - a.amount)
}

export interface MerchantTotal {
  merchant: string
  amount: number
  category: CategoryId
  count: number
}

export function topMerchants(
  transactions: Transaction[],
  limit = 8,
): MerchantTotal[] {
  const expenses = expenseTransactions(transactions)
  const map = new Map<string, MerchantTotal>()

  for (const t of expenses) {
    const key = t.merchant
    const prev = map.get(key)
    if (prev) {
      prev.amount += Math.abs(t.amount)
      prev.count += 1
    } else {
      map.set(key, {
        merchant: key,
        amount: Math.abs(t.amount),
        category: t.category,
        count: 1,
      })
    }
  }

  return [...map.values()].sort((a, b) => b.amount - a.amount).slice(0, limit)
}

export interface TrendPoint {
  month: string
  label: string
  expenses: number
  discretionary: number
  essential: number
}

export function monthlyTrend(transactions: Transaction[]): TrendPoint[] {
  const months = availableMonths(transactions).slice().reverse()
  return months.map((m) => {
    const txs = filterByPeriod(transactions, m)
    const expenses = expenseTransactions(txs)
    let discretionary = 0
    let essential = 0
    let total = 0
    for (const t of expenses) {
      const abs = Math.abs(t.amount)
      total += abs
      const kind = CATEGORIES[t.category].kind
      if (kind === 'discretionary') discretionary += abs
      if (kind === 'essential') essential += abs
    }
    return {
      month: m,
      label: format(new Date(Number(m.slice(0, 4)), Number(m.slice(5)) - 1, 1), 'LLL', {
        locale: pl,
      }),
      expenses: total,
      discretionary,
      essential,
    }
  })
}

export interface SaveHint {
  id: string
  title: string
  detail: string
  amount: number
  severity: 'high' | 'medium' | 'low'
}

export function buildSaveHints(transactions: Transaction[]): SaveHint[] {
  const expenses = expenseTransactions(transactions)
  const total = expenses.reduce((s, t) => s + Math.abs(t.amount), 0)
  const byCat = totalsByCategory(transactions)
  const hints: SaveHint[] = []

  const discretionary = byCat
    .filter((c) => c.kind === 'discretionary')
    .reduce((s, c) => s + c.amount, 0)
  const essential = byCat
    .filter((c) => c.kind === 'essential')
    .reduce((s, c) => s + c.amount, 0)

  if (total > 0 && discretionary / total >= 0.35) {
    hints.push({
      id: 'disc-share',
      title: 'Duży udział wydatków uznaniowych',
      detail: `Bary, restauracje, zakupy i podróże to ${Math.round(
        (discretionary / total) * 100,
      )}% wydatków. Ograniczenie o 20% dałoby ok. ${formatMoney(discretionary * 0.2)}.`,
      amount: discretionary * 0.2,
      severity: 'high',
    })
  }

  const bars = byCat.find((c) => c.id === 'bars')
  const restaurants = byCat.find((c) => c.id === 'restaurants')
  const foodOut = (bars?.amount ?? 0) + (restaurants?.amount ?? 0)
  if (foodOut > 0 && total > 0 && foodOut / total >= 0.12) {
    hints.push({
      id: 'eating-out',
      title: 'Jedzenie na mieście',
      detail: `Kawiarnie i restauracje: ${formatMoney(foodOut)}. Nawet połowa z tego w domu to realna oszczędność.`,
      amount: foodOut * 0.5,
      severity: foodOut / total >= 0.2 ? 'high' : 'medium',
    })
  }

  const subs = byCat.find((c) => c.id === 'subscriptions')
  if (subs && subs.amount > 0) {
    hints.push({
      id: 'subs',
      title: 'Subskrypcje',
      detail: `Stałe opłaty: ${formatMoney(subs.amount)}. Sprawdź, z których realnie korzystasz.`,
      amount: subs.amount * 0.3,
      severity: 'medium',
    })
  }

  const flights = byCat.find((c) => c.id === 'flights')
  if (flights && flights.amount > 0 && total > 0 && flights.share >= 0.1) {
    hints.push({
      id: 'travel',
      title: 'Podróże i bilety',
      detail: `Loty / podróże: ${formatMoney(flights.amount)}. Warto planować z wyprzedzeniem albo ograniczyć częstotliwość.`,
      amount: flights.amount * 0.15,
      severity: 'low',
    })
  }

  const shopping = byCat.find((c) => c.id === 'shopping')
  if (shopping && shopping.amount > 0 && total > 0 && shopping.share >= 0.1) {
    hints.push({
      id: 'shopping',
      title: 'Zakupy nieżywnościowe',
      detail: `Odzież i sklepy: ${formatMoney(shopping.amount)}. Reguła 48h przed większym zakupem często pomaga.`,
      amount: shopping.amount * 0.25,
      severity: 'medium',
    })
  }

  if (hints.length === 0 && total > 0) {
    hints.push({
      id: 'ok',
      title: 'Wydatki wyglądają zrównoważone',
      detail: `Uznaniowe ${formatMoney(discretionary)} vs niezbędne ${formatMoney(essential)}. Dalej warto pilnować trendu miesiąc do miesiąca.`,
      amount: 0,
      severity: 'low',
    })
  }

  return hints.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 }
    return order[a.severity] - order[b.severity]
  })
}

export function formatMoney(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount)
}
