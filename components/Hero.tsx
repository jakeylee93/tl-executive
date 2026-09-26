import { AIRPORTS, BUSINESS } from '@/lib/site'
import { Icon } from './Icon'
import { JourneyStarter } from './JourneyStarter'

export function Hero() {
  return (
    <section id="top" data-hero aria-labelledby="hero-title" className="relative overflow-hidden">
      <div className="page-x grid items-center gap-10 pb-12 pt-10 sm:pb-16 sm:pt-14 lg:grid-cols-12 lg:gap-12 lg:pb-20 lg:pt-20">
        <div className="lg:col-span-7">
          <p suppressHydrationWarning data-anyos="hero.eyebrow" className="eyebrow">Theydon Bois · Essex · London</p>
          <h1 id="hero-title" className="t-display mt-6 text-ink">
            <span suppressHydrationWarning data-anyos="hero.title">Executive cars from Theydon Bois,</span>{' '}
            <span suppressHydrationWarning data-anyos="hero.titleAccent" className="italic text-ink-2" style={{ fontVariationSettings: "'opsz' 72" }}>to wherever you need to be.</span>
          </h1>
          <p suppressHydrationWarning data-anyos="hero.intro" className="t-lead mt-6 max-w-[36rem] text-ink-2">
            Airport transfers, business travel and evenings in London, driven with care by a local firm that has looked after Essex clients since 2008.
          </p>

          <div className="mt-8 flex flex-col gap-3 xs:flex-row">
            <a href="#quote" className="btn btn-primary">
              Get a quote
              <Icon name="arrowRight" className="h-5 w-5" />
            </a>
            <a href={BUSINESS.phoneHref} className="btn btn-secondary tabular">
              <Icon name="phone" className="h-[1.1rem] w-[1.1rem]" />
              Call {BUSINESS.phoneDisplay}
            </a>
          </div>

          <ul className="mt-9 grid gap-x-6 gap-y-3 text-[0.95rem] text-ink-2 sm:grid-cols-3 sm:gap-y-0" aria-label="At a glance">
            <li className="flex items-center gap-2.5"><Icon name="calendar" className="h-[1.15rem] w-[1.15rem] flex-none text-brass" />Established 2008</li>
            <li className="flex items-center gap-2.5"><Icon name="clock" className="h-[1.15rem] w-[1.15rem] flex-none text-brass" />{BUSINESS.hours}</li>
            <li className="flex items-center gap-2.5"><Icon name="shield" className="h-[1.15rem] w-[1.15rem] flex-none text-brass" />Council-licensed</li>
          </ul>
        </div>

        <div className="lg:col-span-5">
          <JourneyStarter />
        </div>
      </div>

      {/* Destinations strip: the six airports on one route line (static — it
          replaces the old auto-scrolling marquee). */}
      <div className="border-y border-line bg-surface">
        <div className="page-x">
          <ol className="grid grid-cols-2 gap-x-4 gap-y-2.5 py-4 text-[0.95rem] xs:grid-cols-3 md:flex md:items-center md:justify-between" aria-label="London airports we cover">
            {AIRPORTS.map(a => (
              <li key={a.code} className="flex items-center gap-2.5">
                <span className="text-[0.8rem] font-bold tracking-[0.08em] text-brass tabular">{a.code}</span>
                <span className="text-ink">{a.short}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
