import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { BUSINESS } from '@/lib/site'

export default function NotFound() {
  return (
    <>
      <Header overPhoto={false} />
      <main id="main" className="page-x pb-20 pt-[calc(var(--tl-header-h)+5rem)] sm:pb-28">
        <p className="label">Page not found</p>
        <h1 className="t-h2 mt-4 max-w-[32rem] text-ink">That page has taken a different route.</h1>
        <p className="t-lead mt-5 max-w-[36rem] text-ink-2">Try the home page, or call {BUSINESS.phoneDisplay} and we’ll help.</p>
        <div className="mt-8 flex flex-col gap-3 xs:flex-row">
          <a href="/" className="btn btn-dark">Go to the home page</a>
          <a href="/#plan" className="btn btn-ghost">Request a quote</a>
        </div>
      </main>
      <Footer />
    </>
  )
}
