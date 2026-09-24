import type { SaveHint } from '../lib/analysis/insights'
import { formatMoney } from '../lib/analysis/insights'

interface Props {
  hints: SaveHint[]
  currency: string
  discretionary: number
  essential: number
}

export function SaveHints({ hints, currency, discretionary, essential }: Props) {
  const pot = hints.reduce((s, h) => s + h.amount, 0)

  return (
    <section className="save">
      <header className="save__head">
        <div>
          <h2>Gdzie możesz zaoszczędzić</h2>
          <p>
            Porównanie wydatków uznaniowych ({formatMoney(discretionary, currency)}) i
            niezbędnych ({formatMoney(essential, currency)}).
          </p>
        </div>
        {pot > 0 && (
          <div className="save__pot">
            <span>Potencjał</span>
            <strong>{formatMoney(pot, currency)}</strong>
          </div>
        )}
      </header>
      <ul className="save__list">
        {hints.map((h, i) => (
          <li
            key={h.id}
            className={`save__item save__item--${h.severity}`}
            style={{ animationDelay: `${0.08 * i}s` }}
          >
            <h3>{h.title}</h3>
            <p>{h.detail}</p>
            {h.amount > 0 && (
              <span className="save__tag">ok. {formatMoney(h.amount, currency)}</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
