'use client'

import { useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { VEHICLES, slug } from '@/lib/site'
import { Icon } from './Icon'
import { QuoteLink } from './QuoteLink'

/** Centred vehicle selector. All four panels stay in the DOM (anyOS edits
 *  apply to every key); only the chosen one is shown. Images carry
 *  data-anyos-img with nothing layered over them, so the owner can replace
 *  the model photographs with his own from anyOS. */
export function FleetSelector() {
  const [active, setActive] = useState(0)
  const tabs = useRef<(HTMLButtonElement | null)[]>([])

  const onKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const last = VEHICLES.length - 1
    let next = -1
    if (e.key === 'ArrowRight') next = i === last ? 0 : i + 1
    if (e.key === 'ArrowLeft') next = i === 0 ? last : i - 1
    if (e.key === 'Home') next = 0
    if (e.key === 'End') next = last
    if (next < 0) return
    e.preventDefault()
    setActive(next)
    tabs.current[next]?.focus()
  }

  return (
    <div>
      <div className="flex justify-center">
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
              onClick={() => setActive(i)}
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
        return (
          <div
            key={v.name}
            id={`fleet-panel-${key}`}
            role="tabpanel"
            aria-labelledby={`fleet-tab-${key}`}
            hidden={active !== i}
            tabIndex={0}
            className="mx-auto mt-8 max-w-[46rem] text-center focus-visible:outline-offset-8"
          >
            <div className="relative mx-auto max-w-[37.5rem] overflow-hidden rounded-[2rem] bg-[radial-gradient(120%_90%_at_50%_30%,#ffffff_0%,#eef0f1_55%,#e3e5e7_100%)]">
              <img
                data-anyos-img={`fleet.${key}.image`}
                src={v.image}
                alt={v.alt}
                width={600}
                height={320}
                loading={i === 0 ? 'eager' : 'lazy'}
                decoding="async"
                className="aspect-[15/8] w-full object-contain mix-blend-multiply"
              />
            </div>
            <h3 suppressHydrationWarning data-anyos={`fleet.${key}.name`} data-vehicle-name={key} className="t-h3 mt-7 text-ink">{v.display}</h3>
            <p className="mt-2 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-[0.98rem] text-ink-2">
              <span className="inline-flex items-center gap-2"><Icon name="users" className="h-[1.1rem] w-[1.1rem] text-steel" /><span suppressHydrationWarning data-anyos={`fleet.${key}.passengers`}>{v.passengersLabel}</span></span>
              <span className="inline-flex items-center gap-2"><Icon name="suitcase" className="h-[1.1rem] w-[1.1rem] text-steel" /><span suppressHydrationWarning data-anyos={`fleet.${key}.bags`}>{v.bagsLabel}</span></span>
            </p>
            <p suppressHydrationWarning data-anyos={`fleet.${key}.description`} className="mx-auto mt-3 max-w-[30rem] text-ink-2">{v.description}</p>
            <QuoteLink prefill={{ vehicle: v.name }} className="btn btn-dark mt-6" ariaLabel={`Request a quote for the ${v.display}`}>
              Choose this car
              <Icon name="arrowRight" className="h-5 w-5" />
            </QuoteLink>
          </div>
        )
      })}
    </div>
  )
}
