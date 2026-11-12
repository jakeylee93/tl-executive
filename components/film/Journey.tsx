import { BUSINESS } from '@/lib/site'
import { Badge } from '../Badge'
import { Icon } from '../Icon'
import { NextCue } from '../NextCue'
import { QuoteLink } from '../QuoteLink'
import { FilmScene, type FilmSource } from './FilmScene'

// The opening film (FILM.md) as four one-screen chapters (12 Nov 2026, the
// magnetic chapters): each is a full screen, its clip plays in place once and
// holds, and the page settles on it. Nothing is pinned or scrubbed.
//   1 #top     dusk turns to night and the TLE S-Class's lights come on
//   2 #drive   it carries on along the road towards the city
//   3 #space   the Tourneo is loaded, the boot shuts and it leaves
//   4 #where   the lit skyline: "Where are we taking you?" and the quote buttons
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
const SPACE = shot('space')
const WHERE = shot('final', true)

const START = [
  { label: 'Airport', occasion: 'Airport transfers', icon: 'plane' as const, flying: true },
  { label: 'Business', occasion: 'Corporate travel', icon: 'briefcase' as const },
  { label: 'Occasion', occasion: 'Special occasions', icon: 'sparkle' as const },
  { label: 'Something else', occasion: 'Something else', icon: 'road' as const },
]

export function Journey() {
  return (
    <div data-hero>
      {/* the clip holds at nightfall, the car still there with its lights on */}
      <FilmScene id="top" film={HERO} play stopAt={0.5} priority snapName="Welcome" label="Your car, from dusk into the night">
        <div className="film-copy film-copy-open page-x">
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
          <div className="film-open-foot">
            <div className="film-night">
              <p suppressHydrationWarning data-anyos="hero.night.title" className="film-night-title text-white">Day or night, door to door.</p>
              <p suppressHydrationWarning data-anyos="hero.night.text" className="film-night-text text-[#efedea]">
                Flights monitored, arrivals met, and home again however late you land.
              </p>
            </div>
            <div className="film-actions flex flex-col gap-3 xs:flex-row">
              <a href="#plan" className="btn btn-light">Request a quote<Icon name="arrowRight" className="h-5 w-5" /></a>
              <a href={BUSINESS.phoneHref} className="btn btn-ghost tabular text-white"><Icon name="phone" className="h-[1.1rem] w-[1.1rem]" />Call {BUSINESS.phoneDisplay}</a>
            </div>
            <NextCue className="film-cue" />
          </div>
        </div>
      </FilmScene>

      <FilmScene id="drive" film={DRIVE} play snapName="On the road" label="On the way into London">
        <div className="film-copy film-copy-low page-x">
          <p suppressHydrationWarning data-anyos="hero.road.title" className="t-h2 text-white">Door to door, on time.</p>
          <p suppressHydrationWarning data-anyos="hero.road.text" className="t-lead mt-3 max-w-[27rem] text-[#efedea]">
            Your driver watches the traffic and the clock. You sit back.
          </p>
          <NextCue className="film-cue mt-6" />
        </div>
      </FilmScene>

      <FilmScene id="space" film={SPACE} play snapName="Room for everyone" label="Room for everyone and their luggage">
        <div className="film-copy film-copy-low page-x">
          <p suppressHydrationWarning data-anyos="hero.space.title" className="t-h2 text-white">Room for everyone, and everything.</p>
          <p suppressHydrationWarning data-anyos="hero.space.text" className="t-lead mt-3 max-w-[27rem] text-[#efedea]">
            Our Tourneo seats eight with room for eight cases, for airport runs, families and groups.
          </p>
          <NextCue className="film-cue mt-6" />
        </div>
      </FilmScene>

      <FilmScene id="where" film={WHERE} play snapName="Where to?" label="Where are we taking you?">
        <div className="film-copy film-copy-final page-x" data-final>
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
            <NextCue className="film-cue mt-8" />
          </div>
        </div>
      </FilmScene>
    </div>
  )
}
