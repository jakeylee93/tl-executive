import { NextRequest, NextResponse } from 'next/server'

// Enquiries go to the anyOS platform, where they land as a booking to quote.
//
// Previously this forwarded to /api/public/site-lead with everything squashed
// into one `message` string, so the pick-up, destination, dates and passenger
// count arrived as prose that had to be re-read by hand. It now posts the
// STRUCTURED fields (including flight numbers) to the transfer endpoint, which
// files them properly — falling back to the old site-lead route if that is ever
// unavailable, so an enquiry is never lost either way.
const PLATFORM_TRANSFER_URL = 'https://platform.anyos.co.uk/api/public/transfer-enquiry'
const PLATFORM_FALLBACK_URL = 'https://platform.anyos.co.uk/api/public/site-lead'
const TL_CLIENT_ID = '2f9b5bf7-bea0-48de-aba9-c933ce112cd8'
const TL_SITE_KEY = 't-l-executive-cars'

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as Record<string, unknown> | null

  const name = str(body?.name, 160)
  const email = str(body?.email, 200)
  const website = str(body?.website, 200) // honeypot, passed straight through
  if (!name || !email) {
    return NextResponse.json({ error: 'Name and email are required.' }, { status: 400 })
  }

  const payload = {
    siteKey: TL_SITE_KEY,
    name, email, website,
    phone: str(body?.phone, 60),
    pickup: str(body?.pickup, 300),
    destination: str(body?.destination, 300),
    travelDate: str(body?.travelDate, 40),
    travelTime: str(body?.travelTime, 20),
    passengers: str(body?.passengers, 10),
    flightIn: str(body?.flightIn, 40),
    flightOut: str(body?.flightOut, 40),
    // Everything the structured fields don't cover (return date, bags, vehicle
    // preference, free text) still reaches Simon as notes.
    notes: [
      str(body?.tripType, 20) === 'return' ? 'Return journey' : 'One-way journey',
      str(body?.returnDate, 40) ? `Return date: ${str(body?.returnDate, 40)}` : '',
      str(body?.bags, 10) ? `Bags: ${str(body?.bags, 10)}` : '',
      str(body?.vehicle, 80) ? `Preferred vehicle: ${str(body?.vehicle, 80)}` : '',
      str(body?.notes, 800),
    ].filter(Boolean).join('\n').slice(0, 1000),
  }

  try {
    const response = await fetch(PLATFORM_TRANSFER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
    })
    if (response.ok) {
      return NextResponse.json(await response.json().catch(() => ({ ok: true })))
    }
    // A 4xx is a real validation complaint — show it rather than retrying.
    if (response.status >= 400 && response.status < 500) {
      const result = await response.json().catch(() => ({ error: 'Could not send your enquiry.' }))
      return NextResponse.json(result, { status: response.status })
    }
  } catch {
    /* fall through to the older endpoint below */
  }

  // Last resort: the original route, so a customer's enquiry still arrives.
  const fallback = await fetch(PLATFORM_FALLBACK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientId: TL_CLIENT_ID, name, email, message: str(body?.message, 2000), website }),
    cache: 'no-store',
  })
  const result = await fallback.json().catch(() => ({ error: 'Could not send your enquiry.' }))
  return NextResponse.json(result, { status: fallback.status })
}
