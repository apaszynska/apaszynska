import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { CategoryTotal } from '../lib/analysis/insights'
import { formatMoney } from '../lib/analysis/insights'

interface Props {
  data: CategoryTotal[]
  currency: string
}

export function CategoryChart({ data, currency }: Props) {
  const chartData = data.slice(0, 8).map((c) => ({
    name: c.label,
    amount: Math.round(c.amount * 100) / 100,
    fill: c.color,
  }))

  if (!chartData.length) {
    return <p className="empty">Brak wydatków w tym okresie.</p>
  }

  return (
    <div className="chart-wrap">
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 16, top: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(19,32,41,0.08)" />
          <XAxis
            type="number"
            tickFormatter={(v) => formatMoney(Number(v), currency)}
            tick={{ fill: '#4a5a66', fontSize: 12 }}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={120}
            tick={{ fill: '#132029', fontSize: 12 }}
          />
          <Tooltip
            formatter={(value) => formatMoney(Number(value ?? 0), currency)}
            contentStyle={{
              borderRadius: 8,
              border: '1px solid rgba(19,32,41,0.1)',
              background: '#f7f9fb',
            }}
          />
          <Bar dataKey="amount" radius={[0, 6, 6, 0]} fill="#0d6e6e" />
        </BarChart>
      </ResponsiveContainer>
      <ul className="cat-legend">
        {data.slice(0, 8).map((c) => (
          <li key={c.id}>
            <span className="dot" style={{ background: c.color }} />
            <span>{c.label}</span>
            <strong>{formatMoney(c.amount, currency)}</strong>
            <em>{Math.round(c.share * 100)}%</em>
          </li>
        ))}
      </ul>
    </div>
  )
}
