import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { AnyVendorBridge } from '@/components/AnyVendorBridge'
import { HomePage } from '@/components/HomePage'
import { SLUG, editorOrigins, getSite } from '@/lib/anyvendor/site'

// Draft preview for the AnyVendor editor: /preview?token=<site-specific token>
// (a UUID), with &av_edit=1 when the editor frames it. Never cached or indexed,
// and sends no referrer, so the token does not travel to other sites. Without a
// token the backend accepts there is no page here (fail closed: a wrong token
// never falls back to published or built-in content). Only this page loads the
// editor bridge (public/anyvendor-bridge.js, copied unchanged from AnyVendor),
// and only the editor origins may frame it (next.config.js).
export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Draft preview',
  robots: { index: false, follow: false, nocache: true },
  referrer: 'no-referrer',
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function Preview({ searchParams }: { searchParams: { token?: string | string[] } }) {
  const token = typeof searchParams.token === 'string' ? searchParams.token : ''
  if (!UUID.test(token)) notFound()
  const site = await getSite(token)
  if (site.source !== 'draft') notFound()
  const origins = editorOrigins()
  return (
    <>
      <HomePage site={site} editorOrigins={origins} />
      <AnyVendorBridge slug={SLUG} origins={origins} />
    </>
  )
}
