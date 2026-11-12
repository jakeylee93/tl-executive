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
  { tag: 'tablet820', width: 820, height: 1180, dpr: 2, mobile: true },
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

// The magnetic chapters (12 Nov 2026): every chapter, at every size.
const chaptersOf = page => page.evaluate(() => Array.from(document.querySelectorAll('[data-snap]')).filter(e => e.getClientRects().length).map(e => {
  const r = e.getBoundingClientRect()
  return { name: e.dataset.snapName || e.id, id: e.id || e.closest('[id]')?.id || '', top: Math.round(r.top + scrollY), height: Math.round(r.height), hero: !!e.closest('[data-hero]') }
}))
const headerH = page => page.evaluate(() => document.querySelector('header')?.getBoundingClientRect().height || 0)
// where a chapter rests: the opening film's chapters at the very top, the others under the solid header
const restOf = (c, h) => Math.max(0, c.top - (c.hero ? 0 : h))
const settle = async (page) => {
  let last = -1
  for (let i = 0; i < 40; i++) {
    const y = await page.evaluate(() => Math.round(scrollY))
    if (y === last) return y
    last = y
    await page.waitForTimeout(120)
  }
  return last
}

for (const v of VIEWS) {
  const { ctx, page, errors } = await open(v)
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto' })
  const h = await headerH(page)
  const chapters = await chaptersOf(page)
  const fs = await films(page)
  check(`${v.tag}: the page is a run of named chapters, the opening film first`, chapters.length >= 10 && chapters[0].name === 'Welcome' && chapters.every(c => c.name), chapters.map(c => c.name).join(' > '))
  check(`${v.tag}: no film chapter takes more than one screen of scroll`, fs.length === 5 && fs.filter(f => f.id !== 'fleet').every(f => f.span <= 2), fs.map(f => `${f.id}:${Math.round(f.span)}`).join(' '))
  const total = await page.evaluate(() => Math.round(document.documentElement.scrollHeight / innerHeight * 10) / 10)
  check(`${v.tag}: the whole page is short (was about 30 screens)`, total <= 16, `${total} screens`)

  // every chapter: where it rests, whether it fits the screen, its way on, its text size
  const fit = []
  for (const [i, c] of chapters.entries()) {
    await page.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), restOf(c, h))
    await page.waitForTimeout(v.tag === 'phone390' || v.tag === 'desk1440' ? 900 : 350)
    const m = await page.evaluate(({ i }) => {
      const el = Array.from(document.querySelectorAll('[data-snap]')).filter(e => e.getClientRects().length)[i]
      const r = el.getBoundingClientRect()
      const cue = Array.from(el.querySelectorAll('.next-cue')).find(b => b.getClientRects().length)
      const cr = cue?.getBoundingClientRect()
      let small = 99, smallText = ''
      el.querySelectorAll('p, li, dd, dt, span, a, button, h1, h2, h3, h4, h5, summary').forEach(t => {
        if (!t.getClientRects().length || !Array.from(t.childNodes).some(n => n.nodeType === 3 && n.textContent.trim())) return
        const f = parseFloat(getComputedStyle(t).fontSize)
        if (f < small) { small = f; smallText = t.textContent.trim().slice(0, 30) }
      })
      return { top: Math.round(r.top), bottom: Math.round(r.bottom), vh: innerHeight, cue: cue ? cue.textContent.trim() : '', cueOn: !!cr && cr.top >= 0 && cr.bottom <= innerHeight + 1, small, smallText, clipped: el.scrollHeight - el.clientHeight }
    }, { i })
    fit.push({ name: c.name, fits: m.bottom <= m.vh + 2, over: m.bottom - m.vh, cue: m.cue, cueOn: m.cueOn, small: m.small, smallText: m.smallText, hero: c.hero })
    await shot(page, `chapter-${v.tag}-${String(i + 1).padStart(2, '0')}-${c.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.jpg`)
  }
  report[`fit-${v.tag}`] = fit
  const filmAndFleet = fit.filter(f => f.hero)
  check(`${v.tag}: each opening chapter is exactly one screen`, filmAndFleet.every(f => f.fits), filmAndFleet.map(f => `${f.name}:${f.over}`).join(' '))
  const concise = fit.filter(f => !['Get a quote', 'Contact'].includes(f.name))
  const tall = concise.filter(f => !f.fits)
  check(`${v.tag}: every chapter but the form and the questions fits the screen`, tall.length === 0, tall.map(f => `${f.name} +${f.over}px`).join(', '))
  const noCue = fit.slice(0, -1).filter(f => !f.cue || !/^Next/.test(f.cue))
  check(`${v.tag}: every chapter names the next one`, noCue.length === 0, noCue.map(f => f.name).join(', ') || fit.map(f => f.cue.replace(/^Next/, '')).join(' | '))
  const offCue = concise.slice(0, -1).filter(f => f.fits && !f.cueOn)
  check(`${v.tag}: the next-chapter button is on screen in every one-screen chapter`, offCue.length === 0, offCue.map(f => f.name).join(', '))
  const tiny = fit.filter(f => f.small < 11.5)
  check(`${v.tag}: no text smaller than 11.5px`, tiny.length === 0, tiny.map(f => `${f.name}: ${f.small}px "${f.smallText}"`).join(', '))

  // the films play in place: the hero runs to nightfall and holds; Pause stops it
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  const heroReady = await waitReady(page, 'top')
  await page.waitForFunction(() => { const x = document.querySelector('#top video'); return x && x.duration && x.paused && x.currentTime > x.duration * 0.4 }, null, { timeout: 15000 }).catch(() => {})
  const hero = await page.evaluate(() => { const x = document.querySelector('#top video'); return x ? { t: x.currentTime, d: x.duration, paused: x.paused } : null })
  check(`${v.tag}: the hero clip plays once to nightfall and holds`, heroReady && !!hero && hero.paused && Math.abs(hero.t / hero.d - 0.5) < 0.06, JSON.stringify(hero))
  await shot(page, `hero-${v.tag}-held.jpg`)
  {
    const tap = (sel) => page.evaluate(sel => {
      const t = Array.from(document.querySelectorAll(sel)).find(e => e.getClientRects().length)
      if (!t) return 'missing ' + sel
      const r = t.getBoundingClientRect()
      const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
      return el && t.contains(el) && r.bottom <= innerHeight && r.top >= 0 ? 'ok' : (el ? String(el.className || el.tagName).slice(0, 40) : 'nothing')
    }, sel)
    const a = await tap('#top .film-actions a[href="#plan"]')
    const call = await tap('#top .film-actions a[href^="tel:"]')
    const hq = await tap('header a[href="/#plan"]')
    const where = chapters.find(c => c.id === 'where')
    await page.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), where.top)
    await page.waitForTimeout(300)
    const b = await tap('#where .arr-chip')
    check(`${v.tag}: hero quote and call buttons, the header quote button and the closing chips are on screen and tappable`, a === 'ok' && call === 'ok' && hq === 'ok' && b === 'ok', `${a} / ${call} / ${hq} / ${b}`)
    const drive = chapters.find(c => c.id === 'drive')
    await page.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), drive.top)
    await waitReady(page, 'drive')
    await page.waitForTimeout(1500)
    const t1 = await page.evaluate(() => document.querySelector('#drive video')?.currentTime || 0)
    await page.click('#drive .film-toggle')
    await page.waitForTimeout(300)
    const p1 = await page.evaluate(() => { const x = document.querySelector('#drive video'); return { paused: x.paused, t: x.currentTime, label: document.querySelector('#drive .film-toggle').getAttribute('aria-label') } })
    await page.waitForTimeout(700)
    const p2 = await page.evaluate(() => document.querySelector('#drive video').currentTime)
    check(`${v.tag}: a film chapter plays when reached, and Pause stops it`, t1 > 0.3 && p1.paused && Math.abs(p2 - p1.t) < 0.05 && p1.label === 'Play the film', `played=${t1.toFixed(2)} paused=${p1.paused} label=${p1.label}`)
  }

  // real wheel scrolling: settles on the next chapter, returns exactly, never hijacked
  if (!v.mobile) {
    await page.evaluate(() => { document.documentElement.style.scrollBehavior = ''; window.scrollTo({ top: 0, behavior: 'instant' }) })
    await page.waitForTimeout(300)
    await page.mouse.move(v.width / 2, v.height / 2)
    const vh = v.height
    await page.mouse.wheel(0, Math.round(vh * 0.86))
    const y1 = await settle(page)
    await page.mouse.wheel(0, -Math.round(vh * 0.86))
    const y0 = await settle(page)
    check(`${v.tag}: a scroll that ends near the next chapter settles on it, and back again`, Math.abs(y1 - restOf(chapters[1], h)) <= 2 && y0 === 0, `down=${y1} (chapter at ${restOf(chapters[1], h)}) up=${y0}`)
    await page.mouse.wheel(0, Math.round(vh * 0.4))
    const mid = await settle(page)
    check(`${v.tag}: a scroll that stops mid-chapter is left where it is (no forced snap)`, Math.abs(mid - Math.round(vh * 0.4)) <= 2, `rested at ${mid}`)
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
    await page.mouse.wheel(0, Math.round(vh * 2.9))
    const far = await settle(page)
    check(`${v.tag}: one long scroll passes several chapters (the wheel is not captured)`, far >= chapters[2].top - 2, `rested at ${far}; third chapter at ${chapters[2].top}`)
    await page.mouse.wheel(0, -Math.round(vh * 2.9))
    const back = await settle(page)
    check(`${v.tag}: and scrolls straight back up`, back <= 2, `rested at ${back}`)
    // nothing moves by itself
    await page.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), chapters[1].top)
    await page.waitForTimeout(7000)
    const stay = await page.evaluate(() => Math.round(scrollY))
    check(`${v.tag}: nothing advances by itself`, Math.abs(stay - chapters[1].top) <= 1, `after 7 s at ${stay}`)
    await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto' })
  }
  // the next-chapter button goes to the next chapter, and the keyboard pages natively
  {
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
    await page.waitForTimeout(200)
    await page.evaluate(() => Array.from(document.querySelectorAll('#top .next-cue')).find(b => b.getClientRects().length).click())
    const y = await settle(page)
    check(`${v.tag}: "Next" goes to the following chapter`, Math.abs(y - restOf(chapters[1], h)) <= 2, `at ${y}, chapter at ${restOf(chapters[1], h)}`)
  }

  // fleet: one screen; the next tab plays its changeover, the last is reached and its card is on screen
  const fleet = chapters.find(c => c.id === 'fleet')
  await page.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), restOf(fleet, h))
  await waitReady(page, 'fleet')
  await page.waitForTimeout(600)
  await shot(page, `fleet-${v.tag}-0-E-Class.jpg`)
  await page.evaluate(() => document.querySelectorAll('#fleet .garage-tab')[1].click())
  await page.waitForTimeout(1500)
  const moving = await page.evaluate(() => { const x = document.querySelector('#fleet video'); return { t: x.currentTime, d: x.duration, paused: x.paused } })
  await page.waitForFunction(() => { const x = document.querySelector('#fleet video'); return x.paused && Math.abs(x.currentTime / x.duration - 1 / 3) < 0.03 }, null, { timeout: 12000 }).catch(() => {})
  const held = await page.evaluate(() => { const x = document.querySelector('#fleet video'); return { f: x.currentTime / x.duration, paused: x.paused } })
  check(`${v.tag}: choosing the next car plays its changeover and holds on it`, moving.t > 0.2 && !moving.paused && held.paused && Math.abs(held.f - 1 / 3) < 0.03, `moving=${JSON.stringify(moving)} held=${JSON.stringify(held)}`)
  await shot(page, `fleet-${v.tag}-1-S-Class.jpg`)
  for (const [n, name] of [[2, 'V-Class'], [3, 'Tourneo']]) {
    await page.evaluate(n => document.querySelectorAll('#fleet .garage-tab')[n].click(), n)
    await page.waitForFunction(n => { const x = document.querySelector('#fleet video'); return x.paused && Math.abs(x.currentTime / x.duration - n / 3) < 0.03 }, n, { timeout: 12000 }).catch(() => {})
    await page.waitForTimeout(500)
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
  const scrolled = await page.evaluate(() => Math.round(scrollY))
  check(`${v.tag}: the Tourneo tab shows the fourth car, its card on screen, the page not moved`, sel === 'Tourneo' && card === 'ok' && Math.abs(scrolled - restOf(fleet, h)) <= 2, `selected=${sel} card=${card} scroll=${scrolled}/${restOf(fleet, h)}`)

  // journeys: a trip opens in place; the airport details open on request
  {
    const j = chapters.find(c => c.id === 'journeys' || c.name === 'Airports & travel') || chapters[4]
    await page.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), restOf(j, h))
    await page.waitForTimeout(300)
    const before = await page.evaluate(() => document.querySelectorAll('#journeys .journey-body:not([hidden])').length)
    await page.evaluate(() => document.querySelector('#journeys .journey-head').click())
    await page.evaluate(() => document.querySelector('#journeys .jr-airports > summary').click())
    await page.waitForTimeout(300)
    const after = await page.evaluate(() => ({ open: document.querySelectorAll('#journeys .journey-body:not([hidden])').length, air: document.querySelector('#journeys .jr-airports').open, notes: document.querySelectorAll('#journeys .jr-notes li').length }))
    check(`${v.tag}: trips are one line until opened; airport details open on request`, before === 0 && after.open === 1 && after.air && after.notes === 4, `${before} -> ${JSON.stringify(after)}`)
    await shot(page, `journeys-${v.tag}-opened.jpg`)
  }

  // the form: on screen under the header, every control inside the width
  {
    await page.evaluate(() => document.getElementById('quote').scrollIntoView({ block: 'start' }))
    await page.waitForTimeout(400)
    const f = await page.evaluate(() => {
      const q = document.getElementById('quote'); const r = q.getBoundingClientRect()
      const head = document.querySelector('header').getBoundingClientRect().bottom
      const wide = Array.from(q.querySelectorAll('input, select, textarea, button')).filter(e => e.getClientRects().length).filter(e => { const b = e.getBoundingClientRect(); return b.left < -1 || b.right > innerWidth + 1 }).length
      const small = Array.from(q.querySelectorAll('input, select, textarea')).filter(e => e.getClientRects().length).map(e => parseFloat(getComputedStyle(e).fontSize)).filter(x => x < 16).length
      return { top: Math.round(r.top), head: Math.round(head), wide, small }
    })
    check(`${v.tag}: the quote form starts clear of the header, controls within the width, inputs 16px or more`, f.top >= f.head - 1 && f.wide === 0 && f.small === 0, JSON.stringify(f))
    await shot(page, `form-${v.tag}.jpg`)
  }

  // whole page and simple checks
  await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.8) { scrollTo(0, y); await new Promise(r => setTimeout(r, 60)) } })
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
  check(`${v.tag}: no horizontal overflow`, overflow <= 0, `${overflow}px`)
  const keys = await page.evaluate(() => Array.from(new Set(Array.from(document.querySelectorAll('[data-anyos]')).map(e => e.getAttribute('data-anyos')))))
  const missing = fixture.text.filter(k => !keys.includes(k))
  check(`${v.tag}: all ${fixture.text.length} CMS text keys in the DOM`, missing.length === 0, missing.join(', '))
  check(`${v.tag}: no console errors`, errors.length === 0, errors.slice(0, 3).join(' | '))
  await ctx.close()
}

// motion evidence: a real-time recording of wheel scrolling down through the chapters and back up
for (const v of [VIEWS[0], VIEWS[3]]) {
  const ctx = await browser.newContext({ viewport: { width: v.width, height: v.height }, deviceScaleFactor: 1, recordVideo: { dir: OUT, size: { width: v.width, height: v.height } } })
  const page = await ctx.newPage()
  await page.route('https://platform.anyos.co.uk/**', r => r.abort())
  await page.goto(BASE + '/', { waitUntil: 'networkidle' })
  await page.mouse.move(v.width / 2, v.height / 2)
  await page.waitForTimeout(2500)
  for (let i = 0; i < 9; i++) { for (let k = 0; k < 6; k++) { await page.mouse.wheel(0, Math.round(v.height * 0.15)); await page.waitForTimeout(45) } await page.waitForTimeout(1300) }
  for (let i = 0; i < 9; i++) { for (let k = 0; k < 6; k++) { await page.mouse.wheel(0, -Math.round(v.height * 0.15)); await page.waitForTimeout(45) } await page.waitForTimeout(700) }
  const up = await page.evaluate(() => Math.round(scrollY))
  check(`${v.tag}: recorded scroll down nine chapters and back up ends at the top`, up <= 2, `at ${up}`)
  const video = page.video()
  await ctx.close()
  if (video) { const to = `scroll-${v.tag}.webm`; await video.saveAs(join(OUT, to)); await video.delete().catch(() => {}); report.files.push(to) }
}

// reduced motion: posters, no snapping, no film controls; content in normal flow
for (const v of [VIEWS[0], VIEWS[3]]) {
  const { ctx, page } = await open(v, 'reduce')
  const fs = await films(page)
  const r = await page.evaluate(() => ({ snap: getComputedStyle(document.documentElement).scrollSnapType, playing: Array.from(document.querySelectorAll('video')).filter(x => !x.paused).length, toggles: Array.from(document.querySelectorAll('.film-toggle')).filter(b => b.getClientRects().length).length, night: !!document.querySelector('[data-anyos="hero.night.title"]')?.getClientRects().length, overflow: document.documentElement.scrollWidth - innerWidth }))
  check(`${v.tag}: reduced motion: stills only, no snapping, nothing playing, copy all present`, fs.every(f => f.pin === 'off') && /none/.test(r.snap) && r.playing === 0 && r.toggles === 0 && r.night && r.overflow <= 0, JSON.stringify(r))
  await shot(page, `reduced-${v.tag}.jpg`)
  await page.evaluate(() => document.getElementById('fleet').scrollIntoView({ block: 'start' }))
  await page.waitForTimeout(300)
  await shot(page, `reduced-${v.tag}-fleet.jpg`)
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
  for (const v of [VIEWS[0], VIEWS[4], VIEWS[3]]) {
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
