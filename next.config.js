/** @type {import("next").NextConfig} */
const nextConfig = {
  images: { unoptimized: true },
  // the draft preview (AnyVendor editor) is never cached, indexed or a referrer
  async headers() {
    return [{ source: '/preview', headers: [
      { key: 'Cache-Control', value: 'private, no-store' },
      { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
      { key: 'Referrer-Policy', value: 'no-referrer' },
    ] }]
  },
}
// tests run a second server from a COPY of the build (tests/anyvendor.test.mjs),
// so its page cache never mixes with the main server's; never set on Vercel
if (process.env.NEXT_DIST_DIR && !process.env.VERCEL) nextConfig.distDir = process.env.NEXT_DIST_DIR
module.exports = nextConfig
