'use client'

import { useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { AIRPORT_NOTES, SERVICE_GROUPS, SERVICES, platePortraitSrcSet, plateSrcSet } from '@/lib/site'
import { Icon } from './Icon'
import { QuoteLink } from './QuoteLink'

const NOTE_ICONS = ['plane', 'users', 'clock', 'suitcase'] as const

/** "Journeys": three kinds of trip, one photograph each. A trip is one line
 *  until you pick it; then its sentence and a quote link appear. Every
 *  service and airport key stays in the page for anyOS. */
export function Journeys() {
  const [group, setGroup] = useState(0)
  const [pick, setPick] = useState<number[]>(SERVICE_GROUPS.map(g => g.items[0]))
  const tabs = useRef<(HTMLButtonElement | null)[]>([])
  const onKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const n = SERVICE_GROUPS.length
    const map: Record<string, number> = { ArrowRight: (i + 1) % n, ArrowLeft: (i - 1 + n) % n, Home: 0, End: n - 1 }
    if (!(e.key in map)) return
    e.preventDefault()
    setGroup(map[e.key])
    tabs.current[map[e.key]]?.focus()
  }

  return (
    <section id="journeys" aria-labelledby="journeys-title" className="journeys on-photo relative isolate overflow-hidden bg-charcoal text-white">
      {SERVICE_GROUPS.map((g, i) => (
        <div key={g.key} className="plate-fade absolute inset-0 -z-10" style={{ opacity: group === i ? 1 : 0 }} aria-hidden="true">
          <picture>
            <source media="(max-aspect-ratio: 4/5)" srcSet={platePortraitSrcSet(g.plate)} sizes="100vw" type="image/webp" />
            <img src={`/media/${g.plate}-1600.webp`} srcSet={plateSrcSet(g.plate)} sizes="100vw" alt="" width={1600} height={900} loading="lazy" decoding="async" className="h-full w-full object-cover" />
          </picture>
        </div>
      ))}
      <div className="journeys-shade absolute inset-0 -z-10" aria-hidden="true" />

      <div className="page-x flex min-h-[min(100svh,56rem)] flex-col justify-between gap-12 py-16 sm:py-20 lg:py-24">
        <div className="max-w-[36rem]">
          <p suppressHydrationWarning data-anyos="services.eyebrow" className="label">Journeys</p>
          <h2 id="journeys-title" suppressHydrationWarning data-anyos="services.title" className="t-h2 mt-3 text-white">Tailored to your needs</h2>
          <p suppressHydrationWarning data-anyos="services.intro" className="t-lead mt-3 text-[#e6e5e3]">
            If your journey isn’t listed, ask: most trips can be arranged.
          </p>
        </div>

        <div>
          <div role="tablist" aria-label="Kinds of journey" className="flex flex-wrap gap-2">
            {SERVICE_GROUPS.map((g, i) => (
              <button
                key={g.key}
                ref={el => { tabs.current[i] = el }}
                id={`jt-${g.key}`}
                role="tab"
                type="button"
                aria-selected={group === i}
                aria-controls={`jp-${g.key}`}
                tabIndex={group === i ? 0 : -1}
                onClick={() => setGroup(i)}
                onKeyDown={e => onKey(e, i)}
                className="journey-tab"
              >
                <span suppressHydrationWarning data-anyos={`services.group.${g.key}`}>{g.title}</span>
              </button>
            ))}
          </div>

          {SERVICE_GROUPS.map((g, gi) => (
            <div key={g.key} id={`jp-${g.key}`} role="tabpanel" aria-labelledby={`jt-${g.key}`} hidden={group !== gi} className="mt-7 grid gap-8 lg:grid-cols-12 lg:items-end">
              <ul className="journey-list lg:col-span-7">
                {g.items.map(idx => {
                  const s = SERVICES.find(x => x.idx === idx)!
                  const open = pick[gi] === idx
                  return (
                    <li key={idx} className={`journey-item ${open ? 'is-open' : ''}`}>
                      <button type="button" aria-expanded={open} aria-controls={`js-${idx}`} onClick={() => setPick(p => p.map((v, j) => (j === gi ? idx : v)))} className="journey-head">
                        <Icon name={s.icon} className="h-5 w-5 flex-none text-[#dcdbd8]" />
                        <span suppressHydrationWarning data-anyos={`services.${idx}.title`} className="journey-name">{s.title}</span>
                        <Icon name="plus" className="journey-plus ml-auto h-4 w-4 flex-none" />
                      </button>
                      <div id={`js-${idx}`} hidden={!open} className="journey-body">
                        <p suppressHydrationWarning data-anyos={`services.${idx}.description`} className="max-w-[34rem] leading-relaxed text-[#e2e1df]">{s.description}</p>
                        <QuoteLink prefill={{ occasion: s.title, ...(idx === 0 ? { flying: true } : {}) }} className="journey-cta" ariaLabel={`Request a quote: ${s.title}`}>
                          Request a quote
                          <Icon name="arrowRight" className="h-4 w-4" />
                        </QuoteLink>
                      </div>
                    </li>
                  )
                })}
              </ul>

              {g.key === 'travel' ? (
                <div className="lg:col-span-5">
                  <h3 suppressHydrationWarning data-anyos="airports.title" className="t-h3 text-white">Every London airport, from your door</h3>
                  <p suppressHydrationWarning data-anyos="airports.intro" className="mt-2 text-[0.98rem] leading-snug text-[#dcdbd8]">Heathrow, Gatwick, London City, Luton, Stansted and Southend, plus the private and VIP terminals.</p>
                  <ul className="mt-5 grid grid-cols-2 gap-x-5 gap-y-4">
                    {AIRPORT_NOTES.map((n, i) => (
                      <li key={n.title} className="flex gap-2.5">
                        <Icon name={NOTE_ICONS[i]} className="mt-0.5 h-4 w-4 flex-none text-[#dcdbd8]" />
                        <div>
                          <h4 suppressHydrationWarning data-anyos={`airports.note.${i}.title`} className="text-[0.95rem] font-semibold leading-snug text-white">{n.title}</h4>
                          <p suppressHydrationWarning data-anyos={`airports.note.${i}.text`} className="mt-0.5 text-[0.86rem] leading-snug text-[#cfcecb]">{n.text}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-5"><a href="/airport-transfers" className="text-link text-white">Airport transfers in detail</a></p>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>

    </section>
  )
}
