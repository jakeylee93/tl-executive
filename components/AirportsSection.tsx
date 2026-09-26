import type { ReactNode } from 'react'
import { AIRPORT_NOTES, AIRPORTS, VIP_TERMINALS } from '@/lib/site'
import { Icon } from './Icon'
import { AirportMap } from './Maps'
import { QuoteLink } from './QuoteLink'
import { SectionHeading } from './SectionHeading'

const NOTE_ICONS = ['plane', 'users', 'clock', 'suitcase'] as const

export function AirportsSection({ headingLevel = 'h2', actions }: { headingLevel?: 'h1' | 'h2'; actions?: ReactNode }) {
  const Sub = headingLevel === 'h1' ? 'h2' : 'h3'
  return (
    <section id="airports" aria-labelledby="airports-title" className="border-y border-line bg-surface py-16 sm:py-20 lg:py-28">
      <div className="page-x">
        {headingLevel === 'h1' ? (
          <div className="max-w-[44rem]" data-hero>
            <p suppressHydrationWarning data-anyos="airports.eyebrow" className="eyebrow">Airport transfers</p>
            <h1 id="airports-title" suppressHydrationWarning data-anyos="airportsPage.title" className="t-display mt-5 text-ink">Every London airport, from your door</h1>
            <p suppressHydrationWarning data-anyos="airports.intro" className="t-lead mt-6 text-ink-2">
              Heathrow, Gatwick, London City, Luton, Stansted and Southend, plus the private and VIP terminals. Door to door from Theydon Bois, Loughton, Epping and the villages around them.
            </p>
            {actions ? <div className="mt-8">{actions}</div> : null}
          </div>
        ) : (
          <SectionHeading
            id="airports-title"
            eyebrowKey="airports.eyebrow" eyebrow="Airport transfers"
            titleKey="airports.title" title="Every London airport, from your door"
            introKey="airports.intro" intro="Heathrow, Gatwick, London City, Luton, Stansted and Southend, plus the private and VIP terminals. Door to door from Theydon Bois, Loughton, Epping and the villages around them."
          />
        )}

        <div className="mt-12 grid gap-8 lg:mt-14 lg:grid-cols-12 lg:gap-12">
          <figure className="overflow-hidden rounded-xl border border-line bg-paper lg:col-span-7" data-reveal>
            <AirportMap className="h-auto w-full" />
            <figcaption className="border-t border-line px-5 py-3 text-[0.875rem] text-muted">
              Theydon Bois and the six London airports, drawn to scale. Lines show direction, not routes.
            </figcaption>
          </figure>

          <div className="lg:col-span-5" data-reveal style={{ ['--reveal-delay' as string]: '120ms' }}>
            <Sub className="text-[0.8125rem] font-semibold uppercase tracking-[0.12em] text-ink">Choose your airport</Sub>
            <ul className="mt-3 divide-y divide-line border-y border-line">
              {AIRPORTS.map(a => (
                <li key={a.code}>
                  <QuoteLink
                    prefill={{ destination: `${a.short} Airport`, occasion: 'Airport transfers', flying: true }}
                    className="group flex min-h-[3.75rem] items-center gap-4 py-2 pr-1"
                    ariaLabel={`Get a quote for ${a.name}`}
                  >
                    <span className="w-12 text-[0.95rem] font-bold tracking-[0.08em] text-brass tabular">{a.code}</span>
                    <span className="flex-1 text-[1.08rem] font-medium text-ink">{a.name}</span>
                    <span className="inline-flex items-center gap-1.5 text-[0.9rem] font-semibold text-ink-2 transition-colors group-hover:text-ink">
                      Quote
                      <Icon name="arrowRight" className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </QuoteLink>
                </li>
              ))}
            </ul>
            <p className="mt-5 text-[0.95rem] leading-relaxed text-ink-2">{VIP_TERMINALS}</p>
          </div>
        </div>

        <ul className="mt-12 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 lg:mt-16 lg:grid-cols-4">
          {AIRPORT_NOTES.map((n, i) => (
            <li key={n.title} className="grid grid-cols-[1.75rem_1fr] gap-x-3 bg-surface p-5 sm:block sm:p-6" data-reveal style={{ ['--reveal-delay' as string]: `${i * 80}ms` }}>
              <Icon name={NOTE_ICONS[i]} className="mt-1 h-6 w-6 text-brass sm:mt-0" />
              <div>
                <Sub suppressHydrationWarning data-anyos={`airports.note.${i}.title`} className="t-h3 text-ink sm:mt-4">{n.title}</Sub>
                <p suppressHydrationWarning data-anyos={`airports.note.${i}.text`} className="mt-1.5 text-[0.98rem] leading-relaxed text-ink-2 sm:mt-2">{n.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
