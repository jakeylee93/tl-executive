import { AirportsChapter } from '@/components/AirportsChapter'
import { ContactSection } from '@/components/ContactSection'
import { FleetSection } from '@/components/FleetSection'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { Hero } from '@/components/Hero'
import { MobileActionBar } from '@/components/MobileActionBar'
import { PlanSection } from '@/components/PlanSection'
import { ServicesChapter } from '@/components/ServicesChapter'
import { StoryChapter } from '@/components/StoryChapter'
import { JsonLd, localBusinessSchema } from '@/lib/schema'

// Chapters: opening scene → plan your journey → fleet → services → airports
// & areas → story & trust → contact. Photographic chapters alternate with
// white ones (see DESIGN.md).
export default function Home() {
  return (
    <>
      <JsonLd data={localBusinessSchema()} />
      <Header />
      <main id="main" tabIndex={-1} className="focus:outline-none">
        <Hero />
        <PlanSection />
        <FleetSection />
        <ServicesChapter />
        <AirportsChapter />
        <StoryChapter />
        <ContactSection />
      </main>
      <Footer />
      <MobileActionBar />
    </>
  )
}
