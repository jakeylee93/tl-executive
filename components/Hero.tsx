import { BUSINESS } from '@/lib/site'
import { JOURNEY, srcSet } from '@/lib/journey'
import { Badge } from './Badge'
import { HeroMotion } from './HeroMotion'
import { Icon } from './Icon'
import { QuoteLink } from './QuoteLink'

// The opening journey (DESIGN.md "Opening journey"). Native scroll moves one
// camera through three scenes of one trip: the car → its cabin → the
// motorway at night, and settles on "Where are we taking you?". HeroMotion
// turns scroll position into CSS variables; nothing plays by itself.
const [arrival, cabin, road] = JOURNEY

const START = [
  { label: 'Airport', occasion: 'Airport transfers', icon: 'plane' as const },
  { label: 'Business', occasion: 'Corporate travel', icon: 'briefcase' as const },
  { label: 'Occasion', occasion: 'Special occasions', icon: 'sparkle' as const },
  { label: 'Something else', occasion: 'Something else', icon: 'road' as const },
]

function Still({ scene, className, priority }: { scene: (typeof JOURNEY)[number]; className?: string; priority?: boolean }) {
  return (
    <picture>
      {scene.portrait ? <source media="(max-aspect-ratio: 4/5)" srcSet={srcSet(scene.base, scene.portrait, 'p')} sizes="100vw" type="image/webp" /> : null}
      <img
        src={`/media/${scene.base}-1600.webp`}
        srcSet={srcSet(scene.base, scene.widths)}
        sizes="100vw"
        alt=""
        width={1600}
        height={900}
        decoding="async"
        loading="eager"
        fetchPriority={priority ? 'high' : 'low'}
        className={className}
      />
    </picture>
  )
}

export function Hero() {
  return (
    <section id="top" data-hero className="hero on-photo relative bg-[#0c0d0f] text-white" aria-labelledby="hero-title">
      <div className="hero-track">
        <div className="hero-stage">
          {/* Scene 1 · arrival: the complete car; the camera moves in toward the windscreen */}
          <div className="scene scene-arrival" aria-hidden="true">
            <div
              className="ext-box"
              data-focal-x={arrival.focal?.x ?? 0.5}
              data-focal-y={arrival.focal?.y ?? 0.4}
              style={{
                ['--ext-ar' as string]: String(arrival.aspect ?? 1.6),
                ['--ext-cx' as string]: String(arrival.carCenter ?? 0.5),
                transformOrigin: `${(arrival.focal?.x ?? 0.5) * 100}% ${(arrival.focal?.y ?? 0.4) * 100}%`,
              }}
            >
              <img
                src={`/media/${arrival.base}-1600.webp`}
                srcSet={srcSet(arrival.base, arrival.widths)}
                sizes="(min-width: 1024px) 82vw, 120vw"
                alt=""
                width={1600}
                height={Math.round(1600 / (arrival.aspect ?? 1.6))}
                decoding="async"
                loading="eager"
                fetchPriority="high"
              />
              {arrival.evening ? <img
                className="ext-eve"
                src={`/media/${arrival.evening}-1600.webp`}
                srcSet={srcSet(arrival.evening, arrival.widths)}
                sizes="(min-width: 1024px) 82vw, 120vw"
                alt=""
                width={1600}
                height={Math.round(1600 / (arrival.aspect ?? 1.6))}
                decoding="async"
                loading="eager"
                fetchPriority="low"
              /> : null}
              <span className="ext-sweep" />
              <span className="ext-shade" />
            </div>
          </div>
          {/* Scene 2 · cabin */}
          <div className="scene scene-cabin" aria-hidden="true"><Still scene={cabin} /></div>
          {/* Scene 3 · the motorway at night */}
          <div className="scene scene-road" aria-hidden="true"><Still scene={road} /></div>

          <div className="hero-glass" aria-hidden="true" />
          <div className="hero-shade hero-shade-a" aria-hidden="true" />
          <div className="hero-shade hero-shade-low" aria-hidden="true" />
          <div className="hero-shade hero-shade-top" aria-hidden="true" />

          {/* Opening copy */}
          <div data-hero-content data-hero-copy="a" className="hero-copy hero-copy-a page-x">
            <div className="hero-copy-a-top">
              <div className="flex items-center gap-4 lg:flex-col lg:items-start lg:gap-6">
                <div className="hero-badge w-[4.25rem] flex-none sm:w-[5rem] lg:w-[6.5rem]">
                  <Badge id="hero" className="h-auto w-full" />
                </div>
                <p suppressHydrationWarning data-anyos="hero.eyebrow" className="label text-[0.76rem]">Theydon Bois · Essex · London</p>
              </div>
              <h1 id="hero-title" className="t-display hero-title mt-5 text-white lg:mt-6">
                <span suppressHydrationWarning data-anyos="hero.title">Executive cars from Theydon Bois,</span>{' '}
                <span suppressHydrationWarning data-anyos="hero.titleAccent" className="italic text-[#e3e4e6]">to wherever you need to be.</span>
              </h1>
              <p suppressHydrationWarning data-anyos="hero.intro" className="hero-intro t-lead mt-5 max-w-[30rem] text-[#e6e7e8]">
                Airport transfers, business travel and occasions, arranged personally by a local firm established in 2008.
              </p>
            </div>
            <div className="hero-actions flex flex-col gap-3 xs:flex-row">
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

          {/* Cabin and road copy: short, low in the frame */}
          <div data-hero-copy="b" className="hero-copy hero-copy-low page-x">
            <p suppressHydrationWarning data-anyos="hero.cabin.title" className="t-h2 text-white">Settle in.</p>
            <p suppressHydrationWarning data-anyos="hero.cabin.text" className="t-lead mt-3 max-w-[28rem] text-[#e6e7e8]">
              Your driver looks after the route and the timing. You arrive composed.
            </p>
          </div>
          <div data-hero-copy="c" className="hero-copy hero-copy-low page-x">
            <p suppressHydrationWarning data-anyos="hero.road.title" className="t-h2 max-w-[34rem] text-white">London, the M25 and all six airports.</p>
            <p suppressHydrationWarning data-anyos="hero.road.text" className="t-lead mt-3 max-w-[30rem] text-[#e6e7e8]">
              Flights monitored, arrivals met, and for departures, at your door ten minutes early.
            </p>
          </div>

          {/* Where the journey settles: the quote */}
          <div data-hero-final data-hero-copy="d" className="hero-copy hero-copy-final page-x">
            <div className="mx-auto max-w-[44rem] text-center">
              <p suppressHydrationWarning data-anyos="hero.final.title" className="t-h2 text-white">Where are we taking you?</p>
              <p suppressHydrationWarning data-anyos="hero.final.text" className="t-lead mx-auto mt-3 max-w-[32rem] text-[#e6e7e8]">
                Tell us the journey and we’ll reply with a quote. Nothing is booked until you accept it.
              </p>
              <ul className="mt-7 grid grid-cols-2 gap-2.5 sm:flex sm:flex-wrap sm:justify-center" aria-label="Start a quote">
                {START.map(s => (
                  <li key={s.label}>
                    <QuoteLink prefill={{ occasion: s.occasion }} className="hero-chip" ariaLabel={`Request a quote: ${s.label}`}>
                      <Icon name={s.icon} className="h-4 w-4 flex-none" />
                      {s.label}
                    </QuoteLink>
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex flex-col items-center gap-3 xs:flex-row xs:justify-center">
                <a href="#plan" className="btn btn-light">Request a quote<Icon name="arrowRight" className="h-5 w-5" /></a>
                <a href={BUSINESS.phoneHref} className="btn btn-ghost tabular text-white"><Icon name="phone" className="h-[1.1rem] w-[1.1rem]" />Call {BUSINESS.phoneDisplay}</a>
              </div>
            </div>
          </div>

          <HeroMotion />
        </div>
      </div>
    </section>
  )
}
