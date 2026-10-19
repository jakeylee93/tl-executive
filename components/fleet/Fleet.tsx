import { FleetGarage } from './FleetGarage'

export function Fleet() {
  return (
    <section id="fleet" aria-labelledby="fleet-title" className="fleet on-photo relative text-white">
      <div className="fleet-head page-x">
        <p suppressHydrationWarning data-anyos="fleet.eyebrow" className="label">The fleet</p>
        <h2 id="fleet-title" suppressHydrationWarning data-anyos="fleet.title" className="t-h2 mt-2 text-white">Choose your car</h2>
        <p suppressHydrationWarning data-anyos="fleet.intro" className="fleet-intro mt-2 max-w-[24rem] leading-relaxed text-[#e4e6ea]">
          From an executive saloon to an eight-seat minibus. Not sure? We’ll recommend one.
        </p>
      </div>
      <FleetGarage />
      <p className="fleet-note page-x pb-4 pt-1 text-[0.8rem] text-[#c9ccd2]">Pictures show each model. Your car may differ in year, colour and specification.</p>
    </section>
  )
}
