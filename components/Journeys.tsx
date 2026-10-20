'use client'

import { useEffect, useRef, useState } from 'react'
import { AIRPORT_NOTES, SERVICE_GROUPS, SERVICES } from '@/lib/site'
import { Icon } from './Icon'
import { QuoteLink } from './QuoteLink'

const NOTE_ICONS = ['plane', 'users', 'clock', 'suitcase'] as const

// "Journeys": three chapters (airports, business & London, occasions), each
// with a night photograph from the same shoot as the opening film. Phones:
// the photograph heads its chapter and drifts slowly with the scroll, the
// text sits on the dark below it. Desktop: the photograph is pinned beside
// the text and dissolves to the next chapter's as you reach it. A trip is
// one line until you pick it; every service and airport key stays in the
// page for anyOS.
// (decorative: the chapter titles carry the meaning)
const PHOTOS: Record<string, { src: string }> = {
  travel: { src: '/media/journeys/travel' }, // a terminal kerb at night, a case going into the boot
  evenings: { src: '/media/journeys/evenings' }, // the S-Class driving towards the lit City
  occasions: { src: '/media/journeys/occasions' }, // a country-house venue, the door held open
}
const srcSet = (b: string) => `${b}-960.webp 960w, ${b}-1600.webp 1600w, ${b}-2400.webp 2400w`

export function Journeys() {
  const [chapter, setChapter] = useState(0)
  const [pick, setPick] = useState<number[]>(SERVICE_GROUPS.map(g => g.items[0]))
  const root = useRef<HTMLElement>(null)

  useEffect(() => {
    const sec = root.current
    if (!sec) return
    const chapters = Array.from(sec.querySelectorAll<HTMLElement>('[data-chapter]'))
    const bands = Array.from(sec.querySelectorAll<HTMLElement>('[data-drift]'))
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) setChapter(Number((e.target as HTMLElement).dataset.chapter)) })
    }, { rootMargin: '-45% 0px -45% 0px' })
    chapters.forEach(c => io.observe(c))
    // the chapter photographs drift a little slower than the page
    const still = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('anyos-editing')
    let raf = 0
    const paint = () => {
      raf = 0
      if (still()) { bands.forEach(b => { b.style.transform = '' }); return }
      const vh = window.innerHeight
      bands.forEach(b => {
        const r = b.parentElement!.getBoundingClientRect()
        if (r.bottom < -vh || r.top > 2 * vh) return
        const off = (r.top + r.height / 2 - vh / 2) / vh // -1 … 1 across the screen
        b.style.transform = `translate3d(0, ${(off * -9).toFixed(2)}%, 0)`
      })
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(paint) }
    paint()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => { io.disconnect(); window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); if (raf) cancelAnimationFrame(raf) }
  }, [])

  return (
    <section ref={root} id="journeys" aria-labelledby="journeys-title" className="jr on-photo relative text-white">
      <div className="jr-grid">
        <div className="jr-copy">
          <header className="jr-head page-x">
            <p suppressHydrationWarning data-anyos="services.eyebrow" className="label">Journeys</p>
            <h2 id="journeys-title" suppressHydrationWarning data-anyos="services.title" className="t-h2 mt-3 text-white">Tailored to your needs</h2>
            <p suppressHydrationWarning data-anyos="services.intro" className="t-lead mt-3 max-w-[30rem] text-[#dfe2e8]">
              If your journey isn’t listed, ask: most trips can be arranged.
            </p>
          </header>

          {SERVICE_GROUPS.map((g, gi) => (
            <article key={g.key} data-chapter={gi} aria-labelledby={`jc-${g.key}`} className="jr-chapter">
              <figure className="jr-band" aria-hidden="true">
                <img data-drift src={`${PHOTOS[g.key].src}-1600.webp`} srcSet={srcSet(PHOTOS[g.key].src)} sizes="100vw" alt="" width={1600} height={1195} loading="lazy" decoding="async" />
              </figure>
              <div className="jr-body page-x">
                <p className="jr-count label tabular">{String(gi + 1).padStart(2, '0')} / {String(SERVICE_GROUPS.length).padStart(2, '0')}</p>
                <h3 id={`jc-${g.key}`} className="jr-title">
                  <span suppressHydrationWarning data-anyos={`services.group.${g.key}`}>{g.title}</span>
                </h3>
                <ul className="journey-list mt-5">
                  {g.items.map(idx => {
                    const s = SERVICES.find(x => x.idx === idx)!
                    const open = pick[gi] === idx
                    return (
                      <li key={idx} className={`journey-item ${open ? 'is-open' : ''}`}>
                        <button type="button" aria-expanded={open} aria-controls={`js-${idx}`} onClick={() => setPick(p => p.map((v, j) => (j === gi ? idx : v)))} className="journey-head">
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
                  <div className="jr-airports">
                    <p suppressHydrationWarning data-anyos="airports.eyebrow" className="label">Airports</p>
                    <h4 suppressHydrationWarning data-anyos="airports.title" className="t-h3 mt-2 text-white">Every London airport, from your door</h4>
                    <p suppressHydrationWarning data-anyos="airports.intro" className="mt-2 max-w-[34rem] text-[0.98rem] leading-snug text-[#c9cdd6]">Heathrow, Gatwick, London City, Luton, Stansted and Southend, plus the private and VIP terminals.</p>
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
                    <p className="mt-6"><a href="/airport-transfers" className="text-link text-white">Airport transfers in detail</a></p>
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </div>

        <div className="jr-visual" aria-hidden="true">
          <div className="jr-pin">
            {SERVICE_GROUPS.map((g, gi) => (
              <img key={g.key} data-on={chapter === gi ? '' : undefined} src={`${PHOTOS[g.key].src}-1600.webp`} srcSet={srcSet(PHOTOS[g.key].src)} sizes="60vw" alt="" width={1600} height={1195} loading="lazy" decoding="async" />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
