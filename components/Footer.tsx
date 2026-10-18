import { BUSINESS, NAV, TAGLINE } from '@/lib/site'

export function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer id="site-footer" className="on-dark bg-[#121315] pb-12 pt-16 text-on-dark lg:pt-20">
      <div className="page-x">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="flex items-center gap-5 lg:col-span-6">
            <img src="/brand/tl-badge.svg" alt="" width={84} height={79} loading="lazy" className="h-20 w-auto flex-none" />
            <div>
              <p suppressHydrationWarning data-anyos="footer.title" translate="no" className="font-display text-[1.45rem] leading-tight text-white">Theydon &amp; Loughton Executive Cars</p>
              <p suppressHydrationWarning data-anyos="footer.strapline" className="mt-1 text-[0.78rem] font-semibold uppercase tracking-[0.16em] text-on-dark-muted">Theydon Bois · Est. 2008</p>
              <p className="mt-3 font-display text-[1.1rem] italic text-on-dark-muted">{TAGLINE}.</p>
            </div>
          </div>
          <div className="grid gap-10 sm:grid-cols-3 lg:col-span-6">
            <div>
              <h2 className="label text-[0.72rem]">Contact</h2>
              <ul className="mt-4 space-y-1 text-[0.98rem]">
                <li><a href={BUSINESS.phoneHref} className="inline-flex min-h-[2.75rem] items-center tabular hover:text-white">{BUSINESS.phoneDisplay}</a></li>
                <li><a href={`mailto:${BUSINESS.email}`} className="inline-flex min-h-[2.75rem] items-center [overflow-wrap:anywhere] hover:text-white">{BUSINESS.email}</a></li>
                <li className="flex min-h-[2.75rem] items-center"><span suppressHydrationWarning data-anyos="footer.location">Theydon Bois, Essex</span></li>
              </ul>
            </div>
            <div>
              <h2 className="label text-[0.72rem]">Explore</h2>
              <ul className="mt-4 space-y-1 text-[0.98rem]">
                <li><a href="/#plan" className="inline-flex min-h-[2.75rem] items-center hover:text-white">Request a quote</a></li>
                {NAV.map(n => <li key={n.href}><a href={n.href} className="inline-flex min-h-[2.75rem] min-w-[2.75rem] items-center hover:text-white">{n.label}</a></li>)}
                <li><a href="/airport-transfers" className="inline-flex min-h-[2.75rem] items-center hover:text-white">Airport transfers</a></li>
              </ul>
            </div>
            <div>
              <h2 className="label text-[0.72rem]">Legal</h2>
              <ul className="mt-4 space-y-1 text-[0.98rem]">
                <li><a href="/privacy" className="inline-flex min-h-[2.75rem] items-center hover:text-white">Privacy</a></li>
                <li><a href="/cookies" className="inline-flex min-h-[2.75rem] items-center hover:text-white">Cookies</a></li>
                <li><a href="/credits" className="inline-flex min-h-[2.75rem] items-center hover:text-white">Photo credits</a></li>
              </ul>
            </div>
          </div>
        </div>
        <p className="mt-14 border-t border-charcoal-2 pt-6 text-[0.875rem] text-on-dark-muted">© {year} Theydon &amp; Loughton Executive Cars</p>
      </div>
    </footer>
  )
}
