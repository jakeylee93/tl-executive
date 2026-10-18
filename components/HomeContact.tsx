import { BUSINESS } from '@/lib/site'
import { FAQS } from './ContactSection'
import { Icon } from './Icon'

/** Under the quote form: how to reach Simon, and the short answers people
 *  ask for most (closed until opened). */
export function HomeContact() {
  return (
    <section id="contact" aria-labelledby="contact-title" className="on-light bg-mist py-14 sm:py-16 lg:py-20">
      <div className="page-x grid gap-10 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <h2 id="contact-title" className="t-h3 text-ink">Prefer to talk?</h2>
          <a href={BUSINESS.phoneHref} className="mt-4 inline-flex min-h-[3rem] items-center font-display text-[clamp(1.9rem,1.5rem+1.4vw,2.6rem)] leading-none text-ink tabular hover:underline">
            {BUSINESS.phoneDisplay}
          </a>
          <ul className="mt-4 grid gap-0.5 text-[1rem] text-ink-2">
            <li className="flex items-center gap-3"><Icon name="mail" className="h-5 w-5 flex-none text-steel" /><a href={`mailto:${BUSINESS.email}`} className="text-link inline-flex min-h-[2.75rem] items-center text-ink [overflow-wrap:anywhere]">{BUSINESS.email}</a></li>
            <li className="flex min-h-[2.75rem] items-center gap-3"><Icon name="clock" className="h-5 w-5 flex-none text-steel" />{BUSINESS.hours}</li>
            <li className="flex min-h-[2.75rem] items-center gap-3"><Icon name="pin" className="h-5 w-5 flex-none text-steel" />Theydon Bois, Essex</li>
          </ul>
        </div>
        <div className="lg:col-span-7">
          <p suppressHydrationWarning data-anyos="faq.eyebrow" className="label">Good to know</p>
          <h3 suppressHydrationWarning data-anyos="faq.title" className="t-h3 mt-2 text-ink">Questions, answered</h3>
          <ul className="mt-4">
            {FAQS.map((f, i) => (
              <li key={f.q} className="faq-row">
                <details className="group">
                  <summary className="flex min-h-[3.5rem] cursor-pointer list-none items-center justify-between gap-6 py-3 [&::-webkit-details-marker]:hidden">
                    <span suppressHydrationWarning data-anyos={`faq.${i}.q`} className="text-[1.05rem] font-semibold text-ink">{f.q}</span>
                    <Icon name="plus" className="h-5 w-5 flex-none text-ink-2 transition-transform duration-300 group-open:rotate-45" />
                  </summary>
                  <p suppressHydrationWarning data-anyos={`faq.${i}.a`} className="max-w-[38rem] pb-5 pr-10 leading-relaxed text-ink-2">{f.a}</p>
                </details>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
