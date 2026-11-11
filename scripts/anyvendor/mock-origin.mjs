// A stand-in AnyVendor content origin for contract tests and cloud QA only:
//   node scripts/anyvendor/mock-origin.mjs [port]
// Serves anyvendor.site/v1 for slug tl-executive-cars: a published revision
// with a few edits (and hostile values the renderer must neutralise), a draft
// behind one token, and 404 for everything else. GET /__mode/down|up toggles an outage.
import { createServer } from 'node:http'
import { readFileSync } from 'node:fs'

const read = f => JSON.parse(readFileSync(new URL(`../../integrations/anyvendor/${f}`, import.meta.url), 'utf8'))
export const TOKEN = 'mock-preview-token-0123456789'
export const PUBLISHED_TITLE = 'Chauffeur-driven cars'
export const DRAFT_TITLE = 'Draft headline, not yet published'
export const NEW_IMAGE = { src: '/media/journeys/occasions-1600.webp', alt: 'A replaced E-Class picture' }

export function startMock(port) {
  const manifest = read('manifest.json')
  const seed = read('seed.json')
  let down = false
  const published = structuredClone(seed)
  published.hero.title = PUBLISHED_TITLE
  published.hero.intro = '<script>alert(1)</script>Arranged <b>personally</b> since 2008.'
  published.fleet.e_class_image = NEW_IMAGE
  published.fleet.s_class_image = { src: 'javascript:alert(1)', alt: 'x' }
  published.clients.names = 'Client One  ·  Client Two'
  published.services.travel_photo = { src: '/media/journeys/occasions-1600.webp', alt: 'A venue at night' }
  published.page.chapters = [{ chapter: 'plan', visible: true }, { chapter: 'journeys', visible: true }, { chapter: 'fleet', visible: false }, { chapter: 'contact', visible: true }]
  const draft = structuredClone(published)
  draft.hero.title = DRAFT_TITLE
  const base = { schema: 'anyvendor.site/v1', business: { name: manifest.name, slug: 'tl-executive-cars' }, kind: 'bespoke', manifestVersion: 1, manifest }
  const server = createServer((req, res) => {
    const url = new URL(req.url, 'http://x')
    const send = (status, body, headers = {}) => { res.writeHead(status, { 'Content-Type': 'application/json', ...headers }); res.end(JSON.stringify(body)) }
    if (url.pathname === '/__mode/down') { down = true; return send(200, { down }) }
    if (url.pathname === '/__mode/up') { down = false; return send(200, { down }) }
    if (down) return send(503, { error: 'unavailable' })
    if (url.pathname !== '/api/sites/tl-executive-cars/content') return send(404, { error: 'not found' })
    const token = url.searchParams.get('preview')
    if (token === null) return send(200, { ...base, mode: 'published', revision: '11111111-1111-4111-8111-111111111111', revisionVersion: 3, publishedAt: '2026-11-11T10:00:00Z', content: published }, { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=600' })
    if (token !== TOKEN) return send(404, { error: 'not found' })
    return send(200, { ...base, mode: 'draft', revision: 'draft-4', updatedAt: '2026-11-11T10:05:00Z', content: draft }, { 'Cache-Control': 'no-store' })
  })
  return new Promise(resolve => server.listen(port, '127.0.0.1', () => resolve(server)))
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  const port = Number(process.argv[2] || 3301)
  startMock(port).then(() => console.log(`mock AnyVendor origin on http://127.0.0.1:${port}`))
}
