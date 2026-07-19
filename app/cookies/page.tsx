export default function Cookies() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-20 md:py-28">
        <a href="/" className="text-sm text-black/40 hover:text-black transition mb-8 inline-block">← Back to Home</a>

        <h1 className="text-3xl md:text-4xl text-black mb-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          Cookies Policy
        </h1>
        <p className="text-sm text-black/40 mb-12">Last updated: March 2026</p>

        <div className="space-y-8 text-sm text-black/70 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-black mb-3">1. What Are Cookies</h2>
            <p>Cookies are small text files that are stored on your device when you visit a website. They help websites function properly and provide information to the site owner.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-black mb-3">2. How We Use Cookies</h2>
            <p className="mb-3">Our website uses minimal cookies. We may use:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Essential cookies:</strong> Required for the website to function properly. These cannot be disabled.</li>
              <li><strong>Analytics cookies:</strong> Help us understand how visitors use our website so we can improve it. These are anonymised and do not personally identify you.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-black mb-3">3. Third-Party Cookies</h2>
            <p>We do not use advertising cookies or sell data to third parties. If we use analytics services (such as Google Analytics), these may set their own cookies. These services have their own privacy policies.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-black mb-3">4. Managing Cookies</h2>
            <p>You can control and delete cookies through your browser settings. Most browsers allow you to:</p>
            <ul className="list-disc pl-5 space-y-1 mt-3">
              <li>See what cookies are stored and delete them individually</li>
              <li>Block third-party cookies</li>
              <li>Block all cookies</li>
              <li>Delete all cookies when you close your browser</li>
            </ul>
            <p className="mt-3">Please note that blocking all cookies may affect the functionality of this and other websites.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-black mb-3">5. Changes to This Policy</h2>
            <p>We may update this cookies policy from time to time. Any changes will be posted on this page with an updated revision date.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-black mb-3">6. Contact</h2>
            <p>If you have questions about our use of cookies, please contact:</p>
            <p className="mt-2">Theydon & Loughton Executive Cars<br />Email: <a href="mailto:simonemburns@gmail.com" className="text-black underline">simonemburns@gmail.com</a><br />Phone: <a href="tel:+447904428896" className="text-black underline">07904 428 896</a></p>
          </section>
        </div>
      </div>
    </main>
  )
}
