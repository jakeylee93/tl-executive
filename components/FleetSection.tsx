import { VEHICLES, slug } from '@/lib/site'
import { Icon } from './Icon'
import { QuoteLink } from './QuoteLink'
import { SectionHeading } from './SectionHeading'

// Each image carries data-anyos-img so the owner can replace it from anyOS.
// Nothing overlays the <img>, because edit.js only opens its picker when the
// click lands on the image itself.
export function FleetSection() {
  return (
    <section id="fleet" aria-labelledby="fleet-title" className="py-16 sm:py-20 lg:py-28">
      <div className="page-x">
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
          <SectionHeading
            className="lg:col-span-8"
            id="fleet-title"
            eyebrowKey="fleet.eyebrow" eyebrow="The cars"
            titleKey="fleet.title" title="Four vehicles, one to eight passengers"
            introKey="fleet.intro" intro="From a saloon for a business trip to a minibus for the whole party. Not sure which suits? Leave it to us and we’ll recommend one with your quote."
          />
          <p className="text-[0.9rem] leading-relaxed text-muted lg:col-span-4 lg:pb-1 lg:text-right" data-reveal>
            Photos show each model. Your car is confirmed with your quote.
          </p>
        </div>

        <p className="mt-8 flex items-center gap-2 text-[0.9rem] text-muted sm:hidden" aria-hidden="true">
          <Icon name="arrowRight" className="h-4 w-4" />Swipe to see all four
        </p>
        <ul
          className="-mx-5 mt-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-5 px-5 pb-4 [scrollbar-width:thin] sm:mx-0 sm:mt-12 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 sm:pb-0 lg:mt-14 xl:grid-cols-4"
          aria-label="Vehicles"
        >
          {VEHICLES.map((v, i) => {
            const key = slug(v.name)
            return (
              <li key={v.name} className="card flex w-[82%] flex-none snap-start flex-col overflow-hidden sm:w-auto" data-reveal style={{ ['--reveal-delay' as string]: `${i * 80}ms` }}>
                <div className="relative bg-[#eef0ef]">
                  <img
                    data-anyos-img={`fleet.${key}.image`}
                    src={v.image}
                    alt={v.alt}
                    width={600}
                    height={320}
                    loading="lazy"
                    decoding="async"
                    className="aspect-[15/8] w-full object-cover mix-blend-multiply"
                  />
                </div>
                <div className="flex flex-1 flex-col p-5 sm:p-6">
                  <h3 suppressHydrationWarning data-anyos={`fleet.${key}.name`} className="t-h3 text-ink">{v.name}</h3>
                  <ul className="mt-3 flex flex-wrap gap-1.5 text-[0.86rem] font-medium text-ink" aria-label="Capacity">
                    <li className="inline-flex items-center gap-1.5 rounded-full bg-stone px-2.5 py-1">
                      <Icon name="users" className="h-4 w-4 text-ink-2" />
                      <span suppressHydrationWarning data-anyos={`fleet.${key}.passengers`}>{v.passengersLabel}</span>
                    </li>
                    <li className="inline-flex items-center gap-1.5 rounded-full bg-stone px-2.5 py-1">
                      <Icon name="suitcase" className="h-4 w-4 text-ink-2" />
                      <span suppressHydrationWarning data-anyos={`fleet.${key}.bags`}>{v.bagsLabel}</span>
                    </li>
                  </ul>
                  <p suppressHydrationWarning data-anyos={`fleet.${key}.description`} className="mt-4 flex-1 text-[0.98rem] leading-relaxed text-ink-2">{v.description}</p>
                  <QuoteLink
                    prefill={{ vehicle: v.name }}
                    className="btn btn-secondary mt-5 min-h-[3rem] w-full"
                    ariaLabel={`Request a quote for the ${v.name}`}
                  >
                    Request this car
                  </QuoteLink>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
