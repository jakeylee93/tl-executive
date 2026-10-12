import { BUSINESS } from '@/lib/site'
import { Icon } from './Icon'
import { JourneyPlanner } from './JourneyPlanner'

const STEPS = [
  { title: 'Send your journey', text: 'Use the form, or call if you’d rather talk it through.' },
  { title: 'Receive your quote', text: 'We reply by email or phone with a price for your journey.' },
  { title: 'Confirm and travel', text: 'Nothing is booked until you accept the quote.' },
]

export function PlanSection() {
  return (
    <section id="plan" aria-labelledby="plan-title" className="on-light relative bg-white py-14 sm:py-20 lg:py-24">
      <div className="page-x">
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-6">
            <p suppressHydrationWarning data-anyos="quote.eyebrow" className="label">Plan your journey</p>
            <h2 id="plan-title" suppressHydrationWarning data-anyos="quote.title" className="t-h2 mt-3 text-ink">Request a quote</h2>
            <p suppressHydrationWarning data-anyos="quote.intro" className="t-lead mt-4 max-w-[34rem] text-ink-2">
              Tell us where and when, and we’ll come back with a price.
            </p>
          </div>
          <ol className="grid gap-4 text-[0.95rem] sm:grid-cols-3 lg:col-span-6 lg:pb-1">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex gap-3">
                <span className="grid h-7 w-7 flex-none place-items-center rounded-full bg-ink text-[0.8rem] font-semibold text-white tabular" aria-hidden="true">{i + 1}</span>
                <span>
                  <span suppressHydrationWarning data-anyos={`quote.step.${i}.title`} className="block font-semibold text-ink">{s.title}</span>
                  <span suppressHydrationWarning data-anyos={`quote.step.${i}.text`} className="mt-0.5 block leading-snug text-steel">{s.text}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-8 lg:mt-10">
          <JourneyPlanner />
        </div>

        <p className="mt-4 flex flex-wrap items-center gap-x-3 text-[0.95rem] text-steel">
          <span className="inline-flex items-center gap-2"><Icon name="phone" className="h-4 w-4" />Prefer to talk?</span>
          <a href={BUSINESS.phoneHref} className="text-link inline-flex min-h-[2.75rem] items-center text-ink tabular">Call {BUSINESS.phoneDisplay}</a>
          <span aria-hidden="true">·</span>
          <a href={`mailto:${BUSINESS.email}`} className="text-link inline-flex min-h-[2.75rem] items-center text-ink [overflow-wrap:anywhere]">{BUSINESS.email}</a>
        </p>
      </div>
    </section>
  )
}
