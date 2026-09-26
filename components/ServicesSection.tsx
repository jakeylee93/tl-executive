import { SERVICE_GROUPS, SERVICES } from '@/lib/site'
import { Icon } from './Icon'
import { QuoteLink } from './QuoteLink'
import { SectionHeading } from './SectionHeading'
import { ServiceGroup } from './ServiceGroup'

export function ServicesSection() {
  return (
    <section id="services" aria-labelledby="services-title" className="py-16 sm:py-20 lg:py-28">
      <div className="page-x">
        <SectionHeading
          id="services-title"
          eyebrowKey="services.eyebrow" eyebrow="What we offer"
          titleKey="services.title" title="Tailored to your journey"
          introKey="services.intro" intro="The journeys we’re asked for most. If yours isn’t listed, ask: most trips can be arranged."
        />

        <div className="mt-10 grid gap-x-10 gap-y-6 lg:mt-16 lg:grid-cols-3 lg:gap-y-12">
          {SERVICE_GROUPS.map((group, gi) => (
            <div key={group.key} data-reveal style={{ ['--reveal-delay' as string]: `${gi * 90}ms` }}>
              <ServiceGroup title={group.title} titleKey={`services.group.${group.key}`} defaultOpen={gi === 0}>
              <ul className="divide-y divide-line">
                {group.items.map(idx => {
                  const s = SERVICES.find(x => x.idx === idx)!
                  return (
                    <li key={s.idx} className="group grid grid-cols-[2.75rem_1fr_auto] items-start gap-x-3 py-5">
                      <span className="mt-0.5 grid h-10 w-10 place-items-center rounded-full border border-line bg-surface text-brass transition-colors group-hover:border-brass">
                        <Icon name={s.icon} className="h-[1.3rem] w-[1.3rem]" />
                      </span>
                      <div className="min-w-0">
                        <h4 suppressHydrationWarning data-anyos={`services.${s.idx}.title`} className="font-display text-[1.28rem] font-medium leading-snug text-ink">{s.title}</h4>
                        <p suppressHydrationWarning data-anyos={`services.${s.idx}.description`} className="mt-1.5 text-[0.98rem] leading-relaxed text-ink-2">{s.description}</p>
                      </div>
                      <QuoteLink
                        prefill={{ occasion: s.title, ...(s.idx === 0 ? { flying: true } : {}) }}
                        className="-mr-1 grid h-11 w-11 place-items-center rounded-full text-ink-2 transition-colors hover:bg-ink hover:text-white"
                        ariaLabel={`Request a quote for ${s.title.toLowerCase()}`}
                      >
                        <Icon name="arrowRight" className="h-[1.15rem] w-[1.15rem]" />
                      </QuoteLink>
                    </li>
                  )
                })}
              </ul>
              </ServiceGroup>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
