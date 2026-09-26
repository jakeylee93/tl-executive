import { AREAS } from '@/lib/site'
import { Icon } from './Icon'
import { LocalMap } from './Maps'

export function CoverageSection() {
  return (
    <section id="areas" aria-labelledby="areas-title" className="py-16 sm:py-20 lg:py-28">
      <div className="page-x grid items-center gap-10 lg:grid-cols-12 lg:gap-14">
        <div className="lg:col-span-5" data-reveal>
          <p className="eyebrow">Coverage</p>
          <h2 id="areas-title" suppressHydrationWarning data-anyos="areas.title" className="t-h2 mt-4 text-ink">Areas we cover</h2>
          <p suppressHydrationWarning data-anyos="areas.intro" className="t-lead mt-5 text-ink-2">
            Collections across Theydon Bois and the towns and villages around Epping Forest, and journeys on to London, every London airport and beyond.
          </p>
          <ul className="mt-8 grid grid-cols-2 gap-x-6 border-t border-line text-[1.02rem]">
            {AREAS.map(a => (
              <li key={a.name} className="flex min-h-[3rem] items-center gap-2.5 border-b border-line text-ink">
                <Icon name="pin" className="h-4 w-4 flex-none text-brass" />
                {a.name}
              </li>
            ))}
          </ul>
          <p className="mt-5 text-[0.95rem] text-muted">Somewhere else? Ask. Longer journeys are quoted individually.</p>
        </div>
        <figure className="on-forest overflow-hidden rounded-xl bg-forest lg:col-span-7" data-reveal style={{ ['--reveal-delay' as string]: '120ms' }}>
          <LocalMap className="h-auto w-full" />
          <figcaption className="border-t border-forest-2 px-5 py-3 text-[0.875rem] text-on-forest-muted">Local pick-up areas either side of Epping Forest, drawn to scale.</figcaption>
        </figure>
      </div>
    </section>
  )
}
