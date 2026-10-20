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
    const last = fs.find(f => f.id === 'where') || fs[fs.length - 1]
    await scrollTo(page, last.top + 0.8 * last.span)
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
    check(`${v.tag}: scrolling back returns the same frame`, Buffer.compare(a1, b1) === 0)
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

await browser.close()
writeFileSync(join(OUT, 'report.json'), JSON.stringify(report, null, 1))
const failed = report.checks.filter(c => !c.ok)
console.log(`\n${report.checks.length - failed.length}/${report.checks.length} checks passed; ${report.files.length} files`)
process.exit(0)
