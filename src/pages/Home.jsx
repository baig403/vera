import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
import CrescentMoon from '../components/CrescentMoon'
import { searchSymbol } from '../utils/api'

gsap.registerPlugin(ScrollTrigger)

const POPULAR_STOCKS = [
  { ticker: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ' },
  { ticker: 'MSFT', name: 'Microsoft Corporation', exchange: 'NASDAQ' },
  { ticker: 'GOOGL', name: 'Alphabet Inc.', exchange: 'NASDAQ' },
  { ticker: 'NVDA', name: 'NVIDIA Corporation', exchange: 'NASDAQ' },
  { ticker: 'TSLA', name: 'Tesla, Inc.', exchange: 'NASDAQ' },
  { ticker: 'AMZN', name: 'Amazon.com, Inc.', exchange: 'NASDAQ' },
  { ticker: 'META', name: 'Meta Platforms, Inc.', exchange: 'NASDAQ' },
  { ticker: 'NFLX', name: 'Netflix, Inc.', exchange: 'NASDAQ' },
  { ticker: 'ADBE', name: 'Adobe Inc.', exchange: 'NASDAQ' },
  { ticker: 'CRM', name: 'Salesforce, Inc.', exchange: 'NYSE' },
  { ticker: 'ORCL', name: 'Oracle Corporation', exchange: 'NYSE' },
  { ticker: 'INTC', name: 'Intel Corporation', exchange: 'NASDAQ' },
  { ticker: 'AMD', name: 'Advanced Micro Devices, Inc.', exchange: 'NASDAQ' },
  { ticker: 'QCOM', name: 'Qualcomm Incorporated', exchange: 'NASDAQ' },
  { ticker: 'CSCO', name: 'Cisco Systems, Inc.', exchange: 'NASDAQ' },
  { ticker: 'IBM', name: 'International Business Machines', exchange: 'NYSE' },
  { ticker: 'PYPL', name: 'PayPal Holdings, Inc.', exchange: 'NASDAQ' },
  { ticker: 'SHOP', name: 'Shopify Inc.', exchange: 'NYSE' },
]

const GCC_MARKETS = [
  { name: 'Saudi Arabia', exchange: 'Tadawul (TASI)', status: 'Coming Soon' },
  { name: 'United Arab Emirates', exchange: 'DFM / ADX', status: 'Coming Soon' },
  { name: 'Qatar', exchange: 'QSE', status: 'Coming Soon' },
  { name: 'Kuwait', exchange: 'Boursa Kuwait', status: 'Coming Soon' },
]

const STATS = [
  { value: 8000, suffix: '+', label: 'Stocks Coverable' },
  { value: 4, suffix: '', label: 'AAOIFI Ratio Checks' },
  { value: 24, suffix: 'h', label: 'Data Freshness' },
  { value: 100, suffix: '%', label: 'Transparent Methodology' },
]

const STEPS = [
  { title: 'Search a Ticker', desc: 'Enter any listed company or ETF symbol you want to screen.' },
  { title: 'We Run the AAOIFI Screen', desc: 'Business activity and financial ratios are checked against AAOIFI thresholds.' },
  { title: 'Get a Clear Verdict', desc: 'See Pass, Fail, or Doubtful — with the full ratio breakdown behind it.' },
]

const VALUE_PROPS = [
  { icon: '⚖️', title: 'AAOIFI Standard', desc: 'Screening built on the widely-recognized AAOIFI two-layer methodology.', border: 'var(--color-emerald)' },
  { icon: '🔍', title: 'Full Transparency', desc: 'Every ratio, threshold, and formula is shown — no black box verdicts.', border: 'var(--color-gold)' },
  { icon: '⚡', title: 'Fast & Cached', desc: 'Results cache for 24 hours so you can revisit screens instantly.', border: 'var(--color-emerald)' },
  { icon: '🕌', title: 'Built for Muslims Investing', desc: 'Designed around the questions Muslim investors actually ask.', border: 'var(--color-gold)' },
]

const TESTIMONIALS = [
  { quote: 'Finally a screener that shows its work instead of just a red or green light.', name: 'Amina R.', role: 'Retail Investor' },
  { quote: 'The ratio breakdown on the Results page is exactly what I needed for due diligence.', name: 'Yusuf K.', role: 'Portfolio Manager' },
  { quote: 'Clean, fast, and the methodology page actually explains the AAOIFI thresholds.', name: 'Sarah M.', role: 'Finance Student' },
]

function PopularStockCard({ ticker, name, exchange }) {
  return (
    <Link
      to={`/results/${ticker}`}
      className="reveal-stagger-item glass-card flex flex-col gap-3 p-5 transition-transform duration-300 hover:-translate-y-1 hover:border-[var(--color-gold)]/40"
    >
      <div>
        <p className="font-mono font-bold text-base text-[var(--color-gold)]">{ticker}</p>
        <p className="mt-1 text-[13px] text-[var(--color-text-secondary)] truncate">{name}</p>
        <p className="text-[11px] text-[var(--color-text-secondary)]/60 mt-0.5">{exchange}</p>
      </div>
      <span className="mt-1 inline-flex w-full items-center justify-center rounded-lg bg-[var(--color-emerald)] py-2 text-sm font-medium text-[#0a0a0f] hover:brightness-110 transition">
        Screen Now
      </span>
    </Link>
  )
}

export default function Home() {
  const containerRef = useRef(null)
  const heroRef = useRef(null)
  const headlineRef = useRef(null)
  const searchRef = useRef(null)
  const statNumRefs = useRef([])

  const navigate = useNavigate()

  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [etfMode, setEtfMode] = useState(false)

  useEffect(() => {
    if (query.trim().length < 1) {
      setSuggestions([])
      return
    }
    const handle = setTimeout(async () => {
      try {
        const results = await searchSymbol(query.trim())
        setSuggestions((results || []).slice(0, 6))
      } catch {
        setSuggestions([])
      }
    }, 400)
    return () => clearTimeout(handle)
  }, [query])

  function goToTicker(ticker) {
    if (!ticker) return
    setShowSuggestions(false)
    setQuery('')
    navigate(`/results/${ticker.toUpperCase()}${etfMode ? '?etf=true' : ''}`)
  }

  const headline = 'Shariah-Compliant Stock Screening'

  useGSAP(
    () => {
      // Headline words fade in with stagger on load, then the search bar follows.
      const words = headlineRef.current?.querySelectorAll('.word')
      const loadTl = gsap.timeline()
      if (words?.length) {
        loadTl.from(words, {
          y: 60,
          opacity: 0,
          duration: 0.7,
          stagger: 0.15,
          ease: 'power3.out',
        })
      }
      loadTl.from(
        searchRef.current,
        { y: 24, opacity: 0, duration: 0.5, ease: 'power2.out' },
        '-=0.3',
      )

      // Simple scroll fade-ins — no pinning, no scrubbing.
      const reveals = gsap.utils.toArray('.reveal', containerRef.current)
      reveals.forEach((el) => {
        gsap.from(el, {
          y: 48,
          opacity: 0,
          duration: 0.7,
          ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 85%', once: true },
        })
      })

      const staggerGroups = gsap.utils.toArray('.reveal-stagger', containerRef.current)
      staggerGroups.forEach((group) => {
        const items = group.querySelectorAll('.reveal-stagger-item')
        gsap.from(items, {
          y: 32,
          opacity: 0,
          duration: 0.6,
          stagger: 0.08,
          ease: 'power2.out',
          scrollTrigger: { trigger: group, start: 'top 85%', once: true },
        })
      })

      // Stats — count up once when the section enters the viewport.
      STATS.forEach((stat, i) => {
        const el = statNumRefs.current[i]
        if (!el) return
        gsap.to(
          { val: 0 },
          {
            val: stat.value,
            duration: 1.6,
            ease: 'power2.out',
            scrollTrigger: { trigger: el, start: 'top 85%', once: true },
            onUpdate: function () {
              el.textContent = Math.round(this.targets()[0].val).toLocaleString()
            },
          },
        )
      })

      // How It Works — alternating slide-in from the side opposite the number.
      const stepRows = gsap.utils.toArray('.step-row', containerRef.current)
      stepRows.forEach((row) => {
        const content = row.querySelector('.step-content')
        const fromX = row.dataset.numberSide === 'left' ? 120 : -120
        gsap.from(content, {
          x: fromX,
          opacity: 0,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: { trigger: row, start: 'top 75%', once: true },
        })
      })

      // Testimonials — slide in from bottom individually.
      const testimonialCards = gsap.utils.toArray('.testimonial-card', containerRef.current)
      testimonialCards.forEach((card) => {
        gsap.from(card, {
          y: 64,
          opacity: 0,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: { trigger: card, start: 'top 85%', once: true },
        })
      })
    },
    { scope: containerRef },
  )

  return (
    <div ref={containerRef}>
      {/* HERO — no pinning, natural scroll */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex items-center px-6 py-24 md:py-0 overflow-hidden"
      >
        <div className="mx-auto w-full max-w-7xl flex flex-col md:flex-row items-center gap-16">
          <div className="relative flex-1 order-2 md:order-1 w-full">
            <div className="relative z-10">
              <h1
                ref={headlineRef}
                aria-label={headline}
                className="font-display italic text-5xl md:text-[68px] font-black leading-[1.05]"
              >
                {headline.split(' ').map((w, i) => (
                  <span key={i} aria-hidden="true" className="word inline-block mr-3 text-gradient-gold">
                    {w}
                  </span>
                ))}
              </h1>
              <p className="mt-4 text-lg text-[var(--color-text-secondary)] max-w-lg" style={{ fontSize: '18px' }}>
                Invest with Principles. Screen with Certainty.
              </p>

              <div ref={searchRef} className="mt-6 relative max-w-lg">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onFocus={() => setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') goToTicker(query)
                      }}
                      placeholder="Search a ticker or company — e.g. AAPL, Apple..."
                      className="w-full text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] outline-none focus:border-[var(--color-gold)]/50 transition-colors"
                      style={{
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '12px',
                        padding: '16px 20px',
                        fontFamily: 'var(--font-sans)',
                        fontSize: '16px',
                      }}
                    />
                    {showSuggestions && suggestions.length > 0 && (
                      <ul className="absolute z-20 mt-2 w-full glass-card overflow-hidden py-1">
                        {suggestions.map((s) => (
                          <li key={s.symbol}>
                            <button
                              onMouseDown={() => goToTicker(s.symbol)}
                              className="w-full text-left px-4 py-2 text-sm hover:bg-white/5 flex items-center justify-between gap-2"
                            >
                              <span className="font-medium text-[var(--color-text-primary)]">{s.symbol}</span>
                              <span className="text-[var(--color-text-secondary)] truncate">{s.name}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <button
                    onClick={() => goToTicker(query)}
                    className="rounded-xl bg-[var(--color-gold)] px-5 py-4 text-sm font-semibold text-[#0a0a0f] hover:brightness-110 transition whitespace-nowrap"
                  >
                    Screen Now
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-4">
                  <label className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={etfMode}
                      onChange={(e) => setEtfMode(e.target.checked)}
                      className="accent-[var(--color-gold)]"
                    />
                    ETF Mode
                  </label>
                  <button
                    onClick={() => navigate('/portfolio')}
                    className="text-sm font-medium text-[var(--color-emerald)] hover:underline"
                  >
                    Bulk Screen →
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex-1 order-1 md:order-2 flex justify-center">
            <div className="relative w-[60%] md:w-full flex justify-center">
              <CrescentMoon heroRef={heroRef} />
              <div
                className="demo-card-float glass-card absolute -bottom-10 -right-2 lg:-right-10 p-6 min-w-[280px]"
                style={{ border: '1px solid var(--color-gold)' }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-500/40 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-[var(--color-text-secondary)]">Apple Inc.</p>
                    <p className="text-xl font-bold text-white">AAPL</p>
                  </div>
                </div>
                <span
                  className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[var(--color-emerald)]/40 bg-[var(--color-emerald)]/10 px-3 py-1 text-xs font-semibold uppercase text-[var(--color-emerald)]"
                  style={{ boxShadow: '0 0 20px rgba(16, 185, 129, 0.6)' }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-emerald)]" />
                  Shariah Pass
                </span>
                <div className="mt-4 flex items-end gap-1.5" style={{ height: '60px' }}>
                  {[40, 55, 48, 65, 58, 72, 68, 80].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t bg-gradient-to-t from-[var(--color-emerald)]/30 to-[var(--color-emerald)]"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS — natural page flow, no separate bar */}
      <section className="w-full py-20">
        <div className="mx-auto max-w-7xl px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((s, i) => (
            <div
              key={s.label}
              className="text-center"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '16px',
                padding: '32px 24px',
              }}
            >
              <p
                className="leading-none font-bold text-[var(--color-gold)]"
                style={{ fontFamily: 'var(--font-display)', fontSize: '64px' }}
              >
                <span ref={(el) => (statNumRefs.current[i] = el)}>0</span>
                {s.suffix}
              </p>
              <p
                className="mt-3 text-[var(--color-text-secondary)]"
                style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em' }}
              >
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* POPULAR STOCKS — plain responsive grid, no scroll hijacking */}
      <section className="relative px-6 pt-0 pb-20">
        <div className="reveal mb-8 max-w-7xl mx-auto w-full">
          <h2 className="font-display text-3xl font-bold">Popular Stocks</h2>
          <p className="mt-2 text-[var(--color-text-secondary)]">Jump straight into a screen for widely-held names.</p>
        </div>
        <div className="reveal-stagger max-w-7xl mx-auto w-full grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {POPULAR_STOCKS.map((s) => (
            <PopularStockCard key={s.ticker} {...s} />
          ))}
        </div>
      </section>

      {/* GCC MARKETS */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="reveal glass-card p-8 border-[var(--color-gold)]/20">
          <h2 className="font-display text-3xl font-bold text-[var(--color-gold)]">GCC Markets</h2>
          <p className="mt-2 text-[var(--color-text-secondary)] max-w-2xl">
            Gulf market coverage is expanding. Today Vera screens best on US-listed equities; regional exchanges
            below are on our roadmap.
          </p>
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            {GCC_MARKETS.map((m) => (
              <div key={m.name} className="rounded-xl border border-[var(--color-gold)]/20 p-4">
                <p className="font-semibold text-[var(--color-text-primary)]">{m.name}</p>
                <p className="text-sm text-[var(--color-text-secondary)]">{m.exchange}</p>
                <span className="mt-2 inline-block text-xs font-medium text-[var(--color-gold)]">{m.status}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS — full-width alternating rows */}
      <section className="py-20">
        <div className="reveal mb-10 text-center px-6">
          <h2 className="font-display text-3xl font-bold">How It Works</h2>
        </div>
        {STEPS.map((step, i) => {
          const numberOnLeft = i % 2 === 0
          return (
            <div
              key={step.title}
              className={`step-row min-h-[40vh] flex items-center gap-8 px-6 max-w-7xl mx-auto ${
                numberOnLeft ? '' : 'flex-row-reverse'
              }`}
              data-number-side={numberOnLeft ? 'left' : 'right'}
            >
              <div className="flex-1 flex justify-center select-none">
                <span
                  className="font-display font-black leading-none"
                  style={{ fontSize: '180px', color: 'var(--color-gold)', opacity: 0.08 }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
              </div>
              <div className="step-content flex-1">
                <p className="font-display text-white" style={{ fontSize: '28px' }}>
                  {step.title}
                </p>
                <p className="mt-3 text-[var(--color-text-secondary)] max-w-md" style={{ fontSize: '16px' }}>
                  {step.desc}
                </p>
              </div>
            </div>
          )
        })}
      </section>

      {/* WHY VERA */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="reveal mb-10 text-center">
          <h2 className="font-display text-3xl font-bold">Why Vera</h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4" style={{ gap: '24px' }}>
          {VALUE_PROPS.map((v) => (
            <div
              key={v.title}
              className="reveal glass-card flex flex-col min-h-[220px] p-10"
              style={{ borderTop: `3px solid ${v.border}` }}
            >
              <span style={{ fontSize: '48px', lineHeight: 1 }}>{v.icon}</span>
              <p className="mt-4 font-display text-xl text-[var(--color-text-primary)]">{v.title}</p>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS — editorial, full width stacked */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="reveal mb-10 text-center">
          <h2 className="font-display text-3xl font-bold">What Investors Say</h2>
        </div>
        <div className="flex flex-col gap-8">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="testimonial-card relative overflow-hidden rounded-2xl p-12"
              style={{ background: 'rgba(255,255,255,0.03)', borderLeft: '2px solid var(--color-gold)' }}
            >
              <span
                aria-hidden="true"
                className="font-display absolute top-4 left-4 select-none"
                style={{ fontSize: '96px', color: 'var(--color-gold)', opacity: 0.1, lineHeight: 1 }}
              >
                &ldquo;
              </span>
              <p className="text-[var(--color-gold)] relative z-10" aria-hidden="true">
                ★★★★★
              </p>
              <p
                className="font-display italic text-white leading-relaxed relative z-10 mt-4"
                style={{ fontSize: '22px' }}
              >
                {t.quote}
              </p>
              <p className="mt-4 text-base font-bold text-[var(--color-gold)] relative z-10">{t.name}</p>
              <p className="text-[13px] text-[var(--color-text-secondary)] relative z-10">{t.role}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
