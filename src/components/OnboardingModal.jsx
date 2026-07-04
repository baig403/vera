import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

const SEEN_KEY = 'vera_onboarding_seen'

export default function OnboardingModal() {
  const { openAuthModal } = useAuth()
  const [visible, setVisible] = useState(() => {
    try {
      return localStorage.getItem(SEEN_KEY) !== 'true'
    } catch {
      return false
    }
  })

  function dismiss() {
    try {
      localStorage.setItem(SEEN_KEY, 'true')
    } catch {
      // localStorage unavailable — just close the modal without persisting
    }
    setVisible(false)
  }

  function handleCreateAccount() {
    dismiss()
    openAuthModal('signup')
  }

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[290] flex items-center justify-center p-6" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

      <div
        className="glass-card relative w-full max-w-md p-10 text-center"
        style={{ background: 'rgba(10, 10, 15, 0.92)' }}
      >
        <h2 className="font-display italic text-4xl font-black text-gradient-gold">Welcome to Vera</h2>
        <p className="mt-4 text-sm text-[var(--color-text-secondary)] leading-relaxed">
          Create a free account to save your watchlist and track your portfolio, or continue as a guest.
        </p>

        <button
          onClick={handleCreateAccount}
          className="mt-8 w-full rounded-xl bg-[var(--color-gold)] py-3 text-sm font-semibold text-[#0a0a0f] hover:brightness-110 transition"
        >
          Create Account
        </button>

        <button
          onClick={dismiss}
          className="mt-4 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          Skip for now
        </button>
      </div>
    </div>
  )
}
