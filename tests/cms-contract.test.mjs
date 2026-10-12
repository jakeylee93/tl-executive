// anyOS live-edit contract test. No network, no writes.
//
// Reads built HTML from .next/server/app (after `npm run build`) or, to test a
// deployed preview without a local build, from CMS_HTML_DIR containing
// index.html and airport-transfers.html fetched from that deployment.
//
// tests/fixtures/cms-keys.json pins every data-anyos (114) and
// data-anyos-img (5) key published by the September build; saved anyOS
// content is looked up by key, so each must survive any redesign.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = process.env.CMS_HTML_DIR || fileURLToPath(new URL('../.next/server/app/', import.meta.url))
const read = f => readFileSync(join(dir, f), 'utf8')
const home = read('index.html')
const airport = read('airport-transfers.html')
const fixture = JSON.parse(readFileSync(new URL('./fixtures/cms-keys.json', import.meta.url), 'utf8'))
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const LIVE_SAVED_KEYS = ['hero.eyebrow', 'services.title'] // saved in anyOS (checked 12 Oct 2026)

test('fixture covers 114 text keys and 5 image keys', () => {
  assert.equal(fixture.text.length, 114)
  assert.equal(fixture.image.length, 5)
})

test('edit.js is loaded with the unchanged site key on every page', () => {
  for (const html of [home, airport]) {
    assert.match(html, /<script[^>]*src="https:\/\/platform\.anyos\.co\.uk\/edit\.js"[^>]*data-site="t-l-executive-cars"/)
  }
})

test('all 114 published text keys (and the live-saved ones) are on the home page', () => {
  const missing = [...new Set([...fixture.text, ...LIVE_SAVED_KEYS])].filter(k => !home.includes(`data-anyos="${k}"`))
  assert.deepEqual(missing, [], `missing keys: ${missing.join(', ')}`)
})

test('all 5 image keys are on real <img> elements', () => {
  for (const key of fixture.image) assert.match(home, new RegExp(`<img[^>]*data-anyos-img="${esc(key)}"`), key)
})

test('data-anyos elements are text leaves (edit.js replaces innerHTML)', () => {
  const offenders = []
  for (const html of [home, airport]) {
    const re = /<([a-z0-9]+)\b[^>]*\sdata-anyos="([^"]+)"[^>]*>([\s\S]*?)<\/\1>/g
    let m
    while ((m = re.exec(html))) if (/<[a-z]/i.test(m[3])) offenders.push(`${m[2]} <${m[1]}>`)
  }
  assert.deepEqual(offenders, [], `nested markup in: ${offenders.join(', ')}`)
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

test('site settings expose only the two brand colours', () => {
  const m = home.match(/window\.ANYOS_SETTINGS=(\[.*?\]);/)
  assert.ok(m, 'ANYOS_SETTINGS declared')
  const vars = JSON.parse(m[1]).flatMap(g => g.settings.map(s => s.cssVar)).sort()
  assert.deepEqual(vars, ['--tl-charcoal', '--tl-silver'])
})

test('no frame-blocking meta and no 24-hour claim in the pages', () => {
  for (const html of [home, airport]) {
    assert.doesNotMatch(html, /http-equiv="Content-Security-Policy"[^>]*frame-ancestors/i)
    assert.doesNotMatch(html, /24[\s-]?hours?|24\/7|open all hours/i)
  }
})
