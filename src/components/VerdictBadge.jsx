const VERDICT_CONFIG = {
  PASS: {
    label: 'Shariah Pass',
    color: 'var(--color-emerald)',
    bg: 'rgba(16, 185, 129, 0.12)',
    border: 'rgba(16, 185, 129, 0.4)',
  },
  FAIL: {
    label: 'Shariah Fail',
    color: 'var(--color-danger)',
    bg: 'rgba(239, 68, 68, 0.12)',
    border: 'rgba(239, 68, 68, 0.4)',
  },
  DOUBTFUL: {
    label: 'Doubtful',
    color: 'var(--color-amber)',
    bg: 'rgba(245, 158, 11, 0.12)',
    border: 'rgba(245, 158, 11, 0.4)',
  },
}

export default function VerdictBadge({ verdict, size = 'md', glow = false }) {
  const config = VERDICT_CONFIG[verdict] || VERDICT_CONFIG.DOUBTFUL
  const sizeClasses =
    size === 'lg' ? 'text-lg px-6 py-3 gap-2.5' : size === 'sm' ? 'text-xs px-2.5 py-1 gap-1.5' : 'text-sm px-4 py-1.5 gap-2'

  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold uppercase tracking-wide ${sizeClasses} ${glow ? 'animate-pulse' : ''}`}
      style={{
        color: config.color,
        background: config.bg,
        border: `1px solid ${config.border}`,
        boxShadow: glow ? `0 0 24px ${config.border}` : 'none',
      }}
    >
      <span
        className={size === 'lg' ? 'w-2.5 h-2.5' : 'w-1.5 h-1.5'}
        style={{ background: config.color, borderRadius: '9999px' }}
      />
      {config.label}
    </span>
  )
}
