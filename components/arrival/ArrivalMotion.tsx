'use client'

import { useEffect } from 'react'
import { ARRIVAL, CABIN, NIGHT, brake, clamp, lerp, nightPath, smooth } from '@/lib/motion/scenes'

// The opening journey's engine. Native scroll position (0 → 1 across the
// pinned track) drives every layer; nothing plays by itself and scrolling
// back returns the identical frame. Each frame writes a handful of
// transforms and opacities: no layout, no filters, no video.
//
//   0.00–0.30  Arrival: the car rolls ROLL m and settles (wheels turn by the
//              distance), its lamps come on, the light falls to dusk.
//   0.20–0.36  The camera moves to the rear door glass; the dark glass fills
//              the frame (a cut through darkness, never a dissolve).
//   0.34–0.66  Cabin: the land outside spreads from the point straight ahead
//              as the car drives on; dusk outside, amber light inside.
//   0.58–0.72  The camera tilts up into darkness and down onto the motorway.
//   0.68–0.94  Night: the same car drives away up its lane.
//   0.86–1.00  "Where are we taking you?" and the journey shortcuts.

type Box = { x: number; y: number; w: number; h: number; c0: number; cw: number }

const PORTRAIT = '(max-aspect-ratio: 4/5)'
const TYRE_CIRC = Math.PI * 0.71 // S-Class 20-inch wheel and tyre, metres

function coverBox(sw: number, sh: number, aspect: number, fx: number, fy: number, tx: number, ty: number): Omit<Box, 'c0' | 'cw'> {
  let w = sw
  let h = w / aspect
  if (h < sh) { h = sh; w = h * aspect }
  const x = clamp(tx * sw - fx * w, sw - w, 0)
  const y = clamp(ty * sh - fy * h, sh - h, 0)
  return { x, y, w, h }
}

export function ArrivalMotion() {
  useEffect(() => {
    const found = document.querySelector<HTMLElement>('[data-arrival]')
    if (!found) return
    const root: HTMLElement = found
    const track = root.querySelector<HTMLElement>('.arr-track')!
    const stage = root.querySelector<HTMLElement>('[data-stage]')!
    const q = <T extends HTMLElement = HTMLElement>(s: string) => root.querySelector<T>(s)
    const qa = (s: string) => Array.from(root.querySelectorAll<HTMLElement>(s))

    const scenes = { a: q('[data-scene="a"]')!, b: q('[data-scene="b"]')!, c: q('[data-scene="c"]')! }
    const frames = { a: q('[data-frame="a"]')!, b: q('[data-frame="b"]')!, c: q('[data-frame="c"]')! }
    const aCar = q('[data-a-car]')!
    const aWheels = qa('[data-a-wheel]')
    const aGlow = q('[data-a-glow]')!
    const aDusk = qa('[data-scene="a"] [data-dusk]')
    const bSky = q('[data-b-sky]')!
    const bLand = q('[data-b-land]')!
    const bDusk = qa('[data-scene="b"] [data-dusk]')
    const bGlow = q('[data-b-glow]')!
    const cCar = q('[data-c-car]')!
    const cSprites = qa('[data-c-sprite]')
    const black = q('[data-black]')!
    const copies = { a: q('[data-copy="a"]')!, b: q('[data-copy="b"]')!, c: q('[data-copy="c"]')! }
    const shades = { a: q('[data-shade="a"]')!, b: q('[data-shade="b"]')!, c: q('[data-shade="c"]')! }

    const mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    const mqPortrait = window.matchMedia(PORTRAIT)
    let boxes: Record<'a' | 'b' | 'c', Box> = {} as never
    let pinned = true
    let raf = 0
    let last = -1

    const still = () => mqReduce.matches || document.documentElement.classList.contains('anyos-editing')

    // ---- layout (on resize only) -------------------------------------------
    function place(el: HTMLElement, b: Box) {
      el.style.width = `${b.w}px`
      el.style.height = `${b.h}px`
      el.style.left = `${b.x}px`
      el.style.top = `${b.y}px`
    }
    // frame fraction → px inside a frame box
    const X = (b: Box, x: number) => ((x - b.c0) / b.cw) * b.w
    const Y = (b: Box, y: number) => y * b.h

    function layout() {
      const sw = stage.clientWidth
      const sh = stage.clientHeight
      const portrait = mqPortrait.matches
      // Arrival: desktop covers the stage with the car right of the type; on
      // narrow screens the whole car sits in a band across the lower half.
      const aAspect = ARRIVAL.aspect
      let a: Box
      if (sw / sh < 1.1) {
        const w = sw / 0.66
        const h = w / aAspect
        a = { x: sw * 0.5 - 0.635 * w, y: sh * 0.64 - 0.63 * h, w, h, c0: 0, cw: 1 }
        frames.a.dataset.fit = 'band'
      } else {
        a = { ...coverBox(sw, sh, aAspect, 0.635, 0.6, sw > 1280 ? 0.64 : 0.6, 0.56), c0: 0, cw: 1 }
        frames.a.dataset.fit = 'cover'
      }
      const bc0 = portrait ? CABIN.portraitX : 0
      const bcw = portrait ? CABIN.portraitW : 1
      const b = { ...coverBox(sw, sh, (CABIN.aspect * bcw), 0.5, 0.42, 0.5, 0.5), c0: bc0, cw: bcw }
      const ccw = portrait ? (9 / 16) / NIGHT.aspect : 1
      const cc0 = portrait ? NIGHT.portraitX : 0
      const c = { ...coverBox(sw, sh, NIGHT.aspect * ccw, 0.5, 0.56, 0.5, 0.52), c0: cc0, cw: ccw }
      boxes = { a, b, c }
      place(frames.a, a)
      place(frames.b, b)
      place(frames.c, c)

      // arrival car + wheels + glow
      const [x0, y0, x1, y1] = ARRIVAL.car.box
      const carL = X(a, x0), carT = Y(a, y0)
      Object.assign(aCar.style, { left: `${carL}px`, top: `${carT}px`, width: `${X(a, x1) - carL}px`, height: `${Y(a, y1) - carT}px` })
      const [ax, ay] = ARRIVAL.roll.anchor
      aCar.style.transformOrigin = `${X(a, ax) - carL}px ${Y(a, ay) - carT}px`
      aWheels.forEach((el, i) => {
        const wgeo = ARRIVAL.wheels[i]
        const size = wgeo.size
        el.style.width = `${size}px`
        el.style.height = `${size}px`
        el.style.left = `${X(a, wgeo.c[0]) - carL - size / 2}px`
        el.style.top = `${Y(a, wgeo.c[1]) - carT - size / 2}px`
        el.dataset.k = String(a.w) // matrix scale
      })
      const [g0, g1, g2, g3] = ARRIVAL.glow.box
      Object.assign(aGlow.style, { left: `${X(a, g0) - carL}px`, top: `${Y(a, g1) - carT}px`, width: `${X(a, g2) - X(a, g0)}px`, height: `${Y(a, g3) - Y(a, g1)}px` })

      // cabin: both outside layers scale about the point straight ahead
      const foe = `${X(b, CABIN.foe[0])}px ${Y(b, CABIN.foe[1])}px`
      bSky.style.transformOrigin = foe
      bLand.style.transformOrigin = foe

      // night sprites: each sits on its own box, scaled about the car's ground point
      const p0 = nightPath(0)
      cSprites.forEach(el => {
        const box = (NIGHT as unknown as Record<string, { box: number[] }>)[el.dataset.cSprite as string].box
        const L = X(c, box[0]), T = Y(c, box[1])
        Object.assign(el.style, { left: `${L}px`, top: `${T}px`, width: `${X(c, box[2]) - L}px`, height: `${Y(c, box[3]) - T}px`, transformOrigin: `${X(c, p0.x0) - L}px ${Y(c, p0.y0) - T}px` })
      })
      root.dataset.ready = 'on'
      last = -1
    }

    // ---- pin decision -------------------------------------------------------
    function decidePin() {
      const tooTall = copies.a.scrollHeight > stage.clientHeight + 4 || copies.c.scrollHeight > stage.clientHeight + 4
      pinned = !still() && !tooTall
      root.dataset.pin = pinned ? 'on' : 'off'
    }

    function setInert(el: HTMLElement, on: boolean) {
      if (on) el.setAttribute('inert', '')
      else el.removeAttribute('inert')
    }

    // ---- per frame ----------------------------------------------------------
    function frame() {
      raf = 0
      if (!pinned) return
      const r = track.getBoundingClientRect()
      const span = Math.max(1, track.offsetHeight - stage.clientHeight)
      const p = clamp(-r.top / span)
      if (Math.abs(p - last) < 1e-4) return
      last = p
      const { a, c } = boxes

      // Scene A ------------------------------------------------------------
      const roll = brake(0.0, 0.26, p) * ARRIVAL.roll.metres
      const s = Math.pow(ARRIVAL.roll.grow, roll)
      const dx = ARRIVAL.roll.axis[0] * roll * a.w
      const dy = ARRIVAL.roll.axis[1] * roll * a.w
      const push = smooth(0.2, 0.36, p)
      aCar.style.transform = `translate3d(${dx}px, ${dy}px, 0) scale(${s * (1 + push * 0.06)})`
      const turn = (-roll / TYRE_CIRC) * 360
      aWheels.forEach((el, i) => {
        const M = ARRIVAL.wheels[i].M
        const k = a.w
        el.style.transform = `matrix(${M[0][0] * k}, ${M[1][0] * k}, ${M[0][1] * k}, ${M[1][1] * k}, 0, 0) rotate(${turn}deg)`
      })
      const lamps = smooth(0.05, 0.18, p)
      aGlow.style.opacity = String(lamps)
      const duskA = smooth(0.06, 0.3, p) * 0.92
      aDusk.forEach(el => { el.style.opacity = String(duskA) })
      const camA = 1 + 0.95 * Math.pow(push, 1.5)
      frames.a.style.transformOrigin = `${X(a, 0.80)}px ${Y(a, 0.47)}px`
      frames.a.style.transform = `scale(${camA})`

      // Scene B ------------------------------------------------------------
      const tB = smooth(0.34, 0.68, p)
      const settle = 1 + 0.07 * (1 - smooth(0.34, 0.46, p))
      const tilt = smooth(0.58, 0.66, p)
      const sway = Math.sin(p * Math.PI * 9) * 2.2
      const rot = Math.sin(p * Math.PI * 7) * 0.22
      frames.b.style.transform = `translate3d(0, ${sway + tilt * boxes.b.h * 0.14}px, 0) rotate(${rot}deg) scale(${settle})`
      bLand.style.transform = `scale(${1 + 0.2 * tB})`
      bSky.style.transform = `scale(${1 + 0.012 * tB})`
      const duskB = smooth(0.4, 0.64, p)
      bDusk.forEach(el => { el.style.opacity = String(duskB) })
      bGlow.style.opacity = String(0.25 + 0.75 * duskB)

      // Scene C ------------------------------------------------------------
      const enter = smooth(0.64, 0.78, p)
      frames.c.style.transform = `translate3d(0, ${(1 - enter) * -c.h * 0.09}px, 0) scale(${lerp(1.06, 1, enter)})`
      const drive = smooth(0.68, 0.95, p)
      const np = nightPath(drive)
      const tx = (np.x - np.x0) / c.cw * c.w
      const ty = (np.y - np.y0) * c.h
      const tr = `translate3d(${tx}px, ${ty}px, 0) scale(${np.s})`
      cCar.style.transform = tr
      cSprites.forEach(el => { el.style.transform = tr })

      // Visibility, darkness and copy -------------------------------------
      scenes.a.style.opacity = p < 0.37 ? '1' : '0'
      scenes.b.style.opacity = p > 0.33 && p < 0.67 ? '1' : '0'
      scenes.c.style.opacity = p > 0.62 ? '1' : '0'
      const dark = Math.max(
        smooth(0.29, 0.355, p) * (1 - smooth(0.36, 0.42, p)),
        smooth(0.6, 0.655, p) * (1 - smooth(0.66, 0.72, p)),
      )
      black.style.opacity = String(dark)

      const ca = 1 - smooth(0.05, 0.13, p)
      const cb = smooth(0.42, 0.47, p) * (1 - smooth(0.55, 0.6, p))
      const cd = smooth(0.86, 0.95, p)
      copies.a.style.opacity = String(ca)
      copies.a.style.transform = `translate3d(0, ${(1 - ca) * -16}px, 0)`
      copies.b.style.opacity = String(cb)
      copies.b.style.transform = `translate3d(0, ${(1 - cb) * 14}px, 0)`
      copies.c.style.opacity = String(cd)
      copies.c.style.transform = `translate3d(0, ${(1 - cd) * 16}px, 0)`
      shades.a.style.opacity = String(ca)
      shades.b.style.opacity = String(Math.max(cb, smooth(0.34, 0.4, p) * (1 - smooth(0.6, 0.64, p)) * 0.6))
      shades.c.style.opacity = String(cd)
      setInert(copies.a, ca < 0.5)
      setInert(copies.b, true) // display copy only, nothing to operate
      setInert(copies.c, cd < 0.5)
      copies.c.dataset.live = cd >= 0.5 ? 'on' : 'off'
    }

    const request = () => { if (!raf) raf = requestAnimationFrame(frame) }
    const relayout = () => {
      decidePin()
      if (pinned) layout()
      else {
        // Still frame: the arrival photograph and its copy; nothing pinned.
        Object.values(copies).forEach(el => { el.style.opacity = ''; el.style.transform = ''; el.removeAttribute('inert') })
        Object.values(shades).forEach(el => { el.style.opacity = '' })
      }
      request()
    }

    relayout()
    window.addEventListener('scroll', request, { passive: true })
    window.addEventListener('resize', relayout)
    mqReduce.addEventListener?.('change', relayout)
    mqPortrait.addEventListener?.('change', relayout)
    document.fonts?.ready.then(relayout).catch(() => {})
    return () => {
      window.removeEventListener('scroll', request)
      window.removeEventListener('resize', relayout)
      mqReduce.removeEventListener?.('change', relayout)
      mqPortrait.removeEventListener?.('change', relayout)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])
  return null
}
