import type { Metadata } from 'next'
import { AirportsChapter } from '@/components/AirportsChapter'
import { ContactSection } from '@/components/ContactSection'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { Icon } from '@/components/Icon'
import { MobileActionBar } from '@/components/MobileActionBar'
import { PlanSection } from '@/components/PlanSection'
import { breadcrumbSchema, JsonLd, localBusinessSchema } from '@/lib/schema'
import { VEHICLES, plateSrcSet } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Airport Transfers from Theydon Bois, Loughton & Epping',
  description:
    'Executive airport transfers from Theydon Bois, Loughton, Epping and nearby to Heathrow, Gatwick, Stansted, Luton, London City and Southend. Flights monitored, met in arrivals. Call 07904 428896.',
  alternates: { canonical: '/airport-transfers' },
  openGraph: { url: '/airport-transfers', title: 'Airport transfers from Theydon Bois | T&L Executive Cars' },
}

const CHECKLIST = [
  { title: 'Your flight number', text: 'For arrivals, so your driver knows when you actually land. Add the terminal if you know it.' },
  { title: 'A pick-up time', text: 'For departures, the time you’d like to leave. We aim to be at your door ten minutes before.' },
  { title: 'Who and what is travelling', text: 'Passengers and suitcases, plus anything bulky such as golf bags or a pushchair.' },
  { title: 'Anything you need', text: 'Child seats, accessibility needs or a hand to the check-in desk. Ask and we’ll confirm.' },
]

export default function AirportTransfersPage() {
  return (
    <>
      <JsonLd data={localBusinessSchema()} />
      <JsonLd data={breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Airport transfers', path: '/airport-transfers' }])} />
      <Header overPhoto={false} />
      <main id="main" tabIndex={-1} className="pt-[var(--tl-header-h)] focus:outline-none">
        <nav aria-label="Breadcrumb" className="page-x pt-6">
          <ol className="flex items-center gap-2 text-[0.9rem] text-steel">
            <li><a href="/" className="text-link text-ink-2">Home</a></li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-ink">Airport transfers</li>
          </ol>
        </nav>

        <div className="page-x mt-6">
          <div data-hero className="relative overflow-hidden rounded-[2rem]">
            <img src="/media/airport-1600.webp" srcSet={plateSrcSet('airport')} sizes="(min-width: 1248px) 1200px, 100vw" alt="London Heathrow Terminal 5" width={1600} height={900} fetchPriority="high" className="aspect-[16/9] w-full object-cover sm:aspect-[21/9]" />
          </div>
        </div>

        <AirportsChapter headingLevel="h1" />

        <section aria-labelledby="checklist-title" className="on-light bg-white py-16 sm:py-20">
          <div className="page-x grid gap-10 lg:grid-cols-12 lg:gap-14">
            <div className="lg:col-span-4">
              <p className="label">Before you enquire</p>
              <h2 id="checklist-title" className="t-h2 mt-3 text-ink">What to tell us</h2>
            </div>
            <ul className="grid gap-6 sm:grid-cols-2 lg:col-span-8">
              {CHECKLIST.map(c => (
                <li key={c.title} className="flex gap-3">
                  <Icon name="check" className="mt-0.5 h-5 w-5 flex-none text-ink" strokeWidth={2} />
                  <div>
                    <h3 className="font-semibold text-ink">{c.title}</h3>
                    <p className="mt-1 leading-relaxed text-ink-2">{c.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="page-x mt-12">
            <table className="w-full text-left">
              <caption className="label pb-3 text-left">Passengers and luggage by vehicle</caption>
              <thead className="text-[0.85rem] text-steel">
                <tr><th scope="col" className="py-2 font-semibold">Vehicle</th><th scope="col" className="py-2 font-semibold">Passengers</th><th scope="col" className="py-2 font-semibold">Suitcases</th></tr>
              </thead>
              <tbody>
                {VEHICLES.map(v => (
                  <tr key={v.name} className="border-t border-line">
                    <th scope="row" className="py-3 font-display text-[1.1rem] font-normal text-ink">{v.display}</th>
                    <td className="py-3 text-ink tabular">Up to {v.seats}</td>
                    <td className="py-3 text-ink tabular">Up to {v.cases}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <PlanSection />
        <ContactSection />
      </main>
      <Footer />
      <MobileActionBar />
    </>
  )
}
