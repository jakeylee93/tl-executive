import { createElement } from 'react'
import { AIRPORTS, AREAS, BUSINESS, SERVICES } from './site'

// Structured data from verified facts only (RESEARCH.md §1). Deliberately no
// street address (it appears to be a home address), no geo point, no ratings
// and no prices.

export function localBusinessSchema() {
  const id = `${BUSINESS.siteUrl}/#business`
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': id,
    name: BUSINESS.name,
    alternateName: BUSINESS.shortName,
    description: 'Executive car and chauffeur service based in Theydon Bois, Essex: airport transfers, corporate travel, events and occasions.',
    url: BUSINESS.siteUrl,
    telephone: BUSINESS.phoneE164,
    email: BUSINESS.email,
    image: `${BUSINESS.siteUrl}/og.jpg`,
    logo: `${BUSINESS.siteUrl}/brand/tl-badge-512.png`,
    foundingDate: String(BUSINESS.founded),
    founder: { '@type': 'Person', name: BUSINESS.founder },
    address: { '@type': 'PostalAddress', addressLocality: BUSINESS.locality, addressRegion: BUSINESS.region, addressCountry: BUSINESS.country },
    areaServed: [
      ...AREAS.map(a => ({ '@type': 'Place', name: a.name })),
      { '@type': 'City', name: 'London' },
      ...AIRPORTS.map(a => ({ '@type': 'Airport', name: `${a.name} Airport`, iataCode: a.code })),
    ],
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: '00:00',
      closes: '23:59',
    },
    paymentAccepted: 'Visa, Mastercard, American Express, Apple Pay',
    sameAs: ['https://tlexecutivecars.co.uk/'],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Executive car services',
      itemListElement: SERVICES.map(s => ({
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: s.title, description: s.description, provider: { '@id': id } },
      })),
    },
  }
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: `${BUSINESS.siteUrl}${it.path}` })),
  }
}

/** Serialises safely into a <script> (no "</script>" break-out). */
export function JsonLd({ data }: { data: unknown }) {
  return createElement('script', {
    type: 'application/ld+json',
    dangerouslySetInnerHTML: { __html: JSON.stringify(data).replace(/</g, '\\u003c') },
  })
}
