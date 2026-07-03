import Lenis from 'lenis'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const expoOut = (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))

let lenis = null
let tickerCallback = null

export function initLenis() {
  if (lenis) return lenis

  lenis = new Lenis({
    duration: 0.8,
    easing: expoOut,
    smoothWheel: true,
  })

  lenis.on('scroll', ScrollTrigger.update)

  tickerCallback = (time) => {
    lenis.raf(time * 1000)
  }
  gsap.ticker.add(tickerCallback)
  gsap.ticker.lagSmoothing(0)

  return lenis
}

export function destroyLenis() {
  if (tickerCallback) {
    gsap.ticker.remove(tickerCallback)
    tickerCallback = null
  }
  if (lenis) {
    lenis.destroy()
    lenis = null
  }
}

export function getLenis() {
  return lenis
}
