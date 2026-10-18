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
  const g = n => +getComputedStyle(h).getPropertyValue(n).trim()
  const d = document.querySelector('[data-hero-copy="d"]')
  return { p: g('--p'), ext: g('--ext-o'), extS: g('--ext-s'), cab: g('--cab-o'), road: g('--road-o'), ca: g('--ca'), cd: g('--cd'), pin: h.dataset.pin, finalLive: d && !d.hasAttribute('inert') }
})
const heroSpan = page => page.evaluate(() => { const t = document.querySelector('.hero-track'); return t.getBoundingClientRect().height - innerHeight })
const future = days => new Date(Date.now() + days * 864e5).toISOString().slice(0, 10)
const heading = page => page.evaluate(() => document.querySelector('#quote h3')?.textContent || '')
const cont = page => page.locator('#quote button[type=submit]').click()

// 1. Mode check (safety gate for the submission test)
const modeRes = await (async () => { const { ctx, page } = await open('/api/enquiry', { width: 800 }); const t = await page.textContent('body'); await ctx.close(); try { return JSON.parse(t) } catch { return {} } })()
check('enquiry API reports dry-run on this deployment', modeRes.mode === 'dry-run', JSON.stringify(modeRes))

// 2. Opening journey: car → cabin → road → quote, forward then reverse
for (const [w, h] of [[375, 812], [390, 844], [430, 932], [1440, 900]]) {
  const { ctx, page } = await open('/', { width: w, height: h })
  const span = await heroSpan(page)
  const fractions = [0, 0.2, 0.47, 0.8, 1]
  const fwd = []
  for (const f of fractions) {
    await page.evaluate(y => window.scrollTo(0, y), Math.round(span * f))
    await page.waitForTimeout(280)
    fwd.push(await heroVars(page))
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/hero-${w}-${Math.round(f * 100)}.png` })
  }
  const rev = []
  for (const f of [...fractions].reverse()) {
    await page.evaluate(y => window.scrollTo(0, y), Math.round(span * f))
    await page.waitForTimeout(280)
    rev.unshift(await heroVars(page))
  }
  const [a, push, cabin, road, end] = fwd
  const story = a.ext > 0.99 && a.ca > 0.99 && push.extS > 1.05 && cabin.cab > 0.9 && cabin.ext < 0.05 && road.road > 0.9 && road.cab < 0.05 && end.cd > 0.95 && end.finalLive && !a.finalLive
  const reversible = fwd.every((v, i) => ['ext', 'extS', 'cab', 'road', 'ca', 'cd'].every(k => Math.abs(v[k] - rev[i][k]) < 0.02))
  check(`journey @${w}: car → push-in → cabin → road → quote`, story, fwd.map(v => `p${v.p.toFixed(2)} ext${v.ext.toFixed(2)}×${v.extS.toFixed(2)} cab${v.cab.toFixed(2)} road${v.road.toFixed(2)} quote${v.cd.toFixed(2)}`).join(' | '))
  check(`journey @${w}: reverse scroll returns to the same frames`, reversible)
  check(`journey @${w}: pinned for about two screens, not endless`, a.pin === 'on' && span > h * 1.6 && span < h * 2.2, `pinned distance ${Math.round(span)}px`)
  await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(200)
  for (let i = 0; i < 6; i++) { await page.mouse.wheel(0, 120); await page.waitForTimeout(60) }
  await page.waitForTimeout(250)
  check(`journey @${w}: native wheel scroll moves the camera`, (await heroVars(page)).p > 0.02)
  // Direct navigation past the journey
  await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(150)
  await page.locator('[data-hero-copy="a"] a[href="#plan"]').click(); await page.waitForTimeout(900)
  check(`journey @${w}: "Request a quote" jumps straight to the form`, await page.evaluate(() => { const r = document.getElementById('quote').getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0 }))
  await ctx.close()
}

// 3. Reduced motion: still arrival frame, nothing pinned or hidden
{
  const { ctx, page } = await open('/', { width: 390, height: 844, reducedMotion: 'reduce' })
  await page.evaluate(() => window.scrollTo(0, 400)); await page.waitForTimeout(300)
  const r = await page.evaluate(() => ({ pos: getComputedStyle(document.querySelector('.hero-stage')).position, cabin: getComputedStyle(document.querySelector('.scene-cabin')).display, ca: getComputedStyle(document.querySelector('[data-hero-copy="a"]')).opacity }))
  check('reduced motion: still frame with its copy, no pin', r.pos !== 'sticky' && r.cabin === 'none' && r.ca === '1', JSON.stringify(r))
  await ctx.close()
}

// 4. Text zoom 200%: the journey unpins rather than clipping content
{
  const { ctx, page } = await open('/', { width: 390, height: 844 })
  await page.addStyleTag({ content: 'html{font-size:200% !important}' })
  await page.evaluate(() => window.dispatchEvent(new Event('resize'))); await page.waitForTimeout(400)
  const r = await page.evaluate(() => {
    const h = document.querySelector('[data-hero]'); const c = h.querySelector('[data-hero-content]')
    return { pin: h.dataset.pin, clipped: c.scrollHeight > c.clientHeight + 2 || c.getBoundingClientRect().height > h.querySelector('.hero-stage').clientHeight + 2 }
  })
  check('text zoom 200%: journey unpins and nothing is clipped', r.pin === 'off' && !r.clipped, JSON.stringify(r))
  await ctx.close()
}

// 5. Keyboard and navigation
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
  const bar = await page.evaluate(() => {
    const vis = sel => { const el = document.querySelector(sel); const r = el?.getBoundingClientRect(); return Boolean(r && r.width && r.right <= innerWidth && r.left >= 0) }
    return { quote: vis('header a[href="/#plan"]'), call: vis('header a[href^="tel:"]'), menu: vis('button[aria-controls="site-menu"]') }
  })
  check('phone header keeps Quote, Call and Menu in reach', bar.quote && bar.call && bar.menu, JSON.stringify(bar))
  const btn = page.locator('button[aria-controls="site-menu"]')
  await btn.focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(200)
  const opened = await page.evaluate(() => ({ inside: Boolean(document.activeElement?.closest('#site-menu')), locked: document.documentElement.style.overflow === 'hidden' }))
  check('menu drawer opens with focus inside and the page locked', (await btn.getAttribute('aria-expanded')) === 'true' && opened.inside && opened.locked, JSON.stringify(opened))
  await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Shift+Tab')
  check('focus stays within the drawer and its toggle', await page.evaluate(() => Boolean(document.activeElement?.closest('#site-menu') || document.activeElement?.getAttribute('aria-controls') === 'site-menu')))
  await page.keyboard.press('Escape'); await page.waitForTimeout(150)
  check('Escape closes the drawer and returns focus', (await btn.getAttribute('aria-expanded')) === 'false' && (await page.evaluate(() => document.activeElement?.getAttribute('aria-controls'))) === 'site-menu' && (await page.evaluate(() => document.documentElement.style.overflow)) !== 'hidden')
  await ctx.close()
}

// 6. Fleet: one car at a time, explicit controls, prefill + chosen state
{
  const { ctx, page } = await open('/', { width: 390, height: 844 })
  await page.locator('#fleet').scrollIntoViewIfNeeded()
  const before = await page.evaluate(() => scrollY)
  await page.getByRole('button', { name: /^Next car:/ }).click(); await page.waitForTimeout(700)
  check('fleet Next shows the next car in place, page not moved', await page.locator('#fleet-panel-mercedes-s-class').isVisible() && !(await page.locator('#fleet-panel-mercedes-e-class').isVisible()) && Math.abs((await page.evaluate(() => scrollY)) - before) < 4)
  await page.getByRole('button', { name: /^Previous car:/ }).click(); await page.waitForTimeout(500)
  check('fleet Previous returns', await page.locator('#fleet-panel-mercedes-e-class').isVisible())
  await page.getByRole('tab', { name: 'V-Class', exact: true }).click(); await page.waitForTimeout(500)
  check('fleet tab chooses directly', await page.locator('#fleet-panel-mercedes-v-class').isVisible())
  await page.getByRole('link', { name: /Request a quote for the Mercedes-Benz V-Class/ }).click(); await page.waitForTimeout(900)
  check('"Choose this car" hands the car to the quote and shows it chosen', await page.getByRole('link', { name: /Chosen for your quote: Mercedes-Benz V-Class/ }).count() === 1)
  await ctx.close()
}

// 7. Quote wizard
{
  const { ctx, page } = await open('/', { width: 390, height: 844 })
  await page.locator('#quote').scrollIntoViewIfNeeded()
  await cont(page); await page.waitForTimeout(300)
  const s0 = await page.evaluate(() => ({ role: document.activeElement?.getAttribute('role'), items: document.activeElement?.querySelectorAll('li').length }))
  check('step 1: continuing without a journey type focuses one error', s0.role === 'alert' && s0.items === 1, JSON.stringify(s0))
  await page.locator('label.choice', { hasText: 'Other' }).click()
  check('"Other" opens its own labelled description field', await page.getByLabel('Describe your journey').isVisible())
  await cont(page); await page.waitForTimeout(300)
  check('"Other" description is required', await page.locator('#plan-journeyDetails-error').isVisible())
  await page.getByLabel('Describe your journey').fill('Southampton for a cruise, four of us')
  await cont(page); await page.waitForTimeout(400)
  check('step 2 follows, with focus on its heading', /Where, and when/.test(await heading(page)) && await page.evaluate(() => document.activeElement?.tagName) === 'H3')
  check('non-airport journeys ask no flight questions', !(await page.locator('[name=airportDirection]').count()) && !(await page.locator('#plan-flightIn, #plan-flightOut').count()))
  // Root QA 18 Oct: a cruise "terminal" must not imply a flight; a named airport still does.
  await page.locator('#plan-destination').fill('Southampton cruise terminal'); await page.waitForTimeout(150)
  check('"Southampton cruise terminal" asks no flight questions', !(await page.locator('[name=airportDirection]').count()) && !(await page.locator('#plan-flightIn, #plan-flightOut').count()))
  await page.locator('#plan-destination').fill('Heathrow Terminal 5'); await page.waitForTimeout(150)
  check('a named airport ("Heathrow Terminal 5") still asks which way', await page.locator('[name=airportDirection]').count() === 2)
  await page.locator('#plan-destination').fill('Southampton cruise terminal'); await page.waitForTimeout(150)
  await page.getByRole('button', { name: 'Back' }).click(); await page.waitForTimeout(300)
  check('Back keeps what was typed', (await page.getByLabel('Describe your journey').inputValue()) === 'Southampton for a cruise, four of us')

  await page.locator('label.choice', { hasText: 'Airport' }).click(); await cont(page); await page.waitForTimeout(400)
  check('airport: direction is asked first', await page.locator('[name=airportDirection]').count() === 2)
  await page.locator('label.choice', { hasText: 'Going to the airport' }).click(); await page.waitForTimeout(150)
  check('going to the airport: departing flight only', await page.locator('#plan-flightOut').isVisible() && !(await page.locator('#plan-flightIn').count()))
  await page.getByLabel('Add a return journey').check(); await page.waitForTimeout(150)
  check('with a return: return date and the flight home appear', await page.locator('#plan-returnDate').isVisible() && await page.getByLabel('Return flight number (landing)').isVisible())
  await page.locator('label.choice', { hasText: 'Being collected from it' }).click(); await page.waitForTimeout(150)
  check('collection: arriving flight first, return departing', await page.getByLabel('Arriving flight number').isVisible() && await page.getByLabel('Return flight number (departing)').isVisible())
  await page.getByLabel('Add a return journey').uncheck()
  await page.locator('label.choice', { hasText: 'Going to the airport' }).click()
  await page.locator('#plan-pickup').fill('Coppice Row, Theydon Bois')
  await page.locator('#plan-destination').fill('Heathrow Airport Terminal 5')
  await page.locator('#plan-travelDate').fill(future(21))
  await page.locator('#plan-travelTime').fill('05:30')
  await page.locator('#plan-flightOut').fill('BA117')
  await cont(page); await page.waitForTimeout(400)
  check('step 3: car and passengers', /Who’s travelling/.test(await heading(page)))
  await page.locator('label.choice', { hasText: 'Mercedes-Benz E-Class' }).click()
  for (let i = 0; i < 4; i++) await page.getByRole('button', { name: 'One more passenger' }).click()
  await page.waitForTimeout(200)
  check('more passengers than the chosen car seats: flagged at once', await page.locator('#plan-vehicle-error').isVisible())
  await cont(page); await page.waitForTimeout(300)
  check('…and Continue is blocked until the car is changed', /Who’s travelling/.test(await heading(page)))
  await page.locator('label.choice', { hasText: 'Mercedes-Benz V-Class' }).click(); await page.waitForTimeout(150)
  check('choosing a car that fits clears it', !(await page.locator('#plan-vehicle-error').count()))
  await cont(page); await page.waitForTimeout(400)
  await cont(page); await page.waitForTimeout(300)
  check('step 4: empty contact details give three errors', await page.evaluate(() => document.activeElement?.querySelectorAll('li').length) === 3)
  if (modeRes.mode === 'dry-run') {
    await page.locator('#plan-name').fill('Browser Test')
    await page.locator('#plan-phone').fill('07700 900123')
    await page.locator('#plan-email').fill('browser.test@example.com')
    check('review lists the journey, with Edit links', (await page.getByRole('button', { name: /^Edit / }).count()) === 3)
    await cont(page)
    const ok = await page.waitForSelector('#plan-result', { timeout: 15000 }).then(() => true).catch(() => false)
    const h = ok ? await page.evaluate(() => document.activeElement?.textContent || '') : ''
    check('dry-run submission shows the test-mode result (nothing sent)', /Test mode/.test(h), h)
  } else {
    console.log('SKIP  submission (deployment is not in dry-run mode)')
  }
  await ctx.close()
}
// 7b. Regressions from the 18 Oct source review (phone width)
{
  const { ctx, page } = await open('/', { width: 390, height: 844 })
  await page.locator('#quote').scrollIntoViewIfNeeded()
  await cont(page); await page.waitForTimeout(300)
  await page.locator('#quote [role=alert] a').first().click(); await page.waitForTimeout(150)
  check('review 4: error link focuses a journey-type radio, not its group', await page.evaluate(() => document.activeElement?.matches('input[type=radio][name=kind]')))
  await page.locator('label.choice', { hasText: 'Other' }).click()
  await page.getByLabel('Describe your journey').fill('see http://example.com')
  await page.locator('label.choice', { hasText: 'Business' }).click()
  await cont(page); await page.waitForTimeout(400)
  check('review 1: a hidden "Other" draft does not block a Business journey', /Where, and when/.test(await heading(page)))
  await page.getByRole('button', { name: 'Back' }).click(); await page.waitForTimeout(250)
  await page.locator('label.choice', { hasText: 'Airport' }).click(); await cont(page); await page.waitForTimeout(400)
  await page.locator('label.choice', { hasText: 'Being collected from it' }).click(); await page.waitForTimeout(150)
  await page.getByRole('radio', { name: 'Loughton' }).click()
  await page.getByRole('radio', { name: 'Stansted' }).click()
  await page.getByRole('link', { name: /Plan this journey/ }).click(); await page.waitForTimeout(1000)
  check('review 3: a new route re-infers the direction (Loughton → Stansted = going)', await page.evaluate(() => document.querySelector('[name=airportDirection][value=to]')?.checked === true))
  await ctx.close()
}
if (modeRes.mode === 'dry-run') {
  const { ctx, page } = await open('/', { width: 390, height: 844 })
  await page.getByRole('tab', { name: 'Airports & travel' }).click(); await page.waitForTimeout(400)
  await page.getByRole('link', { name: 'Request a quote: Seaport & cruise' }).click(); await page.waitForTimeout(900)
  const other = await page.evaluate(() => ({ checked: document.querySelector('input[name=kind][value=other]')?.checked, field: Boolean(document.getElementById('plan-journeyDetails')) }))
  check('review 2: Seaport & cruise opens as "Other" with its description', other.checked && other.field, JSON.stringify(other))
  await page.getByLabel('Describe your journey').fill('Southampton, Ocean Terminal, sailing 4pm')
  await cont(page); await page.waitForTimeout(400)
  await page.locator('#plan-pickup').fill('Coppice Row, Theydon Bois')
  await page.locator('#plan-destination').fill('Southampton Ocean Terminal')
  await page.locator('#plan-travelDate').fill(future(30))
  await page.locator('#plan-travelTime').fill('09:00')
  await cont(page); await page.waitForTimeout(400)
  await cont(page); await page.waitForTimeout(400)
  await page.locator('#plan-name').fill('Browser Test')
  await page.locator('#plan-phone').fill('07700 900123')
  await page.locator('#plan-email').fill('browser.test@example.com')
  await cont(page)
  await page.waitForSelector('#plan-result', { timeout: 15000 }).catch(() => {})
  const rows = await page.evaluate(() => [...document.querySelectorAll('#plan-result dd')].map(d => d.textContent).join(' | '))
  check('review 2: the Seaport description reaches the (dry-run) request', rows.includes('Southampton, Ocean Terminal, sailing 4pm'), rows)
  await ctx.close()
}
{
  const { ctx, page } = await open('/', { width: 390, height: 844 })
  await page.getByRole('radio', { name: 'Loughton' }).click()
  await page.getByRole('radio', { name: 'Stansted' }).click()
  await page.getByRole('link', { name: /Plan this journey/ }).click(); await page.waitForTimeout(1000)
  const v = await page.evaluate(() => ({ p: document.querySelector('#plan-pickup')?.value, d: document.querySelector('#plan-destination')?.value, to: document.querySelector('[name=airportDirection][value=to]')?.checked }))
  check('route builder lands on step 2 with route and direction filled', v.p === 'Loughton' && v.d === 'Stansted Airport' && v.to, JSON.stringify(v))
  await page.getByRole('tab', { name: 'Business & London' }).click(); await page.waitForTimeout(700)
  const svc = await page.evaluate(() => ({ evenings: !document.getElementById('svc-panel-evenings').hidden, travel: !document.getElementById('svc-panel-travel').hidden }))
  check('services change in place', svc.evenings && !svc.travel, JSON.stringify(svc))
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
  check('editor shows every journey scene’s copy', await page.locator('[data-anyos="hero.final.title"]').isVisible() && await page.locator('[data-anyos="hero.cabin.title"]').isVisible())
  const fig = page.locator('img[data-anyos-img="about.image"]')
  await fig.scrollIntoViewIfNeeded(); await page.waitForTimeout(300)
  const box = await fig.boundingBox()
  await page.mouse.click(box.x + box.width * 0.85, box.y + 40)
  const picker = await page.waitForSelector('.anyos-imgbox', { timeout: 5000 }).then(() => true).catch(() => false)
  check('about photograph opens the anyOS image picker through its overlays', picker)
  if (picker) await page.locator('.anyos-imgbox .anyos-cancel').first().click()
  await ctx.close()
}

// 9. Fixed action bar never covers the journey, the quote form or a field
{
  const { ctx, page } = await open('/', { width: 390, height: 844 })
  const shown = () => page.evaluate(() => { const b = document.querySelector('.mobile-bar'); return b && getComputedStyle(b).opacity === '1' && !b.hasAttribute('inert') })
  check('action bar hidden over the journey', !(await shown()))
  await page.locator('#fleet').scrollIntoViewIfNeeded(); await page.evaluate(() => window.scrollBy(0, 300)); await page.waitForTimeout(700)
  check('action bar appears after the journey', await shown())
  await page.locator('#quote').scrollIntoViewIfNeeded(); await page.waitForTimeout(700)
  check('action bar steps aside for the quote form', !(await shown()))
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
  await page.locator('#quote button[type=submit]').click(); await page.waitForTimeout(300)
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
