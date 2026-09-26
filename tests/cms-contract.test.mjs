// anyOS live-edit contract test — runs against the production build output
// (`pnpm build` first). No network, no writes.
//
// The keys below are every data-anyos / data-anyos-img key published by the
// previous site (commit aab90e8, app/page.tsx) plus the two overrides saved
// live in anyOS on 26 Sep 2026 (hero.eyebrow, services.title). Saved content
// is looked up by key, so each must still exist, on a leaf element, or an
// owner's edit would silently stop showing.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = file => readFileSync(new URL(`../.next/server/app/${file}`, import.meta.url), 'utf8')
const home = read('index.html')
const airport = read('airport-transfers.html')

const slug = name => name.toLowerCase().replaceAll(' ', '-')
const VEHICLES = ['Mercedes E Class', 'Mercedes S Class', 'Mercedes V Class', 'Tourneo Custom Executive Spec'].map(slug)
const PEOPLE = ['Jamil Qureshi', 'Ken Spry', 'Peter Joarder'].map(slug)

const LEGACY_TEXT_KEYS = [
  'brand.name', 'brand.strapline',
  'hero.eyebrow', 'hero.title', 'hero.titleAccent', 'hero.intro',
  'services.eyebrow', 'services.title',
  ...Array.from({ length: 12 }, (_, i) => [`services.${i}.title`, `services.${i}.description`]).flat(),
  'fleet.eyebrow', 'fleet.title', 'fleet.intro',
  ...VEHICLES.flatMap(v => [`fleet.${v}.name`, `fleet.${v}.passengers`, `fleet.${v}.bags`, `fleet.${v}.description`]),
  'clients.eyebrow', 'clients.title',
  'testimonials.eyebrow', 'testimonials.title',
  ...PEOPLE.flatMap(p => [`testimonials.${p}.quote`, `testimonials.${p}.name`, `testimonials.${p}.role`]),
  'about.eyebrow', 'about.title', 'about.story', 'about.promise', 'about.signoff',
  'areas.title',
  'quote.eyebrow', 'quote.title', 'quote.intro',
  'footer.title', 'footer.strapline', 'footer.location',
]
const LEGACY_IMAGE_KEYS = VEHICLES.map(v => `fleet.${v}.image`)
const LIVE_SAVED_KEYS = ['hero.eyebrow', 'services.title']

const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

test('edit.js is loaded with the unchanged site key', () => {
  for (const html of [home, airport]) {
    assert.match(html, /<script[^>]*src="https:\/\/platform\.anyos\.co\.uk\/edit\.js"[^>]*data-site="t-l-executive-cars"/)
  }
})

test('every legacy text key and live-saved key is present on the home page', () => {
  const missing = [...new Set([...LEGACY_TEXT_KEYS, ...LIVE_SAVED_KEYS])].filter(k => !home.includes(`data-anyos="${k}"`))
  assert.deepEqual(missing, [], `missing keys: ${missing.join(', ')}`)
})

test('every legacy image key is on an <img> element', () => {
  for (const key of LEGACY_IMAGE_KEYS) {
    const re = new RegExp(`<img[^>]*data-anyos-img="${esc(key)}"`)
    assert.match(home, re, `image key ${key}`)
  }
})

test('data-anyos elements are text leaves (edit.js replaces innerHTML)', () => {
  const offenders = []
  for (const html of [home, airport]) {
    const re = /<([a-z0-9]+)\b[^>]*\sdata-anyos="([^"]+)"[^>]*>([\s\S]*?)<\/\1>/g
    let m
    while ((m = re.exec(html))) {
      if (/<[a-z]/i.test(m[3])) offenders.push(`${m[2]} <${m[1]}>`)
    }
  }
  assert.deepEqual(offenders, [], `elements with nested markup: ${offenders.join(', ')}`)
})

test('keys shared across pages carry the same default text', () => {
  const defaults = html => {
    const map = new Map()
    const re = /<([a-z0-9]+)\b[^>]*\sdata-anyos="([^"]+)"[^>]*>([\s\S]*?)<\/\1>/g
    let m
    while ((m = re.exec(html))) map.set(m[2], m[3])
    return map
  }
  const a = defaults(home)
  const b = defaults(airport)
  const clashes = [...b.keys()].filter(k => a.has(k) && a.get(k) !== b.get(k))
  assert.deepEqual(clashes, [], `same key, different default: ${clashes.join(', ')}`)
})

test('site settings expose only the two brand colours as CSS variables', () => {
  const m = home.match(/window\.ANYOS_SETTINGS=(\[.*?\]);/)
  assert.ok(m, 'ANYOS_SETTINGS declared')
  const groups = JSON.parse(m[1])
  const vars = groups.flatMap(g => g.settings.map(s => s.cssVar))
  assert.deepEqual(vars.sort(), ['--tl-brass', '--tl-forest'])
})
