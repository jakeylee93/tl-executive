import { BUSINESS } from '@/lib/site'
import { ARRIVAL, PORTRAIT_WIDTHS, srcSet } from '@/lib/motion/scenes'
import { Badge } from '../Badge'
import { Icon } from '../Icon'
import { QuoteLink } from '../QuoteLink'
import { ArrivalMotion } from './ArrivalMotion'

// The opening journey: three photographed scenes of one W222 S-Class, each
// cut into layers so the car, its wheels, its lamps, the light and the world
// outside genuinely move (MOTION.md). ArrivalMotion maps native scroll to
// those layers; with reduced motion, or in the anyOS editor, the first
// photograph and its copy stand still and nothing is pinned.

const M = '/media/motion'
const START = [
  { label: 'Airport', occasion: 'Airport transfers', icon: 'plane' as const, flying: true },
  { label: 'Business', occasion: 'Corporate travel', icon: 'briefcase' as const },
  { label: 'Occasion', occasion: 'Special occasions', icon: 'sparkle' as const },
  { label: 'Something else', occasion: 'Something else', icon: 'road' as const },
]

const pct = (v: number) => `${(v * 100).toFixed(3)}%`

function Fill({ base, priority, dusk, portrait, sizes }: { base: string; priority?: boolean; dusk?: boolean; portrait?: boolean; sizes: string }) {
  const img = (
    <img
      src={`${base}-1600.webp`}
      srcSet={srcSet(base)}
      sizes={sizes}
      alt=""
      width={1600}
      height={893}
      decoding="async"
      loading="eager"
      fetchPriority={priority ? 'high' : 'low'}
      className="arr-fill"
      {...(dusk ? { 'data-dusk': '' } : {})}
    />
  )
  if (!portrait) return img
  return (
    <picture>
      <source media="(max-aspect-ratio: 4/5)" srcSet={srcSet(base, PORTRAIT_WIDTHS, 'p')} sizes="100vw" type="image/webp" />
      {img}
    </picture>
  )
}

export function Arrival() {
  const [cx0, cy0, cx1, cy1] = ARRIVAL.car.box
  const carW = cx1 - cx0
  return (
    <section id="top" data-hero data-arrival data-pin="on" className="arrival on-photo relative bg-[#0b0c0e] text-white" aria-labelledby="hero-title">
      <div className="arr-track">
        <div className="arr-stage" data-stage>
          {/* 1 · Arrival: the car on the lane at golden hour */}
          <div className="arr-scene" data-scene="a" aria-hidden="true">
            <div className="arr-frame" data-frame="a">
              <Fill base={`${M}/arrival/plate`} priority sizes="(max-aspect-ratio: 11/10) 152vw, max(100vw, 179svh)" />
              <Fill base={`${M}/arrival/plate-dusk`} dusk sizes="(max-aspect-ratio: 11/10) 152vw, max(100vw, 179svh)" />
              <div className="arr-car" data-a-car style={{ left: pct(cx0), top: pct(cy0), width: pct(carW), height: pct(cy1 - cy0) }}>
                <img src={`${M}/arrival/car-1600.webp`} srcSet={`${M}/arrival/car-960.webp ${Math.round(960 * carW)}w, ${M}/arrival/car-1600.webp ${Math.round(1600 * carW)}w, ${M}/arrival/car-2400.webp ${Math.round(2400 * carW)}w`} sizes="(max-aspect-ratio: 11/10) 88vw, 66vw" alt="" decoding="async" fetchPriority="high" className="arr-fill" />
                <img src={`${M}/arrival/car-dusk-1600.webp`} srcSet={`${M}/arrival/car-dusk-960.webp ${Math.round(960 * carW)}w, ${M}/arrival/car-dusk-1600.webp ${Math.round(1600 * carW)}w, ${M}/arrival/car-dusk-2400.webp ${Math.round(2400 * carW)}w`} sizes="(max-aspect-ratio: 11/10) 88vw, 66vw" alt="" decoding="async" fetchPriority="low" className="arr-fill" data-dusk="" />
                {ARRIVAL.wheels.map(w => (
                  <div key={w.src} className="arr-wheel" data-a-wheel>
                    <img src={`${M}/arrival/${w.src}`} alt="" width={w.size} height={w.size} decoding="async" />
                    <img src={`${M}/arrival/${w.src.replace('.webp', '-dusk.webp')}`} alt="" width={w.size} height={w.size} decoding="async" data-dusk="" />
                  </div>
                ))}
                <img src={`${M}/arrival/glow.webp`} alt="" className="arr-glow" data-a-glow decoding="async" />
              </div>
            </div>
          </div>

          {/* 2 · Cabin: the world moves past the glass */}
          <div className="arr-scene" data-scene="b" aria-hidden="true">
            <div className="arr-frame" data-frame="b">
              <div className="arr-layer" data-b-sky>
                <Fill base={`${M}/cabin/out-sky`} portrait sizes="max(100vw, 179svh)" />
                <Fill base={`${M}/cabin/out-sky-dusk`} portrait dusk sizes="max(100vw, 179svh)" />
              </div>
              <div className="arr-layer" data-b-land>
                <Fill base={`${M}/cabin/out-land`} portrait sizes="max(100vw, 179svh)" />
                <Fill base={`${M}/cabin/out-land-dusk`} portrait dusk sizes="max(100vw, 179svh)" />
              </div>
              <Fill base={`${M}/cabin/interior`} portrait sizes="max(100vw, 179svh)" />
              <div className="arr-layer arr-screen" data-b-glow>
                <picture>
                  <source media="(max-aspect-ratio: 4/5)" srcSet={srcSet(`${M}/cabin/glow`, PORTRAIT_WIDTHS, 'p')} sizes="100vw" type="image/webp" />
                  <img src={`${M}/cabin/glow-960.webp`} srcSet={srcSet(`${M}/cabin/glow`, [960, 1600])} sizes="max(100vw, 179svh)" alt="" decoding="async" loading="eager" className="arr-fill" />
                </picture>
              </div>
            </div>
          </div>

          {/* 3 · Night: the same car drives away up the motorway */}
          <div className="arr-scene" data-scene="c" aria-hidden="true">
            <div className="arr-frame" data-frame="c">
              <Fill base={`${M}/night/plate`} portrait sizes="max(100vw, 179svh)" />
              <img src={`${M}/night/pool.webp`} alt="" className="arr-sprite arr-screen" data-c-sprite="pool" decoding="async" />
              <img src={`${M}/night/tail.webp`} alt="" className="arr-sprite arr-screen" data-c-sprite="tail" decoding="async" />
              <img src={`${M}/night/shadow.webp`} alt="" className="arr-sprite" data-c-sprite="shadow" decoding="async" />
              <img
                src={`${M}/night/car-1600.webp`}
                srcSet={`${M}/night/car-960.webp 120w, ${M}/night/car-1600.webp 200w, ${M}/night/car-2400.webp 300w`}
                sizes="(max-aspect-ratio: 4/5) 40vw, 13vw"
                alt=""
                className="arr-sprite"
                data-c-car
                data-c-sprite="car"
                decoding="async"
              />
            </div>
          </div>

          <div className="arr-black" data-black aria-hidden="true" />
          <div className="arr-shade arr-shade-top" aria-hidden="true" />
          <div className="arr-shade arr-shade-a" data-shade="a" aria-hidden="true" />
          <div className="arr-shade arr-shade-b" data-shade="b" aria-hidden="true" />
          <div className="arr-shade arr-shade-c" data-shade="c" aria-hidden="true" />

          {/* Opening copy */}
          <div className="arr-copy arr-copy-a page-x" data-copy="a">
            <div className="arr-copy-a-top">
              <div className="flex items-center gap-4">
                <div className="arr-badge w-[3.6rem] flex-none sm:w-[4.4rem]">
                  <Badge id="hero" className="h-auto w-full" />
                </div>
                <p suppressHydrationWarning data-anyos="hero.eyebrow" className="label text-[0.76rem]">Theydon Bois · Essex · London</p>
              </div>
              <h1 id="hero-title" className="t-display arr-title mt-4 text-white">
                <span suppressHydrationWarning data-anyos="hero.title">Executive cars</span>{' '}
                <span suppressHydrationWarning data-anyos="hero.titleAccent" className="italic text-[#e6e3de]">from Theydon Bois.</span>
              </h1>
              <p suppressHydrationWarning data-anyos="hero.intro" className="arr-intro t-lead mt-5 max-w-[26rem] text-[#ebe9e6]">
                Airports, business and occasions, arranged personally since 2008.
              </p>
            </div>
            <div className="arr-actions flex flex-col gap-3 xs:flex-row">
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

          <div className="arr-copy arr-copy-b page-x" data-copy="b">
            <p suppressHydrationWarning data-anyos="hero.cabin.title" className="t-h2 text-white">Settle in.</p>
            <p suppressHydrationWarning data-anyos="hero.cabin.text" className="t-lead mt-3 max-w-[26rem] text-[#ebe9e6]">
              Your driver looks after the route and the timing.
            </p>
          </div>

          <div className="arr-copy arr-copy-c page-x" data-copy="c" data-live="off">
            <div className="mx-auto max-w-[44rem] text-center">
              <p suppressHydrationWarning data-anyos="hero.final.title" className="t-h2 text-white">Where are we taking you?</p>
              <p suppressHydrationWarning data-anyos="hero.final.text" className="t-lead mx-auto mt-3 max-w-[30rem] text-[#ebe9e6]">
                Tell us the journey and we’ll reply with a price. Nothing is booked until you accept.
              </p>
              <ul className="mt-7 grid grid-cols-2 gap-2.5 sm:flex sm:flex-wrap sm:justify-center" aria-label="Start a quote">
                {START.map(s => (
                  <li key={s.label}>
                    <QuoteLink prefill={{ occasion: s.occasion, ...(s.flying ? { flying: true } : {}) }} className="arr-chip" ariaLabel={`Request a quote: ${s.label}`}>
                      <Icon name={s.icon} className="h-4 w-4 flex-none" />
                      {s.label}
                    </QuoteLink>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <ArrivalMotion />
        </div>
      </div>
    </section>
  )
}
