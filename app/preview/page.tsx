import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { HomePage } from '@/components/HomePage'
import { getSite } from '@/lib/anyvendor/site'

// Draft preview for the AnyVendor editor: /preview?token=<site-specific token>.
// Never cached or indexed, and sends no referrer, so the token does not travel
// to other sites. Without a token, or if the backend does not accept it, there
// is no page here.
export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Draft preview',
  robots: { index: false, follow: false, nocache: true },
  referrer: 'no-referrer',
}

export default async function Preview({ searchParams }: { searchParams: { token?: string | string[] } }) {
  const token = typeof searchParams.token === 'string' ? searchParams.token : ''
  if (!/^[A-Za-z0-9._~-]{16,256}$/.test(token)) notFound()
  const site = await getSite(token)
  if (site.source !== 'draft') notFound()
  return <HomePage site={site} />
}
