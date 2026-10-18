// Visual evidence for the redesign, run in CI against a local `next start`.
//
//   node tests/browser/capture.mjs <baseUrl> <outDir>
//
// Writes, for phone and desktop: scroll-position frames of the opening
// journey (forward, then the same positions reached backwards), an MP4 of the
// journey built from scroll-driven frames, the fleet convoy driving between
// cars, the reduced-motion still, and full-page screenshots. Also records
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
const STOPS = [0, 0.06, 0.14, 0.24, 0.31, 0.38, 0.46, 0.56, 0.63, 0.7, 0.8, 0.9, 1]

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

async function heroMetrics(page) {
  return page.evaluate(() => {
    const t = document.querySelector('.arr-track')
    const r = t.getBoundingClientRect()
    return { top: r.top + scrollY, span: t.offsetHeight - innerHeight, pin: document.querySelector('[data-arrival]').dataset.pin }
  })
}
async function scrollTo(page, y) {
  await page.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), y)
  await page.evaluate(frames)
  await page.waitForTimeout(60)
}
async function shot(page, name, opts = {}) {
  const path = join(OUT, name)
  await page.screenshot({ path, type: 'jpeg', quality: 82, ...opts })
  report.files.push(name)
  return path
}

for (const v of VIEWS) {
  const { ctx, page, errors } = await open(v)
  const m = await heroMetrics(page)
  check(`${v.tag}: opening journey pinned`, m.pin === 'on', `pin=${m.pin}, span=${m.span}px`)
  // every hero image decoded before capturing
  await page.evaluate(() => Promise.all(Array.from(document.querySelectorAll('[data-arrival] img')).map(i => i.decode().catch(() => {}))))
  for (const s of STOPS) {
    await scrollTo(page, m.top + s * m.span)
    await shot(page, `hero-${v.tag}-${String(Math.round(s * 100)).padStart(3, '0')}.jpg`)
  }
  // reverse: reach the same positions coming back up, compare pixels
  const same = []
  for (const s of [0.24, 0.46, 0.8]) {
    await scrollTo(page, m.top + s * m.span)
    const a = await page.screenshot({ type: 'png' })
    await scrollTo(page, m.top + Math.min(1, s + 0.15) * m.span)
    await scrollTo(page, m.top + s * m.span)
    const b = await page.screenshot({ type: 'png' })
    same.push(Buffer.compare(a, b) === 0)
  }
  check(`${v.tag}: reverse scrolling returns identical frames`, same.every(Boolean), same.join(','))
  // journey film from scroll positions (24 fps, ~5 s)
  if (v.tag === 'phone390' || v.tag === 'desk1440') {
    const dir = join(OUT, `frames-${v.tag}`)
    mkdirSync(dir, { recursive: true })
    const N = 120
    for (let i = 0; i <= N; i++) {
      await scrollTo(page, m.top + (i / N) * m.span)
      await page.screenshot({ path: join(dir, `f${String(i).padStart(4, '0')}.jpg`), type: 'jpeg', quality: 80 })
    }
    const mp4 = join(OUT, `journey-${v.tag}.mp4`)
    const r = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', '24', '-i', join(dir, 'f%04d.jpg'), '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '22', mp4])
    check(`${v.tag}: journey video encoded`, r.status === 0, r.stderr?.toString().slice(0, 200))
    if (r.status === 0) report.files.push(`journey-${v.tag}.mp4`)
    rmSync(dir, { recursive: true, force: true })
  }

  // fleet: the convoy drives in, then between cars
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; document.getElementById('fleet').scrollIntoView({ block: 'start' }) })
  await page.waitForTimeout(3600)
  await shot(page, `fleet-${v.tag}-0-entered.jpg`)
  for (let n = 1; n <= 3; n++) {
    await page.evaluate(() => document.querySelector('.garage-steps button:last-of-type').click())
    for (const t of [250, 650, 1100]) {
      await page.waitForTimeout(t === 250 ? 250 : t === 650 ? 400 : 450)
      if (v.tag === 'desk1440' || v.tag === 'phone390') await shot(page, `fleet-${v.tag}-${n}-t${t}.jpg`)
    }
    await page.waitForTimeout(2600)
    await shot(page, `fleet-${v.tag}-${n}-stopped.jpg`)
  }
  // a filmed drive: Previous back to the first car, frames every ~70 ms
  if (v.tag === 'desk1440' || v.tag === 'phone390') {
    const dir = join(OUT, `fleet-frames-${v.tag}`)
    mkdirSync(dir, { recursive: true })
    await page.evaluate(() => document.querySelector('.garage-tab').click())
    for (let i = 0; i < 60; i++) {
      await page.screenshot({ path: join(dir, `f${String(i).padStart(4, '0')}.jpg`), type: 'jpeg', quality: 80 })
    }
    const mp4 = join(OUT, `fleet-${v.tag}.mp4`)
    const r = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', '15', '-i', join(dir, 'f%04d.jpg'), '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '22', mp4])
    check(`${v.tag}: fleet drive video encoded`, r.status === 0, r.stderr?.toString().slice(0, 200))
    if (r.status === 0) report.files.push(`fleet-${v.tag}.mp4`)
    rmSync(dir, { recursive: true, force: true })
    await page.waitForTimeout(3200)
    for (let n = 0; n < 3; n++) { await page.evaluate(() => document.querySelector('.garage-steps button:last-of-type').click()); await page.waitForTimeout(3300) }
  }
  const sel = await page.evaluate(() => document.querySelector('.garage-tab[aria-selected="true"]')?.textContent)
  check(`${v.tag}: Next reaches the fourth car`, sel === 'Tourneo', `selected=${sel}`)

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
  const m = await heroMetrics(page)
  check(`${v.tag}: reduced motion does not pin`, m.pin === 'off', `pin=${m.pin}`)
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
