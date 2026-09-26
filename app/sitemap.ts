import type { MetadataRoute } from 'next'
import { BUSINESS } from '@/lib/site'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  return [
    { url: `${BUSINESS.siteUrl}/`, lastModified: now, changeFrequency: 'monthly', priority: 1 },
    { url: `${BUSINESS.siteUrl}/airport-transfers`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BUSINESS.siteUrl}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${BUSINESS.siteUrl}/cookies`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
  ]
}
