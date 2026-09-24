import { CATEGORIES } from '../lib/categories/meta'
import type { MerchantTotal } from '../lib/analysis/insights'
import { formatMoney } from '../lib/analysis/insights'

interface Props {
  merchants: MerchantTotal[]
  currency: string
}

export function MerchantList({ merchants, currency }: Props) {
  if (!merchants.length) {
    return <p className="empty">Brak danych o merchantach.</p>
  }

  const max = merchants[0]?.amount ?? 1

  return (
    <ol className="merchants">
      {merchants.map((m) => (
        <li key={m.merchant}>
          <div className="merchants__row">
            <div>
              <strong>{m.merchant}</strong>
              <span className="muted">{CATEGORIES[m.category].label} · {m.count}×</span>
            </div>
            <span className="merchants__amount">{formatMoney(m.amount, currency)}</span>
          </div>
          <div className="merchants__bar" aria-hidden>
            <span style={{ width: `${(m.amount / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ol>
  )
}
