import { BUSINESS, CLIENTS, TESTIMONIALS, plateSrcSet, testimonialKey } from '@/lib/site'

export function StoryChapter() {
  const [lead, ...rest] = TESTIMONIALS
  const facts = [
    { label: 'Established', value: '2008, Theydon Bois' },
    { label: 'Licensing', value: BUSINESS.licensing },
    { label: 'Payment', value: BUSINESS.payments },
  ]
  return (
    <section id="about" aria-labelledby="about-title" className="on-dark bg-charcoal text-on-dark">
      <div className="page-x grid items-center gap-12 py-16 sm:py-20 lg:grid-cols-12 lg:gap-16 lg:py-28">
        <div className="lg:col-span-5">
          <img src="/brand/tl-badge.svg" alt="" width={1006} height={950} loading="lazy" decoding="async" className="mx-auto h-auto w-[min(70vw,22rem)] drop-shadow-[0_30px_40px_rgba(0,0,0,0.55)] lg:w-full lg:max-w-[28rem]" />
        </div>
        <div className="lg:col-span-7">
          <p suppressHydrationWarning data-anyos="about.eyebrow" className="label">About us</p>
          <h2 id="about-title" suppressHydrationWarning data-anyos="about.title" className="t-h2 mt-3 text-white">A personal guarantee</h2>
          <div className="mt-6 max-w-[38rem] space-y-4 text-[1.08rem] leading-relaxed text-[#d9dadc]">
            <p suppressHydrationWarning data-anyos="about.story">
              I founded Theydon &amp; Loughton Executive Cars in 2008 to look after local individuals and businesses. Over the years I have established a very loyal client base by providing a friendly and professional service.
            </p>
            <p suppressHydrationWarning data-anyos="about.promise">
              This is something that I am committed to continuing and personally guarantee all my customers.
            </p>
          </div>
          <p suppressHydrationWarning data-anyos="about.signoff" className="mt-6 font-display text-[1.4rem] italic text-white">Simon Burns, founder</p>
          <dl className="mt-10 grid gap-6 sm:grid-cols-3">
            {facts.map(f => (
              <div key={f.label}>
                <dt className="label text-[0.72rem]">{f.label}</dt>
                <dd className="mt-1.5 text-[0.95rem] leading-snug text-[#e4e5e6]">{f.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* Editable photograph (anyOS about.image). Overlays ignore the pointer
          so the image picker still opens on click in edit mode. */}
      <figure className="relative isolate flex min-h-[34rem] items-end overflow-hidden sm:min-h-[38rem] lg:min-h-[42rem]">
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
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(0deg,rgba(14,15,17,0.9)_0%,rgba(14,15,17,0.55)_45%,rgba(14,15,17,0.1)_100%)]" aria-hidden="true" />
        <div className="page-x pointer-events-none pb-14 pt-40 sm:pb-16 lg:pb-20">
          <blockquote className="max-w-[48rem]">
            <p suppressHydrationWarning data-anyos="testimonials.eyebrow" className="label pointer-events-auto">What our clients say</p>
            <p suppressHydrationWarning data-anyos={`testimonials.${testimonialKey(lead.name)}.quote`} className="pointer-events-auto mt-5 font-display text-[clamp(1.35rem,1.05rem+1.2vw,2.1rem)] leading-[1.35] text-white" style={{ fontVariationSettings: "'opsz' 36" }}>
              {lead.quote}
            </p>
          </blockquote>
          <figcaption className="mt-6">
            <span suppressHydrationWarning data-anyos={`testimonials.${testimonialKey(lead.name)}.name`} className="pointer-events-auto block font-semibold text-white">{lead.name}</span>
            <span suppressHydrationWarning data-anyos={`testimonials.${testimonialKey(lead.name)}.role`} className="pointer-events-auto block text-[0.95rem] text-[#cfd0d2]">{lead.role}</span>
          </figcaption>
        </div>
      </figure>

      <div className="page-x py-16 sm:py-20 lg:py-24">
        <h3 suppressHydrationWarning data-anyos="testimonials.title" className="t-h3 text-white">Trusted since 2008</h3>
        <div className="mt-8 grid gap-10 md:grid-cols-2 md:gap-14">
          {rest.map(t => (
            <figure key={t.name}>
              <blockquote>
                <p suppressHydrationWarning data-anyos={`testimonials.${testimonialKey(t.name)}.quote`} className="text-[1.05rem] leading-relaxed text-[#e1e2e4]">{t.quote}</p>
              </blockquote>
              <figcaption className="mt-4">
                <span suppressHydrationWarning data-anyos={`testimonials.${testimonialKey(t.name)}.name`} className="block font-semibold text-white">{t.name}</span>
                <span suppressHydrationWarning data-anyos={`testimonials.${testimonialKey(t.name)}.role`} className="block text-[0.95rem] text-on-dark-muted">{t.role}</span>
              </figcaption>
            </figure>
          ))}
        </div>

        <div className="mt-16 grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p suppressHydrationWarning data-anyos="clients.eyebrow" className="label">Trusted by</p>
            <h3 suppressHydrationWarning data-anyos="clients.title" className="mt-2 font-display text-[1.5rem] text-white">Clients have included</h3>
          </div>
          <ul className="grid grid-cols-1 gap-x-8 gap-y-2.5 text-[1.02rem] text-[#e4e5e6] xs:grid-cols-2 sm:grid-cols-3 lg:col-span-8 lg:pt-2">
            {CLIENTS.map(c => <li key={c}>{c}</li>)}
          </ul>
        </div>
      </div>
    </section>
  )
}
