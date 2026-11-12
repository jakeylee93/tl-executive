// Visual evidence for the redesign, run in CI against a local `next start`.
//
//   node tests/browser/capture.mjs <baseUrl> <outDir>
//
// Writes, for phone and desktop: scroll-position frames of every scroll film
// (the opening journey and the fleet; forward, then the same positions
// reached backwards), an MP4 built from scroll-driven frames, each fleet tab's
// car, the reduced-motion still, and section screenshots. Also records
// simple checks (console errors, horizontal overflow, CMS keys in the DOM,
// determinism of reverse scrolling) in report.json. Never submits the form.
import { createRequire } from 'node:module'
import { mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { join } from 'node:path'

const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright')
const BASE = (process.argv[2] || 'http://localhost:3100').replace(/\/$/, '')
const OUT = process.argv[3] || 'shots'
mkdirSync(OUT, { recursive: true })
const fixture = JSON.parse(readFileSync(new URL('../fixtures/cms-keys.json', import.meta.url), 'utf8'))

const report = { base: BASE, at: new Date().toISOString(), checks: [], files: [] }
const check = (name, ok, detail = '') => { report.checks.push({ name, ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  — ${detail}` : ''}`) }
const browser = await chromium.launch()

const VIEWS = [
  { tag: 'phone390', width: 390, height: 844, dpr: 2, mobile: true },
  { tag: 'phone375', width: 375, height: 667, dpr: 2, mobile: true },
  { tag: 'phone430', width: 430, height: 932, dpr: 2, mobile: true },
  { tag: 'desk1440', width: 1440, height: 900, dpr: 1, mobile: false },
]

const frames = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))

async function open(v, reducedMotion = 'no-preference') {
  const ctx = await browser.newContext({ viewport: { width: v.width, height: v.height }, deviceScaleFactor: v.dpr, isMobile: v.mobile, hasTouch: v.mobile, reducedMotion })
  const page = await ctx.newPage()
  const errors = []
  // the blocked third-party editor script logs ERR_FAILED; anything else counts
  page.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED/.test(m.text())) errors.push(m.text()) })
  page.on('pageerror', e => errors.push(String(e)))
  // anyOS edit.js is a third-party script; keep it out of the evidence run.
  await page.route('https://platform.anyos.co.uk/**', r => r.abort())
  await page.goto(BASE + '/', { waitUntil: 'networkidle' })
  return { ctx, page, errors }
}

async function films(page) {
  return page.evaluate(() => Array.from(document.querySelectorAll('[data-film]')).map(sec => {
    const t = sec.querySelector('[data-film-track]')
    const r = t.getBoundingClientRect()
    return { id: sec.id, top: r.top + scrollY, span: t.offsetHeight - innerHeight, pin: sec.dataset.pin, ready: sec.dataset.ready }
  }))
}
async function scrollTo(page, y) {
  await page.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), y)
  await page.evaluate(frames)
  // let any scrubbed video finish seeking to its new time; a seek that was
  // already running when we scrolled is followed by a second one, so settle twice
  for (let i = 0; i < 2; i++) {
    await page.waitForFunction(() => Array.from(document.querySelectorAll('video')).every(v => !v.seeking), null, { timeout: 4000 }).catch(() => {})
    await page.waitForTimeout(140)
  }
}
async function waitReady(page, id) {
  return page.waitForFunction(id => document.getElementById(id)?.dataset.ready === 'on', id, { timeout: 20000 }).then(() => true).catch(() => false)
}
async function shot(page, name, opts = {}) {
  const path = join(OUT, name)
  await page.screenshot({ path, type: 'jpeg', quality: 82, ...opts })
  report.files.push(name)
  return path
}

for (const v of VIEWS) {
  const { ctx, page, errors } = await open(v)
  const fs = await films(page)
  check(`${v.tag}: the opening film is pinned`, fs.length >= 1 && fs[0].id === 'top' && fs.every(f => f.pin === 'on'), fs.map(f => `${f.id}:${f.pin}`).join(' '))
  const ready = []
  for (const f of fs) {
    await scrollTo(page, f.top)
    ready.push(await waitReady(page, f.id))
    for (const st of [0, 0.25, 0.45, 0.62, 0.8, 0.9, 1]) {
      await scrollTo(page, f.top + st * f.span)
      await shot(page, `film-${v.tag}-${f.id}-${String(Math.round(st * 100)).padStart(3, '0')}.jpg`)
    }
  }
  check(`${v.tag}: every shot's video loaded and playing by scroll`, ready.every(Boolean), ready.join(','))
  // buttons stay tappable while later shots wait (transparent) above them:
  // the hero's "Request a quote" at the start, the closing quote chips at the end
  {
    const tap = (sel) => page.evaluate(sel => {
      const t = document.querySelector(sel)
      if (!t) return 'missing ' + sel
      const r = t.getBoundingClientRect()
      const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
      return el && t.contains(el) ? 'ok' : (el ? String(el.className || el.tagName) : 'nothing')
    }, sel)
    await scrollTo(page, fs[0].top + 0.04 * fs[0].span)
    const a = await tap('#top .film-actions a')
    // the closing quote chips live in whichever film section holds them (#where, or #drive after PR #3)
    const chipsIn = await page.evaluate(() => document.querySelector('[data-film] .arr-chip')?.closest('[data-film]')?.id || '')
    const last = fs.find(f => f.id === chipsIn) || fs[fs.length - 1]
    await scrollTo(page, last.top + 0.85 * last.span)
    const b = await tap(`#${last.id} .arr-chip`)
    check(`${v.tag}: hero and closing quote buttons are tappable`, a === 'ok' && b === 'ok', `${a} / ${b}`)
  }
  // reverse: the same scroll position reached from below gives the same frame
  {
    const f = fs[0]
    await scrollTo(page, f.top + 0.5 * f.span)
    const a1 = await page.screenshot({ type: 'png' })
    await scrollTo(page, f.top + 0.8 * f.span)
    await scrollTo(page, f.top + 0.5 * f.span)
    const b1 = await page.screenshot({ type: 'png' })
    const same = Buffer.compare(a1, b1) === 0
    if (!same) { // keep both frames so a mismatch can be inspected
      writeFileSync(join(OUT, `reverse-${v.tag}-a.png`), a1); writeFileSync(join(OUT, `reverse-${v.tag}-b.png`), b1)
      report.files.push(`reverse-${v.tag}-a.png`, `reverse-${v.tag}-b.png`)
    }
    check(`${v.tag}: scrolling back returns the same frame`, same)
  }
  // the journey as a film: scroll positions through every film section
  if (v.tag === 'phone390' || v.tag === 'desk1440') {
    const dir = join(OUT, `frames-${v.tag}`)
    mkdirSync(dir, { recursive: true })
    let n = 0
    for (const f of fs) {
      for (let i = 0; i <= 72; i++) {
        await scrollTo(page, f.top + (i / 72) * f.span)
        await page.screenshot({ path: join(dir, `f${String(n++).padStart(4, '0')}.jpg`), type: 'jpeg', quality: 80 })
      }
    }
    const mp4 = join(OUT, `journey-${v.tag}.mp4`)
    const r = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', '18', '-i', join(dir, 'f%04d.jpg'), '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '22', mp4])
    check(`${v.tag}: journey video encoded`, r.status === 0, r.stderr?.toString().slice(0, 200))
    if (r.status === 0) report.files.push(`journey-${v.tag}.mp4`)
    rmSync(dir, { recursive: true, force: true })
  }

  // fleet: a scroll film on the opening road; each tab drives to its car
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto' })
  for (const [n, name] of ['E-Class', 'S-Class', 'V-Class', 'Tourneo'].entries()) {
    await page.evaluate(n => document.querySelectorAll('#fleet .garage-tab')[n].click(), n)
    await page.waitForFunction(n => document.querySelectorAll('#fleet .garage-tab')[n]?.getAttribute('aria-selected') === 'true', n, { timeout: 8000 }).catch(() => {})
    await page.waitForTimeout(1600)
    await page.waitForFunction(() => Array.from(document.querySelectorAll('video')).every(v => !v.seeking), null, { timeout: 4000 }).catch(() => {})
    await page.waitForTimeout(200)
    await shot(page, `fleet-${v.tag}-${n}-${name}.jpg`)
  }
  const sel = await page.evaluate(() => document.querySelector('.garage-tab[aria-selected="true"]')?.textContent)
  const card = await page.evaluate(() => {
    const c = document.querySelector('#fleet .fleet-card[data-on] .fleet-cta')
    if (!c) return 'no card'
    const r = c.getBoundingClientRect()
    const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
    return el && c.contains(el) && r.bottom <= innerHeight ? 'ok' : 'hidden'
  })
  check(`${v.tag}: the Tourneo tab drives to the fourth car, its card on screen`, sel === 'Tourneo' && card === 'ok', `selected=${sel} card=${card}`)

  // whole page and simple checks
  await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.8) { scrollTo(0, y); await new Promise(r => setTimeout(r, 60)) } })
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
  check(`${v.tag}: no horizontal overflow`, overflow <= 0, `${overflow}px`)
  const keys = await page.evaluate(() => Array.from(new Set(Array.from(document.querySelectorAll('[data-anyos]')).map(e => e.getAttribute('data-anyos')))))
  const missing = fixture.text.filter(k => !keys.includes(k))
  check(`${v.tag}: all ${fixture.text.length} CMS text keys in the DOM`, missing.length === 0, missing.join(', '))
  for (const id of ['journeys', 'about', 'plan', 'contact']) {
    await page.evaluate(id => document.getElementById(id).scrollIntoView({ block: 'start' }), id)
    await page.waitForTimeout(400)
    await shot(page, `section-${v.tag}-${id}.jpg`)
  }
  check(`${v.tag}: no console errors`, errors.length === 0, errors.slice(0, 3).join(' | '))
  await ctx.close()
}

// reduced motion: the still arrival, nothing pinned
for (const v of [VIEWS[0], VIEWS[3]]) {
  const { ctx, page } = await open(v, 'reduce')
  const fs = await films(page)
  check(`${v.tag}: reduced motion does not pin`, fs.every(f => f.pin === 'off'), fs.map(f => f.pin).join(','))
  await shot(page, `reduced-${v.tag}.jpg`)
  await ctx.close()
}

// phone menu opens, traps nothing it shouldn't, closes on Escape
{
  const { ctx, page } = await open(VIEWS[0])
  await page.click('button[aria-controls="site-menu"]')
  await page.waitForTimeout(250)
  await shot(page, 'menu-phone390-open.jpg')
  const open1 = await page.evaluate(() => !document.getElementById('site-menu').hidden)
  await page.keyboard.press('Escape')
  const open2 = await page.evaluate(() => !document.getElementById('site-menu').hidden)
  check('phone390: menu opens and Escape closes it', open1 && !open2)
  await ctx.close()
}

// AnyVendor adapter in a real browser (AV_BASE = a server reading the mock
// content origin, scripts/anyvendor/mock-origin.mjs): published edits are on
// the page, the replaced picture loads, chapters follow the content, every
// editable element carries its field path, and the quote form still opens.
if (process.env.AV_BASE) {
  const AV = process.env.AV_BASE
  for (const v of [VIEWS[0], { tag: 'tablet820', width: 820, height: 1180, dpr: 2, mobile: true }, VIEWS[3]]) {
    const ctx = await browser.newContext({ viewport: { width: v.width, height: v.height }, deviceScaleFactor: v.dpr, isMobile: v.mobile, hasTouch: v.mobile })
    const page = await ctx.newPage()
    // the prerendered page picks up published content within its 60 s revalidation
    for (let i = 0; i < 40; i++) {
      await page.goto(AV + '/', { waitUntil: 'domcontentloaded' })
      if ((await page.content()).includes('Chauffeur-driven cars')) break
      await page.waitForTimeout(3000)
    }
    await page.waitForTimeout(5000)
    const r = await page.evaluate(async () => {
      const img = document.querySelector('img[data-anyos-img="fleet.mercedes-e-class.image"]')
      return {
        source: document.documentElement.dataset.avSource,
        title: document.querySelector('[data-anyos="hero.title"]')?.textContent,
        intro: document.querySelector('[data-anyos="hero.intro"]')?.textContent,
        script: !!document.querySelector('[data-anyos] script'),
        photo: document.querySelector('img[data-av-key="services.travel.photo"]')?.getAttribute('src'),
        unlabelledAv: document.querySelectorAll('[data-av-key]:not([data-av-field])').length,
        chapters: Array.from(document.querySelectorAll('[data-av-chapter]')).map(e => e.getAttribute('data-av-chapter')),
        fleet: !!document.getElementById('fleet'),
        fields: document.querySelectorAll('[data-av-field]').length,
        unlabelled: document.querySelectorAll('[data-anyos]:not([data-av-field])').length,
        overflow: document.documentElement.scrollWidth > innerWidth + 1,
        dead: Array.from(document.querySelectorAll('header a[href^="/#"]')).filter(a => !a.closest('[hidden]') && !document.getElementById(a.getAttribute('href').slice(2))).map(a => a.getAttribute('href')),
      }
    })
    check(`${v.tag}: no menu link points at a hidden chapter`, r.dead.length === 0, r.dead.join())
    check(`${v.tag}: AnyVendor published edits are on the page`, r.source === 'published' && r.title === 'Chauffeur-driven cars' && /Arranged personally since 2008\.$/.test(r.intro || '') && !r.script && r.photo === '/media/journeys/occasions-1600.webp' && r.unlabelledAv === 0, JSON.stringify(r))
    check(`${v.tag}: AnyVendor chapter order and hidden chapter`, r.chapters.join() === 'plan,journeys,contact' && !r.fleet, r.chapters.join())
    check(`${v.tag}: every editable element carries its AnyVendor field, no overflow`, r.fields >= 60 && r.unlabelled === 0 && !r.overflow, `fields=${r.fields} unlabelled=${r.unlabelled}`)
    await shot(page, `anyvendor-${v.tag}-published.jpg`)
    await page.click('#top .film-actions a')
    await page.waitForTimeout(1200)
    const form = await page.evaluate(() => { const q = document.getElementById('quote'); if (!q) return false; const b = q.getBoundingClientRect(); return b.top < innerHeight && b.bottom > 0 })
    check(`${v.tag}: "Request a quote" still reaches the form with AnyVendor content`, form)
    await page.goto(AV + '/preview?token=3f2b8c1e-5a47-4d09-9e61-7c0a1b2d3e4f', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2500)
    const d = await page.evaluate(() => ({ title: document.querySelector('[data-anyos="hero.title"]')?.textContent, source: document.documentElement.dataset.avSource, robots: document.querySelector('meta[name="robots"]')?.getAttribute('content') }))
    check(`${v.tag}: draft preview shows the draft, noindex`, d.source === 'draft' && d.title === 'Draft headline, not yet published' && /noindex/.test(d.robots || ''), JSON.stringify(d))
    await shot(page, `anyvendor-${v.tag}-draft.jpg`)
    await ctx.close()
  }

  // The editor bridge (anyvendor.bridge/v1) end to end in a browser. A stand-in
  // editor page is served AT the real editor origin (request interception, no
  // network), frames the draft page exactly as the editor does and speaks the
  // parent's protocol. A second stand-in at another origin must get nothing.
  const TOKEN = '3f2b8c1e-5a47-4d09-9e61-7c0a1b2d3e4f'
  const harness = `<!doctype html><meta charset="utf-8"><title>editor stand-in</title>
<iframe id="f" sandbox="allow-scripts allow-same-origin" referrerpolicy="no-referrer" style="width:100%;height:860px;border:0" src="${AV}/preview?token=${TOKEN}&av_edit=1"></iframe>
<script>
  window.got = []; window.nonce = 'n0nce_' + Math.random().toString(36).slice(2) + 'abcdefghij';
  var site = new URL(document.getElementById('f').src).origin;
  addEventListener('message', function (e) { if (e.source === document.getElementById('f').contentWindow) window.got.push({ origin: e.origin, data: e.data }) });
  window.say = function (type, body) { document.getElementById('f').contentWindow.postMessage(Object.assign({ schema: 'anyvendor.bridge/v1', slug: 'tl-executive-cars', type: type }, body || {}), site) };
  var n = 0, t = setInterval(function () { if (window.got.length || ++n > 40) return clearInterval(t); window.say('hello', { nonce: window.nonce }) }, 600);
</script>`
  for (const v of [VIEWS[0], VIEWS[3]]) {
    const ctx = await browser.newContext({ viewport: { width: v.width, height: v.height }, deviceScaleFactor: 1, isMobile: v.mobile, hasTouch: v.mobile })
    const page = await ctx.newPage()
    const posts = []
    page.on('request', r => { if (r.method() === 'POST' && r.url().includes('/api/enquiry')) posts.push(r.url()) })
    await page.route('https://platform.anyvendor.co.uk/**', r => r.fulfill({ contentType: 'text/html', body: harness }))
    await page.route('https://not-the-editor.example.com/**', r => r.fulfill({ contentType: 'text/html', body: harness }))
    await page.goto('https://platform.anyvendor.co.uk/business/website/edit')
    await page.waitForFunction(() => window.got.length > 0, null, { timeout: 30000 }).catch(() => {})
    await page.waitForTimeout(6000) // the second "ready", once hydration has marked every field
    const frame = page.frames().find(f => f.url().includes('/preview'))
    const ready = await page.evaluate(() => window.got.filter(m => m.data && m.data.type === 'ready').pop() || null)
    const d = ready?.data || {}
    check(`${v.tag}: bridge handshake: ready echoes the nonce, lists fields and chapters`, !!frame && d.schema === 'anyvendor.bridge/v1' && d.slug === 'tl-executive-cars' && d.nonce === await page.evaluate(() => window.nonce) && (d.fields || []).length >= 60 && (d.chapters || []).join() === 'plan,journeys,contact' && d.capabilities?.text === true && d.capabilities?.image === true && d.capabilities?.chapters === true, JSON.stringify({ fields: (d.fields || []).length, chapters: d.chapters, caps: d.capabilities, origin: ready?.origin }))
    check(`${v.tag}: bridge messages never carry the token or the page address`, !JSON.stringify(await page.evaluate(() => window.got)).includes(TOKEN) && !JSON.stringify(await page.evaluate(() => window.got.map(m => m.data))).includes('/preview'))
    if (frame) {
      // set (text), then make sure the page's own timed re-apply does not put the saved draft back
      await page.evaluate(() => window.say('set', { field: 'hero.title', value: 'Typed in the editor' }))
      await page.evaluate(() => window.say('set', { field: 'services.travel_photo', value: { src: '/media/journeys/evenings-1600.webp', alt: 'Evening' } }))
      await page.evaluate(() => window.say('set', { field: 'hero.intro', value: '<b>bold</b>' }))
      await page.evaluate(() => window.say('set', { field: 'fleet.note', value: { src: 'javascript:alert(1)', alt: 'x' } }))
      await page.waitForTimeout(4500)
      const live = await frame.evaluate(() => ({
        title: document.querySelector('[data-av-field="hero.title"]')?.textContent,
        intro: document.querySelector('[data-av-field="hero.intro"]')?.innerHTML,
        photo: document.querySelector('img[data-av-field="services.travel_photo"]')?.getAttribute('src'),
        js: !!document.querySelector('[src^="javascript:"]'),
        edit: document.documentElement.dataset.avEdit, source: document.documentElement.dataset.avSource,
      }))
      check(`${v.tag}: bridge set: unsaved text and picture show, as text, and survive the timed re-apply`, live.title === 'Typed in the editor' && live.intro === '&lt;b&gt;bold&lt;/b&gt;' && live.photo === '/media/journeys/evenings-1600.webp' && !live.js && live.source === 'draft', JSON.stringify(live))
      await page.evaluate(() => window.say('highlight', { field: 'quote.title' }))
      await page.waitForTimeout(1500)
      const hi = await frame.evaluate(() => { const el = document.querySelector('[data-av-field="quote.title"]'); const b = el?.getBoundingClientRect(); return { active: el?.hasAttribute('data-av-active'), inView: !!b && b.top >= 0 && b.bottom <= innerHeight } })
      check(`${v.tag}: bridge highlight outlines the field and scrolls it into view`, hi.active && hi.inView, JSON.stringify(hi))
      await shot(page, `anyvendor-bridge-${v.tag}-highlight.jpg`)
      await page.evaluate(() => window.say('chapters', { order: [{ chapter: 'contact', visible: true }, { chapter: 'journeys', visible: false }, { chapter: 'plan', visible: false }] }))
      await page.waitForTimeout(600)
      const ch = await frame.evaluate(() => Array.from(document.querySelectorAll('[data-av-chapter]')).map(e => e.getAttribute('data-av-chapter') + (e.hasAttribute('data-av-hidden') ? ':hidden' : '')))
      check(`${v.tag}: bridge chapters: reorder and hide live; the quote form cannot be hidden`, ch.join() === 'contact,journeys:hidden,plan', ch.join())
      // a click on an editable element selects it in the editor
      await page.evaluate(() => window.say('chapters', { order: [{ chapter: 'plan', visible: true }, { chapter: 'journeys', visible: true }, { chapter: 'contact', visible: true }] }))
      await frame.evaluate(() => { scrollTo(0, 0) })
      await page.waitForTimeout(600)
      await frame.evaluate(() => document.querySelector('[data-av-field="hero.title"]').dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })))
      await page.waitForTimeout(400)
      const sel = await page.evaluate(() => window.got.filter(m => m.data && m.data.type === 'select').map(m => m.data.field))
      check(`${v.tag}: bridge select: a click on an editable element is reported`, sel.join() === 'hero.title', sel.join())
      // no enquiry can leave an editing session: a submit is cancelled before the form sees it
      const sent = await frame.evaluate(() => { const f = document.getElementById('quote'); if (!f) return 'no form'; const ev = new Event('submit', { bubbles: true, cancelable: true }); f.dispatchEvent(ev); return ev.defaultPrevented })
      await page.waitForTimeout(800)
      check(`${v.tag}: bridge: a form submit in the editor frame is cancelled and posts nothing`, sent === true && posts.length === 0, `${sent} posts=${posts.length}`)
      // unknown types and a wrong slug change nothing
      await page.evaluate(() => { window.say('patch', { field: 'hero.title', value: 'old sketch' }); document.getElementById('f').contentWindow.postMessage({ schema: 'anyvendor.bridge/v1', slug: 'another-business', type: 'set', field: 'hero.title', value: 'other tenant' }, '*') })
      await page.waitForTimeout(400)
      check(`${v.tag}: bridge ignores unknown message types and another business's slug`, await frame.evaluate(() => document.querySelector('[data-av-field="hero.title"]')?.textContent) === 'Typed in the editor')
    }
    // any other origin: the browser refuses the frame (frame-ancestors), and nothing answers
    const other = await ctx.newPage()
    await other.route('https://not-the-editor.example.com/**', r => r.fulfill({ contentType: 'text/html', body: harness }))
    await other.goto('https://not-the-editor.example.com/')
    await other.waitForTimeout(5000)
    const leaked = await other.evaluate(() => window.got.length)
    const framed = other.frames().some(f => f.url().includes('/preview') && !f.url().startsWith('chrome-error'))
    let inside = false
    try { const f = other.frames().find(x => x !== other.mainFrame()); inside = f ? await f.evaluate(() => !!document.querySelector('[data-av-chapter]')) : false } catch { inside = false }
    check(`${v.tag}: another origin cannot frame the draft and gets no reply`, leaked === 0 && !inside, `messages=${leaked} framed=${framed} rendered=${inside}`)
    // opened directly (not framed), av_edit=1 does nothing
    const direct = await ctx.newPage()
    await direct.goto(`${AV}/preview?token=${TOKEN}&av_edit=1`, { waitUntil: 'domcontentloaded' })
    await direct.waitForTimeout(2500)
    check(`${v.tag}: outside a frame the bridge is not loaded`, await direct.evaluate(() => !document.querySelector('script[src="/anyvendor-bridge.js"]') && !('AnyVendorBridge' in window) && document.documentElement.dataset.avEdit === undefined))
    await ctx.close()
  }
}

await browser.close()
writeFileSync(join(OUT, 'report.json'), JSON.stringify(report, null, 1))
const failed = report.checks.filter(c => !c.ok)
console.log(`\n${report.checks.length - failed.length}/${report.checks.length} checks passed; ${report.files.length} files`)
process.exit(0)
