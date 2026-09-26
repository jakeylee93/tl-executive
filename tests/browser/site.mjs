// Browser QA for the T&L site: keyboard, forms, prefill, anyOS hydration and
// edit-mode smoke test, reduced motion, console errors and axe accessibility.
//
//   node tests/browser/site.mjs [baseUrl]      (default http://localhost:3100)
//
// Safe by design:
// - run it against a server in DRY-RUN mode (the default for `next start`
//   locally and for Vercel previews) — the form test asserts the preview
//   panel, so it fails loudly rather than send a real enquiry;
// - the anyOS checks only READ live content, and the edit-mode smoke test uses
//   a dummy token and never presses Save.
// Needs Playwright (PLAYWRIGHT_MODULE=path) and, for accessibility, axe-core
// (AXE_PATH=path/to/axe.min.js). Fresh browser contexts; no profile, no state.
import { createRequire } from 'node:module'
import { readFileSync, existsSync } from 'node:fs'

const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright')
const BASE = (process.argv[2] || 'http://localhost:3100').replace(/\/$/, '')
const AXE = process.env.AXE_PATH && existsSync(process.env.AXE_PATH) ? readFileSync(process.env.AXE_PATH, 'utf8') : null

const results = []
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail })
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  — ${detail}` : ''}`)
}

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {})
const consoleErrors = []

async function open(path, { width = 390, height = 844, reducedMotion = 'no-preference' } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, isMobile: width < 600, hasTouch: width < 1024, reducedMotion })
  const page = await ctx.newPage()
  page.on('pageerror', e => consoleErrors.push(`${path} @${width}: ${e.message}`))
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(`${path} @${width}: ${m.text()}`) })
  await page.goto(BASE + path, { waitUntil: 'networkidle' })
  return { ctx, page }
}

const future = days => new Date(Date.now() + days * 864e5).toISOString().slice(0, 10)
const activeId = page => page.evaluate(() => document.activeElement?.id || document.activeElement?.textContent?.trim().slice(0, 40))

// 1. Skip link is the first stop and moves focus to <main>
{
  const { ctx, page } = await open('/', { width: 1440, height: 900 })
  await page.keyboard.press('Tab')
  const first = await page.evaluate(() => document.activeElement?.textContent?.trim())
  check('skip link is the first tab stop', first === 'Skip to content', first)
  await page.keyboard.press('Enter')
  await page.waitForTimeout(200)
  check('skip link moves focus to main', (await page.evaluate(() => document.activeElement?.id)) === 'main')
  await ctx.close()
}

// 2. Mobile menu: keyboard open, focus inside, Escape returns focus
{
  const { ctx, page } = await open('/')
  const btn = page.locator('button[aria-controls="site-menu"]')
  await btn.focus()
  await page.keyboard.press('Enter')
  await page.waitForTimeout(150)
  check('menu opens and reports aria-expanded', (await btn.getAttribute('aria-expanded')) === 'true')
  const inMenu = await page.evaluate(() => Boolean(document.activeElement?.closest('#site-menu')))
  check('focus moves into the menu', inMenu)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(150)
  check('Escape closes the menu', (await btn.getAttribute('aria-expanded')) === 'false')
  check('focus returns to the menu button', (await page.evaluate(() => document.activeElement?.getAttribute('aria-controls'))) === 'site-menu')
  await ctx.close()
}

// 3. Hero journey starter hands its answers to the quote form
{
  const { ctx, page } = await open('/')
  await page.getByRole('textbox', { name: 'From', exact: true }).fill('Coppice Row, Theydon Bois')
  await page.getByRole('button', { name: 'Stansted', exact: true }).click()
  await page.locator('#top input[type=date]').fill(future(14))
  await page.getByRole('button', { name: /Continue to your quote/ }).click()
  await page.waitForTimeout(900)
  const vals = await page.evaluate(() => ({
    pickup: document.querySelector('#q-pickup')?.value,
    destination: document.querySelector('#q-destination')?.value,
    date: document.querySelector('#q-travelDate')?.value,
    flying: document.querySelector('input[type=checkbox]')?.checked,
  }))
  check('starter prefills pick-up, destination and date', vals.pickup === 'Coppice Row, Theydon Bois' && vals.destination === 'Stansted Airport' && vals.date === future(14), JSON.stringify(vals))
  check('airport destination switches on flight fields', vals.flying === true)
  check('focus lands on the next unanswered field (time)', (await activeId(page)) === 'q-travelTime', await activeId(page))
  await ctx.close()
}

// 4. Fleet and service buttons carry their context into the form
{
  const { ctx, page } = await open('/', { width: 1440, height: 900 })
  await page.getByRole('link', { name: 'Request a quote for the Mercedes V Class' }).click()
  await page.waitForTimeout(700)
  const checked = await page.evaluate(() => document.querySelector('input[type=radio][value="Mercedes V Class"]')?.checked)
  check('"Request this car" selects that car in the form', checked === true)
  await page.getByRole('link', { name: 'Request a quote for theatre trips' }).click()
  await page.waitForTimeout(700)
  check('service arrow sets the occasion', (await page.locator('#q-occasion').inputValue()) === 'Theatre trips')
  await ctx.close()
}

// 5. Empty submit: error summary is announced and focused
{
  const { ctx, page } = await open('/')
  await page.locator('#quote button[type=submit]').click()
  await page.waitForTimeout(300)
  const summary = await page.evaluate(() => {
    const el = document.activeElement
    return { role: el?.getAttribute('role'), items: el?.querySelectorAll('li').length }
  })
  check('error summary receives focus', summary.role === 'alert', JSON.stringify(summary))
  check('error summary lists the 7 required fields', summary.items === 7, String(summary.items))
  check('invalid fields are marked aria-invalid', (await page.locator('#q-pickup').getAttribute('aria-invalid')) === 'true')
  await page.locator('#q-pickup').fill('Epping Station')
  await page.waitForTimeout(100)
  check('fixing a field clears its error', (await page.locator('#q-pickup').getAttribute('aria-invalid')) === null)
  await ctx.close()
}

// 6. Passenger count flags cars that are too small; return trip adds fields
{
  const { ctx, page } = await open('/')
  const plus = page.getByRole('button', { name: 'One more passenger' })
  for (let i = 0; i < 5; i++) await plus.click()
  check('passenger stepper reaches 6', (await page.locator('#q-passengers').inputValue()) === '6')
  check('cars seating 4 are flagged as too small', (await page.locator('text=Seats up to 4').count()) === 2)
  await page.locator('#quote').getByRole('radio', { name: 'Return', exact: true }).check()
  check('return trip reveals return date', await page.locator('#q-returnDate').isVisible())
  await ctx.close()
}

// 7. Complete enquiry in DRY-RUN mode shows the preview panel with the payload
{
  const { ctx, page } = await open('/')
  await page.locator('#q-pickup').fill('Coppice Row, Theydon Bois')
  await page.locator('#q-destination').fill('Heathrow Airport Terminal 5')
  await page.locator('#q-travelDate').fill(future(21))
  await page.locator('#q-travelTime').fill('05:30')
  await page.locator('#q-flightOut').fill('BA117')
  await page.locator('#q-name').fill('Browser Test')
  await page.locator('#q-phone').fill('07700 900123')
  await page.locator('#q-email').fill('browser.test@example.com')
  await page.locator('#quote button[type=submit]').click()
  await page.waitForSelector('#quote-result', { timeout: 10000 })
  const heading = await page.evaluate(() => document.activeElement?.textContent || '')
  check('dry-run submission shows the preview panel (nothing sent)', /Preview mode/.test(heading), heading)
  const payload = await page.evaluate(() => document.querySelector('#quote-result pre')?.textContent || '')
  check('preview payload carries site key, time and flight', /"siteKey": "t-l-executive-cars"/.test(payload) && /"travelTime": "05:30"/.test(payload) && /"flightOut": "BA117"/.test(payload))
  await ctx.close()
}

// 8. anyOS hydration: live saved content replaces defaults (read-only)
{
  const { ctx, page } = await open('/', { width: 1440, height: 900 })
  await page.waitForFunction(() => document.querySelector('#services-title')?.textContent !== 'Tailored to your journey', null, { timeout: 8000 }).catch(() => {})
  const title = await page.locator('#services-title').textContent()
  check('saved anyOS override (services.title) is applied to the new markup', title === 'Tailored to Your Needs', title)
  await ctx.close()
}

// 9. anyOS edit mode smoke test with a dummy token — nothing is saved
{
  const { ctx, page } = await open('/?anyos_edit=qa-dummy-token-no-save', { width: 1440, height: 900 })
  const bar = await page.waitForSelector('.anyos-editbar', { timeout: 8000 }).then(() => true).catch(() => false)
  check('edit bar appears in edit mode', bar)
  check('site settings (brand colours) are offered', (await page.locator('.anyos-gear').count()) > 0)
  const heroTitle = page.locator('[data-anyos="hero.title"]')
  await heroTitle.click()
  check('clicking text starts an in-place edit', (await heroTitle.getAttribute('contenteditable')) === 'true')
  await page.locator('.anyos-texttools .anyos-cancel').click()
  check('Cancel ends the edit without saving', (await heroTitle.getAttribute('contenteditable')) !== 'true')
  await page.locator('#fleet img[data-anyos-img]').first().scrollIntoViewIfNeeded()
  await page.locator('#fleet img[data-anyos-img]').first().click()
  const imgBox = await page.waitForSelector('.anyos-imgbox', { timeout: 4000 }).then(() => true).catch(() => false)
  check('clicking a fleet photo opens the image picker', imgBox)
  if (imgBox) await page.locator('.anyos-imgbox .anyos-cancel').first().click()
  const revealHidden = await page.evaluate(() => [...document.querySelectorAll('[data-reveal]')].some(el => getComputedStyle(el).opacity === '0'))
  check('nothing is hidden by scroll-reveal while editing', !revealHidden)
  await ctx.close()
}

// 10. Reduced motion: content is visible without scrolling animations
{
  const { ctx, page } = await open('/', { width: 1440, height: 900, reducedMotion: 'reduce' })
  const hidden = await page.evaluate(() => [...document.querySelectorAll('[data-reveal]')].filter(el => getComputedStyle(el).opacity !== '1').length)
  check('reduced motion shows all reveal content immediately', hidden === 0, `${hidden} hidden`)
  await ctx.close()
}

// 11. Touch targets on a phone (interactive controls ≥ 44×44, inline text links excepted)
{
  const { ctx, page } = await open('/')
  const small = await page.evaluate(() => {
    const out = []
    for (const el of document.querySelectorAll('a[href], button, input:not([type=hidden]), select, textarea, summary')) {
      if (el.closest('[aria-hidden="true"]') || el.closest('#site-menu[hidden]')) continue
      const r = el.getBoundingClientRect()
      if (!r.width || !r.height) continue
      const cs = getComputedStyle(el)
      if (cs.display === 'inline' && el.closest('p, dd, li')?.textContent.trim().length > el.textContent.trim().length + 3) continue
      const target = el.closest('label') && (el.type === 'radio' || el.type === 'checkbox') ? el.closest('label').getBoundingClientRect() : r
      if (target.height < 43.5 || target.width < 43.5) out.push(`${el.tagName.toLowerCase()} "${(el.getAttribute('aria-label') || el.textContent || el.name || '').trim().slice(0, 30)}" ${Math.round(target.width)}×${Math.round(target.height)}`)
    }
    return out
  })
  check('touch targets are at least 44×44 px on a phone', small.length === 0, small.slice(0, 8).join('; '))
  await ctx.close()
}

// 12. axe-core accessibility audit (WCAG 2.2 A/AA + best practice)
if (AXE) {
  const targets = [['/', 390], ['/', 1440], ['/airport-transfers', 390], ['/airport-transfers', 1440], ['/privacy', 390], ['/cookies', 1440]]
  for (const [path, width] of targets) {
    const { ctx, page } = await open(path, { width, height: 900, reducedMotion: 'reduce' })
    await page.addScriptTag({ content: AXE })
    const res = await page.evaluate(async () => await window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] }))
    const v = res.violations.map(x => `${x.id}(${x.nodes.length}): ${x.nodes.slice(0, 2).map(n => n.target.join(' ')).join(', ')}`)
    check(`axe: no violations on ${path} @${width}`, v.length === 0, v.join(' | '))
    await ctx.close()
  }
  // Error state of the form
  const { ctx, page } = await open('/', { width: 390, height: 844, reducedMotion: 'reduce' })
  await page.locator('#quote button[type=submit]').click()
  await page.waitForTimeout(300)
  await page.addScriptTag({ content: AXE })
  const res = await page.evaluate(async () => await window.axe.run(document.querySelector('#quote'), { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] }))
  check('axe: quote form error state has no violations', res.violations.length === 0, res.violations.map(x => x.id).join(', '))
  await ctx.close()
} else {
  console.log('SKIP  axe audit (set AXE_PATH to axe.min.js)')
}

check('no console errors or page errors', consoleErrors.length === 0, consoleErrors.slice(0, 5).join(' | '))

await browser.close()
const failed = results.filter(r => !r.ok)
console.log(`\n${results.length - failed.length}/${results.length} checks passed`)
process.exit(failed.length ? 1 : 0)
