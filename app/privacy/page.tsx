import type { Metadata } from 'next'
import { LegalPage } from '@/components/LegalPage'
import { BUSINESS } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Privacy notice',
  description: 'How Theydon & Loughton Executive Cars uses the details you give us when you ask for a quote or book a journey.',
  alternates: { canonical: '/privacy' },
}

// Describes what this website actually does (see AUDIT.md). Business
// practices beyond the website (retention, payment handling) should be
// confirmed by the owner — listed in HANDOFF.md.
export default function Privacy() {
  return (
    <LegalPage title="Privacy notice" updated="September 2026">
      <section>
        <h2>Who we are</h2>
        <p>
          {BUSINESS.name} is an executive car service based in {BUSINESS.locality}, Essex, run by {BUSINESS.founder}. We are the
          data controller for the personal details you give us. Contact us about anything in this notice at{' '}
          <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a> or on <a href={BUSINESS.phoneHref}>{BUSINESS.phoneDisplay}</a>.
        </p>
      </section>

      <section>
        <h2>What we collect</h2>
        <p>When you ask for a quote on this website, or contact us by phone or email, we collect:</p>
        <ul>
          <li>your name, email address and phone number;</li>
          <li>journey details: pick-up and destination, dates and times, number of passengers and suitcases, and flight numbers if you give them;</li>
          <li>anything else you choose to tell us, such as a preferred vehicle or accessibility needs.</li>
        </ul>
        <p>Please only give us details about other passengers that are needed for the journey.</p>
      </section>

      <section>
        <h2>How we use it</h2>
        <ul>
          <li>to reply to your enquiry and send you a quote (steps you ask us to take before a contract);</li>
          <li>to arrange, carry out and invoice the journeys you book (performing our contract with you);</li>
          <li>to keep the records the law requires, for example for tax (legal obligation).</li>
        </ul>
        <p>We do not sell your details, and we do not use them for marketing.</p>
      </section>

      <section>
        <h2>Who handles it for us</h2>
        <p>
          Enquiries sent through this website go straight into the booking system we use to manage quotes and bookings, provided by
          anyOS. The website is hosted by Vercel. Both act only on our instructions. We may also share information where the law
          requires it.
        </p>
      </section>

      <section>
        <h2>How long we keep it</h2>
        <p>
          We keep enquiry details for as long as we need them to reply and follow up. Booking and invoice records are kept for as long
          as the law requires for accounting and tax, normally six years.
        </p>
      </section>

      <section>
        <h2>Your rights</h2>
        <p>
          You can ask for a copy of the personal information we hold about you, and ask us to correct it, delete it or stop using it.
          Contact us using the details above. If you are unhappy with how we have handled your information, you can complain to the
          Information Commissioner’s Office at <a href="https://ico.org.uk/make-a-complaint/">ico.org.uk</a>.
        </p>
      </section>

      <section>
        <h2>Cookies</h2>
        <p>This website does not use cookies or tracking. See the <a href="/cookies">cookies page</a> for details.</p>
      </section>
    </LegalPage>
  )
}
