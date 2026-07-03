import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="border-t border-white/10 mt-24">
      <div className="mx-auto max-w-7xl px-6 py-12 grid gap-10 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-display text-xl font-bold text-[var(--color-text-primary)]">Vera</span>
            <span className="rounded-full bg-[var(--color-gold)]/15 border border-[var(--color-gold)]/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-gold)]">
              Beta
            </span>
          </div>
          <p className="mt-3 text-sm text-[var(--color-text-secondary)] max-w-xs">
            Invest with Principles. Screen with Certainty.
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Navigate</p>
          <ul className="flex flex-col gap-2 text-sm text-[var(--color-text-secondary)]">
            <li><Link to="/" className="hover:text-[var(--color-gold)] transition-colors">Screen</Link></li>
            <li><Link to="/watchlist" className="hover:text-[var(--color-gold)] transition-colors">Watchlist</Link></li>
            <li><Link to="/compare" className="hover:text-[var(--color-gold)] transition-colors">Compare</Link></li>
            <li><Link to="/portfolio" className="hover:text-[var(--color-gold)] transition-colors">Portfolio Simulator</Link></li>
            <li><Link to="/methodology" className="hover:text-[var(--color-gold)] transition-colors">Methodology</Link></li>
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Disclaimer</p>
          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
            Vera provides Shariah-compliance screening for informational purposes only and does not constitute
            financial or religious advice. Consult a qualified Shariah scholar and financial advisor before
            investing. Data sourced from Financial Modeling Prep.
          </p>
        </div>
      </div>

      <div className="border-t border-white/5 py-6 text-center text-xs text-[var(--color-text-secondary)]">
        © {new Date().getFullYear()} Vera. Built by Abdullah Baig, University of Waterloo.
      </div>
    </footer>
  )
}
