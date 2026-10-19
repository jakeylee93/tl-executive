'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { VEHICLES, slug } from '@/lib/site'
import { VEHICLE_EVENT } from '@/lib/prefill'
import { FLEET_GEO, clamp } from '@/lib/motion/scenes'
import { Icon } from '../Icon'
import { QuoteLink } from '../QuoteLink'

// The four published vehicles on a country road at dusk, London on the
// horizon (STILL-016), nose to tail at their true relative size (scaled by
// wheelbase), lamps on. The road's own perspective places them: each car sits
// on the near lane at its distance, so the line recedes towards the vanishing
// point. Choosing a car drives the whole convoy forward or back until that car
// stops at the front; every wheel turns by the distance travelled. Explicit controls only (tabs, Previous, Next): the page
// scrolls normally over the studio. Car pictures are anyOS images
// (fleet.<slug>.image): if one is replaced, that car is shown as the uploaded
// photograph instead of the cut-out.

const BASE = '/media/motion/fleet'
const GAP_M = 3.4
const CARS = FLEET_GEO.cars
const ROAD = FLEET_GEO.road
const ref = CARS.find(c => c.slug === 'sclass')!
const PORTRAIT = '(max-aspect-ratio: 4/5)'
const POS: number[] = []
CARS.reduce((at, c) => { POS.push(at); return at + c.length + GAP_M }, 0)
const BY_SLUG: Record<string, number> = { 'mercedes-e-class': 0, 'mercedes-s-class': 1, 'mercedes-v-class': 2, 'tourneo-custom-executive-spec': 3 }

function easeInOut(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

export function FleetGarage() {
  const [active, setActive] = useState(0)
  const [chosen, setChosen] = useState('')
  const stageRef = useRef<HTMLDivElement>(null)
  const plateRef = useRef<HTMLDivElement>(null)
  const carRefs = useRef<(HTMLDivElement | null)[]>([])
  const wheelRefs = useRef<(HTMLDivElement | null)[][]>(CARS.map(() => []))
  const tabs = useRef<(HTMLButtonElement | null)[]>([])
  const offset = useRef(-18) // metres of convoy travel; starts off-stage, drives in once
  const anim = useRef(0)
  const entered = useRef(false)
  const last = VEHICLES.length - 1

  const draw = useCallback(() => {
    const stage = stageRef.current
    const plate = plateRef.current
    if (!stage || !plate) return
    const W = stage.clientWidth
    const H = stage.clientHeight
    const portrait = window.matchMedia(PORTRAIT).matches
    const desk = W >= 1024
    // the road photograph covers the stage; on desktop it is held to the left so
    // the car at the front stands clear of the copy
    const c0 = portrait ? ROAD.portraitX : 0
    const cw = portrait ? ROAD.portraitW : 1
    const aspect = ROAD.aspect * cw
    let bw = W
    let bh = bw / aspect
    if (bh < H) { bh = H; bw = bh * aspect }
    const bx = desk ? 0 : Math.max(W - bw, Math.min(0, W / 2 - bw / 2))
    const by = Math.max(H - bh, Math.min(0, H * 0.5 - bh * 0.5))
    Object.assign(plate.style, { left: `${bx}px`, top: `${by}px`, width: `${bw}px`, height: `${bh}px` })
    const X = (x: number) => bx + ((x - c0) / cw) * bw
    const Y = (y: number) => by + y * bh
    const VP = [X(ROAD.vp[0]), Y(ROAD.vp[1])]
    const L0 = [X(ROAD.lane0[0]), Y(ROAD.lane0[1])]
    const spotY = H * (desk ? 0.84 : 0.8)
    const t = (L0[1] - spotY) / (L0[1] - VP[1])
    const SPOT = [L0[0] + (VP[0] - L0[0]) * t, spotY]
    // size of the front car, at the front position
    const k = desk ? (0.4 * W) / ref.w : Math.min((0.82 * W) / ref.w, (0.3 * H) / ref.h)
    const o = offset.current
    CARS.forEach((c, i) => {
      const el = carRefs.current[i]
      if (!el) return
      const d = POS[i] - o // metres behind the front position
      const z = ROAD.z0 + d
      if (z < 1.4) { el.style.visibility = 'hidden'; return } // already driven past the camera
      el.style.visibility = ''
      const s = ROAD.z0 / z
      const gxy = [VP[0] + (SPOT[0] - VP[0]) * s, VP[1] + (SPOT[1] - VP[1]) * s]
      const sc = k * s
      const [gx, gy] = c.ground[0]
      el.style.transform = `translate3d(${gxy[0] - gx * sc}px, ${gxy[1] - gy * sc}px, 0) scale(${sc})`
      el.style.zIndex = String(200 - Math.round(d * 2))
      const turn = (-o / (Math.PI * c.tyreD)) * 360
      c.wheels.forEach((w, j) => {
        const wel = wheelRefs.current[i][j]
        if (!wel) return
        const M = w.M
        wel.style.transform = `matrix(${M[0][0]}, ${M[1][0]}, ${M[0][1]}, ${M[1][1]}, 0, 0) rotate(${turn}deg)`
      })
    })
  }, [])

  const driveTo = useCallback((target: number, immediate = false) => {
    cancelAnimationFrame(anim.current)
    const from = offset.current
    const dist = Math.abs(target - from)
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (immediate || reduce || dist < 0.01) { offset.current = target; draw(); return }
    const dur = Math.min(3200, 700 + 260 * Math.sqrt(dist) * 2)
    const t0 = performance.now()
    const step = (now: number) => {
      const t = clamp((now - t0) / dur)
      offset.current = from + (target - from) * easeInOut(t)
      draw()
      if (t < 1) anim.current = requestAnimationFrame(step)
    }
    anim.current = requestAnimationFrame(step)
  }, [draw])

  // Size and first entrance: the convoy drives in when the studio comes into view.
  useEffect(() => {
    draw()
    const onResize = () => draw()
    window.addEventListener('resize', onResize)
    const stage = stageRef.current
    let io: IntersectionObserver | undefined
    if (stage && 'IntersectionObserver' in window) {
      io = new IntersectionObserver(([e]) => {
        if (e.isIntersecting && !entered.current) {
          entered.current = true
          driveTo(POS[0])
        }
      }, { threshold: 0.35 })
      io.observe(stage)
    } else {
      driveTo(POS[0], true)
    }
    if (document.documentElement.classList.contains('anyos-editing')) driveTo(POS[0], true)
    return () => { window.removeEventListener('resize', onResize); io?.disconnect(); cancelAnimationFrame(anim.current) }
  }, [draw, driveTo])

  // The quote form announces the car it holds.
  useEffect(() => {
    const on = (e: Event) => setChosen((e as CustomEvent<string>).detail || '')
    window.addEventListener(VEHICLE_EVENT, on)
    return () => window.removeEventListener(VEHICLE_EVENT, on)
  }, [])

  // anyOS image replaced → show that car as the uploaded photograph.
  useEffect(() => {
    const obs: MutationObserver[] = []
    carRefs.current.forEach((el, i) => {
      const img = el?.querySelector<HTMLImageElement>('img[data-anyos-img]')
      if (!img || !el) return
      const car: HTMLDivElement = el
      const pic: HTMLImageElement = img
      const def = `${BASE}/${CARS[i].slug}-dusk.webp`
      const check = () => {
        const src = pic.getAttribute('src') || ''
        car.dataset.photo = src && !src.endsWith(def) ? 'on' : 'off'
      }
      check()
      const mo = new MutationObserver(check)
      mo.observe(pic, { attributes: true, attributeFilter: ['src', 'srcset'] })
      obs.push(mo)
    })
    return () => obs.forEach(o => o.disconnect())
  }, [])

  const go = (next: number, focusTab = false) => {
    const i = (next + VEHICLES.length) % VEHICLES.length
    entered.current = true
    setActive(i)
    driveTo(POS[i])
    if (focusTab) tabs.current[i]?.focus()
  }
  const onKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const map: Record<string, number> = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: last }
    if (!(e.key in map)) return
    e.preventDefault()
    go(map[e.key], true)
  }
  const prev = VEHICLES[(active - 1 + VEHICLES.length) % VEHICLES.length]
  const next = VEHICLES[(active + 1) % VEHICLES.length]

  return (
    <div className="garage">
      <div ref={stageRef} className="garage-stage" aria-hidden="true">
        <div ref={plateRef} className="garage-plate">
          <picture>
            <source media={PORTRAIT} srcSet={`${BASE}/road-p720.webp 720w, ${BASE}/road-p1080.webp 1080w`} sizes="100vw" type="image/webp" />
            <img src={`${BASE}/road-1600.webp`} srcSet={`${BASE}/road-960.webp 960w, ${BASE}/road-1600.webp 1600w, ${BASE}/road-2400.webp 2400w`} sizes="max(100vw, 179svh)" alt="" width={1600} height={893} loading="lazy" decoding="async" />
          </picture>
        </div>
        {VEHICLES.map((v, i) => {
          const key = slug(v.name)
          const c = CARS[BY_SLUG[key] ?? i]
          return (
            <div
              key={key}
              ref={el => { carRefs.current[i] = el }}
              className="garage-car"
              data-lit={active === i ? 'on' : 'off'}
              data-photo="off"
              style={{ width: c.w, height: c.h }}
            >
              <img src={`${BASE}/${c.slug}-shadow-road.webp`} alt="" width={c.w} height={c.h} className="garage-shadow" loading="lazy" decoding="async" />
              <img
                data-anyos-img={`fleet.${key}.image`}
                src={`${BASE}/${c.slug}-dusk.webp`}
                alt={v.alt}
                width={c.w}
                height={c.h}
                className="garage-body"
                loading="lazy"
                decoding="async"
              />
              {c.wheels.map((w, j) => (
                <div
                  key={w.src}
                  ref={el => { wheelRefs.current[i][j] = el }}
                  className="garage-wheel"
                  style={{ width: w.size, height: w.size, left: w.c[0] - w.size / 2, top: w.c[1] - w.size / 2 }}
                >
                  <img src={`${BASE}/${w.src.replace('.webp', '-dusk.webp')}`} alt="" width={w.size} height={w.size} loading="lazy" decoding="async" />
                </div>
              ))}
              <img src={`${BASE}/${c.slug}-lamps.webp`} alt="" width={c.w} height={c.h} className="garage-lamps" loading="lazy" decoding="async" />
            </div>
          )
        })}
      </div>

      <div className="garage-ui page-x">
        <div role="tablist" aria-label="Vehicles" className="garage-tabs">
          {VEHICLES.map((v, i) => (
            <button
              key={v.name}
              ref={el => { tabs.current[i] = el }}
              id={`fleet-tab-${slug(v.name)}`}
              role="tab"
              type="button"
              aria-selected={active === i}
              aria-controls={`fleet-panel-${slug(v.name)}`}
              tabIndex={active === i ? 0 : -1}
              onClick={() => go(i)}
              onKeyDown={e => onKey(e, i)}
              className="garage-tab"
            >
              {v.tab}
            </button>
          ))}
        </div>

        {VEHICLES.map((v, i) => {
          const key = slug(v.name)
          const isChosen = chosen === v.name
          return (
            <div key={v.name} id={`fleet-panel-${key}`} role="tabpanel" aria-labelledby={`fleet-tab-${key}`} hidden={active !== i} className="garage-card">
              <p className="label">{v.kind}</p>
              <h3 suppressHydrationWarning data-anyos={`fleet.${key}.name`} data-vehicle-name={v.name} className="t-h3 mt-2 text-ink">{v.display}</h3>
              <dl className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[0.98rem] text-ink-2">
                <div className="flex items-center gap-2"><dt><Icon name="users" className="h-4 w-4 text-steel" /><span className="sr-only">Passengers</span></dt><dd suppressHydrationWarning data-anyos={`fleet.${key}.passengers`}>{v.passengersLabel}</dd></div>
                <div className="flex items-center gap-2"><dt><Icon name="suitcase" className="h-4 w-4 text-steel" /><span className="sr-only">Luggage</span></dt><dd suppressHydrationWarning data-anyos={`fleet.${key}.bags`}>{v.bagsLabel}</dd></div>
              </dl>
              <p suppressHydrationWarning data-anyos={`fleet.${key}.description`} className="mt-3 max-w-[24rem] leading-relaxed text-ink-2">{v.description}</p>
              <QuoteLink prefill={{ vehicle: v.name }} className={`btn mt-5 ${isChosen ? 'btn-ghost text-ink' : 'btn-dark'}`} ariaLabel={isChosen ? `${v.display}: chosen for your quote` : `Choose the ${v.display} for your quote`}>
                {isChosen ? <><Icon name="check" className="h-5 w-5" />Chosen for your quote</> : <>Choose this car<Icon name="arrowRight" className="h-5 w-5" /></>}
              </QuoteLink>
            </div>
          )
        })}

        <div className="garage-steps">
          <button type="button" className="garage-step" onClick={() => go(active - 1)} aria-label={`Previous car: ${prev.display}`}>
            <Icon name="arrowRight" className="h-5 w-5 rotate-180" />
            <span className="hidden sm:inline">Previous</span>
          </button>
          <span className="garage-count tabular" aria-live="polite">{active + 1} / {VEHICLES.length}</span>
          <button type="button" className="garage-step" onClick={() => go(active + 1)} aria-label={`Next car: ${next.display}`}>
            <span className="hidden sm:inline">Next</span>
            <Icon name="arrowRight" className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
