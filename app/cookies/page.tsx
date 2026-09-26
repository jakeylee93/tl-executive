import type { Metadata } from 'next'
import { LegalPage } from '@/components/LegalPage'
import { BUSINESS } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Cookies',
  description: 'This website does not use cookies, analytics or advertising trackers.',
  alternates: { canonical: '/cookies' },
}

// Verified 26 Sep 2026: no Set-Cookie from the site or from the anyOS content
// API; fonts are self-hosted; edit.js touches sessionStorage only in the
// owner's edit mode. Update this page before adding any analytics.
export default function Cookies() {
  return (
    <LegalPage title="Cookies" updated="September 2026">
      <section>
        <h2>No cookies, no tracking</h2>
        <p>
          This website does not set cookies. It does not use analytics, advertising or social-media trackers, so there is nothing to
          accept or decline.
        </p>
      </section>

      <section>
        <h2>What the site does load</h2>
        <ul>
          <li>The pages, fonts and images come from our own website, hosted by Vercel.</li>
          <li>
            A small script from our website provider, anyOS, fetches the latest wording and photos we have published, so we can keep the
            site up to date. It does not set cookies or record what you do.
          </li>
          <li>
            When we are editing the site ourselves, the editor keeps a sign-in token in the browser’s session storage for that tab
            only. Visitors never receive one.
          </li>
        </ul>
      </section>

      <section>
        <h2>If this changes</h2>
        <p>
          If we ever add analytics or anything else that uses cookies, we will update this page first and ask for your consent where the
          law requires it.
        </p>
      </section>

      <section>
        <h2>Questions</h2>
        <p>
          Email <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a> or call <a href={BUSINESS.phoneHref}>{BUSINESS.phoneDisplay}</a>.
        </p>
      </section>
    </LegalPage>
  )
}
