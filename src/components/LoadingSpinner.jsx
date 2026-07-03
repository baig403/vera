export default function LoadingSpinner({ label = 'Loading...', size = 'md' }) {
  const dimensions = size === 'sm' ? 'w-5 h-5 border-2' : size === 'lg' ? 'w-12 h-12 border-4' : 'w-8 h-8 border-2'

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8">
      <div
        className={`${dimensions} rounded-full animate-spin`}
        style={{
          borderColor: 'rgba(201, 168, 76, 0.2)',
          borderTopColor: 'var(--color-gold)',
        }}
      />
      {label && <p className="text-sm text-[var(--color-text-secondary)]">{label}</p>}
    </div>
  )
}
