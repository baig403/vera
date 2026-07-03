import { Component, useEffect, useRef } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import CustomCursor from './components/CustomCursor'
import Home from './pages/Home'
import Results from './pages/Results'
import Watchlist from './pages/Watchlist'
import Compare from './pages/Compare'
import Portfolio from './pages/Portfolio'
import Methodology from './pages/Methodology'
import { initLenis, destroyLenis } from './utils/lenis'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error) {
    console.error('Vera page error:', error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto max-w-2xl px-6 py-24 text-center">
          <h1 className="font-display text-3xl font-bold text-[var(--color-danger)]">Something went wrong</h1>
          <p className="mt-3 text-[var(--color-text-secondary)]">
            This page hit an unexpected error. Try refreshing or heading back home.
          </p>
        </div>
      )
    }
    return this.props.children
  }
}

function ScrollToTop() {
  const { pathname } = useLocation()
  const isFirstRun = useRef(true)

  useEffect(() => {
    // Native scroll reset first — guaranteed synchronous, unlike Lenis's
    // eased scrollTo which depends on the next raf tick to actually land.
    window.scrollTo(0, 0)

    if (isFirstRun.current) {
      isFirstRun.current = false
      return
    }
    destroyLenis()
    initLenis()
    ScrollTrigger.refresh()
  }, [pathname])

  return null
}

function PageTransition({ children, routeKey }) {
  const ref = useRef(null)
  const overlayRef = useRef(null)

  useGSAP(
    () => {
      gsap.set(overlayRef.current, { scaleY: 0, transformOrigin: 'bottom' })

      const tl = gsap.timeline()
      tl.to(ref.current, { opacity: 0, duration: 0.2, ease: 'power1.in' })
        .set(overlayRef.current, { transformOrigin: 'bottom' })
        .to(overlayRef.current, { scaleY: 1, duration: 0.2, ease: 'power1.inOut' }, '<')
        .set(overlayRef.current, { transformOrigin: 'top' })
        .to(overlayRef.current, { scaleY: 0, duration: 0.2, ease: 'power1.inOut' })
        .to(ref.current, { opacity: 1, duration: 0.3, ease: 'power1.out' }, '<')

      return () => tl.kill()
    },
    { dependencies: [routeKey], scope: ref },
  )

  return (
    <>
      <div ref={overlayRef} className="fixed inset-0 z-[200] bg-black pointer-events-none" style={{ transform: 'scaleY(0)' }} aria-hidden="true" />
      <div ref={ref}>{children}</div>
    </>
  )
}

function withBoundary(element) {
  return <ErrorBoundary>{element}</ErrorBoundary>
}

export default function App() {
  const location = useLocation()

  return (
    <div className="min-h-screen flex flex-col">
      <div className="orb orb-emerald" aria-hidden />
      <div className="orb orb-gold" aria-hidden />
      <CustomCursor />
      <ScrollToTop />
      <Navbar />
      <main className="flex-1">
        <PageTransition routeKey={location.pathname}>
          <Routes location={location}>
            <Route path="/" element={withBoundary(<Home />)} />
            <Route path="/results/:ticker" element={withBoundary(<Results />)} />
            <Route path="/watchlist" element={withBoundary(<Watchlist />)} />
            <Route path="/compare" element={withBoundary(<Compare />)} />
            <Route path="/portfolio" element={withBoundary(<Portfolio />)} />
            <Route path="/methodology" element={withBoundary(<Methodology />)} />
          </Routes>
        </PageTransition>
      </main>
      <Footer />
    </div>
  )
}
