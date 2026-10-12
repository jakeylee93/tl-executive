'use client'

import { useEffect, useRef } from 'react'

// Drives the hero storyboard from native scroll. Sets CSS variables on the
// [data-hero] section; the stylesheet turns them into transforms/opacity:
//   --cam    day plate dolly (camera moving down the road)
//   --dusk   warm horizon light, peaking mid-way
//   --night  evening plate
//   --ry/--rx/--bs/--by   badge turn, tilt, scale and rise
//   --bl     badge rim light angle (sun upper-left → street lamp upper-right)
//   --gx/--gy  badge gloss drift; --badge-sheen  light colour (cool → warm)
//   --cap-day/--cap-night  location captions (never shown together)
// Reversible by construction: every value is a pure function of scroll
// position, so there is nothing autonomous to pause. Reduced motion → the
// static daylight frame. Two different scenes of one journey (Epping Forest
// by day, the M25 at night) — not the same road relit.

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v))
const smooth = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a))
  return t * t * (3 - 2 * t)
}
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

export function HeroMotion() {
  const rootRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const hero = rootRef.current?.closest<HTMLElement>('[data-hero]')
    if (!hero) return
    const track = hero.querySelector<HTMLElement>('.hero-track')
    const content = hero.querySelector<HTMLElement>('[data-hero-content]')
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')

    const apply = (p: number) => {
      const s = hero.style
      const night = smooth(0.38, 0.86, p)
      const warm = smooth(0.3, 0.9, p)
      s.setProperty('--p', p.toFixed(4))
      s.setProperty('--cam', (1 + 0.16 * smooth(0, 0.75, p)).toFixed(4))
      s.setProperty('--dusk', (Math.sin(Math.PI * clamp((p - 0.12) / 0.74)) * 0.95).toFixed(4))
      s.setProperty('--night', night.toFixed(4))
      s.setProperty('--ry', `${lerp(-11, 11, p).toFixed(2)}deg`)
      s.setProperty('--rx', `${lerp(4, -3, p).toFixed(2)}deg`)
      s.setProperty('--bs', lerp(1, 0.9, smooth(0.45, 1, p)).toFixed(4))
      s.setProperty('--by', `${(-window.innerHeight * 0.035 * smooth(0.45, 1, p)).toFixed(1)}px`)
      s.setProperty('--bl', `${lerp(-60, 55, p).toFixed(1)}deg`)
      s.setProperty('--gx', `${lerp(-40, 170, p).toFixed(1)}px`)
      s.setProperty('--gy', `${lerp(0, 60, p).toFixed(1)}px`)
      // Captions hand over without ever overlapping.
      s.setProperty('--cap-day', (1 - smooth(0.3, 0.44, p)).toFixed(4))
      s.setProperty('--cap-night', smooth(0.58, 0.72, p).toFixed(4))
      const g = Math.round(lerp(255, 214, warm)), b = Math.round(lerp(255, 170, warm))
      s.setProperty('--badge-sheen', `rgb(255, ${g}, ${b})`)
    }

    // Unpin if the content (e.g. at large text zoom) is taller than the
    // viewport, so nothing is ever clipped.
    const fit = () => {
      if (!content) return
      hero.dataset.pin = content.scrollHeight > window.innerHeight + 2 ? 'off' : 'on'
    }

    const progress = () => {
      const rect = (track || hero).getBoundingClientRect()
      const span = hero.dataset.pin !== 'off' ? rect.height - window.innerHeight : rect.height
      return span > 0 ? clamp(-rect.top / span) : 0
    }

    let frame = 0
    const onScroll = () => {
      if (frame || mq.matches) return
      frame = requestAnimationFrame(() => { frame = 0; apply(progress()) })
    }
    const onResize = () => { fit(); onScroll() }
    const init = () => { fit(); apply(mq.matches ? 0 : progress()) }

    init()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    mq.addEventListener('change', init)
    document.fonts?.ready.then(() => { fit(); onScroll() }).catch(() => {})
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      mq.removeEventListener('change', init)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  return <span ref={rootRef} hidden />
}
