import type { CategoryId, CategoryMeta } from '../types'

export const CATEGORIES: Record<CategoryId, CategoryMeta> = {
  groceries: {
    id: 'groceries',
    label: 'Zakupy spożywcze',
    kind: 'essential',
    color: '#2f6b4f',
  },
  bars: {
    id: 'bars',
    label: 'Bary i kawiarnie',
    kind: 'discretionary',
    color: '#b45309',
  },
  restaurants: {
    id: 'restaurants',
    label: 'Restauracje',
    kind: 'discretionary',
    color: '#c2410c',
  },
  transport: {
    id: 'transport',
    label: 'Transport',
    kind: 'essential',
    color: '#1d4e63',
  },
  flights: {
    id: 'flights',
    label: 'Loty i podróże',
    kind: 'discretionary',
    color: '#0e7490',
  },
  subscriptions: {
    id: 'subscriptions',
    label: 'Subskrypcje',
    kind: 'discretionary',
    color: '#0f5c5c',
  },
  housing: {
    id: 'housing',
    label: 'Mieszkanie',
    kind: 'essential',
    color: '#374151',
  },
  health: {
    id: 'health',
    label: 'Zdrowie',
    kind: 'essential',
    color: '#0f766e',
  },
  shopping: {
    id: 'shopping',
    label: 'Zakupy',
    kind: 'discretionary',
    color: '#9a3412',
  },
  transfers: {
    id: 'transfers',
    label: 'Przelewy',
    kind: 'neutral',
    color: '#64748b',
  },
  income: {
    id: 'income',
    label: 'Wpływy',
    kind: 'income',
    color: '#15803d',
  },
  other: {
    id: 'other',
    label: 'Inne',
    kind: 'neutral',
    color: '#94a3b8',
  },
}

export const CATEGORY_ORDER: CategoryId[] = [
  'groceries',
  'bars',
  'restaurants',
  'transport',
  'flights',
  'subscriptions',
  'housing',
  'health',
  'shopping',
  'transfers',
  'income',
  'other',
]
