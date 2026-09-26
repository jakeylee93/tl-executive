import { NextRequest, NextResponse } from 'next/server'
import {
  buildSiteLeadPayload, buildTransferPayload, normaliseEnquiry, validateEnquiry,
} from '@/lib/enquiry'

// Website enquiries go to the anyOS platform, where they land in the T&L
// account as a booking to quote (quote → accept → invoice).
//
// Primary: POST the STRUCTURED fields to /api/public/transfer-enquiry, which
// files pick-up, destination, date/time, passengers and flight numbers as real
// fields. Fallback: the older /api/public/site-lead route — note that route
// refuses server-to-server calls unless they carry the site's lead token
// (x-anyos-site-token), so the fallback only works when ANYOS_SITE_LEAD_TOKEN
// is configured. If both fail, the visitor is told plainly and offered the
// phone number and a pre-filled email, so an enquiry is never silently lost.
//
// Modes (ENQUIRY_MODE):
//   live     — forward to the platform (default on the production deployment)
//   dry-run  — validate and build the exact upstream payload, send nothing
//              (default everywhere else: local dev and Vercel previews, so a
//              reviewer's test submission never lands in the real account)
// ANYOS_PLATFORM_ORIGIN may point at a mock platform for contract tests.

export const dynamic = 'force-dynamic'

const DEFAULT_PLATFORM = 'https://platform.anyos.co.uk'

function platformOrigin() {
  const configured = process.env.ANYOS_PLATFORM_ORIGIN
  if (configured && /^https?:\/\/[^\s/]+$/i.test(configured.replace(/\/$/, ''))) return configured.replace(/\/$/, '')
  return DEFAULT_PLATFORM
}

function mode(): 'live' | 'dry-run' {
  const explicit = process.env.ENQUIRY_MODE
  if (explicit === 'live' || explicit === 'dry-run') return explicit
  return process.env.VERCEL_ENV === 'production' ? 'live' : 'dry-run'
}

const reply = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store', 'X-Enquiry-Mode': mode() } })

/** Health/mode check for release verification. Reveals no secrets. */
export async function GET() {
  return reply({ ok: true, mode: mode(), platform: new URL(platformOrigin()).host })
}

const UNAVAILABLE = 'We couldn’t send your enquiry just now.'

async function postJson(url: string, payload: unknown, headers: Record<string, string> = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 10_000)
  try {
    return await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(payload),
      cache: 'no-store',
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timer)
  }
}

export async function POST(request: NextRequest) {
  const length = Number(request.headers.get('content-length') || 0)
  if (length > 20_000) return reply({ error: 'That enquiry is too long to send.' }, 413)

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') return reply({ error: 'We couldn’t read that enquiry. Please try again.' }, 400)

  const enquiry = normaliseEnquiry(body)

  // Honeypot: bots fill the hidden field. Succeed quietly and send nothing.
  if (enquiry.website) return reply({ ok: true })

  const fields = validateEnquiry(enquiry)
  if (Object.keys(fields).length) {
    return reply({ error: 'Please check the highlighted details.', fields }, 400)
  }

  const transfer = buildTransferPayload(enquiry)

  if (mode() === 'dry-run') {
    return reply({ ok: true, dryRun: true, payload: transfer })
  }

  const origin = platformOrigin()

  try {
    const response = await postJson(`${origin}/api/public/transfer-enquiry`, transfer)
    if (response.ok) return reply({ ok: true })
    // A 4xx is a real complaint (validation, rate limit) — show it rather than
    // retrying elsewhere and risking a duplicate.
    console.warn('[enquiry] transfer-enquiry refused', { status: response.status })
    if (response.status >= 400 && response.status < 500) {
      const result = (await response.json().catch(() => null)) as { error?: string } | null
      return reply({ error: result?.error || UNAVAILABLE, upstream: response.status }, response.status === 429 ? 429 : 400)
    }
  } catch (error) {
    // Network failure or timeout: fall through to the fallback. No personal
    // data is logged — only what went wrong.
    console.warn('[enquiry] transfer-enquiry unreachable', { error: error instanceof Error ? error.name : 'unknown' })
  }

  const token = process.env.ANYOS_SITE_LEAD_TOKEN
  if (token) {
    try {
      const fallback = await postJson(`${origin}/api/public/site-lead`, buildSiteLeadPayload(enquiry), { 'x-anyos-site-token': token })
      if (fallback.ok) return reply({ ok: true, via: 'fallback' })
      console.warn('[enquiry] site-lead fallback refused', { status: fallback.status })
    } catch (error) {
      console.warn('[enquiry] site-lead fallback unreachable', { error: error instanceof Error ? error.name : 'unknown' })
    }
  }

  console.error('[enquiry] enquiry could not be delivered; visitor shown phone/email fallback')
  return reply({ error: UNAVAILABLE, unavailable: true }, 502)
}
