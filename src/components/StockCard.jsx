import { Link } from 'react-router-dom'
import VerdictBadge from './VerdictBadge'

/**
 * Shared card for the Home "Popular Stocks" grid and the Watchlist grid.
 * Pass `verdict`/`dateScreened`/`onRemove` for watchlist mode; omit them
 * for the plain browse mode used on Home.
 */
export default function StockCard({ ticker, name, exchange, verdict, dateScreened, onRemove }) {
  return (
    <div className="glass-card group relative flex flex-col gap-3 p-5 transition-transform duration-300 hover:-translate-y-1 hover:border-[var(--color-gold)]/40">
      {onRemove && (
        <button
          onClick={(e) => {
            e.preventDefault()
            onRemove(ticker)
          }}
          aria-label={`Remove ${ticker} from watchlist`}
          className="absolute top-3 right-3 text-[var(--color-text-secondary)] hover:text-[var(--color-danger)] transition-colors text-sm"
        >
          ✕
        </button>
      )}

      <Link to={`/results/${ticker}`} className="flex flex-col gap-3">
        <div>
          <p className="font-display text-xl font-bold text-[var(--color-text-primary)]">{ticker}</p>
          <p className="text-sm text-[var(--color-text-secondary)] truncate">{name}</p>
          {exchange && <p className="text-xs text-[var(--color-text-secondary)]/70 mt-0.5">{exchange}</p>}
        </div>

        {verdict && (
          <div className="flex items-center justify-between">
            <VerdictBadge verdict={verdict} size="sm" />
            {dateScreened && (
              <span className="text-xs text-[var(--color-text-secondary)]">
                {new Date(dateScreened).toLocaleDateString()}
              </span>
            )}
          </div>
        )}
      </Link>

      {!verdict && (
        <Link
          to={`/results/${ticker}`}
          className="mt-1 inline-flex items-center justify-center rounded-lg border border-[var(--color-gold)]/40 py-2 text-sm font-medium text-[var(--color-gold)] transition-colors hover:bg-[var(--color-gold)]/10"
        >
          Screen Now
        </Link>
      )}
    </div>
  )
}
