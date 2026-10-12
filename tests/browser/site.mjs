// Browser QA for the T&L site.
//
//   node tests/browser/site.mjs <baseUrl> [screenshotDir]
//
// Env: PLAYWRIGHT_MODULE (path to playwright), CHROMIUM_PATH (optional),
// AXE_PATH (axe.min.js; enables the accessibility audit),
// VERCEL_BYPASS_FROM_CLI=1 to reach an SSO-protected Vercel preview using the
// project's existing automation-bypass header — read from `vercel curl
// --debug` in memory, sent only to the preview host, never printed.
//
// Safety: reads anyOS content only; the edit-mode smoke test uses a dummy
// token and never presses Save; the enquiry is submitted only when the
// deployment itself reports dry-run mode.
import { createRequire } from 'node:module'
import { readFileSync, existsSync, mkdirSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright')
const BASE = (process.argv[2] || 'http://localhost:3100').replace(/\/$/, '')
const SHOTS = process.argv[3] || ''
if (SHOTS) mkdirSync(SHOTS, { recursive: true })
const AXE = process.env.AXE_PATH && existsSync(process.env.AXE_PATH) ? readFileSync(process.env.AXE_PATH, 'utf8') : null

let bypass = null
if (process.env.VERCEL_BYPASS_FROM_CLI === '1') {
  const r = spawnSync('vercel', ['curl', '/api/enquiry', '--deployment', BASE, '--debug'], { encoding: 'utf8', env: process.env })
  const m = `${r.stdout}\n${r.stderr}`.match(/Executing: curl .*?--header "([^:"]+): ([^"]+)"/)
  if (m) bypass = { name: m[1], value: m[2] }
  console.log(bypass ? 'INFO  preview bypass header obtained (value not shown)' : 'WARN  no bypass header found')
}
const host = new URL(BASE).host

const results = []
const check = (name, ok, detail = '') => { results.push({ name, ok }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  — ${detail}` : ''}`) }
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {})
const consoleErrors = []

async function open(path, { width = 390, height = 844, reducedMotion = 'no-preference' } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, isMobile: width < 600, hasTouch: width < 1024, reducedMotion, deviceScaleFactor: 1 })
  if (bypass) {
    await ctx.route(url => new URL(url).host === host, route => route.continue({ headers: { ...route.request().headers(), [bypass.name]: bypass.value } }))
  }
  const page = await ctx.newPage()
  page.on('pageerror', e => consoleErrors.push(`${path} @${width}: ${e.message}`))
  page.on('console', m => { if (m.type() === 'error' && !/favicon/.test(m.text())) consoleErrors.push(`${path} @${width}: ${m.text()}`) })
  await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: 90000 })
  return { ctx, page }
}
const heroVars = page => page.evaluate(() => {
  const h = document.querySelector('[data-hero]')
  const g = n => getComputedStyle(h).getPropertyValue(n).trim()
  return { night: +g('--night'), cam: +g('--cam'), bl: parseFloat(g('--bl')), ry: parseFloat(g('--ry')), p: +g('--p'), pin: h.dataset.pin }
})
const heroSpan = page => page.evaluate(() => { const t = document.querySelector('.hero-track'); return t.getBoundingClientRect().height - innerHeight })
const future = days => new Date(Date.now() + days * 864e5).toISOString().slice(0, 10)

// 1. Mode check (safety gate for the submission test)
const modeRes = await (async () => { const { ctx, page } = await open('/api/enquiry', { width: 800 }); const t = await page.textContent('body'); await ctx.close(); try { return JSON.parse(t) } catch { return {} } })()
check('enquiry API reports dry-run on this deployment', modeRes.mode === 'dry-run', JSON.stringify(modeRes))

// 2. Hero storyboard: forward then reverse, phone and desktop
for (const [w, h] of [[375, 812], [390, 844], [430, 932], [1440, 900]]) {
  const { ctx, page } = await open('/', { width: w, height: h })
  const span = await heroSpan(page)
  const fractions = [0, 0.25, 0.5, 0.75, 1]
  const fwd = []
  for (const f of fractions) {
    await page.evaluate(y => window.scrollTo(0, y), Math.round(span * f))
    await page.waitForTimeout(260)
    fwd.push(await heroVars(page))
    if (SHOTS && (f === 0 || f === 0.5 || f === 1)) await page.screenshot({ path: `${SHOTS}/hero-${w}-${Math.round(f * 100)}.png` })
  }
  const rev = []
  for (const f of [...fractions].reverse()) {
    await page.evaluate(y => window.scrollTo(0, y), Math.round(span * f))
    await page.waitForTimeout(260)
    rev.unshift(await heroVars(page))
  }
  const increasing = fwd.every((v, i) => i === 0 || v.night >= fwd[i - 1].night - 1e-3) && fwd[4].night > 0.95 && fwd[0].night < 0.05
  const reversible = fwd.every((v, i) => Math.abs(v.night - rev[i].night) < 0.02 && Math.abs(v.bl - rev[i].bl) < 1.5 && Math.abs(v.cam - rev[i].cam) < 0.01)
  const lightTravels = fwd[4].bl - fwd[0].bl > 90
  check(`hero @${w}: day → night scene change plays forward`, increasing && lightTravels, `night ${fwd.map(v => v.night.toFixed(2)).join('→')} · light ${fwd[0].bl}°→${fwd[4].bl}°`)
  check(`hero @${w}: reverse scroll returns to the same frames`, reversible)
  check(`hero @${w}: pinned stage (pin=${fwd[0].pin})`, fwd[0].pin === 'on' && span > h * 0.5 && span < h * 0.95, `pinned distance ${Math.round(span)}px`)
  // Real wheel scrolling also drives it
  await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(200)
  for (let i = 0; i < 6; i++) { await page.mouse.wheel(0, 120); await page.waitForTimeout(60) }
  await page.waitForTimeout(250)
  check(`hero @${w}: native wheel scroll moves the scene`, (await heroVars(page)).p > 0.05)
  await ctx.close()
}

// 3. Reduced motion: static daylight frame, nothing pinned
{
  const { ctx, page } = await open('/', { width: 390, height: 844, reducedMotion: 'reduce' })
  await page.evaluate(() => window.scrollTo(0, 400)); await page.waitForTimeout(300)
  const v = await heroVars(page)
  const pinned = await page.evaluate(() => getComputedStyle(document.querySelector('.hero-stage')).position)
  check('reduced motion: static scene, no pin', v.night === 0 && pinned !== 'sticky', `night=${v.night} position=${pinned}`)
  await ctx.close()
}

// 4. Text zoom 200%: hero unpins rather than clipping content
{
  const { ctx, page } = await open('/', { width: 390, height: 844 })
  await page.addStyleTag({ content: 'html{font-size:200% !important}' })
  await page.evaluate(() => window.dispatchEvent(new Event('resize'))); await page.waitForTimeout(400)
  const r = await page.evaluate(() => {
    const h = document.querySelector('[data-hero]'); const c = h.querySelector('[data-hero-content]'); const s = h.querySelector('.hero-stage')
    return { pin: h.dataset.pin, clipped: c.scrollHeight > s.clientHeight + 2 }
  })
  check('text zoom 200%: hero unpins and nothing is clipped', r.pin === 'off' && !r.clipped, JSON.stringify(r))
  await ctx.close()
}

// 5. Keyboard: skip link and phone menu
{
  const { ctx, page } = await open('/', { width: 1440, height: 900 })
  await page.keyboard.press('Tab')
  check('skip link is the first tab stop', (await page.evaluate(() => document.activeElement?.textContent?.trim())) === 'Skip to content')
  await page.keyboard.press('Enter'); await page.waitForTimeout(150)
  check('skip link moves focus to main', (await page.evaluate(() => document.activeElement?.id)) === 'main')
  await ctx.close()
}
{
  const { ctx, page } = await open('/', { width: 390, height: 844 })
  const btn = page.locator('button[aria-controls="site-menu"]')
  await btn.focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(150)
  check('phone menu opens with focus inside', (await btn.getAttribute('aria-expanded')) === 'true' && await page.evaluate(() => Boolean(document.activeElement?.closest('#site-menu'))))
  await page.keyboard.press('Escape'); await page.waitForTimeout(150)
  check('Escape closes the menu and returns focus', (await btn.getAttribute('aria-expanded')) === 'false' && (await page.evaluate(() => document.activeElement?.getAttribute('aria-controls'))) === 'site-menu')
  await ctx.close()
}

// 6. Planner: journey types, flight fields, selectors prefill in place
{
  const { ctx, page } = await open('/', { width: 390, height: 844 })
  await page.getByRole('radio', { name: 'Airport' }).first().click()
  check('Airport journey type shows flight fields', await page.locator('#plan-flightIn').isVisible())
  await page.getByRole('radio', { name: 'Business' }).first().click()
  check('Business journey type hides flight fields', !(await page.locator('#plan-flightIn').count()))

  await page.getByRole('tab', { name: 'V-Class', exact: true }).click()
  check('fleet tab switches the centred vehicle in place', await page.locator('#fleet-panel-mercedes-v-class').isVisible() && !(await page.locator('#fleet-panel-mercedes-e-class').isVisible()))
  await page.getByRole('link', { name: /Request a quote for the Mercedes-Benz V-Class/ }).click(); await page.waitForTimeout(900)
  check('"Choose this car" prefills the planner', (await page.locator('#plan-vehicle').inputValue()) === 'Mercedes V Class')

  await page.getByRole('tab', { name: 'Business & London' }).click(); await page.waitForTimeout(700)
  const svc = await page.evaluate(() => ({ evenings: !document.getElementById('svc-panel-evenings').hidden, travel: !document.getElementById('svc-panel-travel').hidden, plate: getComputedStyle(document.querySelectorAll('#services .plate-fade')[1]).opacity }))
  check('services change in place (panel and photograph)', svc.evenings && !svc.travel && svc.plate === '1', JSON.stringify(svc))

  await page.getByRole('radio', { name: 'Loughton' }).click()
  await page.getByRole('radio', { name: 'Stansted' }).click()
  await page.getByRole('link', { name: /Plan this journey/ }).click(); await page.waitForTimeout(900)
  const v = await page.evaluate(() => ({ p: document.querySelector('#plan-pickup').value, d: document.querySelector('#plan-destination').value, f: Boolean(document.querySelector('#plan-flightIn')) }))
  check('route builder prefills pick-up, airport and flight fields', v.p === 'Loughton' && v.d === 'Stansted Airport' && v.f, JSON.stringify(v))
  await ctx.close()
}

// 7. Validation and (dry-run only) submission
{
  const { ctx, page } = await open('/', { width: 390, height: 844 })
  await page.locator('#plan button[type=submit]').click(); await page.waitForTimeout(300)
  const s = await page.evaluate(() => ({ role: document.activeElement?.getAttribute('role'), items: document.activeElement?.querySelectorAll('li').length }))
  check('empty submit focuses an error summary of 7 fields', s.role === 'alert' && s.items === 7, JSON.stringify(s))
  if (modeRes.mode === 'dry-run') {
    await page.locator('#plan-pickup').fill('Coppice Row, Theydon Bois')
    await page.locator('#plan-destination').fill('Heathrow Airport Terminal 5')
    await page.locator('#plan-travelDate').fill(future(21))
    await page.locator('#plan-travelTime').fill('05:30')
    await page.locator('#plan-name').fill('Browser Test')
    await page.locator('#plan-phone').fill('07700 900123')
    await page.locator('#plan-email').fill('browser.test@example.com')
    await page.locator('#plan button[type=submit]').click()
    const ok = await page.waitForSelector('#plan-result', { timeout: 15000 }).then(() => true).catch(() => false)
    const heading = ok ? await page.evaluate(() => document.activeElement?.textContent || '') : ''
    check('dry-run submission shows the test-mode result (nothing sent)', /Test mode/.test(heading), heading)
  } else {
    console.log('SKIP  submission (deployment is not in dry-run mode)')
  }
  await ctx.close()
}

// 8. anyOS: live hydration and edit-mode smoke test (dummy token, no save)
{
  const { ctx, page } = await open('/', { width: 1440, height: 900 })
  await page.waitForFunction(() => document.querySelector('#services-title')?.textContent === 'Tailored to Your Needs', null, { timeout: 10000 }).catch(() => {})
  check('saved anyOS override is applied to the new markup', (await page.locator('#services-title').textContent()) === 'Tailored to Your Needs')
  await ctx.close()
}
{
  const { ctx, page } = await open('/?anyos_edit=qa-dummy-token-no-save', { width: 1440, height: 900 })
  check('anyOS edit bar appears', await page.waitForSelector('.anyos-editbar', { timeout: 10000 }).then(() => true).catch(() => false))
  const t = page.locator('[data-anyos="hero.title"]')
  await t.click()
  check('clicking hero text starts an in-place edit', (await t.getAttribute('contenteditable')) === 'true')
  await page.locator('.anyos-texttools .anyos-cancel').click()
  const fig = page.locator('img[data-anyos-img="about.image"]')
  await fig.scrollIntoViewIfNeeded(); await page.waitForTimeout(300)
  const box = await fig.boundingBox()
  await page.mouse.click(box.x + box.width * 0.85, box.y + 40)
  const picker = await page.waitForSelector('.anyos-imgbox', { timeout: 5000 }).then(() => true).catch(() => false)
  check('about photograph opens the anyOS image picker through its overlays', picker)
  if (picker) await page.locator('.anyos-imgbox .anyos-cancel').first().click()
  await ctx.close()
}

// 9. Fixed action bar never covers the hero, the planner or a focused field
{
  const { ctx, page } = await open('/', { width: 390, height: 844 })
  const shown = () => page.evaluate(() => { const b = document.querySelector('.mobile-bar'); return b && getComputedStyle(b).opacity === '1' && !b.hasAttribute('inert') })
  check('action bar hidden over the hero', !(await shown()))
  await page.locator('#fleet').scrollIntoViewIfNeeded(); await page.evaluate(() => window.scrollBy(0, 300)); await page.waitForTimeout(700)
  check('action bar appears after the hero', await shown())
  await page.locator('#plan-name').scrollIntoViewIfNeeded(); await page.locator('#plan-name').focus(); await page.waitForTimeout(600)
  check('action bar steps aside for the planner and typing', !(await shown()))
  await ctx.close()
}

// 10. Layout: no sideways scroll at 375/390/430/820/1440; touch targets
for (const [w, h] of [[375, 812], [390, 844], [430, 932], [820, 1180], [1440, 900]]) {
  const { ctx, page } = await open('/', { width: w, height: h })
  const over = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
  check(`no horizontal overflow @${w}`, over <= 0, `${over}px`)
  if (w === 390) {
    const small = await page.evaluate(() => {
      const out = []
      for (const el of document.querySelectorAll('a[href], button, input:not([type=hidden]), select, textarea, summary')) {
        if (el.closest('[aria-hidden="true"]') || el.closest('[hidden]') || el.closest('[inert]')) continue
        const r = el.getBoundingClientRect(); if (!r.width || !r.height) continue
        const inline = getComputedStyle(el).display === 'inline' && el.closest('p, dd, li')?.textContent.trim().length > el.textContent.trim().length + 3
        if (inline) continue
        const t = el.closest('label') && (el.type === 'checkbox' || el.type === 'radio') ? el.closest('label').getBoundingClientRect() : r
        if (t.height < 43.5 || t.width < 43.5) out.push(`${el.tagName.toLowerCase()} "${(el.getAttribute('aria-label') || el.textContent || el.name || '').trim().slice(0, 28)}" ${Math.round(t.width)}×${Math.round(t.height)}`)
      }
      return out
    })
    check('touch targets ≥ 44×44 px on a phone', small.length === 0, small.slice(0, 6).join('; '))
  }
  await ctx.close()
}

// 10b. Chapter screenshots for review
if (SHOTS) {
  for (const [w, h] of [[390, 844], [1440, 900]]) {
    const { ctx, page } = await open('/', { width: w, height: h })
    for (const id of ['plan', 'fleet', 'services', 'airports', 'about', 'contact']) {
      await page.evaluate(i => document.getElementById(i).scrollIntoView({ block: 'start', behavior: 'instant' }), id)
      await page.waitForTimeout(450)
      await page.screenshot({ path: `${SHOTS}/section-${id}-${w}.png` })
    }
    await ctx.close()
  }
}

// 11. axe-core (WCAG 2.2 A/AA + best practice)
if (AXE) {
  for (const [path, width] of [['/', 390], ['/', 1440], ['/airport-transfers', 390], ['/airport-transfers', 1440], ['/privacy', 390], ['/credits', 1440]]) {
    const { ctx, page } = await open(path, { width, height: 900, reducedMotion: 'reduce' })
    await page.addScriptTag({ content: AXE })
    const res = await page.evaluate(async () => await window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] }))
    check(`axe: no violations on ${path} @${width}`, res.violations.length === 0, res.violations.map(x => `${x.id}(${x.nodes.length}): ${x.nodes.slice(0, 2).map(n => n.target.join(' ')).join(', ')}`).join(' | '))
    await ctx.close()
  }
  const { ctx, page } = await open('/', { width: 390, height: 844, reducedMotion: 'reduce' })
  await page.locator('#plan button[type=submit]').click(); await page.waitForTimeout(300)
  await page.addScriptTag({ content: AXE })
  const res = await page.evaluate(async () => await window.axe.run(document.querySelector('#plan'), { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] }))
  check('axe: planner error state has no violations', res.violations.length === 0, res.violations.map(x => x.id).join(', '))
  await ctx.close()
}

check('no console or page errors', consoleErrors.length === 0, consoleErrors.slice(0, 4).join(' | '))
await browser.close()
const failed = results.filter(r => !r.ok)
console.log(`\n${results.length - failed.length}/${results.length} checks passed`)
process.exit(failed.length ? 1 : 0)
