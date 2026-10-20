'use client'

import { useCallback, useEffect, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { VEHICLES, slug } from '@/lib/site'
import { VEHICLE_EVENT } from '@/lib/prefill'
import { FilmScene, type FilmSource } from '../film/FilmScene'
import { Icon } from '../Icon'
import { QuoteLink } from '../QuoteLink'

// The fleet (FILM.md): the four published vehicles on the opening film's
// night road, London behind, each photographed at the same spot. One video
// of three Kling 3.0 shots, played by scroll: the car drives off and the next
// one pulls up where it stood, E-Class → S-Class → V-Class → Tourneo. The
// scroll holds on each parked car (TIMELINE); tabs and Previous / Next
// scroll to it, so the cars drive there. The four parked stills are the
// anyOS images (fleet.<slug>.image): they show while the video loads, with
// reduced motion and in the editor, and a replaced image is shown over the
// film while its car is chosen.

const STILL = (key: string) => `/media/fleet-road/${key}`
const stillSet = (key: string) => `${STILL(key)}-960.webp 960w, ${STILL(key)}-1600.webp 1600w, ${STILL(key)}-2560.webp 2560w`
const FIRST = slug(VEHICLES[0].name)
const FILM: FilmSource = {
  wide: '/media/film/fleet-wide.mp4',
  tall: '/media/film/fleet-wide.mp4',
  posterWide: `${STILL(FIRST)}-1600.webp`,
  posterWideSet: stillSet(FIRST),
  posterTall: `${STILL(FIRST)}-1600.webp`,
  posterTallSet: stillSet(FIRST),
}
// [scroll progress, video fraction]: hold, drive, hold, drive, hold, drive, hold
const TIMELINE = [[0, 0], [0.08, 0], [0.3, 1 / 3], [0.38, 1 / 3], [0.6, 2 / 3], [0.68, 2 / 3], [0.9, 1], [1, 1]]
const STOPS = [0.04, 0.34, 0.64, 0.95]
const carAt = (p: number) => (p < 0.19 ? 0 : p < 0.49 ? 1 : p < 0.79 ? 2 : 3)

export function Fleet() {
  const [active, setActive] = useState(0)
  const [chosen, setChosen] = useState('')
  const [photo, setPhoto] = useState<boolean[]>(VEHICLES.map(() => false))
  const last = VEHICLES.length - 1

  const onProgress = useCallback((p: number) => {
    const i = carAt(p)
    setActive(a => (a === i ? a : i))
  }, [])

  // The quote form announces the car it holds.
  useEffect(() => {
    const on = (e: Event) => setChosen((e as CustomEvent<string>).detail || '')
    window.addEventListener(VEHICLE_EVENT, on)
    return () => window.removeEventListener(VEHICLE_EVENT, on)
  }, [])

  // only the chosen car's card can be reached (the others are faded out)
  useEffect(() => {
    document.querySelectorAll<HTMLElement>('#fleet .fleet-card').forEach((c, i) => {
      if (i === active) c.removeAttribute('inert')
      else c.setAttribute('inert', '')
    })
  }, [active])

  // anyOS image replaced → that photograph is shown over the film.
  useEffect(() => {
    const imgs = Array.from(document.querySelectorAll<HTMLImageElement>('#fleet img[data-anyos-img]'))
    const check = () => setPhoto(imgs.map((img, i) => {
      const src = img.getAttribute('src') || ''
      return !!src && !src.includes(STILL(slug(VEHICLES[i].name)))
    }))
    check()
    const obs = imgs.map(img => { const mo = new MutationObserver(check); mo.observe(img, { attributes: true, attributeFilter: ['src', 'srcset'] }); return mo })
    return () => obs.forEach(o => o.disconnect())
  }, [])

  const go = (next: number, focus = false) => {
    const i = Math.max(0, Math.min(last, next))
    const sec = document.getElementById('fleet')
    const track = sec?.querySelector<HTMLElement>('[data-film-track]')
    const stage = sec?.querySelector<HTMLElement>('[data-film-stage]')
    if (sec?.dataset.pin === 'on' && track && stage) {
      const top = track.getBoundingClientRect().top + window.scrollY
      const span = track.offsetHeight - stage.clientHeight
      const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
      window.scrollTo({ top: top + STOPS[i] * span, behavior: smooth ? 'smooth' : 'auto' })
    } else {
      setActive(i)
    }
    if (focus) document.getElementById(`fleet-tab-${slug(VEHICLES[i].name)}`)?.focus()
  }
  const onKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const map: Record<string, number> = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: last }
    if (!(e.key in map)) return
    e.preventDefault()
    go(map[e.key], true)
  }
  const prev = VEHICLES[Math.max(0, active - 1)]
  const next = VEHICLES[Math.min(last, active + 1)]

  return (
    <FilmScene id="fleet" film={FILM} track="600svh" timeline={TIMELINE} onProgress={onProgress} label="The fleet" className="fleet-film">
      <div className="fleet-stills">
        {VEHICLES.map((v, i) => {
          const key = slug(v.name)
          return (
            <img
              key={key}
              data-anyos-img={`fleet.${key}.image`}
              data-on={active === i ? '' : undefined}
              data-photo={photo[i] ? 'on' : 'off'}
              src={`${STILL(key)}-1600.webp`}
              srcSet={stillSet(key)}
              sizes="100vw"
              alt={v.alt}
              width={1600}
              height={893}
              loading="lazy"
              decoding="async"
            />
          )
        })}
      </div>

      <div className="fleet-ui">
        <div className="fleet-head page-x">
          <p suppressHydrationWarning data-anyos="fleet.eyebrow" className="label">The fleet</p>
          <h2 id="fleet-title" suppressHydrationWarning data-anyos="fleet.title" className="t-h2 mt-2 text-white">Choose your car</h2>
          <p suppressHydrationWarning data-anyos="fleet.intro" className="fleet-intro mt-2 text-[#dfe2e8]">
            From an executive saloon to an eight-seat minibus. Not sure? We’ll recommend one.
          </p>
        </div>

        <div className="fleet-cards page-x">
          {VEHICLES.map((v, i) => {
            const key = slug(v.name)
            const isChosen = chosen === v.name
            return (
              <div key={v.name} id={`fleet-panel-${key}`} role="tabpanel" aria-labelledby={`fleet-tab-${key}`} data-on={active === i ? '' : undefined} className="fleet-card">
                <div className="fleet-card-id">
                  <p className="label">{v.kind}</p>
                  <h3 suppressHydrationWarning data-anyos={`fleet.${key}.name`} data-vehicle-name={v.name} className="t-h3 mt-1.5 text-white">{v.display}</h3>
                  <dl className="mt-1.5 flex flex-wrap gap-x-5 gap-y-1 text-[0.98rem] text-[#dfe2e8]">
                    <div className="flex items-center gap-2"><dt><Icon name="users" className="h-4 w-4 text-[#b9bec9]" /><span className="sr-only">Passengers</span></dt><dd suppressHydrationWarning data-anyos={`fleet.${key}.passengers`}>{v.passengersLabel}</dd></div>
                    <div className="flex items-center gap-2"><dt><Icon name="suitcase" className="h-4 w-4 text-[#b9bec9]" /><span className="sr-only">Luggage</span></dt><dd suppressHydrationWarning data-anyos={`fleet.${key}.bags`}>{v.bagsLabel}</dd></div>
                  </dl>
                </div>
                <p suppressHydrationWarning data-anyos={`fleet.${key}.description`} className="fleet-desc leading-relaxed text-[#dfe2e8]">{v.description}</p>
                <QuoteLink prefill={{ vehicle: v.name }} className={`btn fleet-cta ${isChosen ? 'btn-ghost text-white' : 'btn-light'}`} ariaLabel={isChosen ? `${v.display}: chosen for your quote` : `Choose the ${v.display} for your quote`}>
                  {isChosen ? <><Icon name="check" className="h-5 w-5" />Chosen for your quote</> : <>Choose this car<Icon name="arrowRight" className="h-5 w-5" /></>}
                </QuoteLink>
              </div>
            )
          })}
        </div>

        <div className="fleet-nav page-x">
          <div role="tablist" aria-label="Vehicles" className="garage-tabs">
            {VEHICLES.map((v, i) => (
              <button
                key={v.name}
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
          <div className="garage-steps">
            <button type="button" className="garage-step" onClick={() => go(active - 1)} disabled={active === 0} aria-label={`Previous car: ${prev.display}`}>
              <Icon name="arrowRight" className="h-5 w-5 rotate-180" />
            </button>
            <span className="garage-count tabular" aria-live="polite">{active + 1} / {VEHICLES.length}</span>
            <button type="button" className="garage-step" onClick={() => go(active + 1)} disabled={active === last} aria-label={`Next car: ${next.display}`}>
              <Icon name="arrowRight" className="h-5 w-5" />
            </button>
          </div>
        </div>
        <p className="fleet-note page-x">Pictures show each model. Your car may differ in year, colour and specification.</p>
      </div>
    </FilmScene>
  )
}
