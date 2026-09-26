// The enquiry contract, shared by the quote form (instant, field-level
// feedback) and /api/enquiry (the authority). Pure functions only — no
// server or browser APIs — so both sides validate identically.
//
// Upstream contract (anyOS platform, unchanged):
//   POST /api/public/transfer-enquiry  { siteKey, name, email, phone, pickup,
//     destination, travelDate (YYYY-MM-DD), travelTime, passengers, flightIn,
//     flightOut, notes, website }  → { ok: true } | { error }
// The platform flattens whitespace in every field and rejects links/markup in
// name, pickup, destination and notes, so we catch those first with a
// friendlier message.

export const SITE_KEY = 't-l-executive-cars'
export const TL_CLIENT_ID = '2f9b5bf7-bea0-48de-aba9-c933ce112cd8' // public routing id, not a secret

export type TripType = 'one-way' | 'return'

export type EnquiryInput = {
  name: string
  email: string
  phone: string
  pickup: string
  destination: string
  travelDate: string
  travelTime: string
  tripType: TripType
  returnDate: string
  returnTime: string
  passengers: string
  bags: string
  vehicle: string
  occasion: string
  flying: boolean
  flightIn: string
  flightOut: string
  notes: string
  website: string // honeypot
}

export type FieldName = Exclude<keyof EnquiryInput, 'website' | 'flying' | 'tripType'>
export type FieldErrors = Partial<Record<FieldName, string>>

export const LIMITS = {
  name: 120, email: 200, phone: 40, pickup: 300, destination: 300,
  travelDate: 10, travelTime: 5, returnDate: 10, returnTime: 5,
  passengers: 2, bags: 2, vehicle: 80, occasion: 60,
  flightIn: 20, flightOut: 20, notes: 800,
} as const

export const MAX_BAGS = 20

export const emptyEnquiry = (): EnquiryInput => ({
  name: '', email: '', phone: '', pickup: '', destination: '',
  travelDate: '', travelTime: '', tripType: 'one-way', returnDate: '', returnTime: '',
  passengers: '1', bags: '1', vehicle: '', occasion: '',
  flying: false, flightIn: '', flightOut: '', notes: '', website: '',
})

const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '')
const cleanMultiline = (v: unknown, max: number) =>
  typeof v === 'string' ? v.replace(/\r\n?/g, '\n').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim().slice(0, max) : ''

/** Coerce an untrusted JSON body into a bounded EnquiryInput. */
export function normaliseEnquiry(body: unknown): EnquiryInput {
  const b = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>
  const tripType: TripType = b.tripType === 'return' ? 'return' : 'one-way'
  const flightIn = clean(b.flightIn, LIMITS.flightIn).toUpperCase()
  const flightOut = clean(b.flightOut, LIMITS.flightOut).toUpperCase()
  return {
    name: clean(b.name, LIMITS.name),
    email: clean(b.email, LIMITS.email),
    phone: clean(b.phone, LIMITS.phone),
    pickup: clean(b.pickup, LIMITS.pickup),
    destination: clean(b.destination, LIMITS.destination),
    travelDate: clean(b.travelDate, LIMITS.travelDate),
    travelTime: clean(b.travelTime, LIMITS.travelTime),
    tripType,
    returnDate: tripType === 'return' ? clean(b.returnDate, LIMITS.returnDate) : '',
    returnTime: tripType === 'return' ? clean(b.returnTime, LIMITS.returnTime) : '',
    passengers: clean(String(b.passengers ?? ''), LIMITS.passengers),
    bags: clean(String(b.bags ?? ''), LIMITS.bags),
    vehicle: clean(b.vehicle, LIMITS.vehicle),
    occasion: clean(b.occasion, LIMITS.occasion),
    flying: b.flying === true || Boolean(flightIn || flightOut),
    flightIn,
    flightOut,
    notes: cleanMultiline(b.notes, LIMITS.notes),
    website: clean(b.website, 200),
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const PHONE_RE = /^\+?[\d\s().-]{7,}$/
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/
const FLIGHT_RE = /^[A-Z0-9]{2,3}\s?\d{1,4}[A-Z]?$/
// Same rule the platform applies: links and markup are always refused.
const HOSTILE_RE = /https?:\/\/|<[a-z/]/i

/** Today's date in the UK, as YYYY-MM-DD, regardless of server timezone. */
export function ukToday(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now)
  const get = (t: string) => parts.find(p => p.type === t)?.value ?? ''
  return `${get('year')}-${get('month')}-${get('day')}`
}

function isRealDate(s: string) {
  if (!DATE_RE.test(s)) return false
  const [y, m, d] = s.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d
}

export function validateEnquiry(e: EnquiryInput, today: string = ukToday()): FieldErrors {
  const errors: FieldErrors = {}

  if (!e.pickup) errors.pickup = 'Enter where we should collect you.'
  else if (HOSTILE_RE.test(e.pickup)) errors.pickup = 'Please enter an address or place name, without links.'

  if (!e.destination) errors.destination = 'Enter where you’re going.'
  else if (HOSTILE_RE.test(e.destination)) errors.destination = 'Please enter an address or place name, without links.'

  if (!e.travelDate) errors.travelDate = 'Choose the date of travel.'
  else if (!isRealDate(e.travelDate)) errors.travelDate = 'Enter a real date, for example 14/03/2027.'
  else if (e.travelDate < today) errors.travelDate = 'That date has passed. Choose today or a later date.'

  if (!e.travelTime) errors.travelTime = 'Choose a pick-up time. An approximate time is fine.'
  else if (!TIME_RE.test(e.travelTime)) errors.travelTime = 'Enter a time, for example 06:30.'

  if (e.tripType === 'return') {
    if (!e.returnDate) errors.returnDate = 'Choose the date of your return journey.'
    else if (!isRealDate(e.returnDate)) errors.returnDate = 'Enter a real date, for example 21/03/2027.'
    else if (!errors.travelDate && e.returnDate < e.travelDate) errors.returnDate = 'The return must be on or after the outward date.'
    if (e.returnTime && !TIME_RE.test(e.returnTime)) errors.returnTime = 'Enter a time, for example 18:45.'
  }

  const pax = Number(e.passengers)
  if (!Number.isInteger(pax) || pax < 1) errors.passengers = 'Enter at least 1 passenger.'
  else if (pax > 8) errors.passengers = 'For more than 8 passengers, please call us to arrange it.'

  const bags = e.bags === '' ? 0 : Number(e.bags)
  if (!Number.isInteger(bags) || bags < 0 || bags > MAX_BAGS) errors.bags = `Enter a number of cases from 0 to ${MAX_BAGS}.`

  if (e.flying) {
    if (e.flightIn && !FLIGHT_RE.test(e.flightIn)) errors.flightIn = 'Enter a flight number like BA117 or EZY 8234.'
    if (e.flightOut && !FLIGHT_RE.test(e.flightOut)) errors.flightOut = 'Enter a flight number like BA117 or EZY 8234.'
  }

  if (e.name.length < 2) errors.name = 'Enter your name.'
  else if (HOSTILE_RE.test(e.name) || /www\./i.test(e.name)) errors.name = 'Please enter just your name.'

  if (!e.phone) errors.phone = 'Enter a phone number so we can confirm details.'
  else if (!PHONE_RE.test(e.phone)) errors.phone = 'Enter a phone number using digits, for example 07700 900123.'

  if (!e.email) errors.email = 'Enter your email address for the quote.'
  else if (!EMAIL_RE.test(e.email)) errors.email = 'Enter an email address like name@example.com.'

  if (HOSTILE_RE.test(e.notes)) errors.notes = 'Please remove any links from your message.'

  return errors
}

const ukDate = (iso: string) => {
  if (!isRealDate(iso)) return iso
  const [y, m, d] = iso.split('-').map(Number)
  return new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(y, m - 1, d)))
}

/** Human summary lines, used in the success panel, the mailto fallback and
 *  the platform's legacy site-lead message. */
export function summariseEnquiry(e: EnquiryInput): { label: string; value: string }[] {
  const rows: { label: string; value: string }[] = [
    { label: 'Journey', value: `${e.pickup} → ${e.destination}` },
    { label: 'Outward', value: [ukDate(e.travelDate), e.travelTime].filter(Boolean).join(' at ') },
  ]
  if (e.tripType === 'return') rows.push({ label: 'Return', value: [ukDate(e.returnDate), e.returnTime].filter(Boolean).join(' at ') || 'Date to confirm' })
  rows.push({ label: 'Passengers', value: `${e.passengers} passenger${e.passengers === '1' ? '' : 's'}, ${e.bags || '0'} case${e.bags === '1' ? '' : 's'}` })
  if (e.vehicle) rows.push({ label: 'Vehicle', value: e.vehicle })
  if (e.occasion) rows.push({ label: 'Occasion', value: e.occasion })
  if (e.flightIn) rows.push({ label: 'Arriving flight', value: e.flightIn })
  if (e.flightOut) rows.push({ label: 'Departing flight', value: e.flightOut })
  if (e.notes) rows.push({ label: 'Notes', value: e.notes })
  return rows
}

/** Everything the platform's structured fields don't cover, as one line —
 *  the platform flattens newlines, so separators must read well inline. */
export function buildNotes(e: EnquiryInput): string {
  return [
    e.tripType === 'return'
      ? `Return journey${e.returnDate ? `: back ${e.returnDate}${e.returnTime ? ` at ${e.returnTime}` : ''}` : ''}`
      : 'One-way journey',
    `Cases: ${e.bags || '0'}`,
    e.vehicle ? `Preferred vehicle: ${e.vehicle}` : 'Vehicle: please recommend',
    e.occasion ? `Occasion: ${e.occasion}` : '',
    e.notes ? `Customer notes: ${e.notes.replace(/\s*\n\s*/g, ' / ')}` : '',
  ].filter(Boolean).join(' · ').slice(0, 1000)
}

export type TransferPayload = {
  siteKey: string
  name: string; email: string; phone: string
  pickup: string; destination: string
  travelDate: string; travelTime: string
  passengers: string
  flightIn: string; flightOut: string
  notes: string
  website: string
}

export function buildTransferPayload(e: EnquiryInput): TransferPayload {
  return {
    siteKey: SITE_KEY,
    name: e.name, email: e.email, phone: e.phone,
    pickup: e.pickup, destination: e.destination,
    travelDate: e.travelDate, travelTime: e.travelTime,
    passengers: e.passengers,
    flightIn: e.flying ? e.flightIn : '',
    flightOut: e.flying ? e.flightOut : '',
    notes: buildNotes(e),
    website: '',
  }
}

export function buildSiteLeadPayload(e: EnquiryInput) {
  return {
    clientId: TL_CLIENT_ID,
    name: e.name,
    email: e.email,
    phone: e.phone,
    message: summariseEnquiry(e).map(r => `${r.label}: ${r.value}`).join(' · ').slice(0, 2000),
    website: '',
  }
}

/** Heuristic: does a place look like an airport? Used to offer flight fields. */
export const looksLikeAirport = (s: string) =>
  /\b(airport|heathrow|gatwick|stansted|luton|southend airport|london city airport|lhr|lgw|stn|ltn|lcy|sen|terminal)\b/i.test(s)
