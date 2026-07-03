import { useEffect, useRef, useState } from 'react'

const HOVER_SELECTOR = 'a, button, input, textarea, select, [role="button"]'

export default function CustomCursor() {
  const dotRef = useRef(null)
  const ringRef = useRef(null)
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches,
  )

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const onChange = (e) => setIsDesktop(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    if (!isDesktop) return undefined

    document.body.classList.add('custom-cursor-active')

    const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    const ring = { x: mouse.x, y: mouse.y }
    let hovering = false
    let rafId

    function onMouseMove(e) {
      mouse.x = e.clientX
      mouse.y = e.clientY
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${mouse.x}px, ${mouse.y}px, 0) translate(-50%, -50%)`
      }
    }

    function onPointerOver(e) {
      const isHoverTarget = e.target.closest(HOVER_SELECTOR)
      if (isHoverTarget && !hovering) {
        hovering = true
        ringRef.current?.classList.add('cursor-ring-hover')
      } else if (!isHoverTarget && hovering) {
        hovering = false
        ringRef.current?.classList.remove('cursor-ring-hover')
      }
    }

    function tick() {
      ring.x += (mouse.x - ring.x) * 0.15
      ring.y += (mouse.y - ring.y) * 0.15
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ring.x}px, ${ring.y}px, 0) translate(-50%, -50%)`
      }
      rafId = requestAnimationFrame(tick)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('pointerover', onPointerOver)
    rafId = requestAnimationFrame(tick)

    return () => {
      document.body.classList.remove('custom-cursor-active')
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('pointerover', onPointerOver)
      cancelAnimationFrame(rafId)
    }
  }, [isDesktop])

  if (!isDesktop) return null

  return (
    <>
      <div ref={dotRef} className="cursor-dot" aria-hidden="true" />
      <div ref={ringRef} className="cursor-ring" aria-hidden="true" />
    </>
  )
}
