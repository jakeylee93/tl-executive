import { BUSINESS, platePortraitSrcSet, plateSrcSet } from '@/lib/site'
import { Badge } from './Badge'
import { HeroMotion } from './HeroMotion'
import { Icon } from './Icon'

// The hero is a short scroll storyboard (see DESIGN.md "Hero storyboard"):
// daylight on Epping Road → dusk → the M25 at night, while the authentic
// badge turns gently and its rim catches a light that travels from the
// upper left (sun) to the upper right (street lamp).
function Plate({ name, className, priority }: { name: 'day' | 'night'; className: string; priority?: boolean }) {
  return (
    <div className={`hero-plate ${className}`} aria-hidden="true">
      <picture>
        <source media="(max-aspect-ratio: 4/5)" srcSet={platePortraitSrcSet(name)} sizes="100vw" type="image/webp" />
        <img
          src={`/media/${name}-1600.webp`}
          srcSet={plateSrcSet(name)}
          sizes="100vw"
          alt=""
          width={1600}
          height={900}
          decoding="async"
          loading="eager"
          fetchPriority={priority ? 'high' : 'low'}
        />
      </picture>
    </div>
  )
}

export function Hero() {
  return (
    <section id="top" data-hero className="hero on-photo relative bg-charcoal text-white" aria-labelledby="hero-title">
      <div className="hero-track">
        <div className="hero-stage">
          <Plate name="day" className="hero-day" priority />
          <Plate name="night" className="hero-night" />
          <div className="hero-dusk" aria-hidden="true" />
          <div className="hero-scrim" aria-hidden="true" />

          <div data-hero-content className="page-x relative z-10 grid h-full grid-rows-[auto_1fr_auto] pb-24 pt-[calc(var(--tl-header-h)+1.25rem)] lg:grid-cols-12 lg:grid-rows-1 lg:items-center lg:pb-16 lg:pt-[var(--tl-header-h)]">
            <div className="flex justify-center lg:order-2 lg:col-span-5 lg:col-start-8 lg:justify-end">
              <div className="hero-badge w-[min(56vw,17rem)] sm:w-[min(42vw,20rem)] lg:w-[min(30vw,26rem)]">
                <Badge id="hero" className="h-auto w-full" />
              </div>
            </div>
            <div aria-hidden="true" className="lg:hidden" />
            <div className="max-w-[40rem] lg:order-1 lg:col-span-6 lg:self-end lg:pb-6">
              <p suppressHydrationWarning data-anyos="hero.eyebrow" className="label text-[0.78rem]">Theydon Bois · Essex · London</p>
              <h1 id="hero-title" className="t-display mt-4 text-white">
                <span suppressHydrationWarning data-anyos="hero.title">Executive cars from Theydon Bois,</span>{' '}
                <span suppressHydrationWarning data-anyos="hero.titleAccent" className="italic text-[#e3e4e6]">to wherever you need to be.</span>
              </h1>
              <p suppressHydrationWarning data-anyos="hero.intro" className="t-lead mt-5 max-w-[34rem] text-[#e6e7e8]">
                Airport transfers, business travel and occasions, arranged personally by a local firm established in 2008.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <a href="#plan" className="btn btn-light">
                  Request a quote
                  <Icon name="arrowRight" className="h-5 w-5" />
                </a>
                <a href={BUSINESS.phoneHref} className="btn btn-ghost tabular text-white">
                  <Icon name="phone" className="h-[1.1rem] w-[1.1rem]" />
                  Call {BUSINESS.phoneDisplay}
                </a>
              </div>
            </div>
          </div>

          {/* Where the camera is: true to each photograph */}
          <p className="pointer-events-none absolute bottom-6 left-5 z-10 hidden text-[0.8rem] font-semibold uppercase tracking-[0.16em] text-[rgba(255,255,255,0.82)] sm:left-8 md:block lg:left-12" aria-hidden="true">
            <span className="hero-cap-day absolute whitespace-nowrap">Epping Forest · Theydon Bois</span>
            <span className="hero-cap-night whitespace-nowrap">The M25 · towards London &amp; the airports</span>
          </p>

          <HeroMotion />
        </div>
      </div>
    </section>
  )
}
