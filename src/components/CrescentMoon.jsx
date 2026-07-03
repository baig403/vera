import { useEffect, useRef } from 'react'

const SIZE = 480
const MAX_TILT = 8

export default function CrescentMoon({ heroRef }) {
  const tiltRef = useRef(null)

  useEffect(() => {
    const hero = heroRef?.current
    if (!hero) return undefined

    function handleMouseMove(e) {
      const rect = hero.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width
      const y = (e.clientY - rect.top) / rect.height
      const tiltX = (0.5 - y) * (MAX_TILT * 2)
      const tiltY = (x - 0.5) * (MAX_TILT * 2)
      if (tiltRef.current) {
        tiltRef.current.style.transform = `perspective(800px) rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg)`
      }
    }

    function handleMouseLeave() {
      if (tiltRef.current) {
        tiltRef.current.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg)'
      }
    }

    hero.addEventListener('mousemove', handleMouseMove)
    hero.addEventListener('mouseleave', handleMouseLeave)
    return () => {
      hero.removeEventListener('mousemove', handleMouseMove)
      hero.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [heroRef])

  return (
    <div className="crescent-outer" style={{ width: SIZE, maxWidth: '100%', aspectRatio: '1 / 1' }}>
      <div ref={tiltRef} className="crescent-tilt w-full h-full">
        <svg className="crescent-spin block w-full h-full" viewBox="0 0 480 480" aria-hidden="true">
          <defs>
            <radialGradient id="crescentGold" cx="35%" cy="35%" r="70%">
              <stop offset="0%" stopColor="#F4E4B8" />
              <stop offset="45%" stopColor="#C9A84C" />
              <stop offset="100%" stopColor="#8B7233" />
            </radialGradient>
            <filter id="crescentGlow">
              <feGaussianBlur stdDeviation="12" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <circle cx="240" cy="240" r="160" fill="url(#crescentGold)" filter="url(#crescentGlow)" />
          <circle cx="310" cy="210" r="145" fill="#0A0A0F" />
        </svg>
      </div>
    </div>
  )
}
