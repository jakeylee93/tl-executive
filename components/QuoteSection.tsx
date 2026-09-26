import { BUSINESS } from '@/lib/site'
import { Icon } from './Icon'
import { QuoteForm } from './QuoteForm'

const STEPS = [
  { title: 'Send your journey', text: 'Use the form, or call if you’d rather talk it through.' },
  { title: 'Receive your quote', text: 'We reply by email or phone with a price for your journey.' },
  { title: 'Confirm and travel', text: 'Nothing is booked until you accept. Then we’re there at the agreed time.' },
]

export function QuoteSection() {
  return (
    <section id="quote" aria-labelledby="quote-heading" className="on-forest bg-forest py-16 text-on-forest sm:py-20 lg:py-28">
      {/* Phones: heading → form → contact & steps, so "Get a quote" lands
          right above the form. Desktop: heading and contact in the left
          column, the form alongside. */}
      <div className="page-x grid gap-10 lg:grid-cols-12 lg:grid-rows-[auto_1fr] lg:gap-x-14 lg:gap-y-8">
        <div className="lg:col-span-4 lg:row-start-1">
          <p suppressHydrationWarning data-anyos="quote.eyebrow" className="eyebrow">Request a quote</p>
          <h2 id="quote-heading" suppressHydrationWarning data-anyos="quote.title" className="t-h2 mt-4 text-on-forest">Tell us about the journey</h2>
          <p suppressHydrationWarning data-anyos="quote.intro" className="t-lead mt-5 text-on-forest-muted">
            A few details and we’ll come back with a price. It takes about two minutes.
          </p>
          <p className="mt-4 text-[0.98rem] text-on-forest-muted lg:hidden">
            Or call <a href={BUSINESS.phoneHref} className="font-semibold text-on-forest underline decoration-forest-2 underline-offset-4 tabular">{BUSINESS.phoneDisplay}</a>
          </p>
        </div>

        <div className="text-ink lg:col-span-8 lg:col-start-5 lg:row-span-2 lg:row-start-1">
          <QuoteForm />
        </div>

        <div className="lg:col-span-4 lg:row-start-2">
          <div className="lg:sticky lg:top-[calc(var(--tl-header-h)+2rem)]">
            <div className="rounded-xl border border-forest-2 p-5">
              <p className="text-[0.9rem] font-semibold uppercase tracking-[0.1em] text-on-forest-muted">Prefer to talk?</p>
              <a href={BUSINESS.phoneHref} className="mt-1 inline-flex min-h-[2.75rem] items-center gap-3 font-display text-[1.9rem] leading-none text-on-forest tabular hover:text-white">
                <Icon name="phone" className="h-6 w-6 text-brass-light" />
                {BUSINESS.phoneDisplay}
              </a>
              <p className="mt-3 text-[0.95rem] text-on-forest-muted">{BUSINESS.hours}</p>
              <a href={`mailto:${BUSINESS.email}`} className="mt-4 inline-flex min-h-[2.75rem] items-center gap-2.5 text-[0.98rem] text-on-forest underline decoration-forest-2 underline-offset-4 [overflow-wrap:anywhere] hover:decoration-on-forest">
                <Icon name="mail" className="h-5 w-5 flex-none text-brass-light" />
                {BUSINESS.email}
              </a>
            </div>

            <h3 className="mt-8 text-[0.9rem] font-semibold uppercase tracking-[0.1em] text-on-forest-muted">How it works</h3>
            <ol className="mt-4 grid gap-0">
              {STEPS.map((s, i) => (
                <li key={s.title} className="relative grid grid-cols-[2rem_1fr] gap-3 pb-6 last:pb-0">
                  {i < STEPS.length - 1 ? <span aria-hidden="true" className="absolute bottom-0 left-[0.95rem] top-8 w-px bg-forest-2" /> : null}
                  <span className="grid h-8 w-8 place-items-center rounded-full border border-on-forest-muted text-[0.85rem] font-semibold tabular text-on-forest" aria-hidden="true">{i + 1}</span>
                  <div className="pt-1">
                    <h4 suppressHydrationWarning data-anyos={`quote.step.${i}.title`} className="font-semibold text-on-forest">{s.title}</h4>
                    <p suppressHydrationWarning data-anyos={`quote.step.${i}.text`} className="mt-1 text-[0.95rem] leading-relaxed text-on-forest-muted">{s.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  )
}
