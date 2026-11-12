// Origins that may frame the draft page: the AnyVendor editor, plus any testing
// origin named for this environment (same rule as lib/anyvendor/site.ts).
const EDITOR_ORIGINS = ['https://platform.anyvendor.co.uk'].concat(
  (process.env.ANYVENDOR_EDITOR_ORIGINS || '').split(',').map(o => o.trim())
    .filter(o => /^https:\/\/[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(o) && o !== 'https://platform.anyvendor.co.uk'))

/** @type {import("next").NextConfig} */
const nextConfig = {
  images: { unoptimized: true },
  // the draft preview (AnyVendor editor) is never cached, indexed or a referrer
  async headers() {
    return [{ source: '/preview', headers: [
      { key: 'Cache-Control', value: 'private, no-store' },
      { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
      { key: 'Referrer-Policy', value: 'no-referrer' },
      // only the AnyVendor editor may frame the draft page
      { key: 'Content-Security-Policy', value: `frame-ancestors 'self' ${EDITOR_ORIGINS.join(' ')}` },
    ] }]
  },
}
// tests run a second server from a COPY of the build (tests/anyvendor.test.mjs),
// so its page cache never mixes with the main server's; never set on Vercel
if (process.env.NEXT_DIST_DIR && !process.env.VERCEL) nextConfig.distDir = process.env.NEXT_DIST_DIR
module.exports = nextConfig
