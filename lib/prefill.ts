// A tiny channel from anywhere on the page to the quote form: "I want this
// car / this service / this journey". Links carry the same values as URL
// parameters, so everything still works before (or without) JavaScript.

import type { EnquiryInput } from './enquiry'

export type Prefill = Partial<Pick<EnquiryInput, 'pickup' | 'destination' | 'travelDate' | 'tripType' | 'vehicle' | 'occasion' | 'flying'>>

export const PREFILL_EVENT = 'tl:prefill'

const PARAMS: (keyof Prefill)[] = ['pickup', 'destination', 'travelDate', 'tripType', 'vehicle', 'occasion', 'flying']

export function prefillHref(p: Prefill) {
  const q = new URLSearchParams()
  for (const k of PARAMS) {
    const v = p[k]
    if (v === undefined || v === '' || v === false) continue
    q.set(k, String(v))
  }
  const s = q.toString()
  return `/${s ? `?${s}` : ''}#quote`
}

export function readPrefillFromUrl(search: string): Prefill {
  const q = new URLSearchParams(search)
  const out: Prefill = {}
  const str = (k: string, max = 120) => (q.get(k) || '').slice(0, max).trim()
  if (str('pickup')) out.pickup = str('pickup', 300)
  if (str('destination')) out.destination = str('destination', 300)
  if (/^\d{4}-\d{2}-\d{2}$/.test(str('travelDate'))) out.travelDate = str('travelDate')
  if (q.get('tripType') === 'return') out.tripType = 'return'
  if (str('vehicle')) out.vehicle = str('vehicle', 80)
  if (str('occasion')) out.occasion = str('occasion', 60)
  if (q.get('flying') === 'true') out.flying = true
  return out
}

/** Send details to the quote form (which scrolls into view and focuses the
 *  next field that still needs an answer). */
export function requestQuote(p: Prefill) {
  window.dispatchEvent(new CustomEvent<Prefill>(PREFILL_EVENT, { detail: p }))
}
