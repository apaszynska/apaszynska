import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { TrendPoint } from '../lib/analysis/insights'
import { formatMoney } from '../lib/analysis/insights'

interface Props {
  data: TrendPoint[]
  currency: string
}

export function TrendChart({ data, currency }: Props) {
  if (data.length < 2) {
    return (
      <p className="empty">
        Trend pojawi się, gdy w danych będzie więcej niż jeden miesiąc.
      </p>
    )
  }

  return (
    <div className="chart-wrap">
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(19,32,41,0.08)" />
          <XAxis dataKey="label" tick={{ fill: '#4a5a66', fontSize: 12 }} />
          <YAxis
            tickFormatter={(v) => `${Math.round(Number(v))}`}
            tick={{ fill: '#4a5a66', fontSize: 12 }}
          />
          <Tooltip
            formatter={(value) => formatMoney(Number(value ?? 0), currency)}
            contentStyle={{
              borderRadius: 8,
              border: '1px solid rgba(19,32,41,0.1)',
              background: '#f7f9fb',
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="expenses"
            name="Wydatki"
            stroke="#132029"
            strokeWidth={2.5}
            dot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="discretionary"
            name="Uznaniowe"
            stroke="#b45309"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="essential"
            name="Niezbędne"
            stroke="#0d6e6e"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
