import type { ReactNode } from 'react'
import { AnyVendorContent } from '@/components/AnyVendorContent'
import { Journey } from '@/components/film/Journey'
import { Fleet } from '@/components/fleet/Fleet'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { HomeContact } from '@/components/HomeContact'
import { Journeys } from '@/components/Journeys'
import { PlanSection } from '@/components/PlanSection'
import { Trust } from '@/components/Trust'
import type { Chapter, SiteOverrides } from '@/lib/anyvendor/site'
import { JsonLd, localBusinessSchema } from '@/lib/schema'

// Five chapters: the journey (continuous shots, each a full screen) →
// journeys → the fleet on the road → trust → the quote (contact, answers).
// See DESIGN.md and FILM.md. The chapters after the opening film render in
// the order, and with the visibility, that the site content gives
// (integrations/anyvendor: page.chapters); built-in content is the order below.
const CHAPTER: Record<Chapter, () => ReactNode> = {
  journeys: () => <Journeys />,
  fleet: () => <Fleet />,
  trust: () => <Trust />,
  plan: () => <PlanSection />,
  contact: () => <HomeContact />,
}

export function HomePage({ site, editorOrigins }: { site: SiteOverrides; editorOrigins?: string[] }) {
  return (
    <>
      <JsonLd data={localBusinessSchema()} />
      <Header />
      <main id="main" tabIndex={-1} className="focus:outline-none">
        <Journey />
        {site.chapters.map(key => (
          <div key={key} data-av-chapter={key} className="contents">{CHAPTER[key]()}</div>
        ))}
      </main>
      <Footer />
      <AnyVendorContent site={site} editorOrigins={editorOrigins} />
    </>
  )
}
