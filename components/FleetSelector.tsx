'use client'

import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { VEHICLES, slug } from '@/lib/site'
import { VEHICLE_EVENT } from '@/lib/prefill'
import { Icon } from './Icon'
import { QuoteLink } from './QuoteLink'

/** One car at a time, full width. Explicit controls only (tabs, Previous,
 *  Next, Choose): no swipe or scroll capture, so the page scrolls normally
 *  over it. All four panels stay in the DOM (anyOS edits apply to every key);
 *  images carry data-anyos-img with nothing layered over them. */
export function FleetSelector() {
  const [active, setActive] = useState(0)
  const [dir, setDir] = useState<'next' | 'prev' | ''>('')
  const [chosen, setChosen] = useState('')
  const tabs = useRef<(HTMLButtonElement | null)[]>([])
  const last = VEHICLES.length - 1

  // The quote form announces the car it holds, so the matching panel can say
  // so (and stops saying so if the visitor changes their mind there).
  useEffect(() => {
    const on = (e: Event) => setChosen((e as CustomEvent<string>).detail || '')
    window.addEventListener(VEHICLE_EVENT, on)
    return () => window.removeEventListener(VEHICLE_EVENT, on)
  }, [])

  const go = (next: number, focusTab = false) => {
    const i = (next + VEHICLES.length) % VEHICLES.length
    setDir(next === active ? '' : next > active ? 'next' : 'prev')
    setActive(i)
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
    <div>
      <div className="page-x flex justify-center">
        <div role="tablist" aria-label="Vehicles" className="seg max-w-full flex-nowrap justify-center">
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
              className="seg-btn px-3.5 text-[0.92rem] sm:px-5 sm:text-[0.98rem]"
            >
              {v.tab}
            </button>
          ))}
        </div>
      </div>

      {VEHICLES.map((v, i) => {
        const key = slug(v.name)
        const isChosen = chosen === v.name
        return (
          <div
            key={v.name}
            id={`fleet-panel-${key}`}
            role="tabpanel"
            aria-labelledby={`fleet-tab-${key}`}
            hidden={active !== i}
            data-enter={active === i ? dir : ''}
            className="fleet-panel mt-8 sm:mt-10"
          >
            <div className={`fleet-stage ${v.studio ? 'fleet-stage-studio' : 'fleet-stage-render'}`}>
              <img
                data-anyos-img={`fleet.${key}.image`}
                src={v.image}
                alt={v.alt}
                width={v.imageSize[0]}
                height={v.imageSize[1]}
                loading={i === 0 ? 'eager' : 'lazy'}
                decoding="async"
                className="fleet-photo"
              />
            </div>

            <div className="page-x">
              <div className="mx-auto mt-7 grid max-w-[64rem] gap-6 sm:mt-9 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-end lg:gap-12">
                <div>
                  <p className="label">{v.kind}</p>
                  <h3 suppressHydrationWarning data-anyos={`fleet.${key}.name`} data-vehicle-name={key} className="t-h2 mt-2 text-ink">{v.display}</h3>
                  <p suppressHydrationWarning data-anyos={`fleet.${key}.description`} className="mt-3 max-w-[30rem] text-ink-2">{v.description}</p>
                </div>
                <dl className="flex gap-8 sm:gap-10">
                  <div>
                    <dt className="flex items-center gap-2 text-[0.86rem] font-semibold text-steel"><Icon name="users" className="h-4 w-4" />Seats</dt>
                    <dd suppressHydrationWarning data-anyos={`fleet.${key}.passengers`} className="mt-1 font-display text-[1.5rem] leading-tight text-ink">{v.passengersLabel}</dd>
                  </div>
                  <div>
                    <dt className="flex items-center gap-2 text-[0.86rem] font-semibold text-steel"><Icon name="suitcase" className="h-4 w-4" />Luggage</dt>
                    <dd suppressHydrationWarning data-anyos={`fleet.${key}.bags`} className="mt-1 font-display text-[1.5rem] leading-tight text-ink">{v.bagsLabel}</dd>
                  </div>
                </dl>
                <QuoteLink prefill={{ vehicle: v.name }} className={`btn ${isChosen ? 'btn-ghost text-ink' : 'btn-dark'} justify-self-start`} ariaLabel={`${isChosen ? 'Chosen for your quote: ' : 'Request a quote for the '}${v.display}`}>
                  {isChosen ? <><Icon name="check" className="h-5 w-5" strokeWidth={2} />Chosen for your quote</> : <>Choose this car<Icon name="arrowRight" className="h-5 w-5" /></>}
                </QuoteLink>
              </div>
            </div>
          </div>
        )
      })}

      <div className="page-x">
        <div className="mx-auto mt-8 flex max-w-[64rem] items-center justify-between gap-3 border-t border-line pt-5">
          <button type="button" onClick={() => go(active - 1)} className="fleet-step" aria-label={`Previous car: ${prev.display}`}>
            <Icon name="arrowRight" className="h-5 w-5 rotate-180" />
            <span>{prev.tab}</span>
          </button>
          <p className="text-[0.92rem] font-semibold text-steel tabular" aria-live="polite">
            <span className="sr-only">{VEHICLES[active].display}, </span>{active + 1} of {VEHICLES.length}
          </p>
          <button type="button" onClick={() => go(active + 1)} className="fleet-step" aria-label={`Next car: ${next.display}`}>
            <span>{next.tab}</span>
            <Icon name="arrowRight" className="h-5 w-5" />
          </button>
        </div>
        <p className="mx-auto mt-4 max-w-[64rem] text-[0.86rem] text-steel">
          Pictures show each model. Your car may differ in year, colour and specification.
        </p>
      </div>
    </div>
  )
}
