import { BUSINESS } from '@/lib/site'
import { Icon } from './Icon'

// The owner's own words (from T&L's site since 2013), kept as written. The
// portrait slot defaults to the badge; the owner can upload a real photo of
// himself or his car from anyOS (data-anyos-img="about.image").
export function AboutSection() {
  const facts = [
    { icon: 'calendar' as const, label: 'Established', value: '2008, in Theydon Bois' },
    { icon: 'shield' as const, label: 'Licensing', value: BUSINESS.licensing },
    { icon: 'clock' as const, label: 'Availability', value: BUSINESS.hours },
    { icon: 'check' as const, label: 'Payment', value: BUSINESS.payments },
  ]
  return (
    <section id="about" aria-labelledby="about-title" className="border-y border-line bg-stone py-16 sm:py-20 lg:py-28">
      <div className="page-x grid items-center gap-10 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5" data-reveal>
          <div className="relative mx-auto aspect-square w-full max-w-[15rem] overflow-hidden rounded-xl bg-paper sm:max-w-[20rem] lg:max-w-[26rem]">
            <img
              data-anyos-img="about.image"
              src="/brand/tl-badge-512.png"
              alt="Theydon & Loughton Executive Cars badge"
              width={512}
              height={512}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-contain p-[12%]"
            />
          </div>
        </div>

        <div className="lg:col-span-7" data-reveal style={{ ['--reveal-delay' as string]: '100ms' }}>
          <p suppressHydrationWarning data-anyos="about.eyebrow" className="eyebrow">About us</p>
          <h2 id="about-title" suppressHydrationWarning data-anyos="about.title" className="t-h2 mt-4 text-ink">A personal guarantee</h2>
          <div className="mt-6 max-w-[38rem] space-y-4 text-[1.08rem] leading-relaxed text-ink-2">
            <p suppressHydrationWarning data-anyos="about.story">
              I founded Theydon &amp; Loughton Executive Cars in 2008 to look after local individuals and businesses. Over the years I have established a very loyal client base by providing a friendly and professional service.
            </p>
            <p suppressHydrationWarning data-anyos="about.promise">
              This is something that I am committed to continuing and personally guarantee all my customers.
            </p>
          </div>
          <p suppressHydrationWarning data-anyos="about.signoff" className="mt-6 font-display text-[1.35rem] italic text-ink">Simon Burns, founder</p>

          <dl className="mt-10 grid gap-x-8 gap-y-5 border-t border-line pt-8 sm:grid-cols-2">
            {facts.map(f => (
              <div key={f.label}>
                <dt className="flex items-center gap-3 text-[0.8125rem] font-semibold uppercase tracking-[0.1em] text-muted">
                  <Icon name={f.icon} className="h-5 w-5 flex-none text-brass" />
                  {f.label}
                </dt>
                <dd className="mt-1 pl-8 text-[0.98rem] leading-snug text-ink">{f.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
}
