import { BUSINESS } from '@/lib/site'
import { Badge } from '../Badge'
import { Icon } from '../Icon'
import { QuoteLink } from '../QuoteLink'
import { FilmScene, type FilmSource } from './FilmScene'

// The opening film (FILM.md): two shots from one night on a hilltop road
// with London behind, each played by scroll, the second dissolving in over
// the first (it starts 170svh up inside it and fades in while both are pinned).
//   1 #top     the title; dusk turns to night, the TLE S-Class's lights come on, it drives off
//   2 #drive   seen from behind, it carries on towards the city, and "Where are
//              we taking you?" with the quote buttons fades in as it goes
// Phones get 9:16 crops of the same 4K masters (scripts/film/build_*.py).

const F = '/media/film'
const shot = (name: string, still = false): FilmSource => ({
  ...(still ? {} : { wide: `${F}/${name}-wide.mp4`, tall: `${F}/${name}-tall.mp4` }),
  posterWide: `${F}/${name}-poster-1600.webp`,
  posterWideSet: `${F}/${name}-poster-960.webp 960w, ${F}/${name}-poster-1600.webp 1600w, ${F}/${name}-poster-2560.webp 2560w`,
  posterTall: `${F}/${name}-poster-p720.webp`,
  posterTallSet: `${F}/${name}-poster-p720.webp 720w, ${F}/${name}-poster-p1080.webp 1080w`,
})
const HERO = shot('hero')
const DRIVE = shot('drive')
const XFADE = '170svh'

const START = [
  { label: 'Airport', occasion: 'Airport transfers', icon: 'plane' as const, flying: true },
  { label: 'Business', occasion: 'Corporate travel', icon: 'briefcase' as const },
  { label: 'Occasion', occasion: 'Special occasions', icon: 'sparkle' as const },
  { label: 'Something else', occasion: 'Something else', icon: 'road' as const },
]

export function Journey() {
  return (
    <div data-hero>
      <FilmScene id="top" film={HERO} track="380svh" end={0.75} priority label="Your car, from dusk into the night">
        <div className="film-copy film-copy-open page-x" data-in="0" data-out="0.2">
          <div className="film-open-top">
            <div className="flex items-center gap-4">
              <div className="arr-badge w-[3.6rem] flex-none sm:w-[4.4rem]">
                <Badge id="hero" className="h-auto w-full" />
              </div>
              <p suppressHydrationWarning data-anyos="hero.eyebrow" className="label text-[0.76rem]">Theydon Bois · Essex · London</p>
            </div>
            <h1 id="hero-title" className="t-display arr-title mt-4 text-white">
              <span suppressHydrationWarning data-anyos="hero.title">Executive cars</span>{' '}
              <span suppressHydrationWarning data-anyos="hero.titleAccent" className="italic text-[#e9e6e1]">from Theydon Bois.</span>
            </h1>
            <p suppressHydrationWarning data-anyos="hero.intro" className="film-intro t-lead mt-4 max-w-[26rem] text-[#efedea]">
              Airports, business and occasions, arranged personally since 2008.
            </p>
          </div>
          <div className="film-actions flex flex-col gap-3 xs:flex-row xs:flex-wrap">
            <a href="#plan" className="btn btn-light">Request a quote<Icon name="arrowRight" className="h-5 w-5" /></a>
            <a href={BUSINESS.phoneHref} className="btn btn-ghost tabular text-white"><Icon name="phone" className="h-[1.1rem] w-[1.1rem]" />Call {BUSINESS.phoneDisplay}</a>
          </div>
        </div>
      </FilmScene>

      <FilmScene id="drive" film={DRIVE} track="360svh" end={0.8} overlap={XFADE} fadeIn={0.3} label="Where are we taking you?">
        <div className="film-copy film-copy-final page-x" data-in="0.3" data-out="1" data-final>
          <div className="mx-auto max-w-[44rem] text-center">
            <p suppressHydrationWarning data-anyos="hero.final.title" className="t-h2 text-white">Where are we taking you?</p>
            <p suppressHydrationWarning data-anyos="hero.final.text" className="t-lead mx-auto mt-3 max-w-[30rem] text-[#efedea]">
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
      </FilmScene>
    </div>
  )
}
