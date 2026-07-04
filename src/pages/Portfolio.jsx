import { useEffect, useMemo, useState } from 'react'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'
import VerdictBadge from '../components/VerdictBadge'
import SignInRequired from '../components/SignInRequired'
import LoadingSpinner from '../components/LoadingSpinner'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../utils/supabase'
import { getScreeningData, searchSymbol } from '../utils/api'
import { screenStock, computePurificationRatio } from '../utils/screening'

ChartJS.register(ArcElement, Tooltip, Legend)

const SUGGESTION_POOL = ['AAPL', 'MSFT', 'GOOGL', 'NVDA', 'ADBE']
const VERDICT_HEX = { PASS: '#10B981', FAIL: '#EF4444', DOUBTFUL: '#F59E0B' }

function TickerAutocomplete({ value, onChange }) {
  const [suggestions, setSuggestions] = useState([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (value.trim().length < 1) {
      setSuggestions([])
      return
    }
    const handle = setTimeout(async () => {
      try {
        const results = await searchSymbol(value.trim())
        setSuggestions((results || []).slice(0, 6))
      } catch {
        setSuggestions([])
      }
    }, 400)
    return () => clearTimeout(handle)
  }, [value])

  return (
    <div className="relative flex-1">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Ticker"
        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-[var(--color-gold)]/50"
      />
      {open && suggestions.length > 0 && (
        <ul className="absolute z-20 mt-2 w-56 glass-card overflow-hidden py-1">
          {suggestions.map((s) => (
            <li key={s.symbol}>
              <button
                onMouseDown={() => onChange(s.symbol)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-white/5 flex items-center justify-between gap-2"
              >
                <span className="font-medium">{s.symbol}</span>
                <span className="text-[var(--color-text-secondary)] truncate">{s.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function Portfolio() {
  const { user, loading: authLoading } = useAuth()
  const [holdings, setHoldings] = useState([{ id: null, ticker: '', shares: '' }])
  const [holdingsLoading, setHoldingsLoading] = useState(true)
  const [results, setResults] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [progress, setProgress] = useState(0)

  const [whatIfFrom, setWhatIfFrom] = useState('')
  const [whatIfTo, setWhatIfTo] = useState('')
  const [whatIfResult, setWhatIfResult] = useState(null)
  const [whatIfLoading, setWhatIfLoading] = useState(false)

  useEffect(() => {
    if (!user) {
      setHoldings([{ id: null, ticker: '', shares: '' }])
      setHoldingsLoading(false)
      return undefined
    }

    let cancelled = false
    setHoldingsLoading(true)
    supabase
      .from('portfolio_holdings')
      .select('*')
      .eq('user_id', user.id)
      .then(({ data, error }) => {
        if (cancelled) return
        if (!error && data && data.length > 0) {
          setHoldings(data.map((row) => ({ id: row.id, ticker: row.ticker, shares: String(row.shares) })))
        } else {
          setHoldings([{ id: null, ticker: '', shares: '' }])
        }
        setHoldingsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [user])

  function updateHolding(index, field, value) {
    setHoldings((prev) => prev.map((h, i) => (i === index ? { ...h, [field]: value } : h)))
  }

  function addRow() {
    setHoldings((prev) => [...prev, { id: null, ticker: '', shares: '' }])
  }

  async function removeRow(index) {
    const holding = holdings[index]
    setHoldings((prev) => prev.filter((_, i) => i !== index))
    if (holding?.id) {
      await supabase.from('portfolio_holdings').delete().eq('id', holding.id)
    }
  }

  async function analyze() {
    const active = holdings.filter((h) => h.ticker.trim() && Number(h.shares) > 0)
    if (active.length === 0) return
    setAnalyzing(true)
    setProgress(0)
    setResults(null)

    if (user) {
      const withIds = await Promise.all(
        holdings.map(async (h) => {
          if (h.id || !h.ticker.trim() || !(Number(h.shares) > 0)) return h
          try {
            const { data, error } = await supabase
              .from('portfolio_holdings')
              .insert({ user_id: user.id, ticker: h.ticker.trim().toUpperCase(), shares: Number(h.shares) })
              .select()
              .single()
            if (error || !data) return h
            return { ...h, id: data.id }
          } catch {
            return h
          }
        }),
      )
      setHoldings(withIds)
    }

    let completed = 0
    const settled = await Promise.all(
      active.map(async (h) => {
        try {
          const { profile, income, balance } = await getScreeningData(h.ticker.trim())
          completed += 1
          setProgress(completed)
          const verdict = screenStock({ profile, income, balance })
          const price = profile?.price || 0
          return {
            ticker: h.ticker.trim().toUpperCase(),
            shares: Number(h.shares),
            profile,
            price,
            value: price * Number(h.shares),
            purificationRatio: computePurificationRatio(income),
            ...verdict,
          }
        } catch {
          completed += 1
          setProgress(completed)
          return { ticker: h.ticker.trim().toUpperCase(), shares: Number(h.shares), error: true, value: 0 }
        }
      }),
    )
    setResults(settled)
    setAnalyzing(false)
  }

  const summary = useMemo(() => {
    if (!results) return null
    const totalValue = results.reduce((sum, r) => sum + (r.value || 0), 0)
    const byVerdict = { PASS: 0, FAIL: 0, DOUBTFUL: 0 }
    results.forEach((r) => {
      if (r.verdict) byVerdict[r.verdict] += r.value || 0
    })
    const compliancePct = totalValue ? (byVerdict.PASS / totalValue) * 100 : 0
    return { totalValue, byVerdict, compliancePct }
  }, [results])

  const nonCompliant = useMemo(
    () => (results || []).filter((r) => r.verdict === 'FAIL' || r.verdict === 'DOUBTFUL'),
    [results],
  )

  const suggestions = useMemo(() => {
    const owned = new Set((results || []).map((r) => r.ticker))
    return SUGGESTION_POOL.filter((t) => !owned.has(t)).slice(0, 3)
  }, [results])

  async function runWhatIf() {
    if (!whatIfFrom || !whatIfTo || !summary) return
    setWhatIfLoading(true)
    setWhatIfResult(null)
    try {
      const replaced = results.find((r) => r.ticker === whatIfFrom)
      const { profile, income, balance } = await getScreeningData(whatIfTo.trim())
      const verdict = screenStock({ profile, income, balance })
      const newValue = replaced ? replaced.value : 0

      const newByVerdict = { ...summary.byVerdict }
      if (replaced?.verdict) newByVerdict[replaced.verdict] -= replaced.value
      newByVerdict[verdict.verdict] = (newByVerdict[verdict.verdict] || 0) + newValue
      const newCompliance = summary.totalValue ? (newByVerdict.PASS / summary.totalValue) * 100 : 0

      setWhatIfResult({
        ticker: whatIfTo.trim().toUpperCase(),
        verdict: verdict.verdict,
        newCompliance,
        delta: newCompliance - summary.compliancePct,
      })
    } catch {
      setWhatIfResult({ error: true })
    } finally {
      setWhatIfLoading(false)
    }
  }

  const donutData = summary && {
    labels: ['Compliant', 'Non-Compliant', 'Doubtful'],
    datasets: [
      {
        data: [summary.byVerdict.PASS, summary.byVerdict.FAIL, summary.byVerdict.DOUBTFUL],
        backgroundColor: [VERDICT_HEX.PASS, VERDICT_HEX.FAIL, VERDICT_HEX.DOUBTFUL],
        borderWidth: 0,
      },
    ],
  }

  if (authLoading || holdingsLoading) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-24">
        <LoadingSpinner label="Loading your portfolio..." />
      </div>
    )
  }

  if (!user) {
    return <SignInRequired feature="Portfolio Simulator" />
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="font-display text-3xl font-bold">Portfolio Simulator</h1>
      <p className="mt-2 text-[var(--color-text-secondary)]">
        Enter your holdings to see overall Shariah compliance and purification estimates.
      </p>

      <div className="glass-card mt-8 p-6">
        <div className="space-y-3">
          {holdings.map((h, i) => (
            <div key={i} className="flex items-center gap-3">
              <TickerAutocomplete value={h.ticker} onChange={(v) => updateHolding(i, 'ticker', v)} />
              <input
                type="number"
                min="0"
                value={h.shares}
                onChange={(e) => updateHolding(i, 'shares', e.target.value)}
                placeholder="Shares"
                className="w-28 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-[var(--color-gold)]/50"
              />
              <button
                onClick={() => removeRow(i)}
                disabled={holdings.length === 1}
                className="text-[var(--color-text-secondary)] hover:text-[var(--color-danger)] disabled:opacity-30"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button onClick={addRow} className="rounded-lg border border-white/15 px-4 py-2 text-sm hover:bg-white/5">
            + Add Holding
          </button>
          <button
            onClick={analyze}
            disabled={analyzing}
            className="rounded-lg bg-[var(--color-gold)] px-5 py-2 text-sm font-semibold text-[#0a0a0f] hover:brightness-110 disabled:opacity-50"
          >
            Analyze
          </button>
        </div>

        {analyzing && (
          <div className="mt-4">
            <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-[var(--color-gold)] transition-all duration-300"
                style={{ width: `${(progress / holdings.filter((h) => h.ticker.trim()).length) * 100}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-[var(--color-text-secondary)]">
              Screening {progress} of {holdings.filter((h) => h.ticker.trim()).length}...
            </p>
          </div>
        )}
      </div>

      {summary && (
        <>
          {/* OVERVIEW */}
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            <div className="glass-card p-6 lg:col-span-1 flex flex-col items-center justify-center">
              <div className="w-48 h-48">
                <Doughnut data={donutData} options={{ plugins: { legend: { position: 'bottom', labels: { color: '#9CA3AF', boxWidth: 10 } } } }} />
              </div>
            </div>
            <div className="glass-card p-6 lg:col-span-2 grid grid-cols-2 gap-6 content-center">
              <div>
                <p className="text-sm text-[var(--color-text-secondary)]">Total Portfolio Value</p>
                <p className="font-display text-3xl font-bold">${summary.totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
              </div>
              <div>
                <p className="text-sm text-[var(--color-text-secondary)]">Compliance</p>
                <p className="font-display text-3xl font-bold text-[var(--color-emerald)]">{summary.compliancePct.toFixed(1)}%</p>
              </div>
            </div>
          </div>

          {/* HOLDINGS TABLE */}
          <div className="glass-card mt-8 p-6 overflow-x-auto">
            <p className="font-semibold text-lg mb-4">Holdings</p>
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="text-left text-sm text-[var(--color-text-secondary)]">
                  <th className="pb-2">Ticker</th>
                  <th className="pb-2">Shares</th>
                  <th className="pb-2">Value</th>
                  <th className="pb-2">Verdict</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.ticker} className="border-t border-white/5">
                    <td className="py-3 font-medium">{r.ticker}</td>
                    <td className="py-3 text-sm">{r.shares}</td>
                    <td className="py-3 text-sm">${(r.value || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                    <td className="py-3">{r.error ? <span className="text-sm text-[var(--color-danger)]">Error</span> : <VerdictBadge verdict={r.verdict} size="sm" />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* NON-COMPLIANT */}
          {nonCompliant.length > 0 && (
            <div className="glass-card mt-8 p-6">
              <p className="font-semibold text-lg text-[var(--color-danger)]">Non-Compliant Holdings</p>
              <ul className="mt-3 space-y-2 text-sm text-[var(--color-text-secondary)]">
                {nonCompliant.map((r) => (
                  <li key={r.ticker}>
                    <span className="font-medium text-[var(--color-text-primary)]">{r.ticker}</span> — {r.verdict}
                  </li>
                ))}
              </ul>
              {suggestions.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    Potential compliant alternatives to research (screen before investing):{' '}
                    <span className="text-[var(--color-gold)]">{suggestions.join(', ')}</span>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* WHAT-IF */}
          <div className="glass-card mt-8 p-6">
            <p className="font-semibold text-lg">What-If Scenario</p>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              Replace a holding and see how your compliance percentage would change.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <select
                value={whatIfFrom}
                onChange={(e) => setWhatIfFrom(e.target.value)}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
              >
                <option value="">Replace...</option>
                {results.map((r) => (
                  <option key={r.ticker} value={r.ticker}>
                    {r.ticker}
                  </option>
                ))}
              </select>
              <span className="text-sm text-[var(--color-text-secondary)]">with</span>
              <input
                value={whatIfTo}
                onChange={(e) => setWhatIfTo(e.target.value.toUpperCase())}
                placeholder="New ticker"
                className="w-32 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
              />
              <button
                onClick={runWhatIf}
                disabled={whatIfLoading || !whatIfFrom || !whatIfTo}
                className="rounded-lg bg-[var(--color-emerald)] px-4 py-2 text-sm font-semibold text-[#0a0a0f] hover:brightness-110 disabled:opacity-50"
              >
                {whatIfLoading ? 'Checking...' : 'Simulate'}
              </button>
            </div>

            {whatIfResult && !whatIfResult.error && (
              <div className="mt-4 text-sm">
                <p>
                  {whatIfResult.ticker} screens as <VerdictBadge verdict={whatIfResult.verdict} size="sm" />
                </p>
                <p className="mt-2">
                  New compliance: <span className="font-semibold text-[var(--color-text-primary)]">{whatIfResult.newCompliance.toFixed(1)}%</span>{' '}
                  <span className={whatIfResult.delta >= 0 ? 'text-[var(--color-emerald)]' : 'text-[var(--color-danger)]'}>
                    ({whatIfResult.delta >= 0 ? '+' : ''}
                    {whatIfResult.delta.toFixed(1)}%)
                  </span>
                </p>
              </div>
            )}
            {whatIfResult?.error && <p className="mt-4 text-sm text-[var(--color-danger)]">Couldn&apos;t screen that ticker.</p>}
          </div>

          {/* DIVIDEND PURIFICATION */}
          <div className="glass-card mt-8 p-6 border-[var(--color-gold)]/20 overflow-x-auto">
            <p className="font-semibold text-lg text-[var(--color-gold)]">Dividend Purification Calculator</p>
            <table className="mt-4 w-full min-w-[500px]">
              <thead>
                <tr className="text-left text-sm text-[var(--color-text-secondary)]">
                  <th className="pb-2">Ticker</th>
                  <th className="pb-2">Shares</th>
                  <th className="pb-2">Ann. Dividend/Share</th>
                  <th className="pb-2">Purification %</th>
                  <th className="pb-2">Amount to Purify</th>
                </tr>
              </thead>
              <tbody>
                {results
                  .filter((r) => !r.error)
                  .map((r) => {
                    const divPerShare = r.profile?.lastDividend || 0
                    const totalDiv = divPerShare * r.shares
                    const purifyAmount = totalDiv * ((r.purificationRatio || 0) / 100)
                    return (
                      <tr key={r.ticker} className="border-t border-white/5 text-sm">
                        <td className="py-3 font-medium">{r.ticker}</td>
                        <td className="py-3">{r.shares}</td>
                        <td className="py-3">${divPerShare.toFixed(2)}</td>
                        <td className="py-3">{(r.purificationRatio || 0).toFixed(2)}%</td>
                        <td className="py-3 text-[var(--color-gold)]">${purifyAmount.toFixed(2)}</td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
