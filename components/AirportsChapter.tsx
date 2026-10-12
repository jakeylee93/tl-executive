'use client'

import { useState } from 'react'
import { AIRPORT_NOTES, AIRPORTS, AREAS } from '@/lib/site'
import { Icon } from './Icon'
import { QuoteLink } from './QuoteLink'

const NOTE_ICONS = ['plane', 'users', 'clock', 'suitcase'] as const

function Choice({ label, checked, onSelect }: { label: string; checked: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={onSelect}
      className={`min-h-[2.75rem] rounded-full px-4 text-[0.95rem] font-semibold transition-colors ${checked ? 'bg-ink text-white' : 'bg-white text-ink-2 shadow-[inset_0_0_0_1px_var(--tl-line)] hover:text-ink hover:shadow-[inset_0_0_0_1px_var(--tl-field)]'}`}
    >
      {label}
    </button>
  )
}

/** "From your door to the terminal": choose a collection area and an
 *  airport, then hand both to the journey planner. */
export function AirportsChapter({ headingLevel = 'h2' }: { headingLevel?: 'h1' | 'h2' }) {
  const [area, setArea] = useState<string>(AREAS[0])
  const [airport, setAirport] = useState(AIRPORTS[0].name)
  const H = headingLevel
  const Sub = headingLevel === 'h1' ? 'h2' : 'h3'

  return (
    <section id="airports" aria-labelledby="airports-title" className="on-light bg-mist py-16 sm:py-20 lg:py-28">
      <div className="page-x">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-5">
            <p suppressHydrationWarning data-anyos="airports.eyebrow" className="label">Airports</p>
            <H id="airports-title" suppressHydrationWarning data-anyos="airports.title" className={`${headingLevel === 'h1' ? 't-display' : 't-h2'} mt-3 text-ink`}>Every London airport, from your door</H>
            <p suppressHydrationWarning data-anyos="airports.intro" className="t-lead mt-4 text-ink-2">
              Heathrow, Gatwick, London City, Luton, Stansted and Southend, plus the private and VIP terminals.
            </p>
            <ul className="mt-8 grid gap-5 sm:grid-cols-2">
              {AIRPORT_NOTES.map((n, i) => (
                <li key={n.title} className="flex gap-3">
                  <Icon name={NOTE_ICONS[i]} className="mt-0.5 h-5 w-5 flex-none text-ink-2" />
                  <div>
                    <Sub suppressHydrationWarning data-anyos={`airports.note.${i}.title`} className="font-semibold text-ink">{n.title}</Sub>
                    <p suppressHydrationWarning data-anyos={`airports.note.${i}.text`} className="mt-0.5 text-[0.95rem] leading-snug text-steel">{n.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-[0_30px_60px_-45px_rgba(0,0,0,0.45)] sm:p-9 lg:col-span-7">
            <Sub suppressHydrationWarning data-anyos="areas.title" className="font-display text-[1.45rem] text-ink">Areas we cover</Sub>
            <p suppressHydrationWarning data-anyos="areas.intro" className="mt-1.5 text-ink-2">
              Collections from Theydon Bois and the towns and villages around Epping Forest.
            </p>
            <div role="radiogroup" aria-label="Collect me from" className="mt-5 flex flex-wrap gap-2">
              {AREAS.map(a => <Choice key={a} label={a} checked={area === a} onSelect={() => setArea(a)} />)}
            </div>

            <p className="label mt-8">To</p>
            <div role="radiogroup" aria-label="Airport" className="mt-3 flex flex-wrap gap-2">
              {AIRPORTS.map(a => <Choice key={a.code} label={a.name} checked={airport === a.name} onSelect={() => setAirport(a.name)} />)}
            </div>

            <div className="mt-8 flex flex-col gap-4 rounded-2xl bg-mist p-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="font-display text-[1.35rem] leading-tight text-ink" aria-live="polite">
                {area} <span className="text-steel">to</span> {airport}
              </p>
              <QuoteLink
                prefill={{ pickup: area, destination: `${airport} Airport`, occasion: 'Airport transfers', flying: true }}
                className="btn btn-dark flex-none"
              >
                Plan this journey
                <Icon name="arrowRight" className="h-5 w-5" />
              </QuoteLink>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
