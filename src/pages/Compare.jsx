import { useEffect, useState } from 'react'
import VerdictBadge from '../components/VerdictBadge'
import LoadingSpinner from '../components/LoadingSpinner'
import { getScreeningData, searchSymbol } from '../utils/api'
import { screenStock, RATIO_DEFINITIONS } from '../utils/screening'

function TickerInput({ index, value, onChange }) {
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
        placeholder={`Ticker ${index + 1}`}
        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-[var(--color-gold)]/50"
      />
      {open && suggestions.length > 0 && (
        <ul className="absolute z-20 mt-2 w-full glass-card overflow-hidden py-1">
          {suggestions.map((s) => (
            <li key={s.symbol}>
              <button
                onMouseDown={() => onChange(s.symbol)}
                className="w-full text-left px-4 py-2 text-sm hover:bg-white/5 flex items-center justify-between gap-2"
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

export default function Compare() {
  const [tickers, setTickers] = useState(['', '', ''])
  const [results, setResults] = useState([null, null, null])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleCompare() {
    const active = tickers.map((t) => t.trim()).filter(Boolean)
    if (active.length < 2) {
      setError('Enter at least two tickers to compare.')
      return
    }
    setError(null)
    setLoading(true)
    setResults([null, null, null])

    const settled = await Promise.all(
      tickers.map(async (t) => {
        if (!t.trim()) return null
        try {
          const { profile, income, balance } = await getScreeningData(t.trim())
          return { ticker: t.trim().toUpperCase(), profile, ...screenStock({ profile, income, balance }) }
        } catch {
          return { ticker: t.trim().toUpperCase(), error: true }
        }
      }),
    )
    setResults(settled)
    setLoading(false)
  }

  const activeResults = results.filter(Boolean)

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="font-display text-3xl font-bold">Compare Stocks</h1>
      <p className="mt-2 text-[var(--color-text-secondary)]">Screen up to three tickers side by side.</p>

      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        {tickers.map((t, i) => (
          <TickerInput
            key={i}
            index={i}
            value={t}
            onChange={(v) => setTickers((prev) => prev.map((p, idx) => (idx === i ? v : p)))}
          />
        ))}
        <button
          onClick={handleCompare}
          disabled={loading}
          className="rounded-xl bg-[var(--color-gold)] px-6 py-3 text-sm font-semibold text-[#0a0a0f] hover:brightness-110 disabled:opacity-50"
        >
          Compare
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-[var(--color-danger)]">{error}</p>}
      {loading && <LoadingSpinner label="Screening tickers..." />}

      {activeResults.length > 0 && !loading && (
        <div className="mt-10 overflow-x-auto">
          <table className="w-full min-w-[560px] border-separate border-spacing-y-2">
            <thead>
              <tr>
                <th className="text-left text-sm text-[var(--color-text-secondary)] font-medium px-2">Criteria</th>
                {activeResults.map((r) => (
                  <th key={r.ticker} className="text-left px-2">
                    <p className="font-display font-bold text-lg">{r.ticker}</p>
                    {r.profile?.companyName && (
                      <p className="text-xs font-normal text-[var(--color-text-secondary)] truncate max-w-[140px]">
                        {r.profile.companyName}
                      </p>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="glass-card">
                <td className="px-2 py-3 text-sm font-medium">Verdict</td>
                {activeResults.map((r) => (
                  <td key={r.ticker} className="px-2 py-3">
                    {r.error ? (
                      <span className="text-sm text-[var(--color-danger)]">Error</span>
                    ) : (
                      <VerdictBadge verdict={r.verdict} size="sm" />
                    )}
                  </td>
                ))}
              </tr>
              <tr className="glass-card">
                <td className="px-2 py-3 text-sm font-medium">Business Activity</td>
                {activeResults.map((r) => (
                  <td key={r.ticker} className="px-2 py-3 text-sm">
                    {r.error ? (
                      '—'
                    ) : r.businessActivity?.pass ? (
                      <span className="text-[var(--color-emerald)]">Clear</span>
                    ) : (
                      <span className="text-[var(--color-danger)]">{r.businessActivity?.categoryLabel}</span>
                    )}
                  </td>
                ))}
              </tr>
              {RATIO_DEFINITIONS.map((def) => (
                <tr key={def.key} className="glass-card">
                  <td className="px-2 py-3 text-sm font-medium">{def.label}</td>
                  {activeResults.map((r) => {
                    const ratio = r.financials?.ratios.find((x) => x.key === def.key)
                    return (
                      <td key={r.ticker} className="px-2 py-3 text-sm">
                        {ratio ? (
                          <span
                            style={{
                              color:
                                ratio.status === 'PASS' ? '#10B981' : ratio.status === 'FAIL' ? '#EF4444' : '#F59E0B',
                            }}
                          >
                            {ratio.value.toFixed(1)}%
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
