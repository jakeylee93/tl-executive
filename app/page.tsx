import { Arrival } from '@/components/arrival/Arrival'
import { Fleet } from '@/components/fleet/Fleet'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { HomeContact } from '@/components/HomeContact'
import { Journeys } from '@/components/Journeys'
import { PlanSection } from '@/components/PlanSection'
import { Trust } from '@/components/Trust'
import { JsonLd, localBusinessSchema } from '@/lib/schema'

// Five chapters: the arrival (one journey, three moving scenes) → journeys →
// the fleet studio → trust → the quote (with contact and short answers).
// Photographic chapters alternate with light ones (DESIGN.md, MOTION.md).
export default function Home() {
  return (
    <>
      <JsonLd data={localBusinessSchema()} />
      <Header />
      <main id="main" tabIndex={-1} className="focus:outline-none">
        <Arrival />
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
