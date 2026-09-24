import { availableMonths, monthLabel } from '../lib/analysis/insights'
import type { PeriodFilter, Transaction } from '../lib/types'

interface Props {
  transactions: Transaction[]
  period: PeriodFilter
  onChange: (period: PeriodFilter) => void
}

export function PeriodFilter({ transactions, period, onChange }: Props) {
  const months = availableMonths(transactions)

  return (
    <div className="period" role="group" aria-label="Okres">
      <button
        type="button"
        className={`period__btn ${period === 'all' ? 'is-active' : ''}`}
        onClick={() => onChange('all')}
      >
        Cały okres
      </button>
      {months.map((m) => (
        <button
          key={m}
          type="button"
          className={`period__btn ${period === m ? 'is-active' : ''}`}
          onClick={() => onChange(m)}
        >
          {monthLabel(m)}
        </button>
      ))}
    </div>
  )
}
