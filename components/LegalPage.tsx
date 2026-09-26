import type { ReactNode } from 'react'
import { Footer } from './Footer'
import { Header } from './Header'

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <>
      <Header />
      <main id="main" tabIndex={-1} className="focus:outline-none">
        <article className="page-x py-12 sm:py-16 lg:py-20">
          <div className="mx-auto max-w-[42rem]">
            <a href="/" className="text-link text-[0.95rem] text-ink-2">← Back to home</a>
            <h1 className="t-h2 mt-8 text-ink">{title}</h1>
            <p className="mt-3 text-[0.95rem] text-muted">Last updated {updated}</p>
            <div className="legal mt-10 space-y-8 text-[1.02rem] leading-relaxed text-ink-2 [&_a]:font-semibold [&_a]:text-ink [&_a]:underline [&_a]:underline-offset-4 [&_h2]:mb-3 [&_h2]:font-display [&_h2]:text-[1.45rem] [&_h2]:font-medium [&_h2]:text-ink [&_li]:mt-1.5 [&_ul]:list-disc [&_ul]:pl-5">
              {children}
            </div>
          </div>
        </article>
      </main>
      <Footer />
    </>
  )
}
