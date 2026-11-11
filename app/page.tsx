import { HomePage } from '@/components/HomePage'
import { getSite } from '@/lib/anyvendor/site'

// Published content: built-in unless the AnyVendor content origin is configured
// (lib/anyvendor/site.ts); then re-read at most every 60 seconds.
export const revalidate = 60

export default async function Home() {
  return <HomePage site={await getSite()} />
}
