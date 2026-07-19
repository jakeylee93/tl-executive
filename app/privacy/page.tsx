export default function Privacy() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-20 md:py-28">
        <a href="/" className="text-sm text-black/40 hover:text-black transition mb-8 inline-block">← Back to Home</a>

        <h1 className="text-3xl md:text-4xl text-black mb-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          Privacy Policy
        </h1>
        <p className="text-sm text-black/40 mb-12">Last updated: March 2026</p>

        <div className="space-y-8 text-sm text-black/70 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-black mb-3">1. Who We Are</h2>
            <p>Theydon & Loughton Executive Cars is a private hire executive car service based in Theydon Bois, Essex. We are committed to protecting your privacy and handling your personal data responsibly.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-black mb-3">2. Information We Collect</h2>
            <p className="mb-3">When you use our services or contact us, we may collect:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Your name, email address and telephone number</li>
              <li>Pick-up and drop-off locations</li>
              <li>Travel dates and times</li>
              <li>Number of passengers</li>
              <li>Payment information (processed securely by our payment provider)</li>
              <li>Any additional requirements you share with us</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-black mb-3">3. How We Use Your Information</h2>
            <p className="mb-3">We use your personal data to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Provide and manage our executive car services</li>
              <li>Respond to your enquiries and quote requests</li>
              <li>Process payments</li>
              <li>Communicate with you about your bookings</li>
              <li>Improve our services</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-black mb-3">4. Legal Basis</h2>
            <p>We process your data on the basis of contractual necessity (to fulfil your booking), legitimate interest (to manage and improve our business), and where applicable, your consent.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-black mb-3">5. Data Sharing</h2>
            <p>We do not sell your personal data. We may share your information with payment processors to complete transactions. We will disclose information if required by law.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-black mb-3">6. Data Retention</h2>
            <p>We retain your personal data only for as long as necessary to fulfil the purposes outlined above, or as required by law. Booking records are typically retained for 6 years for accounting purposes.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-black mb-3">7. Your Rights</h2>
            <p className="mb-3">Under UK GDPR, you have the right to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Object to or restrict processing</li>
              <li>Data portability</li>
            </ul>
            <p className="mt-3">To exercise any of these rights, please contact us at <a href="mailto:simonemburns@gmail.com" className="text-black underline">simonemburns@gmail.com</a>.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-black mb-3">8. Contact</h2>
            <p>If you have questions about this policy or your personal data, please contact:</p>
            <p className="mt-2">Theydon & Loughton Executive Cars<br />Theydon Bois, Essex<br />Email: <a href="mailto:simonemburns@gmail.com" className="text-black underline">simonemburns@gmail.com</a><br />Phone: <a href="tel:+447904428896" className="text-black underline">07904 428 896</a></p>
          </section>
        </div>
      </div>
    </main>
  )
}
