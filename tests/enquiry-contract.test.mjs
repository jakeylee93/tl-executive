// Enquiry pipeline contract test — safe by construction: the site's server is
// pointed at a local MOCK of the anyOS platform (ANYOS_PLATFORM_ORIGIN), so no
// real enquiry is ever created. Requires `pnpm build` first.
//
// Verifies what /api/enquiry sends upstream (the structured transfer-enquiry
// payload), how it reacts to platform errors, the token-gated site-lead
// fallback, and that the default mode off-production is a dry run.
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const LIVE_PORT = 3211
const DRY_PORT = 3212

// ---- mock platform -------------------------------------------------------
const received = []
let behaviour = { transfer: 200, siteLead: 200 }
const mock = createServer((req, res) => {
  let body = ''
  req.on('data', c => (body += c))
  req.on('end', () => {
    received.push({ path: req.url, headers: req.headers, body: body ? JSON.parse(body) : null })
    const status = req.url === '/api/public/transfer-enquiry' ? behaviour.transfer : behaviour.siteLead
    res.writeHead(status, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(status < 300 ? { ok: true } : { error: status === 429 ? 'Too many requests.' : 'That email doesn’t look right.' }))
  })
})

let mockUrl = ''
const servers = []

function startNext(port, env) {
  const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', String(port)], {
    cwd: root,
    env: { ...process.env, VERCEL_ENV: '', ENQUIRY_MODE: '', ANYOS_SITE_LEAD_TOKEN: '', ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  servers.push(child)
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`next start ${port} timed out`)), 30000)
    child.stdout.on('data', d => {
      if (/ready|started server|Local:/i.test(String(d))) { clearTimeout(timer); resolve() }
    })
    child.on('exit', code => reject(new Error(`next exited ${code}`)))
  })
}

before(async () => {
  await new Promise(r => mock.listen(0, '127.0.0.1', r))
  mockUrl = `http://127.0.0.1:${mock.address().port}`
  await Promise.all([
    startNext(LIVE_PORT, { ENQUIRY_MODE: 'live', ANYOS_PLATFORM_ORIGIN: mockUrl, ANYOS_SITE_LEAD_TOKEN: 'test-site-token' }),
    startNext(DRY_PORT, { ANYOS_PLATFORM_ORIGIN: mockUrl }),
  ])
})

after(() => {
  servers.forEach(s => s.kill())
  mock.close()
})

// ---- helpers ---------------------------------------------------------------
const future = (days = 30) => new Date(Date.now() + days * 864e5).toISOString().slice(0, 10)
const valid = () => ({
  name: 'Test Traveller',
  email: 'traveller@example.com',
  phone: '07700 900123',
  pickup: 'Coppice Row, Theydon Bois',
  destination: 'Heathrow Airport Terminal 5',
  travelDate: future(30),
  travelTime: '05:30',
  tripType: 'return',
  returnDate: future(37),
  returnTime: '18:45',
  passengers: '3',
  bags: '4',
  vehicle: 'Mercedes V Class',
  occasion: 'Airport transfers',
  flying: true,
  flightIn: 'ba 118',
  flightOut: 'BA117',
  notes: 'Child seat please.\nTwo golf bags.',
  website: '',
})

async function post(port, body) {
  const res = await fetch(`http://127.0.0.1:${port}/api/enquiry`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return { status: res.status, mode: res.headers.get('x-enquiry-mode'), json: await res.json() }
}

const reset = (b = { transfer: 200, siteLead: 200 }) => { behaviour = b; received.length = 0 }

// ---- tests -----------------------------------------------------------------
test('live: a valid enquiry is sent once, structured, to transfer-enquiry', async () => {
  reset()
  const r = await post(LIVE_PORT, valid())
  assert.equal(r.status, 200)
  assert.deepEqual(r.json, { ok: true })
  assert.equal(r.mode, 'live')
  assert.equal(received.length, 1)
  const { path, body } = received[0]
  assert.equal(path, '/api/public/transfer-enquiry')
  assert.deepEqual(Object.keys(body).sort(), [
    'destination', 'email', 'flightIn', 'flightOut', 'name', 'notes', 'passengers', 'phone', 'pickup', 'siteKey',
    'travelDate', 'travelTime', 'website',
  ])
  assert.equal(body.siteKey, 't-l-executive-cars')
  assert.equal(body.name, 'Test Traveller')
  assert.equal(body.email, 'traveller@example.com')
  assert.equal(body.phone, '07700 900123')
  assert.equal(body.pickup, 'Coppice Row, Theydon Bois')
  assert.equal(body.destination, 'Heathrow Airport Terminal 5')
  assert.equal(body.travelDate, future(30))
  assert.equal(body.travelTime, '05:30')
  assert.equal(body.passengers, '3')
  assert.equal(body.flightIn, 'BA 118')
  assert.equal(body.flightOut, 'BA117')
  assert.equal(body.website, '')
  // Everything without its own field travels in notes, on one line (the
  // platform flattens newlines), and with no links.
  assert.ok(!/\n/.test(body.notes))
  for (const part of [`Return journey: back ${future(37)} at 18:45`, 'Cases: 4', 'Preferred vehicle: Mercedes V Class', 'Occasion: Airport transfers', 'Customer notes: Child seat please. / Two golf bags.']) {
    assert.ok(body.notes.includes(part), `notes should include "${part}" — got "${body.notes}"`)
  }
  assert.ok(body.notes.length <= 1000)
})

test('live: flight numbers are dropped when the visitor is not flying', async () => {
  reset()
  const e = { ...valid(), flying: false, flightIn: '', flightOut: '', destination: 'The Ivy, West Street', tripType: 'one-way' }
  const r = await post(LIVE_PORT, e)
  assert.equal(r.status, 200)
  assert.equal(received[0].body.flightIn, '')
  assert.equal(received[0].body.flightOut, '')
  assert.ok(received[0].body.notes.startsWith('One-way journey'))
})

test('validation errors return field messages and send nothing upstream', async () => {
  reset()
  const cases = [
    [{ name: '' }, 'name'],
    [{ email: 'not-an-email' }, 'email'],
    [{ phone: 'call me' }, 'phone'],
    [{ pickup: '' }, 'pickup'],
    [{ destination: 'https://spam.example' }, 'destination'],
    [{ travelDate: '2020-01-01' }, 'travelDate'],
    [{ travelDate: '2027-02-30' }, 'travelDate'],
    [{ travelTime: '' }, 'travelTime'],
    [{ returnDate: future(10) }, 'returnDate'], // before the outward date
    [{ passengers: '12' }, 'passengers'],
    [{ flightIn: 'not a flight' }, 'flightIn'],
    [{ notes: 'see http://example.com' }, 'notes'],
  ]
  for (const [patch, field] of cases) {
    const r = await post(LIVE_PORT, { ...valid(), ...patch })
    assert.equal(r.status, 400, `${field} should be refused`)
    assert.ok(r.json.fields?.[field], `expected an error on ${field}: ${JSON.stringify(r.json)}`)
  }
  assert.equal(received.length, 0)
})

test('malformed and oversized bodies are refused', async () => {
  reset()
  const bad = await fetch(`http://127.0.0.1:${LIVE_PORT}/api/enquiry`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{nope' })
  assert.equal(bad.status, 400)
  const big = await post(LIVE_PORT, { ...valid(), notes: 'x'.repeat(30000) })
  assert.equal(big.status, 413)
  assert.equal(received.length, 0)
})

test('honeypot: bots get a quiet success and nothing is sent', async () => {
  reset()
  const r = await post(LIVE_PORT, { ...valid(), website: 'http://bot.example' })
  assert.equal(r.status, 200)
  assert.deepEqual(r.json, { ok: true })
  assert.equal(received.length, 0)
})

test('a platform 4xx is shown to the visitor and not retried elsewhere', async () => {
  reset({ transfer: 400, siteLead: 200 })
  const r = await post(LIVE_PORT, valid())
  assert.equal(r.status, 400)
  assert.equal(r.json.error, 'That email doesn’t look right.')
  assert.deepEqual(received.map(x => x.path), ['/api/public/transfer-enquiry'])
})

test('a platform rate limit comes back as 429', async () => {
  reset({ transfer: 429, siteLead: 200 })
  const r = await post(LIVE_PORT, valid())
  assert.equal(r.status, 429)
  assert.equal(received.length, 1)
})

test('a platform 5xx falls back to site-lead with the site token', async () => {
  reset({ transfer: 503, siteLead: 200 })
  const r = await post(LIVE_PORT, valid())
  assert.equal(r.status, 200)
  assert.deepEqual(r.json, { ok: true, via: 'fallback' })
  assert.deepEqual(received.map(x => x.path), ['/api/public/transfer-enquiry', '/api/public/site-lead'])
  const lead = received[1]
  assert.equal(lead.headers['x-anyos-site-token'], 'test-site-token')
  assert.equal(lead.body.clientId, '2f9b5bf7-bea0-48de-aba9-c933ce112cd8')
  assert.equal(lead.body.email, 'traveller@example.com')
  assert.ok(lead.body.message.includes('Coppice Row, Theydon Bois → Heathrow Airport Terminal 5'))
})

test('when both routes fail the visitor is told plainly (502)', async () => {
  reset({ transfer: 500, siteLead: 403 })
  const r = await post(LIVE_PORT, valid())
  assert.equal(r.status, 502)
  assert.equal(r.json.unavailable, true)
})

test('GET reports the mode without secrets', async () => {
  const live = await (await fetch(`http://127.0.0.1:${LIVE_PORT}/api/enquiry`)).json()
  assert.equal(live.mode, 'live')
  assert.equal(live.platform, new URL(mockUrl).host)
  assert.ok(!JSON.stringify(live).includes('test-site-token'))
})

test('default mode off-production is a dry run: payload built, nothing sent', async () => {
  reset()
  const r = await post(DRY_PORT, valid())
  assert.equal(r.status, 200)
  assert.equal(r.mode, 'dry-run')
  assert.equal(r.json.dryRun, true)
  assert.equal(r.json.payload.siteKey, 't-l-executive-cars')
  assert.equal(r.json.payload.travelTime, '05:30')
  assert.equal(received.length, 0)
  const info = await (await fetch(`http://127.0.0.1:${DRY_PORT}/api/enquiry`)).json()
  assert.equal(info.mode, 'dry-run')
})
