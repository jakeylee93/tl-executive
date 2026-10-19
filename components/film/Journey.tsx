import { BUSINESS } from '@/lib/site'
import { Badge } from '../Badge'
import { Icon } from '../Icon'
import { QuoteLink } from '../QuoteLink'
import { FilmScene, type FilmSource } from './FilmScene'

// The opening journey: three continuous shots of one W222 S-Class, each
// played by scroll in its own full-screen section (FILM.md):
//   1 the camera glides to the car on the lane, the rear window lowers and
//     it floats inside;  2 from the cabin out through the windscreen onto the
//     country road;  3 overhead at night, rising towards London's lights.

const F = '/media/film'
const film = (n: number): FilmSource => ({
  wide: `${F}/s${n}-wide.mp4`,
  tall: `${F}/s${n}-tall.mp4`,
  posterWide: `${F}/s${n}-poster-1600.webp`,
  posterWideSet: `${F}/s${n}-poster-960.webp 960w, ${F}/s${n}-poster-1600.webp 1600w, ${F}/s${n}-poster-1920.webp 1920w`,
  posterTall: `${F}/s${n}-poster-p720.webp`,
  posterTallSet: `${F}/s${n}-poster-p720.webp 720w, ${F}/s${n}-poster-p1080.webp 1080w`,
})
const S1 = film(1)
const S2 = film(2)
const S3 = film(3)

const START = [
  { label: 'Airport', occasion: 'Airport transfers', icon: 'plane' as const, flying: true },
  { label: 'Business', occasion: 'Corporate travel', icon: 'briefcase' as const },
  { label: 'Occasion', occasion: 'Special occasions', icon: 'sparkle' as const },
  { label: 'Something else', occasion: 'Something else', icon: 'road' as const },
]

export function Journey() {
  return (
    <div data-hero>
      <FilmScene id="top" film={S1} track="260svh" priority label="Your car arrives">
        <div className="film-copy film-copy-open page-x" data-in="0" data-out="0.24">
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
          <div className="film-actions flex flex-col gap-3 xs:flex-row">
            <a href="#plan" className="btn btn-light">Request a quote<Icon name="arrowRight" className="h-5 w-5" /></a>
            <a href={BUSINESS.phoneHref} className="btn btn-ghost tabular text-white"><Icon name="phone" className="h-[1.1rem] w-[1.1rem]" />Call {BUSINESS.phoneDisplay}</a>
          </div>
        </div>
        <div className="film-copy film-copy-low page-x" data-in="0.62" data-out="1">
          <p suppressHydrationWarning data-anyos="hero.cabin.title" className="t-h2 text-white">Settle in.</p>
          <p suppressHydrationWarning data-anyos="hero.cabin.text" className="t-lead mt-3 max-w-[27rem] text-[#efedea]">
            Quilted leather, a quiet cabin and a driver who knows the way.
          </p>
        </div>
      </FilmScene>

      <FilmScene id="journey-road" film={S2} track="220svh" label="On the road">
        <div className="film-copy film-copy-low page-x" data-in="0.22" data-out="0.86">
          <p suppressHydrationWarning data-anyos="hero.road.title" className="t-h2 text-white">Door to door, on time.</p>
          <p suppressHydrationWarning data-anyos="hero.road.text" className="t-lead mt-3 max-w-[27rem] text-[#efedea]">
            Your driver watches the traffic and the clock. You watch the countryside.
          </p>
        </div>
      </FilmScene>

      <FilmScene id="journey-night" film={S3} track="250svh" label="Every airport, day or night">
        <div className="film-copy film-copy-top page-x" data-in="0.06" data-out="0.5">
          <p suppressHydrationWarning data-anyos="hero.night.title" className="t-h2 text-white">Every London airport.</p>
          <p suppressHydrationWarning data-anyos="hero.night.text" className="t-lead mt-3 max-w-[27rem] text-[#efedea]">
            Flights monitored, arrivals met, and home again however late you land.
          </p>
        </div>
        <div className="film-copy film-copy-final page-x" data-in="0.66" data-out="1" data-final>
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
