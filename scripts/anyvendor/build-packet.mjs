// Builds the AnyVendor site-integration packet (anyvendor.site/v1) from the
// RENDERED home page, so manifest, seed and field map cannot drift from what
// is on screen:
//
//   node scripts/anyvendor/build-packet.mjs <dir containing index.html>
//
// (index.html = the built page, .next/server/app/index.html, or one fetched
// from a deployment.) Every data-anyos text key and data-anyos-img image key
// becomes one field; the anyOS key is kept in the field map, so the existing
// anyOS editor and the AnyVendor renderer address the same elements.
// Writes integrations/anyvendor/{manifest,seed,field-map}.json.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = process.argv[2] || fileURLToPath(new URL('../../.next/server/app/', import.meta.url))
const html = readFileSync(join(dir, 'index.html'), 'utf8')
const OUT = fileURLToPath(new URL('../../integrations/anyvendor/', import.meta.url))

const SECTIONS = [
  ['brand', 'Brand'], ['hero', 'Opening film'], ['services', 'Journeys'], ['airports', 'Airports'],
  ['fleet', 'Fleet'], ['about', 'About'], ['areas', 'Areas covered'], ['testimonials', 'Testimonials'],
  ['clients', 'Clients'], ['quote', 'Quote'], ['faq', 'Questions'], ['footer', 'Footer'],
]
// the page's movable chapters (components in app/page.tsx), in their built-in order
export const CHAPTERS = [
  ['journeys', 'Journeys'], ['fleet', 'Fleet'], ['trust', 'About, areas and testimonials'], ['plan', 'Quote form'], ['contact', 'Questions and contact'],
]
const SHORT = { 'mercedes-e-class': 'e_class', 'mercedes-s-class': 's_class', 'mercedes-v-class': 'v_class', 'tourneo-custom-executive-spec': 'tourneo' }
const decode = s => s.replace(/<!-- -->/g, '').replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
const attr = (tag, name) => { const m = tag.match(new RegExp(`\\s${name}="([^"]*)"`)); return m ? decode(m[1]) : '' }

function fieldKey(rest) {
  const k = rest.map(p => SHORT[p] || p).join('_')
    .replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase().replace(/[^a-z0-9_]/g, '_')
  return /^[a-z]/.test(k) ? k : `item${k}`
}
const words = k => k.replace(/^item(\d+)/, (_, n) => `Item ${+n + 1}`).replace(/_(\d+)_/g, (_, n) => ` ${+n + 1} `).replace(/_/g, ' ').replace(/\s+/g, ' ').trim().replace(/^./, c => c.toUpperCase())

const manifest = { version: 1, name: 'Theydon & Loughton Executive Cars', sections: [] }
const seed = {}
const map = {}
const byKey = Object.fromEntries(SECTIONS.map(([key, label]) => { const s = { key, label, fields: [] }; manifest.sections.push(s); seed[key] = {}; return [key, s] }))

const add = (anyosKey, kind, value) => {
  const [sec, ...rest] = anyosKey.split('.')
  if (!byKey[sec]) throw new Error(`no section for ${anyosKey}`)
  const key = fieldKey(rest)
  if (!/^[a-z][a-z0-9_]{0,39}$/.test(key)) throw new Error(`bad field key ${key} (${anyosKey})`)
  if (byKey[sec].fields.some(f => f.key === key)) return // the same key rendered twice
  if (kind === 'image') {
    byKey[sec].fields.push({ key, label: words(key), type: 'image' })
  } else {
    const long = value.length > 90
    byKey[sec].fields.push({ key, label: words(key), type: long ? 'textarea' : 'text', max: long ? Math.max(400, Math.ceil(value.length * 1.5 / 50) * 50) : 120 })
  }
  seed[sec][key] = value
  map[`${sec}.${key}`] = kind === 'image'
    ? { kind, anyos: anyosKey, selector: `img[data-anyos-img="${anyosKey}"]`, sets: ['src', 'alt'] }
    : { kind, anyos: anyosKey, selector: `[data-anyos="${anyosKey}"]`, sets: ['textContent'] }
}

let m
const text = /<([a-z0-9]+)\b[^>]*\sdata-anyos="([^"]+)"[^>]*>([\s\S]*?)<\/\1>/g
while ((m = text.exec(html))) {
  if (/<[a-z]/i.test(m[3])) throw new Error(`${m[2]} is not a text leaf`)
  add(m[2], 'text', decode(m[3]).trim())
}
const img = /<img\b[^>]*\sdata-anyos-img="([^"]+)"[^>]*>/g
while ((m = img.exec(html))) add(m[1], 'image', { src: attr(m[0], 'src'), alt: attr(m[0], 'alt') })

// Page chapters: which appear, and in what order. Plain v1 (a list of select +
// boolean), so it works before the shared section-instances extension lands.
manifest.sections.push({
  key: 'page', label: 'Page layout', fields: [{
    key: 'chapters', label: 'Chapters after the opening film', type: 'list', max: CHAPTERS.length,
    fields: [
      { key: 'chapter', label: 'Chapter', type: 'select', options: CHAPTERS.map(([value, label]) => ({ value, label })) },
      { key: 'visible', label: 'Show on the page', type: 'boolean' },
    ],
  }],
})
seed.page = { chapters: CHAPTERS.map(([chapter]) => ({ chapter, visible: true })) }
map['page.chapters'] = { kind: 'layout', renders: 'order and visibility of <main> chapters (components/HomePage.tsx)', selector: '[data-av-chapter]' }

for (const s of manifest.sections) if (!s.fields.length) throw new Error(`empty section ${s.key}`)
if (manifest.sections.length > 40) throw new Error('too many sections')
mkdirSync(OUT, { recursive: true })
const write = (f, d) => writeFileSync(join(OUT, f), JSON.stringify(d, null, 2) + '\n')
write('manifest.json', manifest); write('seed.json', seed); write('field-map.json', map)
console.log(manifest.sections.map(s => `${s.key}:${s.fields.length}`).join(' '), '| fields', Object.keys(map).length)
