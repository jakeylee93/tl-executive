/** @type {import("next").NextConfig} */
const nextConfig = { images: { unoptimized: true } }
// tests run a second server from a COPY of the build (tests/anyvendor.test.mjs),
// so its page cache never mixes with the main server's; never set on Vercel
if (process.env.NEXT_DIST_DIR && !process.env.VERCEL) nextConfig.distDir = process.env.NEXT_DIST_DIR
module.exports = nextConfig
