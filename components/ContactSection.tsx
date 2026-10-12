import { BUSINESS, VEHICLES } from '@/lib/site'
import { Icon } from './Icon'

// Answers restate T&L's own published information. Keys faq.0–5 are
// published; defaults may change.
export const FAQS = [
  { q: 'How do I get a price?', a: `Send your journey with the form on this page, or call ${BUSINESS.phoneDisplay}. We reply with a quote by email or phone, and nothing is booked until you accept it.` },
  { q: 'What if my flight is delayed?', a: 'Include your flight number. Flights are monitored, so your driver knows your actual arrival time and meets you in the arrivals hall.' },
  { q: 'Which car do I need?', a: `As a guide, the E-Class and S-Class seat up to ${VEHICLES[0].seats} with ${VEHICLES[0].cases} cases, the V-Class up to ${VEHICLES[2].seats}, and the Tourneo Custom up to ${VEHICLES[3].seats}. Tell us what you’re bringing and we’ll recommend the right one.` },
  { q: 'Are your drivers and cars licensed?', a: 'Our drivers and vehicles are licensed by Epping Forest District Council, and our executive vehicles are exempt from displaying standard private hire plates.' },
  { q: 'How can I pay?', a: `We accept ${BUSINESS.payments}.` },
  { q: 'When can I reach you?', a: `Our hours are Monday to Friday, 9.00am to 6.30pm. You can send a journey request with the form at any time and we’ll reply with a quote.` },
]

export function ContactSection() {
  return (
    <section id="contact" aria-labelledby="contact-title" className="on-light bg-white py-16 sm:py-20 lg:py-28">
      <div className="page-x grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <p className="label">Contact</p>
          <h2 id="contact-title" className="t-h2 mt-3 text-ink">Speak to us</h2>
          <a href={BUSINESS.phoneHref} className="mt-7 inline-flex min-h-[3rem] items-center gap-3 font-display text-[clamp(2rem,1.6rem+1.6vw,2.8rem)] leading-none text-ink tabular hover:underline">
            {BUSINESS.phoneDisplay}
          </a>
          <dl className="mt-6 grid gap-1 text-[1rem]">
            <div className="flex items-center gap-3">
              <dt><Icon name="mail" className="h-5 w-5 text-steel" /><span className="sr-only">Email</span></dt>
              <dd><a href={`mailto:${BUSINESS.email}`} className="text-link inline-flex min-h-[2.75rem] items-center text-ink [overflow-wrap:anywhere]">{BUSINESS.email}</a></dd>
            </div>
            <div className="flex min-h-[2.75rem] items-center gap-3">
              <dt><Icon name="clock" className="h-5 w-5 text-steel" /><span className="sr-only">Hours</span></dt>
              <dd className="text-ink-2">{BUSINESS.hours}</dd>
            </div>
            <div className="flex min-h-[2.75rem] items-center gap-3">
              <dt><Icon name="pin" className="h-5 w-5 text-steel" /><span className="sr-only">Based in</span></dt>
              <dd className="text-ink-2">Theydon Bois, Essex</dd>
            </div>
          </dl>
          <a href="#plan" className="btn btn-dark mt-9">
            Request a quote
            <Icon name="arrowRight" className="h-5 w-5" />
          </a>
        </div>

        <div className="lg:col-span-7">
          <p suppressHydrationWarning data-anyos="faq.eyebrow" className="label">Good to know</p>
          <h3 suppressHydrationWarning data-anyos="faq.title" className="t-h3 mt-3 text-ink">Questions, answered</h3>
          <ul className="mt-5">
            {FAQS.map((f, i) => (
              <li key={f.q} className="border-b border-line first:border-t">
                <details className="group" {...(i === 0 ? { open: true } : {})}>
                  <summary className="flex min-h-[3.75rem] cursor-pointer list-none items-center justify-between gap-6 py-4 [&::-webkit-details-marker]:hidden">
                    <span suppressHydrationWarning data-anyos={`faq.${i}.q`} className="font-display text-[1.2rem] text-ink">{f.q}</span>
                    <Icon name="plus" className="h-5 w-5 flex-none text-ink-2 transition-transform duration-300 group-open:rotate-45" />
                  </summary>
                  <p suppressHydrationWarning data-anyos={`faq.${i}.a`} className="max-w-[40rem] pb-6 pr-10 leading-relaxed text-ink-2">{f.a}</p>
                </details>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
