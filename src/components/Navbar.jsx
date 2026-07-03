import { useRef, useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'

const LINKS = [
  { to: '/', label: 'Screen', end: true },
  { to: '/watchlist', label: 'Watchlist' },
  { to: '/compare', label: 'Compare' },
  { to: '/portfolio', label: 'Portfolio Simulator' },
  { to: '/methodology', label: 'Methodology' },
]

function NavLinks({ onClick, vertical = false }) {
  return (
    <>
      {LINKS.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.end}
          onClick={onClick}
          className={({ isActive }) =>
            `relative py-1 text-sm font-medium transition-colors ${
              isActive ? 'text-[var(--color-gold)]' : 'text-[var(--color-text-primary)] hover:text-[var(--color-gold)]'
            } after:absolute after:left-0 after:-bottom-1 after:h-[2px] after:bg-[var(--color-gold)] after:transition-all after:duration-300 ${
              isActive ? 'after:w-full' : 'after:w-0 hover:after:w-full'
            } ${vertical ? 'text-base' : ''}`
          }
        >
          {link.label}
        </NavLink>
      ))}
    </>
  )
}

export default function Navbar() {
  const navRef = useRef(null)
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useGSAP(() => {
    gsap.from(navRef.current, { y: -24, opacity: 0, duration: 0.6, ease: 'power2.out' })
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  return (
    <header
      ref={navRef}
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'backdrop-blur-2xl bg-[#0a0a0f]/90 border-b border-[var(--color-gold)]/15'
          : 'backdrop-blur-md bg-[#0a0a0f]/40 border-b border-transparent'
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <NavLink to="/" className="group flex items-center gap-2">
          <span className="font-display text-[22px] font-bold text-[var(--color-text-primary)] transition-transform duration-300 ease-out group-hover:scale-110 inline-block">
            Vera
          </span>
          <span className="rounded-full bg-[var(--color-gold)]/15 border border-[var(--color-gold)]/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-gold)]">
            Beta
          </span>
        </NavLink>

        <div className="hidden md:flex items-center gap-8">
          <NavLinks />
        </div>

        <button
          className="md:hidden flex flex-col gap-1.5 p-2"
          aria-label="Toggle menu"
          onClick={() => setMenuOpen(true)}
        >
          <span className="block h-0.5 w-6 bg-[var(--color-text-primary)]" />
          <span className="block h-0.5 w-6 bg-[var(--color-text-primary)]" />
          <span className="block h-0.5 w-6 bg-[var(--color-text-primary)]" />
        </button>
      </nav>

      {/* Mobile slide-in menu */}
      <div
        className={`fixed inset-0 z-[60] md:hidden transition-opacity duration-300 ${
          menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="absolute inset-0 bg-black/60" onClick={() => setMenuOpen(false)} />
        <div
          className={`absolute top-0 right-0 h-full w-72 bg-[#0a0a0f] border-l border-white/10 p-6 flex flex-col gap-6 transition-transform duration-300 ${
            menuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <button
            className="self-end text-[var(--color-text-secondary)] text-2xl leading-none"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          >
            ✕
          </button>
          <div className="flex flex-col gap-6">
            <NavLinks vertical onClick={() => setMenuOpen(false)} />
          </div>
        </div>
      </div>
    </header>
  )
}
