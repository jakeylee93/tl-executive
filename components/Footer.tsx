import { BUSINESS, NAV, TAGLINE } from '@/lib/site'
import { Icon } from './Icon'

export function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer id="site-footer" className="on-forest bg-[#161f1a] pb-12 pt-16 text-on-forest lg:pt-20">
      <div className="page-x">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <div className="flex items-center gap-4">
              <picture className="flex-none">
                <source srcSet="/brand/tl-badge-96.webp 1x, /brand/tl-badge-192.webp 2x" type="image/webp" />
                <img src="/brand/tl-badge-96.png" alt="" width={56} height={56} loading="lazy" className="h-14 w-14" />
              </picture>
              <div>
                <p suppressHydrationWarning data-anyos="footer.title" translate="no" className="font-display text-[1.45rem] leading-tight text-on-forest">Theydon &amp; Loughton Executive Cars</p>
                <p suppressHydrationWarning data-anyos="footer.strapline" className="mt-1 text-[0.85rem] tracking-[0.04em] text-on-forest-muted">Theydon Bois · Est. 2008</p>
              </div>
            </div>
            <p className="mt-6 max-w-[26rem] font-display text-[1.2rem] italic text-on-forest-muted">{TAGLINE}.</p>
          </div>

          <div className="grid gap-10 sm:grid-cols-[1.5fr_1fr_0.8fr] lg:col-span-7">
            <div>
              <h2 className="text-[0.8125rem] font-semibold uppercase tracking-[0.12em] text-on-forest-muted">Contact</h2>
              <ul className="mt-4 space-y-1 text-[0.98rem]">
                <li><a href={BUSINESS.phoneHref} className="inline-flex min-h-[2.75rem] items-center gap-2.5 tabular hover:text-white"><Icon name="phone" className="h-4 w-4 text-brass-light" />{BUSINESS.phoneDisplay}</a></li>
                <li><a href={`mailto:${BUSINESS.email}`} className="inline-flex min-h-[2.75rem] items-center gap-2.5 [overflow-wrap:anywhere] hover:text-white"><Icon name="mail" className="h-4 w-4 flex-none text-brass-light" />{BUSINESS.email}</a></li>
                <li className="flex min-h-[2.75rem] items-center gap-2.5"><Icon name="pin" className="h-4 w-4 text-brass-light" /><span suppressHydrationWarning data-anyos="footer.location">Theydon Bois, Essex</span></li>
                <li className="flex min-h-[2.75rem] items-center gap-2.5 text-on-forest-muted"><Icon name="clock" className="h-4 w-4 text-brass-light" />{BUSINESS.hours}</li>
              </ul>
            </div>
            <div>
              <h2 className="text-[0.8125rem] font-semibold uppercase tracking-[0.12em] text-on-forest-muted">Explore</h2>
              <ul className="mt-4 space-y-1 text-[0.98rem]">
                {NAV.map(n => (
                  <li key={n.href}><a href={n.href} className="inline-flex min-h-[2.75rem] min-w-[2.75rem] items-center hover:text-white">{n.label}</a></li>
                ))}
                <li><a href="/airport-transfers" className="inline-flex min-h-[2.75rem] items-center hover:text-white">Airport transfers</a></li>
                <li><a href="/#quote" className="inline-flex min-h-[2.75rem] items-center hover:text-white">Get a quote</a></li>
              </ul>
            </div>
            <div>
              <h2 className="text-[0.8125rem] font-semibold uppercase tracking-[0.12em] text-on-forest-muted">Legal</h2>
              <ul className="mt-4 space-y-1 text-[0.98rem]">
                <li><a href="/privacy" className="inline-flex min-h-[2.75rem] items-center hover:text-white">Privacy notice</a></li>
                <li><a href="/cookies" className="inline-flex min-h-[2.75rem] items-center hover:text-white">Cookies</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-2 border-t border-forest-2 pt-6 text-[0.875rem] text-on-forest-muted sm:flex-row sm:justify-between">
          <p>© {year} Theydon &amp; Loughton Executive Cars</p>
          <p>{BUSINESS.licensing}</p>
        </div>
      </div>
    </footer>
  )
}
