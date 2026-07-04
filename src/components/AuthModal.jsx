import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.83.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.95v2.33A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.95A9 9 0 0 0 0 9c0 1.45.35 2.83.95 4.03z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58A8.55 8.55 0 0 0 9 0 9 9 0 0 0 .95 4.97L3.95 7.3C4.66 5.17 6.65 3.58 9 3.58z"
      />
    </svg>
  )
}

export default function AuthModal() {
  const { authModalOpen, authModalMode, closeAuthModal, signUpWithEmail, signInWithEmail, signInWithGoogle } =
    useAuth()

  const [mode, setMode] = useState(authModalMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  useEffect(() => {
    if (authModalOpen) {
      setMode(authModalMode)
      setEmail('')
      setPassword('')
      setError('')
      setInfo('')
      setLoading(false)
    }
  }, [authModalOpen, authModalMode])

  if (!authModalOpen) return null

  const isSignup = mode === 'signup'

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setInfo('')
    setLoading(true)
    try {
      if (isSignup) {
        const data = await signUpWithEmail(email, password)
        // A project with "Confirm email" enabled returns a user but no
        // session until the confirmation link is clicked — closing the
        // modal here would silently look like a successful login.
        if (data.session) {
          closeAuthModal()
        } else {
          setInfo('Check your email to confirm your account, then log in.')
        }
      } else {
        await signInWithEmail(email, password)
        closeAuthModal()
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    setError('')
    setGoogleLoading(true)
    try {
      await signInWithGoogle()
    } catch (err) {
      setError(err.message || 'Could not continue with Google.')
      setGoogleLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeAuthModal} />

      <div
        className="glass-card relative w-full max-w-md p-8"
        style={{ background: 'rgba(10, 10, 15, 0.9)' }}
      >
        <button
          onClick={closeAuthModal}
          aria-label="Close"
          className="absolute top-4 right-4 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          ✕
        </button>

        <h2 className="font-display italic text-3xl font-bold text-gradient-gold">
          {isSignup ? 'Create Your Account' : 'Welcome Back'}
        </h2>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          {isSignup
            ? 'Save your watchlist and track your portfolio across devices.'
            : 'Log in to access your watchlist and portfolio.'}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            autoComplete="email"
            className="w-full rounded-xl border border-white/12 bg-white/[0.06] px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] outline-none focus:border-[var(--color-gold)]/50 transition-colors"
          />
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete={isSignup ? 'new-password' : 'current-password'}
            className="w-full rounded-xl border border-white/12 bg-white/[0.06] px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] outline-none focus:border-[var(--color-gold)]/50 transition-colors"
          />

          {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}
          {info && <p className="text-sm text-[var(--color-emerald)]">{info}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-xl bg-[var(--color-gold)] py-3 text-sm font-semibold text-[#0a0a0f] hover:brightness-110 transition disabled:opacity-50"
          >
            {loading ? 'Please wait...' : isSignup ? 'Create Account' : 'Log In'}
          </button>
        </form>

        <div className="mt-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-xs uppercase tracking-wider text-[var(--color-text-secondary)]">or</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <button
          onClick={handleGoogle}
          disabled={googleLoading}
          className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl border border-white/15 bg-white py-3 text-sm font-medium text-[#0a0a0f] hover:brightness-95 transition disabled:opacity-50"
        >
          <GoogleIcon />
          {googleLoading ? 'Redirecting...' : 'Continue with Google'}
        </button>

        <p className="mt-6 text-center text-sm text-[var(--color-text-secondary)]">
          {isSignup ? (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="font-medium text-[var(--color-gold)] hover:underline"
              >
                Log in
              </button>
            </>
          ) : (
            <>
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('signup')}
                className="font-medium text-[var(--color-gold)] hover:underline"
              >
                Sign up
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  )
}
