import { BUSINESS, VEHICLES } from '@/lib/site'
import { Icon } from './Icon'

// Every answer restates something T&L already publishes (own site, Yell) or
// how the enquiry process actually works. No promises about waiting time,
// prices or response times until the owner confirms them.
export const FAQS = [
  {
    q: 'How do I get a price?',
    a: `Send your journey with the form on this page, or call ${BUSINESS.phoneDisplay}. We reply with a quote by email or phone, and nothing is booked until you accept it.`,
  },
  {
    q: 'What if my flight is delayed?',
    a: 'Include your flight number when you enquire. Flights are monitored, so your driver knows your actual arrival time and meets you in the arrivals hall.',
  },
  {
    q: 'Which vehicle do I need?',
    a: `As a guide: the ${VEHICLES[0].name.replace('Mercedes ', '')} and ${VEHICLES[1].name.replace('Mercedes ', '')} seat up to ${VEHICLES[0].seats}, the ${VEHICLES[2].name.replace('Mercedes ', '')} up to ${VEHICLES[2].seats} and the Tourneo Custom up to ${VEHICLES[3].seats}. Tell us how many cases you have and we’ll recommend the right one.`,
  },
  {
    q: 'Are your drivers and cars licensed?',
    a: 'Yes. Drivers and vehicles are licensed by Epping Forest District Council, and the executive vehicles are exempt from displaying standard private hire plates and signs.',
  },
  {
    q: 'How can I pay?',
    a: `We accept ${BUSINESS.payments}.`,
  },
  {
    q: 'Do you travel outside Essex and London?',
    a: 'Yes. Longer journeys, other airports and cruise terminals such as Southampton, Dover, Tilbury and Harwich are quoted individually.',
  },
]

export function FaqSection() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="border-t border-line py-16 sm:py-20 lg:py-24">
      <div className="page-x grid gap-10 lg:grid-cols-12 lg:gap-14">
        <div className="lg:col-span-4" data-reveal>
          <p suppressHydrationWarning data-anyos="faq.eyebrow" className="eyebrow">Good to know</p>
          <h2 id="faq-title" suppressHydrationWarning data-anyos="faq.title" className="t-h2 mt-4 text-ink">Questions, answered</h2>
          <p className="mt-5 text-ink-2">
            Anything else? Call <a href={BUSINESS.phoneHref} className="text-link text-ink tabular">{BUSINESS.phoneDisplay}</a>.
          </p>
        </div>
        <div className="lg:col-span-8" data-reveal style={{ ['--reveal-delay' as string]: '100ms' }}>
          <ul className="border-t border-ink">
            {FAQS.map((f, i) => (
              <li key={f.q} className="border-b border-line">
                <details className="group" {...(i === 0 ? { open: true } : {})}>
                  <summary className="flex min-h-[3.75rem] cursor-pointer list-none items-center justify-between gap-6 py-4 text-left [&::-webkit-details-marker]:hidden">
                    <span suppressHydrationWarning data-anyos={`faq.${i}.q`} className="font-display text-[1.22rem] font-medium leading-snug text-ink">{f.q}</span>
                    <span className="grid h-8 w-8 flex-none place-items-center rounded-full border border-line text-ink transition-transform duration-300 group-open:rotate-45">
                      <Icon name="plus" className="h-4 w-4" />
                    </span>
                  </summary>
                  <p suppressHydrationWarning data-anyos={`faq.${i}.a`} className="max-w-[40rem] pb-6 pr-12 text-[1.02rem] leading-relaxed text-ink-2">{f.a}</p>
                </details>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
