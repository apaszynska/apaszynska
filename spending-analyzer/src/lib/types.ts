export type CategoryId =
  | 'groceries'
  | 'bars'
  | 'restaurants'
  | 'transport'
  | 'flights'
  | 'subscriptions'
  | 'housing'
  | 'health'
  | 'shopping'
  | 'transfers'
  | 'income'
  | 'other'

export type SpendKind = 'essential' | 'discretionary' | 'neutral' | 'income'

export interface CategoryMeta {
  id: CategoryId
  label: string
  kind: SpendKind
  color: string
}

export interface Transaction {
  id: string
  date: Date
  description: string
  merchant: string
  amount: number
  currency: string
  category: CategoryId
  raw: Record<string, string>
}

export interface ParseWarning {
  message: string
  row?: number
}

export interface ParseResult {
  transactions: Transaction[]
  warnings: ParseWarning[]
  detectedDelimiter: string
  detectedEncoding: string
  columnMapping: ColumnMapping
}

export interface ColumnMapping {
  date?: string
  description?: string
  amount?: string
  currency?: string
  merchant?: string
}

export type PeriodFilter = 'all' | string // 'all' | 'YYYY-MM'
