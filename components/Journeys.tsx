'use client'

import { useState } from 'react'
import { AIRPORT_NOTES, SERVICE_GROUPS, SERVICES } from '@/lib/site'
import { Icon } from './Icon'
import { NextCue } from './NextCue'
import { QuoteLink } from './QuoteLink'

const NOTE_ICONS = ['plane', 'users', 'clock', 'suitcase'] as const

// "Journeys": three one-screen chapters (airports, business & London,
// occasions), each a full-bleed night photograph from the same shoot as the
// opening film with a short list of trips over it. A trip is one line until
// you pick it; the airport details open on request. Every service and airport
// key stays in the page for anyOS and AnyVendor.
const PHOTOS: Record<string, { src: string }> = {
  travel: { src: '/media/journeys/travel' }, // a terminal kerb at night, a case going into the boot
  evenings: { src: '/media/journeys/evenings' }, // the S-Class driving towards the lit City
  occasions: { src: '/media/journeys/occasions' }, // a country-house venue, the door held open
}
const srcSet = (b: string) => `${b}-960.webp 960w, ${b}-1600.webp 1600w, ${b}-2400.webp 2400w`

export function Journeys() {
  // which trip is open in each chapter (none to begin with: the chapter is a short list)
  const [pick, setPick] = useState<number[]>(SERVICE_GROUPS.map(() => -1))

  return (
    <section id="journeys" data-bleed aria-labelledby="journeys-title" className="jr on-photo relative text-white">
      {SERVICE_GROUPS.map((g, gi) => (
        <article key={g.key} data-snap data-snap-name={g.title} aria-labelledby={`jc-${g.key}`} className="jr-chapter">
          <img className="jr-photo" data-av-key={`services.${g.key}.photo`} src={`${PHOTOS[g.key].src}-1600.webp`} srcSet={srcSet(PHOTOS[g.key].src)} sizes="100vw" alt="" width={1600} height={1195} loading="lazy" decoding="async" />
          <div className="jr-shade" aria-hidden="true" />
          <div className="jr-body page-x">
            {gi === 0 ? (
              <header className="jr-head">
                <p suppressHydrationWarning data-anyos="services.eyebrow" className="label">Journeys</p>
                <h2 id="journeys-title" suppressHydrationWarning data-anyos="services.title" className="t-h3 mt-2 text-white">Tailored to your needs</h2>
                <p suppressHydrationWarning data-anyos="services.intro" className="jr-intro mt-2 max-w-[30rem] text-[#dfe2e8]">
                  If your journey isn’t listed, ask: most trips can be arranged.
                </p>
              </header>
            ) : null}
            <p className="jr-count label tabular">{String(gi + 1).padStart(2, '0')} / {String(SERVICE_GROUPS.length).padStart(2, '0')}</p>
            <h3 id={`jc-${g.key}`} className="jr-title">
              <span suppressHydrationWarning data-anyos={`services.group.${g.key}`}>{g.title}</span>
            </h3>
            <ul className="journey-list mt-4">
              {g.items.map(idx => {
                const s = SERVICES.find(x => x.idx === idx)!
                const open = pick[gi] === idx
                return (
                  <li key={idx} className={`journey-item ${open ? 'is-open' : ''}`}>
                    <button type="button" aria-expanded={open} aria-controls={`js-${idx}`} onClick={() => setPick(p => p.map((v, j) => (j === gi ? (v === idx ? -1 : idx) : v)))} className="journey-head">
                      <Icon name={s.icon} className="h-5 w-5 flex-none text-[#c9cdd6]" />
                      <span suppressHydrationWarning data-anyos={`services.${idx}.title`} className="journey-name">{s.title}</span>
                      <Icon name="plus" className="journey-plus ml-auto h-4 w-4 flex-none" />
                    </button>
                    <div id={`js-${idx}`} hidden={!open} className="journey-body">
                      <p suppressHydrationWarning data-anyos={`services.${idx}.description`} className="max-w-[34rem] leading-relaxed text-[#dfe2e8]">{s.description}</p>
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
              <details className="jr-airports">
                <summary>
                  <span className="jr-airports-sum">
                    <span suppressHydrationWarning data-anyos="airports.eyebrow" className="label">Airports</span>
                    <span suppressHydrationWarning data-anyos="airports.title" className="jr-airports-title">Every London airport, from your door</span>
                  </span>
                  <Icon name="plus" className="journey-plus h-4 w-4 flex-none" />
                </summary>
                <p suppressHydrationWarning data-anyos="airports.intro" className="mt-1 max-w-[34rem] text-[0.98rem] leading-snug text-[#c9cdd6]">Heathrow, Gatwick, London City, Luton, Stansted and Southend, plus the private and VIP terminals.</p>
                <ul className="jr-notes">
                  {AIRPORT_NOTES.map((n, i) => (
                    <li key={n.title}>
                      <Icon name={NOTE_ICONS[i]} className="h-5 w-5 flex-none text-[#c9cdd6]" />
                      <div>
                        <h5 suppressHydrationWarning data-anyos={`airports.note.${i}.title`} className="text-[0.98rem] font-semibold leading-snug text-white">{n.title}</h5>
                        <p suppressHydrationWarning data-anyos={`airports.note.${i}.text`} className="mt-1 text-[0.9rem] leading-snug text-[#b9bec9]">{n.text}</p>
                      </div>
                    </li>
                  ))}
                </ul>
                <p className="mt-4"><a href="/airport-transfers" className="text-link text-white">Airport transfers in detail</a></p>
              </details>
            ) : null}
            <NextCue className="mt-5" />
          </div>
        </article>
      ))}
    </section>
  )
}
