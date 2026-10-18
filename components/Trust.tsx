'use client'

import { useState } from 'react'
import { AREAS, BUSINESS, CLIENTS, TESTIMONIALS, plateSrcSet, testimonialKey } from '@/lib/site'
import { Icon } from './Icon'

/** Essential trust, briefly: who runs it, the facts, one client voice at a
 *  time over the editable photograph, and who has used the service. */
export function Trust() {
  const [q, setQ] = useState(0)
  const n = TESTIMONIALS.length
  const facts = [
    { label: 'Established', value: '2008, Theydon Bois' },
    { label: 'Licensing', value: BUSINESS.licensing },
    { label: 'Payment', value: BUSINESS.payments },
  ]
  return (
    <section id="about" aria-labelledby="about-title" className="on-dark bg-charcoal text-on-dark">
      <div className="page-x grid items-center gap-12 py-16 sm:py-20 lg:grid-cols-12 lg:gap-16 lg:py-24">
        <div className="lg:col-span-5">
          <img src="/brand/tl-badge.svg" alt="" width={1006} height={950} loading="lazy" decoding="async" className="trust-badge mx-auto h-auto w-[min(62vw,19rem)] lg:w-full lg:max-w-[24rem]" />
        </div>
        <div className="lg:col-span-7">
          <p suppressHydrationWarning data-anyos="about.eyebrow" className="label">About us</p>
          <h2 id="about-title" suppressHydrationWarning data-anyos="about.title" className="t-h2 mt-3 text-white">A personal guarantee</h2>
          <div className="mt-5 max-w-[34rem] space-y-3 text-[1.06rem] leading-relaxed text-[#dcdcda]">
            <p suppressHydrationWarning data-anyos="about.story">I founded Theydon &amp; Loughton Executive Cars in 2008 to look after local people and businesses, and they have kept coming back.</p>
            <p suppressHydrationWarning data-anyos="about.promise">I personally guarantee the service to every customer.</p>
          </div>
          <p suppressHydrationWarning data-anyos="about.signoff" className="mt-5 font-display text-[1.35rem] italic text-white">Simon Burns, founder</p>
          <dl className="mt-9 grid gap-6 sm:grid-cols-3">
            {facts.map(f => (
              <div key={f.label}>
                <dt className="label text-[0.72rem]">{f.label}</dt>
                <dd className="mt-1.5 text-[0.95rem] leading-snug text-[#e6e6e4]">{f.value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-7 text-[0.95rem] leading-snug text-on-dark-muted">
            <span suppressHydrationWarning data-anyos="areas.title" className="font-semibold text-[#e6e6e4]">Areas we cover</span>
            {': '}
            <span suppressHydrationWarning data-anyos="areas.intro">Collections from Theydon Bois and the towns and villages around Epping Forest.</span>
            {' '}{AREAS.join(' · ')}
          </p>
        </div>
      </div>

      <figure className="trust-voice relative isolate flex min-h-[32rem] items-end overflow-hidden sm:min-h-[36rem] lg:min-h-[40rem]">
        <img
          data-anyos-img="about.image"
          src="/media/forest-1600.webp"
          srcSet={plateSrcSet('forest')}
          sizes="100vw"
          alt="Lodge Road in Epping Forest"
          width={1600}
          height={900}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 -z-10 h-full w-full object-cover"
        />
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(0deg,rgba(12,13,15,0.92)_0%,rgba(12,13,15,0.55)_48%,rgba(12,13,15,0.08)_100%)]" aria-hidden="true" />
        <div className="page-x pointer-events-none w-full pb-12 pt-40 sm:pb-16">
          <p suppressHydrationWarning data-anyos="testimonials.eyebrow" className="label pointer-events-auto">What our clients say</p>
          <h3 suppressHydrationWarning data-anyos="testimonials.title" className="pointer-events-auto mt-2 text-[1.05rem] font-semibold text-white">Trusted since 2008</h3>
          {TESTIMONIALS.map((t, i) => (
            <div key={t.name} hidden={q !== i} className="pointer-events-auto mt-5 max-w-[46rem]">
              <blockquote>
                <p suppressHydrationWarning data-anyos={`testimonials.${testimonialKey(t.name)}.quote`} className="font-display text-[clamp(1.2rem,1rem+0.9vw,1.75rem)] leading-[1.4] text-white">{t.quote}</p>
              </blockquote>
              <p className="mt-5">
                <span suppressHydrationWarning data-anyos={`testimonials.${testimonialKey(t.name)}.name`} className="block font-semibold text-white">{t.name}</span>
                <span suppressHydrationWarning data-anyos={`testimonials.${testimonialKey(t.name)}.role`} className="block text-[0.95rem] text-[#d2d1ce]">{t.role}</span>
              </p>
            </div>
          ))}
          <div className="pointer-events-auto mt-6 flex items-center gap-2">
            <button type="button" className="voice-step" onClick={() => setQ((q - 1 + n) % n)} aria-label="Previous client">
              <Icon name="arrowRight" className="h-5 w-5 rotate-180" />
            </button>
            <span className="tabular min-w-[3rem] text-center text-[0.92rem] text-[#d2d1ce]" aria-live="polite">{q + 1} / {n}</span>
            <button type="button" className="voice-step" onClick={() => setQ((q + 1) % n)} aria-label="Next client">
              <Icon name="arrowRight" className="h-5 w-5" />
            </button>
          </div>
        </div>
      </figure>

      <div className="page-x grid gap-4 py-14 lg:grid-cols-12 lg:py-16">
        <div className="lg:col-span-4">
          <p suppressHydrationWarning data-anyos="clients.eyebrow" className="label">Trusted by</p>
          <h3 suppressHydrationWarning data-anyos="clients.title" className="mt-2 font-display text-[1.45rem] text-white">Clients have included</h3>
        </div>
        <p className="text-[1.02rem] leading-[1.9] text-[#dedddb] lg:col-span-8 lg:pt-1">{CLIENTS.join('  ·  ')}</p>
      </div>
    </section>
  )
}
