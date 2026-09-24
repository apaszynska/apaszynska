import { format } from 'date-fns'
import type { CSSProperties } from 'react'
import { CATEGORIES } from '../lib/categories/meta'
import { formatMoney } from '../lib/analysis/insights'
import type { Transaction } from '../lib/types'

interface Props {
  transactions: Transaction[]
  currency: string
}

export function TransactionTable({ transactions, currency }: Props) {
  const rows = transactions.filter((t) => t.amount < 0).slice(0, 40)

  if (!rows.length) {
    return <p className="empty">Brak transakcji do wyświetlenia.</p>
  }

  return (
    <div className="table-wrap">
      <table className="tx-table">
        <thead>
          <tr>
            <th>Data</th>
            <th>Merchant</th>
            <th>Kategoria</th>
            <th>Kwota</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => (
            <tr key={t.id}>
              <td>{format(t.date, 'dd.MM.yyyy')}</td>
              <td>
                <strong>{t.merchant}</strong>
              </td>
              <td>
                <span
                  className="pill"
                  style={{ '--pill': CATEGORIES[t.category].color } as CSSProperties}
                >
                  {CATEGORIES[t.category].label}
                </span>
              </td>
              <td className="num">{formatMoney(Math.abs(t.amount), currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
