'use client'

import { useEffect, useRef } from 'react'

// Drives the opening journey from native scroll. Every value is a pure
// function of scroll position p (0 → 1 across the pinned stage), so scrolling
// back returns the identical frame and there is nothing autonomous to pause.
//
//   p 0.00  ARRIVAL start   the complete car, opening copy, early evening
//     0.04–0.34            camera moves in toward the windscreen; light turns
//                          to evening and a reflection travels along the car
//     0.27–0.38            through the glass → CABIN
//     0.36–0.58  CABIN     settles; "Settle in."
//     0.60–0.72            camera draws back and rises → ROAD
//     0.70–0.90  ROAD      the motorway at night, light trails; airports copy
//     0.88–1.00  QUOTE     "Where are we taking you?"
//
// CSS variables written on [data-hero]:
//   --ext-o --ext-tx --ext-ty --ext-s  exterior opacity and camera
//   --eve --sweep                      evening grade, travelling reflection
//   --cab-o --cab-s  --road-o --road-s cabin and road scenes
//   --glass                            transition veil
//   --ca --cb --cc --cd                copy: opening, cabin, road, quote
//   --bl --ry                          badge rim light and turn
// Reduced motion, or content taller than the screen (large text zoom): the
// static arrival frame with its copy; nothing pinned.

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v))
const smooth = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a))
  return t * t * (3 - 2 * t)
}
const bump = (a: number, b: number, c: number, d: number, v: number) => smooth(a, b, v) * (1 - smooth(c, d, v))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

export function HeroMotion() {
  const rootRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const hero = rootRef.current?.closest<HTMLElement>('[data-hero]')
    if (!hero) return
    const track = hero.querySelector<HTMLElement>('.hero-track')
    const stage = hero.querySelector<HTMLElement>('.hero-stage')
    const box = hero.querySelector<HTMLElement>('.ext-box')
    const copyA = hero.querySelector<HTMLElement>('[data-hero-copy="a"]')
    const copyD = hero.querySelector<HTMLElement>('[data-hero-copy="d"]')
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    let geo = { fx: 0, fy: 0, cx: 0, cy: 0, cover: 1 }

    const measure = () => {
      if (!box || !stage) return
      // Layout box (offset*), unaffected by the transforms applied below.
      // Where the camera heads: the windscreen (lib/journey focal, as data-*).
      const FOCAL = { x: Number(box.dataset.focalX) || 0.5, y: Number(box.dataset.focalY) || 0.4 }
      const w = box.offsetWidth, h = box.offsetHeight
      const W = stage.clientWidth, H = stage.clientHeight
      geo = {
        fx: box.offsetLeft + w * FOCAL.x,
        fy: box.offsetTop + h * FOCAL.y,
        cx: W / 2,
        cy: H * 0.45,
        cover: Math.max(W / w, H / h),
      }
    }

    const setInert = (el: HTMLElement | null, on: boolean) => {
      if (!el) return
      if (on) el.setAttribute('inert', '')
      else el.removeAttribute('inert')
    }

    const apply = (p: number) => {
      const s = hero.style
      const t = smooth(0.04, 0.34, p)
      const scale = lerp(1, geo.cover * 1.75, t * t)
      s.setProperty('--p', p.toFixed(4))
      s.setProperty('--ext-o', (1 - smooth(0.27, 0.35, p)).toFixed(4))
      s.setProperty('--ext-tx', `${((geo.cx - geo.fx) * t).toFixed(1)}px`)
      s.setProperty('--ext-ty', `${((geo.cy - geo.fy) * t).toFixed(1)}px`)
      s.setProperty('--ext-s', scale.toFixed(4))
      s.setProperty('--eve', smooth(0, 0.24, p).toFixed(4))
      s.setProperty('--sweep', clamp((p - 0.02) / 0.28).toFixed(4))
      s.setProperty('--glass', Math.max(bump(0.24, 0.31, 0.32, 0.39, p), 0.8 * bump(0.58, 0.65, 0.66, 0.72, p)).toFixed(4))
      s.setProperty('--cab-o', (smooth(0.29, 0.37, p) * (1 - smooth(0.62, 0.7, p))).toFixed(4))
      s.setProperty('--cab-s', (lerp(1.22, 1, smooth(0.29, 0.56, p)) * lerp(1, 0.9, smooth(0.6, 0.7, p))).toFixed(4))
      s.setProperty('--road-o', smooth(0.63, 0.71, p).toFixed(4))
      s.setProperty('--road-s', lerp(1.42, 1, smooth(0.62, 0.96, p)).toFixed(4))
      const ca = 1 - smooth(0.06, 0.16, p)
      const cd = smooth(0.88, 0.96, p)
      const cb = bump(0.36, 0.42, 0.52, 0.58, p)
      const cc = bump(0.7, 0.76, 0.84, 0.89, p)
      s.setProperty('--ca', ca.toFixed(4))
      s.setProperty('--cb', cb.toFixed(4))
      s.setProperty('--cc', cc.toFixed(4))
      s.setProperty('--cd', cd.toFixed(4))
      s.setProperty('--low', Math.max(cb, cc, cd).toFixed(4))
      s.setProperty('--bl', `${lerp(-60, 30, smooth(0, 0.16, p)).toFixed(1)}deg`)
      s.setProperty('--ry', `${lerp(-9, 4, smooth(0, 0.16, p)).toFixed(2)}deg`)
      // Hidden copy leaves the tab order; visible copy is always operable.
      setInert(copyA, ca < 0.5)
      setInert(copyD, cd < 0.5)
      if (copyD) copyD.dataset.live = cd >= 0.5 ? 'on' : 'off'
    }

    const fit = () => {
      const tall = [copyA, copyD].some(el => el && el.scrollHeight > window.innerHeight + 2)
      hero.dataset.pin = tall ? 'off' : 'on'
    }
    // The anyOS editor lays every scene's copy out in order (globals.css), so
    // nothing it may edit is hidden by the motion.
    const editing = () => document.documentElement.classList.contains('anyos-editing')
    const still = () => mq.matches || hero.dataset.pin === 'off' || editing()

    const progress = () => {
      const rect = (track || hero).getBoundingClientRect()
      const span = rect.height - window.innerHeight
      return span > 0 ? clamp(-rect.top / span) : 0
    }

    let frame = 0
    const onScroll = () => {
      if (frame || still()) return
      frame = requestAnimationFrame(() => { frame = 0; apply(progress()) })
    }
    const init = () => {
      fit()
      measure()
      if (still()) {
        apply(0)
        setInert(copyA, false)
        setInert(copyD, !editing())
      } else apply(progress())
    }

    init()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', init)
    mq.addEventListener('change', init)
    document.fonts?.ready.then(init).catch(() => {})
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', init)
      mq.removeEventListener('change', init)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  return <span ref={rootRef} hidden />
}
