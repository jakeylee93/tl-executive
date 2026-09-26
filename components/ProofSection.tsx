import { CLIENTS, SHOW_CLIENTS, SHOW_TESTIMONIALS, TESTIMONIALS, testimonialKey } from '@/lib/site'

// Testimonials and client names from T&L's own website (published there since
// 2020). Client names are set as text rather than third-party logos: calmer,
// sharper at every size, and no borrowed trade marks.
export function ProofSection() {
  if (!SHOW_TESTIMONIALS && !SHOW_CLIENTS) return null
  const [lead, ...rest] = TESTIMONIALS
  return (
    <section id="testimonials" aria-labelledby="testimonials-title" className="on-forest bg-forest py-16 text-on-forest sm:py-20 lg:py-28">
      <div className="page-x">
        {SHOW_TESTIMONIALS ? (
          <>
            <div className="max-w-[44rem]" data-reveal>
              <p suppressHydrationWarning data-anyos="testimonials.eyebrow" className="eyebrow">What our clients say</p>
              <h2 id="testimonials-title" suppressHydrationWarning data-anyos="testimonials.title" className="t-h2 mt-4 text-on-forest">Trusted since 2008</h2>
            </div>

            <div className="mt-12 grid gap-10 lg:mt-14 lg:grid-cols-12 lg:gap-12">
              <figure className="lg:col-span-7" data-reveal>
                <svg viewBox="0 0 48 36" className="h-9 w-12 text-brass-light" aria-hidden="true" fill="currentColor">
                  <path d="M0 36V21.6C0 9.6 6.2 2.4 18.6 0l2.2 4.8C13.6 7 10.2 11 10.2 17h9V36H0Zm27 0V21.6C27 9.6 33.2 2.4 45.6 0l2.2 4.8C40.6 7 37.2 11 37.2 17h9V36H27Z" />
                </svg>
                <blockquote className="mt-6">
                  <p suppressHydrationWarning data-anyos={`testimonials.${testimonialKey(lead.name)}.quote`} className="font-display text-[clamp(1.35rem,1.1rem+0.9vw,1.85rem)] leading-[1.4] text-on-forest" style={{ fontVariationSettings: "'opsz' 36" }}>
                    {lead.quote}
                  </p>
                </blockquote>
                <figcaption className="mt-6 border-t border-forest-2 pt-5">
                  <span suppressHydrationWarning data-anyos={`testimonials.${testimonialKey(lead.name)}.name`} className="block font-semibold text-on-forest">{lead.name}</span>
                  <span suppressHydrationWarning data-anyos={`testimonials.${testimonialKey(lead.name)}.role`} className="block text-[0.95rem] text-on-forest-muted">{lead.role}</span>
                </figcaption>
              </figure>

              <div className="grid content-start gap-8 lg:col-span-5">
                {rest.map((t, i) => (
                  <figure key={t.name} className="rounded-xl border border-forest-2 p-6 sm:p-7" style={{ backgroundColor: 'color-mix(in srgb, var(--tl-forest-2) 55%, transparent)', ['--reveal-delay' as string]: `${(i + 1) * 90}ms` }} data-reveal>
                    <blockquote>
                      <p suppressHydrationWarning data-anyos={`testimonials.${testimonialKey(t.name)}.quote`} className="text-[1.02rem] leading-relaxed text-on-forest">
                        {t.quote}
                      </p>
                    </blockquote>
                    <figcaption className="mt-5">
                      <span suppressHydrationWarning data-anyos={`testimonials.${testimonialKey(t.name)}.name`} className="block font-semibold text-on-forest">{t.name}</span>
                      <span suppressHydrationWarning data-anyos={`testimonials.${testimonialKey(t.name)}.role`} className="block text-[0.95rem] text-on-forest-muted">{t.role}</span>
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          </>
        ) : null}

        {SHOW_CLIENTS ? (
          <div className={`${SHOW_TESTIMONIALS ? 'mt-16 border-t border-forest-2 pt-12 lg:mt-20' : ''}`} data-reveal>
            <div className="grid gap-6 lg:grid-cols-12">
              <div className="lg:col-span-4">
                <p suppressHydrationWarning data-anyos="clients.eyebrow" className="eyebrow">Trusted by</p>
                <h3 suppressHydrationWarning data-anyos="clients.title" className="mt-3 font-display text-[1.6rem] leading-tight text-on-forest">Clients have included</h3>
              </div>
              <ul className="grid grid-cols-1 gap-x-8 gap-y-3 text-[1.02rem] text-on-forest xs:grid-cols-2 sm:grid-cols-3 lg:col-span-8 lg:pt-2">
                {CLIENTS.map(c => (
                  <li key={c.name} className="flex items-center gap-3">
                    <span aria-hidden="true" className="h-1.5 w-1.5 flex-none rounded-full bg-brass-light" />
                    {c.name}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}
