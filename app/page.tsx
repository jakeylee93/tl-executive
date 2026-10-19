import { Journey } from '@/components/film/Journey'
import { Fleet } from '@/components/fleet/Fleet'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { HomeContact } from '@/components/HomeContact'
import { Journeys } from '@/components/Journeys'
import { PlanSection } from '@/components/PlanSection'
import { Trust } from '@/components/Trust'
import { JsonLd, localBusinessSchema } from '@/lib/schema'

// Five chapters: the journey (three continuous shots, each a full screen) →
// journeys → the fleet on the road → trust → the quote (contact, answers).
// See DESIGN.md and FILM.md.
export default function Home() {
  return (
    <>
      <JsonLd data={localBusinessSchema()} />
      <Header />
      <main id="main" tabIndex={-1} className="focus:outline-none">
        <Journey />
        <Journeys />
        <Fleet />
        <Trust />
        <PlanSection />
        <HomeContact />
      </main>
      <Footer />
    </>
  )
}
