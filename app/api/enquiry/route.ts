import { NextRequest, NextResponse } from 'next/server'

const PLATFORM_ENQUIRY_URL = 'https://platform.anyos.co.uk/api/public/site-lead'
const TL_CLIENT_ID = '2f9b5bf7-bea0-48de-aba9-c933ce112cd8'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as Record<string, unknown> | null
  const name = typeof body?.name === 'string' ? body.name.trim().slice(0, 160) : ''
  const email = typeof body?.email === 'string' ? body.email.trim().slice(0, 200) : ''
  const message = typeof body?.message === 'string' ? body.message.trim().slice(0, 2000) : ''
  const website = typeof body?.website === 'string' ? body.website.trim() : ''

  if (!name || !email) {
    return NextResponse.json({ error: 'Name and email are required.' }, { status: 400 })
  }

  const response = await fetch(PLATFORM_ENQUIRY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientId: TL_CLIENT_ID, name, email, message, website }),
    cache: 'no-store',
  })
  const result = await response.json().catch(() => ({ error: 'Could not send your enquiry.' }))
  return NextResponse.json(result, { status: response.status })
}
