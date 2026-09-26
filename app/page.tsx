import { AboutSection } from '@/components/AboutSection'
import { AirportsSection } from '@/components/AirportsSection'
import { CoverageSection } from '@/components/CoverageSection'
import { FaqSection } from '@/components/FaqSection'
import { FleetSection } from '@/components/FleetSection'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { Hero } from '@/components/Hero'
import { MobileActionBar } from '@/components/MobileActionBar'
import { ProofSection } from '@/components/ProofSection'
import { QuoteSection } from '@/components/QuoteSection'
import { RevealObserver } from '@/components/RevealObserver'
import { ServicesSection } from '@/components/ServicesSection'
import { JsonLd, localBusinessSchema } from '@/lib/schema'

export default function Home() {
  return (
    <>
      <JsonLd data={localBusinessSchema()} />
      <Header />
      <main id="main" tabIndex={-1} className="focus:outline-none">
        <Hero />
        <ServicesSection />
        <AirportsSection />
        <FleetSection />
        <AboutSection />
        <ProofSection />
        <CoverageSection />
        <FaqSection />
        <QuoteSection />
      </main>
      <Footer />
      <MobileActionBar />
      <RevealObserver />
    </>
  )
}
