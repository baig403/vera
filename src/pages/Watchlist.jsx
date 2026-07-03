import { useState } from 'react'
import { Link } from 'react-router-dom'
import StockCard from '../components/StockCard'
import * as cache from '../utils/cache'

export default function Watchlist() {
  const [items, setItems] = useState(() => cache.getWatchlist())

  function handleRemove(ticker) {
    setItems(cache.removeFromWatchlist(ticker))
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h1 className="font-display text-3xl font-bold">Your Watchlist is Empty</h1>
        <p className="mt-3 text-[var(--color-text-secondary)]">
          Screen a stock and save it here to track its Shariah verdict over time.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-[var(--color-gold)] px-5 py-3 text-sm font-semibold text-[#0a0a0f] hover:brightness-110"
        >
          Screen a Stock
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <h1 className="font-display text-3xl font-bold">Watchlist</h1>
      <p className="mt-2 text-[var(--color-text-secondary)]">{items.length} saved screen{items.length === 1 ? '' : 's'}.</p>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map((item) => (
          <StockCard
            key={item.ticker}
            ticker={item.ticker}
            name={item.name}
            verdict={item.verdict}
            dateScreened={item.dateScreened}
            onRemove={handleRemove}
          />
        ))}
      </div>
    </div>
  )
}
