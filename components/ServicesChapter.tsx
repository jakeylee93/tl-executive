'use client'

import { useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { SERVICE_GROUPS, SERVICES, platePortraitSrcSet, plateSrcSet } from '@/lib/site'
import { Icon } from './Icon'
import { QuoteLink } from './QuoteLink'

/** Full-width photographic chapter; choosing a category changes the photo
 *  and the services in place. Every service key stays in the DOM. */
export function ServicesChapter() {
  const [active, setActive] = useState(0)
  const tabs = useRef<(HTMLButtonElement | null)[]>([])
  const onKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const last = SERVICE_GROUPS.length - 1
    const next = e.key === 'ArrowRight' ? (i === last ? 0 : i + 1) : e.key === 'ArrowLeft' ? (i === 0 ? last : i - 1) : e.key === 'Home' ? 0 : e.key === 'End' ? last : -1
    if (next < 0) return
    e.preventDefault()
    setActive(next)
    tabs.current[next]?.focus()
  }

  return (
    <section id="services" aria-labelledby="services-title" className="on-photo relative overflow-hidden bg-charcoal text-white">
      {SERVICE_GROUPS.map((g, i) => (
        <div key={g.key} className="plate-fade absolute inset-0" style={{ opacity: active === i ? 1 : 0 }} aria-hidden="true">
          <picture>
            <source media="(max-aspect-ratio: 4/5)" srcSet={platePortraitSrcSet(g.plate)} sizes="100vw" type="image/webp" />
            <img src={`/media/${g.plate}-1600.webp`} srcSet={plateSrcSet(g.plate)} sizes="100vw" alt="" width={1600} height={900} loading="lazy" decoding="async" className="h-full w-full object-cover" />
          </picture>
        </div>
      ))}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(14,15,17,0.72)_0%,rgba(14,15,17,0.5)_40%,rgba(14,15,17,0.86)_100%)]" aria-hidden="true" />

      <div className="page-x relative py-16 sm:py-20 lg:py-28">
        <div className="max-w-[42rem]">
          <p suppressHydrationWarning data-anyos="services.eyebrow" className="label">Services</p>
          <h2 id="services-title" suppressHydrationWarning data-anyos="services.title" className="t-h2 mt-3 text-white">Tailored to your needs</h2>
          <p suppressHydrationWarning data-anyos="services.intro" className="t-lead mt-4 text-[#e2e3e5]">
            The journeys T&amp;L is asked for most. If yours isn’t here, ask: most trips can be arranged.
          </p>
        </div>

        <div role="tablist" aria-label="Service categories" className="mt-9 flex flex-wrap gap-2">
          {SERVICE_GROUPS.map((g, i) => (
            <button
              key={g.key}
              ref={el => { tabs.current[i] = el }}
              id={`svc-tab-${g.key}`}
              role="tab"
              type="button"
              aria-selected={active === i}
              aria-controls={`svc-panel-${g.key}`}
              tabIndex={active === i ? 0 : -1}
              onClick={() => setActive(i)}
              onKeyDown={e => onKey(e, i)}
              className={`min-h-[2.9rem] flex-none rounded-full px-5 text-[0.98rem] font-semibold transition-colors ${active === i ? 'bg-white text-ink' : 'bg-[rgba(255,255,255,0.12)] text-white backdrop-blur-md hover:bg-[rgba(255,255,255,0.2)]'}`}
            >
              <span suppressHydrationWarning data-anyos={`services.group.${g.key}`}>{g.title}</span>
            </button>
          ))}
        </div>

        {SERVICE_GROUPS.map((g, i) => (
          <div key={g.key} id={`svc-panel-${g.key}`} role="tabpanel" aria-labelledby={`svc-tab-${g.key}`} hidden={active !== i} className="mt-8">
            <ul className="grid gap-x-10 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
              {g.items.map(idx => {
                const s = SERVICES.find(x => x.idx === idx)!
                return (
                  <li key={idx} className="flex gap-4">
                    <Icon name={s.icon} className="mt-1 h-6 w-6 flex-none text-[#d9dadc]" />
                    <div className="min-w-0">
                      <h3 suppressHydrationWarning data-anyos={`services.${idx}.title`} className="t-h3 text-white">{s.title}</h3>
                      <p suppressHydrationWarning data-anyos={`services.${idx}.description`} className="mt-1.5 leading-relaxed text-[#d7d8da]">{s.description}</p>
                      <QuoteLink
                        prefill={{ occasion: s.title, ...(idx === 0 ? { flying: true } : {}) }}
                        className="mt-2 inline-flex min-h-[2.75rem] items-center gap-1.5 text-[0.95rem] font-semibold text-white underline decoration-[rgba(255,255,255,0.4)] underline-offset-4 hover:decoration-white"
                        ariaLabel={`Request a quote: ${s.title}`}
                      >
                        Request a quote
                        <Icon name="arrowRight" className="h-4 w-4" />
                      </QuoteLink>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}

      </div>
    </section>
  )
}
