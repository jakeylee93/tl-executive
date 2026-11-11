// AnyVendor site-adapter contract. No network beyond localhost, no writes.
// 1. The packet (manifest, seed, field map) obeys anyvendor.site/v1 rules and
//    covers every editable key of the built page.
// 2. Against a mock content origin (scripts/anyvendor/mock-origin.mjs): the
//    page uses published content, hides/reorders chapters, neutralises hostile
//    values, serves drafts only for the right token, and keeps the built-in
//    content when the origin is missing, down or says 404.
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { startMock, TOKEN, PUBLISHED_TITLE, DRAFT_TITLE, NEW_IMAGE } from '../scripts/anyvendor/mock-origin.mjs'

const json = f => JSON.parse(readFileSync(new URL(`../integrations/anyvendor/${f}`, import.meta.url), 'utf8'))
const manifest = json('manifest.json'); const seed = json('seed.json'); const map = json('field-map.json')
const fixture = JSON.parse(readFileSync(new URL('./fixtures/cms-keys.json', import.meta.url), 'utf8'))
const built = readFileSync(new URL('../.next/server/app/index.html', import.meta.url), 'utf8')
const KEY = /^[a-z][a-z0-9_]{0,39}$/
const TYPES = ['text', 'textarea', 'richtext', 'number', 'boolean', 'select', 'image', 'link', 'list']

test('manifest obeys the v1 rules', () => {
  assert.equal(manifest.version, 1)
  assert.ok(manifest.sections.length <= 40)
  assert.equal(new Set(manifest.sections.map(s => s.key)).size, manifest.sections.length)
  for (const s of manifest.sections) {
    assert.match(s.key, KEY); assert.ok(s.label)
    assert.equal(new Set(s.fields.map(f => f.key)).size, s.fields.length, `duplicate field in ${s.key}`)
    for (const f of s.fields) {
      assert.match(f.key, KEY, `${s.key}.${f.key}`); assert.ok(TYPES.includes(f.type))
      if (f.type === 'list') for (const g of f.fields) { assert.match(g.key, KEY); assert.notEqual(g.type, 'list', 'no nested lists') }
    }
  }
})

test('seed has a value for every field, and every field is mapped to an element', () => {
  for (const s of manifest.sections) for (const f of s.fields) {
    const v = seed[s.key]?.[f.key]
    assert.ok(v !== undefined && v !== '', `seed ${s.key}.${f.key}`)
    if (f.type === 'image') { assert.ok(v.src && v.alt, `image ${s.key}.${f.key}`) }
    if (f.max && typeof v === 'string') assert.ok(v.length <= f.max, `${s.key}.${f.key} longer than max`)
    assert.ok(map[`${s.key}.${f.key}`], `map ${s.key}.${f.key}`)
  }
})

test('every anyOS key on the built page (and every pinned September key) has an AnyVendor field', () => {
  const mapped = new Set(Object.values(map).map(m => m.anyos).filter(Boolean))
  const onPage = [...built.matchAll(/data-anyos(?:-img)?="([^"]+)"/g)].map(m => m[1])
  const missing = [...new Set([...onPage, ...fixture.text, ...fixture.image])].filter(k => !mapped.has(k))
  assert.deepEqual(missing, [])
  for (const m of Object.values(map)) if (m.anyos) assert.ok(onPage.includes(m.anyos), `${m.anyos} is in the map but not on the page (re-run scripts/anyvendor/build-packet.mjs)`)
})

test('the built page is the built-in content: five chapters in order, anyOS editor still loaded', () => {
  assert.deepEqual([...built.matchAll(/data-av-chapter="([a-z]+)"/g)].map(m => m[1]), ['journeys', 'fleet', 'trust', 'plan', 'contact'])
  assert.match(built, /platform\.anyos\.co\.uk\/edit\.js"[^>]*data-site="t-l-executive-cars"/)
})

// ---- against a mock content origin -----------------------------------------
const MOCK = 3231; const ON = 3232; const OFF = 3233
const root = fileURLToPath(new URL('..', import.meta.url))
let mock; const procs = []
const start = (port, env) => { const p = spawn('npx', ['next', 'start', '-p', String(port)], { cwd: root, env: { ...process.env, ...env }, stdio: 'ignore' }); procs.push(p) }
const get = async (base, path) => { const r = await fetch(`http://127.0.0.1:${base}${path}`, { redirect: 'manual' }); return { status: r.status, html: await r.text(), headers: r.headers } }
const until = async (fn, ms = 40000) => { const t = Date.now(); for (;;) { const v = await fn().catch(() => null); if (v) return v; if (Date.now() - t > ms) return null; await new Promise(r => setTimeout(r, 1000)) } }
const chapters = html => [...html.matchAll(/data-av-chapter="([a-z]+)"/g)].map(m => m[1])

before(async () => {
  mock = await startMock(MOCK)
  start(ON, { ANYVENDOR_CONTENT_ORIGIN: `http://127.0.0.1:${MOCK}`, ENQUIRY_MODE: 'dry-run' })
  start(OFF, { ANYVENDOR_CONTENT_ORIGIN: '', ENQUIRY_MODE: 'dry-run' })
  await until(async () => (await get(ON, '/api/enquiry')).status === 200 && (await get(OFF, '/api/enquiry')).status === 200, 60000)
})
after(() => { procs.forEach(p => p.kill()); mock?.close() })

test('published content is used: edits, chapter order, hidden chapter; hostile values neutralised', async () => {
  // the prerendered page is replaced within its 60-second revalidation
  const page = await until(async () => { const r = await get(ON, '/'); return r.html.includes(PUBLISHED_TITLE) ? r : null }, 90000)
  assert.ok(page, 'published headline reached the page')
  assert.deepEqual(chapters(page.html), ['plan', 'journeys', 'contact'], 'reordered, fleet hidden, unlisted chapter dropped')
  assert.ok(page.html.includes(NEW_IMAGE.src))
  assert.ok(!page.html.includes('javascript:alert'), 'unsafe image source dropped')
  assert.ok(!/<script>alert\(1\)<\/script>/.test(page.html) && !page.html.includes('alert(1)\\u003c') , 'tags stripped from text')
  assert.ok(page.html.includes('Arranged personally since 2008.'))
  assert.ok(!page.html.includes(DRAFT_TITLE), 'draft content is not public')
})

test('draft preview: right token only, never indexed or cached, no referrer', async () => {
  const ok = await get(ON, `/preview?token=${TOKEN}`)
  assert.equal(ok.status, 200)
  assert.ok(ok.html.includes(DRAFT_TITLE))
  assert.match(ok.html, /<meta name="robots" content="noindex[^"]*"/)
  assert.match(ok.html, /<meta name="referrer" content="no-referrer"/)
  assert.ok(!/s-maxage|public/.test(ok.headers.get('cache-control') || ''), ok.headers.get('cache-control'))
  for (const path of ['/preview', '/preview?token=short', '/preview?token=wrong-token-0123456789abcdef']) assert.equal((await get(ON, path)).status, 404, path)
})

test('no origin configured: built-in content, no preview', async () => {
  const page = await get(OFF, '/')
  assert.deepEqual(chapters(page.html), ['journeys', 'fleet', 'trust', 'plan', 'contact'])
  assert.ok(!page.html.includes(PUBLISHED_TITLE))
  assert.equal((await get(OFF, `/preview?token=${TOKEN}`)).status, 404)
})

test('origin outage: the page still renders, the enquiry route is unaffected, drafts are refused', async () => {
  await fetch(`http://127.0.0.1:${MOCK}/__mode/down`)
  const page = await get(ON, '/')
  assert.equal(page.status, 200)
  assert.ok(page.html.includes('data-av-chapter="plan"'))
  assert.equal((await get(ON, `/preview?token=${TOKEN}`)).status, 404)
  const mode = await (await fetch(`http://127.0.0.1:${ON}/api/enquiry`)).json()
  assert.equal(mode.mode, 'dry-run')
  await fetch(`http://127.0.0.1:${MOCK}/__mode/up`)
})
