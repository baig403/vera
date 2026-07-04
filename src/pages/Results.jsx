import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import VerdictBadge from '../components/VerdictBadge'
import LoadingSpinner from '../components/LoadingSpinner'
import { useScreening } from '../hooks/useScreening'
import { getHistoricalPrices } from '../utils/api'
import { BUSINESS_ACTIVITY_CATEGORIES } from '../utils/screening'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../utils/supabase'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler)

const RANGES = { '1D': 2, '1W': 5, '1M': 22, '6M': 126, '1Y': 252 }
const VERDICT_HEX = { PASS: '#10B981', FAIL: '#EF4444', DOUBTFUL: '#F59E0B' }

function formatMarketCap(value) {
  if (!value) return 'N/A'
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`
  return `$${value.toLocaleString()}`
}

function DataPill({ label, value }) {
  return (
    <div className="glass-card px-4 py-3 text-center min-w-[120px]">
      <p className="text-xs text-[var(--color-text-secondary)]">{label}</p>
      <p className="mt-1 font-semibold text-[var(--color-text-primary)]">{value}</p>
    </div>
  )
}

function ResultsSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16 animate-pulse space-y-6">
      <div className="h-10 w-64 rounded bg-white/5" />
      <div className="flex gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 w-28 rounded-xl bg-white/5" />
        ))}
      </div>
      <div className="h-12 w-48 rounded-full bg-white/5" />
      <div className="h-80 rounded-2xl bg-white/5" />
      <div className="h-64 rounded-2xl bg-white/5" />
    </div>
  )
}

export default function Results() {
  const { ticker } = useParams()
  const { user, openAuthModal } = useAuth()
  const { result, loading, error, fromCache, cacheAgeHours, refresh } = useScreening(ticker)

  const [disclaimerDismissed, setDisclaimerDismissed] = useState(
    () => sessionStorage.getItem('vera_disclaimer_dismissed') === '1',
  )
  const [saved, setSaved] = useState(false)
  const [shareCopied, setShareCopied] = useState(false)

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true)
  const [range, setRange] = useState('6M')

  useEffect(() => {
    let cancelled = false
    setHistoryLoading(true)
    getHistoricalPrices(ticker)
      .then((data) => {
        if (cancelled) return
        const sorted = [...(data || [])].sort((a, b) => new Date(a.date) - new Date(b.date))
        setHistory(sorted)
      })
      .catch(() => !cancelled && setHistory([]))
      .finally(() => !cancelled && setHistoryLoading(false))
    return () => {
      cancelled = true
    }
  }, [ticker])

  useEffect(() => {
    if (!user) {
      setSaved(false)
      return undefined
    }
    let cancelled = false
    supabase
      .from('watchlist')
      .select('id')
      .eq('user_id', user.id)
      .eq('ticker', ticker.toUpperCase())
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setSaved(!!data)
      })
    return () => {
      cancelled = true
    }
  }, [ticker, user])

  const chartData = useMemo(() => {
    const n = RANGES[range] || history.length
    const slice = history.slice(-n)
    const color = VERDICT_HEX[result?.verdict] || '#10B981'
    return {
      labels: slice.map((d) => d.date),
      datasets: [
        {
          data: slice.map((d) => d.price),
          borderColor: color,
          backgroundColor: `${color}22`,
          fill: true,
          tension: 0.3,
          pointRadius: 0,
          borderWidth: 2,
        },
      ],
    }
  }, [history, range, result?.verdict])

  function dismissDisclaimer() {
    sessionStorage.setItem('vera_disclaimer_dismissed', '1')
    setDisclaimerDismissed(true)
  }

  async function handleSaveToWatchlist() {
    if (!result) return
    if (!user) {
      openAuthModal('signup')
      return
    }
    const { error: saveError } = await supabase.from('watchlist').insert({
      user_id: user.id,
      ticker: ticker.toUpperCase(),
      company_name: result.profile?.companyName || ticker,
      verdict: result.verdict,
    })
    if (!saveError) setSaved(true)
  }

  function handleShare() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setShareCopied(true)
      setTimeout(() => setShareCopied(false), 2000)
    })
  }

  if (loading) return <ResultsSkeleton />

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <p className="font-display text-2xl font-bold text-[var(--color-danger)]">Couldn&apos;t screen {ticker}</p>
        <p className="mt-2 text-[var(--color-text-secondary)]">{error}</p>
      </div>
    )
  }

  if (!result) return null

  const { profile, verdict, businessActivity, financials, purificationRatio } = result

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      {!disclaimerDismissed && (
        <div className="glass-card mb-8 flex items-start justify-between gap-4 border-[var(--color-amber)]/30 p-4">
          <p className="text-sm text-[var(--color-text-secondary)]">
            This screen is for informational purposes only and is not financial or religious advice. Consult a
            qualified Shariah scholar before making investment decisions.
          </p>
          <button onClick={dismissDisclaimer} className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
            ✕
          </button>
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="flex items-center gap-4">
          {profile?.image && (
            <img src={profile.image} alt={ticker} className="h-14 w-14 rounded-xl object-contain bg-white/5 p-1" />
          )}
          <div>
            <h1 className="font-display font-bold text-[36px] leading-tight">{profile?.companyName || ticker}</h1>
            <p className="text-[var(--color-text-secondary)]">
              {ticker.toUpperCase()} · {profile?.exchange || 'N/A'} · ${profile?.price?.toFixed(2) ?? 'N/A'}
            </p>
          </div>
        </div>
        <VerdictBadge verdict={verdict} size="lg" glow />
      </div>

      {/* DATA PILLS */}
      <div className="mt-6 flex flex-wrap gap-3">
        <DataPill label="Market Cap" value={formatMarketCap(profile?.marketCap)} />
        <DataPill label="P/E Ratio" value={profile?.pe ? profile.pe.toFixed(2) : 'N/A'} />
        <DataPill label="Dividend Yield" value={profile?.lastDividend ? `${profile.lastDividend}` : 'N/A'} />
        <DataPill label="52W Range" value={profile?.range || 'N/A'} />
      </div>

      {/* FRESHNESS */}
      <div className="mt-6 flex items-center gap-3 text-sm text-[var(--color-text-secondary)]">
        <span className={`w-2 h-2 rounded-full ${fromCache ? 'bg-[var(--color-amber)]' : 'bg-[var(--color-emerald)]'}`} />
        {fromCache ? `Cached ${cacheAgeHours.toFixed(1)}h ago` : 'Live data'}
        <button onClick={refresh} className="text-[var(--color-gold)] hover:underline">
          Refresh
        </button>
      </div>

      {/* ACTIONS */}
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          onClick={handleSaveToWatchlist}
          disabled={saved}
          className="rounded-lg border border-[var(--color-gold)]/40 px-4 py-2 text-sm font-medium text-[var(--color-gold)] hover:bg-[var(--color-gold)]/10 disabled:opacity-50"
        >
          {saved ? 'Saved to Watchlist' : 'Save to Watchlist'}
        </button>
        <button
          onClick={handleShare}
          className="rounded-lg border border-white/15 px-4 py-2 text-sm font-medium hover:bg-white/5"
        >
          {shareCopied ? 'Link Copied!' : 'Share'}
        </button>
        <button onClick={() => window.print()} className="rounded-lg border border-white/15 px-4 py-2 text-sm font-medium hover:bg-white/5">
          Export PDF
        </button>
      </div>

      {/* CHART */}
      <div className="glass-card mt-10 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-semibold">Price History</p>
          <div className="flex gap-1">
            {Object.keys(RANGES).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  range === r ? 'bg-[var(--color-gold)] text-[#0a0a0f]' : 'text-[var(--color-text-secondary)] hover:bg-white/5'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-6 h-64">
          {historyLoading ? (
            <LoadingSpinner label="Loading price history..." />
          ) : (
            <Line
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  x: { display: false },
                  y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9CA3AF' } },
                },
              }}
            />
          )}
        </div>
      </div>

      {/* BUSINESS ACTIVITY */}
      <div className="glass-card mt-8 p-6">
        <p className="font-semibold text-lg">Business Activity Screen</p>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Sector: {profile?.sector || 'N/A'} · Industry: {profile?.industry || 'N/A'}
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {Object.entries(BUSINESS_ACTIVITY_CATEGORIES).map(([id, cat]) => {
            const isFlagged = businessActivity?.categoryId === id
            return (
              <div
                key={id}
                className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${
                  isFlagged ? 'border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10' : 'border-white/10'
                }`}
              >
                <span>{cat.label}</span>
                <span className={isFlagged ? 'text-[var(--color-danger)]' : 'text-[var(--color-emerald)]'}>
                  {isFlagged ? 'Flagged' : 'Clear'}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* FINANCIAL RATIOS */}
      {financials && (
        <div className="glass-card mt-8 p-6">
          <p className="font-semibold text-lg">Financial Ratios</p>
          <div className="mt-4 space-y-4">
            {financials.ratios.map((r) => (
              <div key={r.key} className="border-b border-white/5 pb-4 last:border-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{r.label}</p>
                  <span
                    className="text-sm font-semibold"
                    style={{ color: VERDICT_HEX[r.status] || VERDICT_HEX.DOUBTFUL }}
                  >
                    {r.value.toFixed(1)}% ({r.comparison === 'lessThan' ? '<' : '>'} {r.threshold}%) — {r.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-[var(--color-text-secondary)]">{r.formula}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* WHAT THIS MEANS */}
      <div className="glass-card mt-8 p-6">
        <p className="font-semibold text-lg">What This Means</p>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)] leading-relaxed">
          {verdict === 'PASS' &&
            `${profile?.companyName || ticker} clears the AAOIFI business activity screen and all four financial ratio thresholds. It is generally considered Shariah-compliant, though any incidental interest income should still be purified.`}
          {verdict === 'FAIL' && businessActivity && !businessActivity.pass &&
            `${profile?.companyName || ticker} operates in "${businessActivity.categoryLabel}", a core business AAOIFI screens out entirely, regardless of its financial ratios.`}
          {verdict === 'FAIL' && businessActivity?.pass &&
            `${profile?.companyName || ticker} passes the business activity screen but fails one or more financial ratio thresholds, exceeding AAOIFI's limits on interest-bearing debt, interest income, or receivables.`}
          {verdict === 'DOUBTFUL' &&
            `${profile?.companyName || ticker} is within 5% of one or more AAOIFI thresholds. It doesn't clearly pass or fail — investors who are cautious may wish to avoid it, while others may accept it given the narrow margin.`}
        </p>
      </div>

      {/* PURIFICATION */}
      {financials && (
        <div className="glass-card mt-8 p-6 border-[var(--color-gold)]/20">
          <p className="font-semibold text-lg text-[var(--color-gold)]">Purification Ratio</p>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            Approximately <span className="text-[var(--color-gold)] font-semibold">{purificationRatio.toFixed(2)}%</span> of
            dividends received from {ticker.toUpperCase()} should be purified (donated) to offset non-compliant
            interest income.
          </p>
        </div>
      )}
    </div>
  )
}
