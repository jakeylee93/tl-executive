import type { Metadata } from 'next'
import { AirportsSection } from '@/components/AirportsSection'
import { FAQS } from '@/components/FaqSection'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { Icon } from '@/components/Icon'
import { MobileActionBar } from '@/components/MobileActionBar'
import { QuoteLink } from '@/components/QuoteLink'
import { QuoteSection } from '@/components/QuoteSection'
import { RevealObserver } from '@/components/RevealObserver'
import { breadcrumbSchema, JsonLd, localBusinessSchema } from '@/lib/schema'
import { BUSINESS, VEHICLES, slug } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Airport Transfers from Theydon Bois, Loughton & Epping',
  description:
    'Executive airport transfers from Theydon Bois, Loughton, Epping and nearby to Heathrow, Gatwick, Stansted, Luton, London City and Southend. Flights monitored, meet and greet on arrival. Call 07904 428896.',
  alternates: { canonical: '/airport-transfers' },
  openGraph: { url: '/airport-transfers', title: 'Airport transfers from Theydon Bois | T&L Executive Cars' },
}

const CHECKLIST = [
  { title: 'Your flight number', text: 'For arrivals, so your driver knows when you actually land. Add the terminal if you know it.' },
  { title: 'A pick-up time', text: 'For departures, the time you’d like to leave. We aim to be at your door ten minutes before.' },
  { title: 'Who and what is travelling', text: 'Passengers and suitcases, plus anything bulky: golf bags, skis or a pushchair.' },
  { title: 'Anything you need', text: 'Child seats, accessibility needs or a hand to the check-in desk. Ask and we’ll confirm.' },
  { title: 'Your return', text: 'If you’d like collecting when you fly home, add the return date and flight.' },
]

const AIRPORT_FAQS = FAQS.filter(f => /flight|vehicle|pay|price/i.test(f.q))

export default function AirportTransfersPage() {
  return (
    <>
      <JsonLd data={localBusinessSchema()} />
      <JsonLd data={breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Airport transfers', path: '/airport-transfers' }])} />
      <Header />
      <main id="main" tabIndex={-1} className="focus:outline-none">
        <div id="top">
          <nav aria-label="Breadcrumb" className="page-x pb-6 pt-6">
            <ol className="flex items-center gap-2 text-[0.9rem] text-muted">
              <li><a href="/" className="text-link font-medium text-ink-2">Home</a></li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="text-ink">Airport transfers</li>
            </ol>
          </nav>
          <AirportsSection
            headingLevel="h1"
            actions={
              <div className="flex flex-col gap-3 xs:flex-row">
                <QuoteLink prefill={{ occasion: 'Airport transfers', flying: true }} className="btn btn-primary">
                  Get an airport quote
                  <Icon name="arrowRight" className="h-5 w-5" />
                </QuoteLink>
                <a href={BUSINESS.phoneHref} className="btn btn-secondary tabular">
                  <Icon name="phone" className="h-[1.1rem] w-[1.1rem]" />
                  Call {BUSINESS.phoneDisplay}
                </a>
              </div>
            }
          />
        </div>

        <section aria-labelledby="checklist-title" className="py-16 sm:py-20 lg:py-24">
          <div className="page-x grid gap-10 lg:grid-cols-12 lg:gap-14">
            <div className="lg:col-span-4" data-reveal>
              <p className="eyebrow">Before you enquire</p>
              <h2 id="checklist-title" suppressHydrationWarning data-anyos="airportsPage.checklistTitle" className="t-h2 mt-4 text-ink">What to tell us</h2>
              <p className="mt-5 text-ink-2">The form asks for all of this, and you can add anything else in the notes.</p>
            </div>
            <ol className="grid gap-px overflow-hidden rounded-xl border border-line bg-line lg:col-span-8">
              {CHECKLIST.map((c, i) => (
                <li key={c.title} className="grid grid-cols-[2.25rem_1fr] gap-4 bg-surface p-5 sm:p-6" data-reveal style={{ ['--reveal-delay' as string]: `${i * 60}ms` }}>
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-stone text-brass"><Icon name="check" className="h-5 w-5" strokeWidth={2} /></span>
                  <div>
                    <h3 suppressHydrationWarning data-anyos={`airportsPage.check.${i}.title`} className="font-semibold text-ink">{c.title}</h3>
                    <p suppressHydrationWarning data-anyos={`airportsPage.check.${i}.text`} className="mt-1 text-[0.98rem] leading-relaxed text-ink-2">{c.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section aria-labelledby="luggage-title" className="border-y border-line bg-stone py-16 sm:py-20 lg:py-24">
          <div className="page-x">
            <div className="max-w-[44rem]" data-reveal>
              <p className="eyebrow">Luggage guide</p>
              <h2 id="luggage-title" suppressHydrationWarning data-anyos="airportsPage.luggageTitle" className="t-h2 mt-4 text-ink">Room for everyone, and the cases</h2>
              <p className="t-lead mt-5 text-ink-2">A guide to each vehicle. Tell us what you’re bringing and we’ll recommend the right car with your quote.</p>
            </div>
            <div className="mt-10 overflow-hidden rounded-xl border border-line bg-surface" data-reveal>
              <table className="w-full text-left">
                <caption className="sr-only">Passenger and luggage capacity by vehicle</caption>
                <thead className="border-b border-line bg-paper text-[0.8125rem] uppercase tracking-[0.1em] text-muted">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold sm:px-6">Vehicle</th>
                    <th scope="col" className="px-4 py-3 font-semibold sm:px-6">Passengers</th>
                    <th scope="col" className="px-4 py-3 font-semibold sm:px-6">Suitcases</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {VEHICLES.map(v => (
                    <tr key={v.name}>
                      <th scope="row" className="px-4 py-4 font-display text-[1.15rem] font-medium text-ink sm:px-6">
                        <span suppressHydrationWarning data-anyos={`fleet.${slug(v.name)}.name`}>{v.name}</span>
                      </th>
                      <td className="px-4 py-4 text-ink tabular sm:px-6">Up to {v.seats}</td>
                      <td className="px-4 py-4 text-ink tabular sm:px-6">Up to {v.cases}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-[0.9rem] text-muted">Cruise holiday? Transfers to Southampton, Dover, Tilbury, Harwich and other ports are quoted the same way.</p>
          </div>
        </section>

        <section aria-labelledby="airport-faq-title" className="py-16 sm:py-20 lg:py-24">
          <div className="page-x grid gap-10 lg:grid-cols-12 lg:gap-14">
            <div className="lg:col-span-4" data-reveal>
              <p className="eyebrow">Good to know</p>
              <h2 id="airport-faq-title" className="t-h2 mt-4 text-ink">Airport questions</h2>
            </div>
            <dl className="border-t border-ink lg:col-span-8">
              {AIRPORT_FAQS.map(f => (
                <div key={f.q} className="border-b border-line py-5" data-reveal>
                  <dt className="font-display text-[1.22rem] font-medium text-ink">{f.q}</dt>
                  <dd className="mt-2 max-w-[40rem] text-[1.02rem] leading-relaxed text-ink-2">{f.a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <QuoteSection />
      </main>
      <Footer />
      <MobileActionBar />
      <RevealObserver />
    </>
  )
}
