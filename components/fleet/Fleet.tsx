import { FleetGarage } from './FleetGarage'

export function Fleet() {
  return (
    <section id="fleet" aria-labelledby="fleet-title" className="fleet on-light relative bg-[#d8d0ca]">
      <div className="fleet-head page-x">
        <p suppressHydrationWarning data-anyos="fleet.eyebrow" className="label text-[#5b5650]">The fleet</p>
        <h2 id="fleet-title" suppressHydrationWarning data-anyos="fleet.title" className="t-h2 mt-3 text-ink">Choose your car</h2>
        <p suppressHydrationWarning data-anyos="fleet.intro" className="mt-3 max-w-[26rem] leading-relaxed text-ink-2">
          From an executive saloon to an eight-seat minibus. Not sure? We’ll recommend one.
        </p>
      </div>
      <FleetGarage />
      <p className="fleet-note page-x pb-6 pt-1 text-[0.86rem] text-[#5b5650]">Pictures show each model. Your car may differ in year, colour and specification.</p>
    </section>
  )
}
