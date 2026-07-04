import { useAuth } from '../context/AuthContext'

export default function SignInRequired({ feature }) {
  const { openAuthModal } = useAuth()

  return (
    <div className="mx-auto max-w-lg px-6 py-24">
      <div className="glass-card p-10 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[var(--color-gold)]/40 bg-[var(--color-gold)]/10 text-2xl">
          🔒
        </div>
        <h1 className="mt-6 font-display text-2xl font-bold">Sign in to access your {feature}</h1>
        <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
          Create a free account to save stocks and track your portfolio across devices.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
          <button
            onClick={() => openAuthModal('signup')}
            className="rounded-lg bg-[var(--color-gold)] px-5 py-3 text-sm font-semibold text-[#0a0a0f] hover:brightness-110 transition"
          >
            Sign Up
          </button>
          <button
            onClick={() => openAuthModal('login')}
            className="rounded-lg border border-white/20 px-5 py-3 text-sm font-semibold text-[var(--color-text-primary)] hover:bg-white/5 transition"
          >
            Log In
          </button>
        </div>
      </div>
    </div>
  )
}
