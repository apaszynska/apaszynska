import { useEffect, useMemo, useState } from 'react'
import { CategoryChart } from './components/CategoryChart'
import { MerchantList } from './components/MerchantList'
import { PeriodFilter } from './components/PeriodFilter'
import { SaveHints } from './components/SaveHints'
import { TrendChart } from './components/TrendChart'
import { TransactionTable } from './components/TransactionTable'
import { UploadZone } from './components/UploadZone'
import {
  buildSaveHints,
  expenseTotal,
  formatMoney,
  incomeTotal,
  monthlyTrend,
  topMerchants,
  totalsByCategory,
  filterByPeriod,
  outflowTransactions,
} from './lib/analysis/insights'
import { CATEGORIES } from './lib/categories/meta'
import { parseBankCsv } from './lib/csv/parse'
import type { PeriodFilter as Period, Transaction } from './lib/types'
import './App.css'

function detectCurrency(transactions: Transaction[]): string {
  const counts = new Map<string, number>()
  for (const t of transactions) {
    counts.set(t.currency, (counts.get(t.currency) ?? 0) + 1)
  }
  let best = 'EUR'
  let n = 0
  for (const [c, v] of counts) {
    if (v > n) {
      best = c || 'EUR'
      n = v
    }
  }
  return best || 'EUR'
}

export default function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [period, setPeriod] = useState<Period>('all')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [meta, setMeta] = useState<string | null>(null)
  const [sourceLabel, setSourceLabel] = useState<string | null>(null)

  async function ingest(file: File | Blob, label: string) {
    setBusy(true)
    setError(null)
    try {
      const result = await parseBankCsv(file)
      if (!result.transactions.length) {
        setError('Nie znaleziono transakcji. Sprawdź format pliku.')
        setTransactions([])
        return
      }
      setTransactions(result.transactions)
      setPeriod('all')
      setSourceLabel(label)
      const warn =
        result.warnings.length > 0
          ? ` · ostrzeżenia: ${result.warnings.length}`
          : ''
      setMeta(
        `separator: ${result.detectedDelimiter} · kodowanie: ${result.detectedEncoding} · transakcji: ${result.transactions.length}${warn}`,
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Nie udało się wczytać pliku.')
    } finally {
      setBusy(false)
    }
  }

  async function loadSample() {
    const res = await fetch('/sample-transactions.csv')
    const blob = await res.blob()
    await ingest(blob, 'dane demo')
  }

  useEffect(() => {
    void loadSample()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = useMemo(
    () => filterByPeriod(transactions, period),
    [transactions, period],
  )
  const currency = useMemo(() => detectCurrency(filtered), [filtered])
  const categories = useMemo(() => totalsByCategory(filtered), [filtered])
  const merchants = useMemo(() => topMerchants(filtered), [filtered])
  const trend = useMemo(() => monthlyTrend(transactions), [transactions])
  const hints = useMemo(() => buildSaveHints(filtered), [filtered])
  const spent = expenseTotal(filtered)
  const income = incomeTotal(filtered)
  const transfersOut = outflowTransactions(filtered)
    .filter((t) => t.category === 'transfers')
    .reduce((s, t) => s + Math.abs(t.amount), 0)
  const discretionary = categories
    .filter((c) => c.kind === 'discretionary')
    .reduce((s, c) => s + c.amount, 0)
  const essential = categories
    .filter((c) => c.kind === 'essential')
    .reduce((s, c) => s + c.amount, 0)

  return (
    <div className="app">
      <div className="bg-glow" aria-hidden />
      <header className="hero">
        <p className="brand">Ola&apos;s Finanses</p>
        <h1>Gdzie idą pieniądze</h1>
        <p className="lede">
          Wgraj wyciąg z banku i zobacz kategorie, merchantów oraz konkretne miejsca do
          cięcia wydatków — bez grzebania w Excelu.
        </p>
      </header>

      <UploadZone
        busy={busy}
        onFile={(f) => void ingest(f, f.name)}
        onLoadSample={() => void loadSample()}
      />

      {error && <p className="banner banner--error">{error}</p>}
      {meta && (
        <p className="banner banner--meta">
          Źródło: {sourceLabel ?? 'CSV'} · {meta}
        </p>
      )}

      {transactions.length > 0 && (
        <>
          <PeriodFilter
            transactions={transactions}
            period={period}
            onChange={setPeriod}
          />

          <section className="kpis">
            <article className="kpi kpi--spend">
              <span>Wydatki (bez przelewów)</span>
              <strong>{formatMoney(spent, currency)}</strong>
            </article>
            <article className="kpi kpi--in">
              <span>Wpływy</span>
              <strong>{formatMoney(income, currency)}</strong>
            </article>
            <article className="kpi kpi--disc">
              <span>Uznaniowe</span>
              <strong>{formatMoney(discretionary, currency)}</strong>
            </article>
            <article className="kpi kpi--ess">
              <span>Niezbędne</span>
              <strong>{formatMoney(essential, currency)}</strong>
            </article>
          </section>
          {transfersOut > 0 && (
            <p className="banner banner--meta">
              Przelewy (P2P / własne): {formatMoney(transfersOut, currency)} — wyłączone z
              kategorii „gdzie schodzi na co dzień”, żeby nie zasłaniały jedzenia, zakupów i
              subskrypcji.
            </p>
          )}

          <SaveHints
            hints={hints}
            currency={currency}
            discretionary={discretionary}
            essential={essential}
          />

          <div className="grid">
            <section className="panel">
              <h2>Największe kategorie</h2>
              <p className="panel__sub">Gdzie schodzi najwięcej w wybranym okresie.</p>
              <CategoryChart data={categories} currency={currency} />
            </section>
            <section className="panel">
              <h2>Top merchanci</h2>
              <p className="panel__sub">Sklepy i usługi z najwyższą sumą.</p>
              <MerchantList merchants={merchants} currency={currency} />
            </section>
          </div>

          <section className="panel panel--wide">
            <h2>Trend miesięczny</h2>
            <p className="panel__sub">Wydatki ogółem vs uznaniowe i niezbędne.</p>
            <TrendChart data={trend} currency={currency} />
          </section>

          <section className="panel panel--wide">
            <h2>Ostatnie wydatki</h2>
            <p className="panel__sub">
              Tylko merchant, kategoria i kwota — bez numerów kont i danych osobowych.
            </p>
            <TransactionTable transactions={filtered} currency={currency} />
          </section>

          <footer className="footer">
            <p>
              Kategorie: {Object.values(CATEGORIES).map((c) => c.label).join(' · ')}
            </p>
          </footer>
        </>
      )}
    </div>
  )
}
