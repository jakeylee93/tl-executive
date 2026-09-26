import type { Metadata, Viewport } from 'next'
import { Hanken_Grotesk, Newsreader } from 'next/font/google'
import { BUSINESS } from '@/lib/site'
import './globals.css'

// Fonts are self-hosted by Next at build time: no request to Google from the
// visitor’s browser (nothing to consent to), and preloaded to keep shift low.
const display = Newsreader({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  axes: ['opsz'],
  variable: '--font-display',
  display: 'swap',
  // Next has no fallback metrics for Newsreader; Georgia is the closest match.
  adjustFontFallback: false,
  fallback: ['Georgia', 'Times New Roman', 'serif'],
})
const sans = Hanken_Grotesk({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const description =
  'Executive car service based in Theydon Bois, Essex, since 2008. Airport transfers to Heathrow, Gatwick, Stansted, Luton, London City and Southend, plus business travel, theatre, race days and weddings. Call 07904 428896.'

export const metadata: Metadata = {
  metadataBase: new URL(BUSINESS.siteUrl),
  title: {
    default: 'Theydon & Loughton Executive Cars | Executive Cars & Airport Transfers, Theydon Bois',
    template: '%s | Theydon & Loughton Executive Cars',
  },
  description,
  applicationName: BUSINESS.shortName,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    url: '/',
    siteName: BUSINESS.name,
    title: 'Theydon & Loughton Executive Cars',
    description: 'Executive cars from Theydon Bois since 2008: airport transfers, business travel and evenings in London.',
    images: [{ url: '/og.jpg', width: 1200, height: 630, alt: 'Theydon & Loughton Executive Cars: executive cars from Theydon Bois since 2008' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Theydon & Loughton Executive Cars',
    description: 'Executive cars from Theydon Bois since 2008.',
    images: ['/og.jpg'],
  },
  formatDetection: { telephone: false, email: false, address: false },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  themeColor: '#f6f4ee',
  width: 'device-width',
  initialScale: 1,
}

// anyOS Site settings (edit.js v6): the two brand colours the owner may
// retune from the live editor. Applied for every visitor via CSS variables.
const ANYOS_SETTINGS = [
  {
    label: 'Brand colours',
    settings: [
      { cssVar: '--tl-forest', label: 'Deep green (quote & reviews bands)', type: 'color' },
      { cssVar: '--tl-brass', label: 'Accent (labels, route lines)', type: 'color' },
    ],
  },
]

// Runs before first paint: marks JS as available (arms the reveal motion) and
// switches motion off while the anyOS editor is open so nothing is hidden.
const bootScript = `(function(){var d=document.documentElement;d.classList.add('js');try{if(/[?&]anyos_edit=/.test(location.search)||sessionStorage.getItem('anyosEditToken'))d.classList.add('anyos-editing')}catch(e){}window.ANYOS_SETTINGS=${JSON.stringify(ANYOS_SETTINGS)};})();`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={`${display.variable} ${sans.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
        {/* edit.js (classic script) and its content fetch (CORS) use separate connections. */}
        <link rel="preconnect" href="https://platform.anyos.co.uk" />
        <link rel="preconnect" href="https://platform.anyos.co.uk" crossOrigin="anonymous" />
        {/* anyOS live editing — contract: keep src and data-site unchanged. */}
        <script src="https://platform.anyos.co.uk/edit.js" data-site="t-l-executive-cars" defer />
      </head>
      <body>
        <a href="#main" className="skip-link">Skip to content</a>
        {children}
      </body>
    </html>
  )
}
