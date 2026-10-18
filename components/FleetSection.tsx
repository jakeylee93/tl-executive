import { FleetSelector } from './FleetSelector'

export function FleetSection() {
  return (
    <section id="fleet" aria-labelledby="fleet-title" className="on-light bg-white py-16 sm:py-20 lg:py-28">
      <div className="page-x">
        <div className="mx-auto max-w-[40rem] text-center">
          <p suppressHydrationWarning data-anyos="fleet.eyebrow" className="label">The fleet</p>
          <h2 id="fleet-title" suppressHydrationWarning data-anyos="fleet.title" className="t-h2 mt-3 text-ink">Choose your car</h2>
          <p suppressHydrationWarning data-anyos="fleet.intro" className="t-lead mt-4 text-ink-2">
            From an executive saloon to an eight-seat minibus. Not sure which suits? We’ll recommend one with your quote.
          </p>
        </div>
      </div>
      <div className="mt-10">
        <FleetSelector />
      </div>
    </section>
  )
}
