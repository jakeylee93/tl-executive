import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { BUSINESS } from '@/lib/site'

export default function NotFound() {
  return (
    <>
      <Header />
      <main id="main" className="page-x py-20 sm:py-28">
        <p className="eyebrow">Page not found</p>
        <h1 className="t-h2 mt-4 max-w-[32rem] text-ink">That page has taken a different route.</h1>
        <p className="t-lead mt-5 max-w-[36rem] text-ink-2">Try the home page, or call {BUSINESS.phoneDisplay} and we’ll help.</p>
        <div className="mt-8 flex flex-col gap-3 xs:flex-row">
          <a href="/" className="btn btn-primary">Go to the home page</a>
          <a href="/#quote" className="btn btn-secondary">Get a quote</a>
        </div>
      </main>
      <Footer />
    </>
  )
}
