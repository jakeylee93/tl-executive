'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent, ReactNode } from 'react'
import {
  AIRPORT_DIRECTION_TEXT, emptyEnquiry, findVehicle, flightFields, isOtherOccasion, looksLikeAirport, MAX_BAGS, MAX_SEATS, notesRoom, OTHER_OCCASION,
  summariseEnquiry, ukToday, validateEnquiry,
  type AirportDirection, type EnquiryInput, type FieldErrors, type FieldName,
} from '@/lib/enquiry'
import { PREFILL_EVENT, VEHICLE_EVENT, readPrefillFromUrl, type Prefill } from '@/lib/prefill'
import { AIRPORTS, BUSINESS, SERVICE_GROUPS, SERVICES, VEHICLES, slug } from '@/lib/site'
import { Icon } from './Icon'

// The quote wizard: four short steps, one question group at a time.
//   1 Journey     what kind of trip ("Other" asks for its own description)
//   2 Route       which way (airports only), where, when, return, flights
//   3 Car         passengers, luggage, which car (only cars that fit)
//   4 Details     contact, review, send
// Everything typed is kept when moving back and forth. Validation is the
// shared lib/enquiry contract (the server re-checks all of it), plus two
// client-only questions: journey type, and airport direction.

type Status = 'idle' | 'sending' | 'sent' | 'dry-run' | 'error'
type Kind = '' | 'airport' | 'business' | 'occasion' | 'other'

const KINDS: { id: Exclude<Kind, ''>; label: string; hint: string; occasion: string; icon: 'plane' | 'briefcase' | 'sparkle' | 'road' }[] = [
  { id: 'airport', label: 'Airport', hint: 'To or from any London airport', occasion: 'Airport transfers', icon: 'plane' },
  { id: 'business', label: 'Business', hint: 'Meetings, roadshows, speakers', occasion: 'Corporate travel', icon: 'briefcase' },
  { id: 'occasion', label: 'Occasion', hint: 'Weddings, theatre, race days', occasion: 'Special occasions', icon: 'sparkle' },
  { id: 'other', label: 'Other', hint: 'Ports, days out, anything else', occasion: OTHER_OCCASION, icon: 'road' },
]
const OCCASIONS = ['Special occasions', 'Weddings', 'Theatre', 'Fine dining', 'Race days', 'Sporting events', 'West End shopping']

const kindFor = (occasion: string): Kind => {
  if (!occasion) return ''
  if (isOtherOccasion(occasion)) return 'other'
  const direct = KINDS.find(k => k.occasion === occasion)
  if (direct) return direct.id
  if (OCCASIONS.includes(occasion)) return 'occasion'
  const svc = SERVICES.find(s => s.title === occasion)
  const group = svc ? SERVICE_GROUPS.find(g => g.items.includes(svc.idx)) : null
  if (group?.key === 'travel') return 'airport'
  if (group?.key === 'evenings') return 'business'
  if (group?.key === 'occasions') return 'occasion'
  return 'other'
}

const STEPS = ['Your journey', 'Route and time', 'Car and passengers', 'Your details'] as const
const STEP_FIELDS: FieldName[][] = [
  ['occasion', 'journeyDetails'],
  ['airportDirection', 'pickup', 'destination', 'travelDate', 'travelTime', 'returnDate', 'returnTime', 'flightIn', 'flightOut'],
  ['passengers', 'bags', 'vehicle', 'notes'],
  ['name', 'phone', 'email'],
]
const stepOf = (f: FieldName) => Math.max(0, STEP_FIELDS.findIndex(fs => fs.includes(f)))
const FIELD_LABEL: Record<FieldName, string> = {
  occasion: 'Journey type', journeyDetails: 'About the journey', airportDirection: 'Which way',
  pickup: 'Pick-up', destination: 'Destination', travelDate: 'Date', travelTime: 'Pick-up time',
  returnDate: 'Return date', returnTime: 'Return time', flightIn: 'Arriving flight', flightOut: 'Departing flight',
  passengers: 'Passengers', bags: 'Luggage', vehicle: 'Car', notes: 'Notes',
  name: 'Name', phone: 'Phone', email: 'Email',
}

const fid = (f: FieldName) => `plan-${f}`
const described = (f: FieldName, errors: FieldErrors, hint?: boolean) =>
  [hint ? `${fid(f)}-hint` : '', errors[f] ? `${fid(f)}-error` : ''].filter(Boolean).join(' ') || undefined

/** Recompute what follows from the route and journey type. */
function derive(d: EnquiryInput, kind: Kind, directionChosen: boolean): EnquiryInput {
  const toAirport = looksLikeAirport(d.destination), fromAirport = looksLikeAirport(d.pickup)
  const flying = kind === 'airport' || toAirport || fromAirport
  let airportDirection: AirportDirection = flying ? d.airportDirection : ''
  if (flying && !directionChosen) airportDirection = toAirport && !fromAirport ? 'to' : fromAirport && !toAirport ? 'from' : airportDirection
  // drop-off and collection needs the return; without it, it is a drop-off
  if (airportDirection === 'both' && d.tripType !== 'return') airportDirection = 'to'
  return { ...d, flying, airportDirection }
}

function checkSteps(steps: number[], d: EnquiryInput, kind: Kind, today: string): FieldErrors {
  const all = validateEnquiry(d, today || undefined)
  const f = flightFields(d)
  const out: FieldErrors = {}
  for (const i of steps) {
    for (const field of STEP_FIELDS[i]) if (all[field]) out[field] = all[field]
    if (i === 0 && !kind) out.occasion = 'Choose the kind of journey.'
    if (i === 1 && d.flying && !d.airportDirection) out.airportDirection = 'Tell us whether you’re going to the airport, being collected from it, or both.'
  }
  if (!f.flightIn) delete out.flightIn
  if (!f.flightOut) delete out.flightOut
  return out
}

function FieldError({ field, errors }: { field: FieldName; errors: FieldErrors }) {
  if (!errors[field]) return null
  return (
    <span id={`${fid(field)}-error`} className="field-error">
      <Icon name="alert" className="mt-[0.1rem] h-4 w-4 flex-none" />
      {errors[field]}
    </span>
  )
}

function Stepper({ field, label, value, min, max, onChange, errors, unit }: {
  field: 'passengers' | 'bags'; label: string; value: string; min: number; max: number
  onChange: (v: string) => void; errors: FieldErrors; unit: [string, string]
}) {
  const n = Number(value) || 0
  const set = (next: number) => onChange(String(Math.min(max, Math.max(min, next))))
  return (
    <div>
      <label htmlFor={fid(field)} className="field-label">{label}</label>
      <div className="flex min-h-[3.25rem] items-stretch overflow-hidden rounded-xl border border-field bg-white focus-within:border-focus focus-within:shadow-[0_0_0_3px_rgba(31,95,191,0.28)]">
        <button type="button" className="grid w-12 flex-none place-items-center text-ink hover:bg-mist disabled:text-silver disabled:hover:bg-transparent" onClick={() => set(n - 1)} disabled={n <= min} aria-label={`One fewer ${unit[0]}`} aria-controls={fid(field)}>
          <Icon name="minus" className="h-5 w-5" strokeWidth={2} />
        </button>
        <input
          id={fid(field)} name={field} type="number" inputMode="numeric" min={min} max={max} value={value}
          onChange={e => onChange(e.target.value.replace(/\D/g, '').slice(0, 2))}
          onBlur={() => value !== '' && set(n)}
          className="w-full min-w-0 bg-transparent text-center text-[1.1rem] font-semibold text-ink tabular focus:outline-none"
          aria-invalid={errors[field] ? true : undefined} aria-describedby={described(field, errors)}
        />
        <button type="button" className="grid w-12 flex-none place-items-center text-ink hover:bg-mist disabled:text-silver disabled:hover:bg-transparent" onClick={() => set(n + 1)} disabled={n >= max} aria-label={`One more ${unit[0]}`} aria-controls={fid(field)}>
          <Icon name="plus" className="h-5 w-5" strokeWidth={2} />
        </button>
      </div>
      <span className="sr-only" aria-live="polite">{n} {n === 1 ? unit[0] : unit[1]}</span>
      <FieldError field={field} errors={errors} />
    </div>
  )
}

/** A native radio dressed as a card: arrow keys, Space and labels all work as
 *  the browser intends. */
function Choice({ name, value, checked, onChange, disabled, children, className = '' }: {
  name: string; value: string; checked: boolean; onChange: () => void; disabled?: boolean; children: ReactNode; className?: string
}) {
  return (
    <label className={`choice ${disabled ? 'choice-disabled' : ''} ${className}`}>
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange} disabled={disabled} className="choice-input" />
      <span className="choice-body">{children}</span>
    </label>
  )
}

export function JourneyPlanner() {
  const [data, setData] = useState<EnquiryInput>(emptyEnquiry)
  const [kind, setKind] = useState<Kind>('')
  const [step, setStep] = useState(0)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [summary, setSummary] = useState<FieldName[]>([])
  const [status, setStatus] = useState<Status>('idle')
  const [serverMessage, setServerMessage] = useState('')
  const [sent, setSent] = useState<{ rows: { label: string; value: string }[]; firstName: string } | null>(null)
  const [today, setToday] = useState('')
  const directionChosen = useRef(false)
  const focusTarget = useRef<string | null>(null)
  const summaryRef = useRef<HTMLDivElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const resultRef = useRef<HTMLHeadingElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const uid = useId()

  useEffect(() => setToday(ukToday()), [])

  // Let the fleet show which car this quote holds.
  useEffect(() => {
    window.dispatchEvent(new CustomEvent(VEHICLE_EVENT, { detail: status === 'sent' || status === 'dry-run' ? '' : data.vehicle }))
  }, [data.vehicle, status])

  // After a step change or prefill: bring the form into view and move focus
  // to the step heading (or a field that needs an answer).
  useEffect(() => {
    const target = focusTarget.current
    if (!target) return
    focusTarget.current = null
    requestAnimationFrame(() => {
      const form = formRef.current
      if (!form) return
      const el = target === 'heading' ? headingRef.current : form.querySelector<HTMLElement>(`#${target}`)
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (form.getBoundingClientRect().top < 0 || form.getBoundingClientRect().top > window.innerHeight * 0.6) {
        form.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
      }
      el?.focus({ preventScroll: true })
    })
  })

  const applyPrefill = useCallback((p: Prefill, focus: boolean) => {
    setStatus(s => (s === 'sent' || s === 'dry-run' ? 'idle' : s))
    setSent(null)
    setErrors({})
    setSummary([])
    const nextKind = p.occasion !== undefined ? kindFor(p.occasion) : undefined
    // A new route re-infers the airport direction; an explicit choice only
    // survives while the route it was made for stays.
    const newRoute = p.pickup !== undefined || p.destination !== undefined
    if (newRoute) directionChosen.current = false
    setKind(k => nextKind ?? k)
    setData(d => {
      const merged = { ...d, ...p, flying: d.flying }
      if (newRoute) merged.airportDirection = ''
      if (p.vehicle) merged.vehicle = findVehicle(p.vehicle)?.name || ''
      return derive(merged, nextKind ?? kindFor(merged.occasion), directionChosen.current)
    })
    if (nextKind === 'other') setStep(0)
    else if (nextKind) setStep(s => (s === 0 ? 1 : s))
    if (focus) focusTarget.current = nextKind === 'other' ? fid('journeyDetails') : 'heading'
  }, [])

  useEffect(() => {
    const p = readPrefillFromUrl(window.location.search)
    if (Object.keys(p).length) applyPrefill(p, false)
  }, [applyPrefill])

  useEffect(() => {
    const on = (e: Event) => applyPrefill((e as CustomEvent<Prefill>).detail || {}, true)
    window.addEventListener(PREFILL_EVENT, on)
    return () => window.removeEventListener(PREFILL_EVENT, on)
  }, [applyPrefill])

  /** Update one field; re-check the fields it can affect if they already
   *  show an error, and the car whenever the party or luggage changes. */
  const update = <K extends keyof EnquiryInput>(field: K, value: EnquiryInput[K], nextKind: Kind = kind) => {
    setData(d => {
      const next = derive({ ...d, [field]: value }, nextKind, directionChosen.current)
      const recheck = validateEnquiry(next, today || undefined)
      setErrors(prev => {
        const out = { ...prev }
        const affected = new Set<FieldName>([field as FieldName])
        if (field === 'passengers' || field === 'bags' || field === 'vehicle') affected.add('vehicle').add('passengers').add('bags')
        if (field === 'travelDate') affected.add('returnDate')
        affected.forEach(f => {
          const live = f === 'vehicle' || f in prev
          if (recheck[f] && live) out[f] = recheck[f]
          else delete out[f]
        })
        if (field === 'airportDirection') delete out.airportDirection
        return out
      })
      return next
    })
  }
  const onText = (f: FieldName) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => update(f, e.target.value as never)
  const onBlur = (f: FieldName) => () => {
    if (!data[f]) return
    const check = validateEnquiry(data, today || undefined)
    setErrors(prev => {
      const out = { ...prev }
      if (check[f]) out[f] = check[f]
      else delete out[f]
      return out
    })
  }

  const chooseKind = (k: Exclude<Kind, ''>) => {
    const def = KINDS.find(x => x.id === k)!.occasion
    const keep = kindFor(data.occasion) === k ? data.occasion : def
    setKind(k)
    if (k !== 'airport') directionChosen.current = false
    update('occasion', keep, k)
    setErrors(e => { const o = { ...e }; delete o.occasion; if (k !== 'other') delete o.journeyDetails; return o })
  }

  /** Focus a field from the error summary; for a group of radios, its
   *  checked (or first available) radio rather than the group itself. */
  const focusField = (f: FieldName) => {
    const el = document.getElementById(fid(f))
    const target = el && (el.matches('input, select, textarea, button')
      ? el
      : el.querySelector<HTMLElement>('input:checked:not([disabled])') || el.querySelector<HTMLElement>('input:not([disabled]), select, textarea, button'))
    target?.scrollIntoView({ block: 'center' })
    target?.focus({ preventScroll: true })
  }

  const showErrors = (found: FieldErrors) => {
    const failed = STEP_FIELDS.flat().filter(f => found[f])
    setErrors(e => ({ ...e, ...found }))
    setSummary(failed)
    requestAnimationFrame(() => { summaryRef.current?.scrollIntoView({ block: 'center' }); summaryRef.current?.focus({ preventScroll: true }) })
  }

  const goTo = (target: number) => {
    if (target <= step) {
      setSummary([]); setStep(target); focusTarget.current = 'heading'
      return
    }
    const between = Array.from({ length: target - step }, (_, i) => step + i)
    const found = checkSteps(between, data, kind, today)
    const first = between.find(i => STEP_FIELDS[i].some(f => found[f]))
    if (first !== undefined) {
      setStep(first)
      const own: FieldErrors = {}
      for (const f of STEP_FIELDS[first]) if (found[f]) own[f] = found[f]
      showErrors(own)
      return
    }
    setSummary([]); setStep(target); focusTarget.current = 'heading'
  }

  async function submit() {
    if (status === 'sending') return
    const found = checkSteps([0, 1, 2, 3], data, kind, today)
    const firstField = STEP_FIELDS.flat().find(f => found[f])
    if (firstField) {
      const s = stepOf(firstField)
      setStep(s)
      const own: FieldErrors = {}
      for (const f of STEP_FIELDS[s]) if (found[f]) own[f] = found[f]
      showErrors(own)
      setStatus('idle')
      return
    }
    setSummary([]); setServerMessage(''); setStatus('sending')
    const v = findVehicle(data.vehicle)
    const shown = v ? document.querySelector(`[data-vehicle-name="${slug(v.name)}"]`)?.textContent?.trim() || v.display : ''
    const f = flightFields(data)
    const payload: EnquiryInput = {
      ...data,
      vehicle: v?.name || '',
      vehicleLabel: shown,
      journeyDetails: isOtherOccasion(data.occasion) ? data.journeyDetails : '',
      flightIn: f.flightIn ? data.flightIn : '',
      flightOut: f.flightOut ? data.flightOut : '',
      returnDate: data.tripType === 'return' ? data.returnDate : '',
      returnTime: data.tripType === 'return' ? data.returnTime : '',
    }
    try {
      const res = await fetch('/api/enquiry', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const result = (await res.json().catch(() => ({}))) as { ok?: boolean; dryRun?: boolean; error?: string; fields?: FieldErrors }
      if (res.ok && result.ok) {
        setSent({ rows: summariseEnquiry(payload), firstName: data.name.split(' ')[0] })
        setStatus(result.dryRun ? 'dry-run' : 'sent')
        requestAnimationFrame(() => { document.getElementById('plan-result')?.scrollIntoView({ block: 'start' }); resultRef.current?.focus({ preventScroll: true }) })
        return
      }
      const fields = result.fields || {}
      const first = STEP_FIELDS.flat().find(x => fields[x])
      if (first) {
        setStatus('idle')
        const s = stepOf(first)
        setStep(s)
        const own: FieldErrors = {}
        for (const x of STEP_FIELDS[s]) if (fields[x]) own[x] = fields[x]
        showErrors(own)
        return
      }
      setServerMessage(result.error || '')
      setStatus('error')
    } catch {
      setStatus('error')
    }
  }

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (step < STEPS.length - 1) goTo(step + 1)
    else submit()
  }

  const reset = () => {
    setData(emptyEnquiry()); setKind(''); setStep(0); setErrors({}); setSummary([]); setSent(null); setStatus('idle')
    directionChosen.current = false
    focusTarget.current = 'heading'
  }

  const isReturn = data.tripType === 'return'
  const pax = Number(data.passengers) || 1
  const cases = Number(data.bags) || 0
  const flights = flightFields(data)
  const dir = data.airportDirection
  const toAirport = dir === 'to' || dir === 'both' // the outward journey ends at the airport
  const chosen = findVehicle(data.vehicle)
  const kindInfo = KINDS.find(k => k.id === kind)
  // Notes share the platform's 1,000-character notes field with the journey
  // details, so show what is left (the server enforces the same limit).
  const room = notesRoom({ ...data, vehicle: chosen?.name || '', vehicleLabel: chosen?.display || '', journeyDetails: isOtherOccasion(data.occasion) ? data.journeyDetails : '' })
  const notesLeft = data.notes ? room : room - ' · Customer notes: '.length
  const mailto = (() => {
    const rows = summariseEnquiry(data)
    const body = ["Hello, I'd like a quote please.", '', ...rows.map(r => `${r.label}: ${r.value}`), '', `Name: ${data.name}`, `Phone: ${data.phone}`].join('\n')
    return `mailto:${BUSINESS.email}?subject=${encodeURIComponent(`Quote request: ${data.pickup || 'pick-up'} to ${data.destination || 'destination'}`)}&body=${encodeURIComponent(body)}`
  })()

  if ((status === 'sent' || status === 'dry-run') && sent) {
    const test = status === 'dry-run'
    return (
      <div id="plan-result" className="rounded-3xl bg-mist p-6 sm:p-10" role="status">
        <div className={`mb-5 grid h-12 w-12 place-items-center rounded-full ${test ? 'bg-cloud text-ink' : 'bg-success text-white'}`}>
          <Icon name={test ? 'info' : 'check'} className="h-6 w-6" strokeWidth={2} />
        </div>
        <h3 ref={resultRef} tabIndex={-1} className="t-h3 text-ink focus:outline-none">
          {test ? 'Test mode: this enquiry was not sent' : `Thank you${sent.firstName ? `, ${sent.firstName}` : ''}. Your request is with us.`}
        </h3>
        <p className="mt-3 max-w-prose text-ink-2">
          {test ? 'This copy of the website checks enquiries without delivering them.' : `We’ll reply with a quote by email or phone. This is a request, not a booking: nothing is booked until you accept the quote. For anything urgent, call ${BUSINESS.phoneDisplay}.`}
        </p>
        <dl className="mt-6 grid gap-x-6 gap-y-3 sm:grid-cols-2">
          {sent.rows.map(r => (
            <div key={r.label}>
              <dt className="label text-[0.72rem]">{r.label}</dt>
              <dd className="mt-0.5 break-words text-ink">{r.value}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-8 flex flex-wrap gap-3">
          <button type="button" onClick={reset} className="btn btn-dark">Plan another journey</button>
          <a href={BUSINESS.phoneHref} className="btn btn-ghost tabular"><Icon name="phone" className="h-[1.05rem] w-[1.05rem]" />Call {BUSINESS.phoneDisplay}</a>
        </div>
      </div>
    )
  }

  const reviewGroups: { step: number; title: string; rows: { label: string; value: string }[] }[] = [
    { step: 0, title: 'Journey', rows: [{ label: 'Type', value: data.occasion || '—' }, ...(isOtherOccasion(data.occasion) && data.journeyDetails ? [{ label: 'About the journey', value: data.journeyDetails }] : [])] },
    {
      step: 1, title: 'Route and time', rows: [
        { label: 'Journey', value: `${data.pickup || '—'} → ${data.destination || '—'}` },
        { label: 'Outward', value: [data.travelDate, data.travelTime].filter(Boolean).join(' at ') || '—' },
        ...(isReturn ? [{ label: 'Return', value: [data.returnDate, data.returnTime].filter(Boolean).join(' at ') || '—' }] : []),
        ...(data.flying && dir ? [{ label: 'Airport', value: AIRPORT_DIRECTION_TEXT[dir] }] : []),
        ...(flights.flightIn && data.flightIn ? [{ label: 'Arriving flight', value: data.flightIn }] : []),
        ...(flights.flightOut && data.flightOut ? [{ label: 'Departing flight', value: data.flightOut }] : []),
      ],
    },
    {
      step: 2, title: 'Car and passengers', rows: [
        { label: 'Party', value: `${pax} passenger${pax === 1 ? '' : 's'}, ${cases} case${cases === 1 ? '' : 's'}` },
        { label: 'Car', value: chosen?.display || 'Please recommend' },
        ...(data.notes ? [{ label: 'Notes', value: data.notes }] : []),
      ],
    },
  ]

  return (
    <form id="quote" ref={formRef} onSubmit={onSubmit} noValidate aria-labelledby="plan-title" aria-busy={status === 'sending'} className="wizard rounded-3xl bg-mist p-5 sm:p-8 lg:p-10">
      <ol className="wizard-steps" aria-label="Quote steps">
        {STEPS.map((title, i) => (
          <li key={title} className="min-w-0">
            <button
              type="button"
              onClick={() => goTo(i)}
              aria-current={i === step ? 'step' : undefined}
              className={`wizard-step ${i === step ? 'is-current' : i < step ? 'is-done' : ''}`}
            >
              <span className="wizard-step-n" aria-hidden="true">{i < step ? <Icon name="check" className="h-3.5 w-3.5" strokeWidth={2.5} /> : i + 1}</span>
              <span className={`truncate ${i === step ? '' : 'max-sm:sr-only'}`}><span className="sr-only">Step {i + 1}: </span>{title}</span>
            </button>
          </li>
        ))}
      </ol>

      <h3 ref={headingRef} tabIndex={-1} className="t-h3 mt-7 text-ink focus:outline-none">
        <span className="sr-only">Step {step + 1} of {STEPS.length}: </span>
        {[
          'What kind of journey?',
          kind === 'airport' ? 'Your airport transfer' : 'Where, and when?',
          'Who’s travelling?',
          'Where should we send your quote?',
        ][step]}
      </h3>

      {summary.length ? (
        <div ref={summaryRef} tabIndex={-1} role="alert" className="mt-5 rounded-2xl bg-white p-5 shadow-[inset_0_0_0_2px_var(--tl-error)] focus:outline-none">
          <p className="flex items-center gap-2 font-semibold text-error"><Icon name="alert" className="h-5 w-5" strokeWidth={2} />{summary.length === 1 ? 'One detail needs checking' : `${summary.length} details need checking`}</p>
          <ul className="mt-3 grid gap-1.5 pl-7">
            {summary.map(f => (
              <li key={f}>
                <a href={`#${fid(f)}`} className="text-link text-ink" onClick={e => { e.preventDefault(); focusField(f) }}>
                  {FIELD_LABEL[f]}: {errors[f] || 'please check'}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-6">
        {step === 0 ? (
          <div className="space-y-6">
            <fieldset aria-describedby={errors.occasion ? `${fid('occasion')}-error` : undefined}>
              <legend className="sr-only">Journey type</legend>
              <div id={fid('occasion')} className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {KINDS.map(k => (
                  <Choice key={k.id} name="kind" value={k.id} checked={kind === k.id} onChange={() => chooseKind(k.id)}>
                    <Icon name={k.icon} className="h-5 w-5 text-steel" />
                    <span className="mt-3 block font-semibold text-ink">{k.label}</span>
                    <span className="mt-0.5 block text-[0.88rem] leading-snug text-steel">{k.hint}</span>
                  </Choice>
                ))}
              </div>
              <FieldError field="occasion" errors={errors} />
            </fieldset>

            {kind === 'occasion' ? (
              <div className="max-w-[24rem]">
                <label htmlFor={fid('occasion') + '-which'} className="field-label">Which occasion? <span className="font-normal text-steel">(optional)</span></label>
                <select id={fid('occasion') + '-which'} className="field-input" value={OCCASIONS.includes(data.occasion) ? data.occasion : 'Special occasions'} onChange={e => update('occasion', e.target.value)}>
                  {OCCASIONS.map(o => <option key={o} value={o}>{o === 'Special occasions' ? 'A special occasion' : o}</option>)}
                </select>
              </div>
            ) : null}
            {(kind === 'business' && data.occasion !== 'Corporate travel') || (kind === 'other' && data.occasion !== OTHER_OCCASION) ? (
              <p className="text-[0.95rem] text-steel">Trip: <span className="font-semibold text-ink">{data.occasion}</span></p>
            ) : null}
            {kind === 'other' ? (
              <div className="max-w-[40rem]">
                <label htmlFor={fid('journeyDetails')} className="field-label">Describe your journey</label>
                <textarea
                  id={fid('journeyDetails')} name="journeyDetails" className="field-input" rows={3} maxLength={300} required
                  value={data.journeyDetails} onChange={onText('journeyDetails')} onBlur={onBlur('journeyDetails')}
                  aria-invalid={errors.journeyDetails ? true : undefined} aria-describedby={described('journeyDetails', errors, true)}
                />
                <span id={`${fid('journeyDetails')}-hint`} className="field-hint">For example: to Southampton for a cruise, or a day out with three stops.</span>
                <FieldError field="journeyDetails" errors={errors} />
              </div>
            ) : null}
          </div>
        ) : null}

        {step === 1 ? (
          <div className="space-y-5">
            {data.flying ? (
              <fieldset aria-describedby={errors.airportDirection ? `${fid('airportDirection')}-error` : undefined}>
                <legend className="field-label">Which way?</legend>
                <div id={fid('airportDirection')} className="grid gap-3 lg:grid-cols-3">
                  {(['to', 'from', 'both'] as const).map(d => (
                    <Choice key={d} name="airportDirection" value={d} checked={dir === d} onChange={() => {
                      directionChosen.current = true
                      // the return carries the collection, so set it before the direction
                      if (d === 'both') update('tripType', 'return')
                      // leaving drop-off and collection drops the collection it added
                      else if (dir === 'both') update('tripType', 'one-way')
                      update('airportDirection', d)
                    }} className="choice-row">
                      {d === 'both' ? <Icon name="swap" className="h-5 w-5 flex-none text-steel" /> : <Icon name="plane" className={`h-5 w-5 flex-none text-steel ${d === 'from' ? 'rotate-90' : ''}`} />}
                      <span className="font-semibold text-ink">{d === 'to' ? 'Going to the airport' : d === 'from' ? 'Being collected from it' : 'Drop-off and collection'}</span>
                    </Choice>
                  ))}
                </div>
                <FieldError field="airportDirection" errors={errors} />
              </fieldset>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor={fid('pickup')} className="field-label">Pick-up</label>
                <input id={fid('pickup')} name="pickup" className="field-input" value={data.pickup} onChange={onText('pickup')} onBlur={onBlur('pickup')} list={dir === 'from' ? `${uid}-airports` : undefined} placeholder={dir === 'from' ? 'Airport and terminal' : 'Address, postcode or station'} autoComplete={dir === 'from' ? 'off' : 'street-address'} required aria-invalid={errors.pickup ? true : undefined} aria-describedby={described('pickup', errors)} />
                <FieldError field="pickup" errors={errors} />
              </div>
              <div>
                <div className="flex items-end justify-between">
                  <label htmlFor={fid('destination')} className="field-label">Destination</label>
                  <button type="button" onClick={() => setData(d => derive({ ...d, pickup: d.destination, destination: d.pickup, airportDirection: d.airportDirection === 'to' || d.airportDirection === 'both' ? 'from' : d.airportDirection === 'from' ? 'to' : '' }, kind, directionChosen.current))} className="-mt-3 mb-0.5 inline-flex min-h-[2.75rem] items-center gap-1.5 rounded-full px-2.5 text-[0.86rem] font-semibold text-ink-2 hover:text-ink" aria-label="Swap pick-up and destination">
                    <Icon name="swap" className="h-4 w-4" />Swap
                  </button>
                </div>
                <input id={fid('destination')} name="destination" className="field-input" value={data.destination} onChange={onText('destination')} onBlur={onBlur('destination')} list={toAirport ? `${uid}-airports` : undefined} placeholder={toAirport ? 'Airport and terminal' : 'Address, venue, port or airport'} autoComplete="off" required aria-invalid={errors.destination ? true : undefined} aria-describedby={described('destination', errors)} />
                <FieldError field="destination" errors={errors} />
              </div>
              <datalist id={`${uid}-airports`}>
                {AIRPORTS.map(a => <option key={a.code} value={`${a.name} Airport`} />)}
              </datalist>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:max-w-[36rem]">
              <div>
                <label htmlFor={fid('travelDate')} className="field-label">{dir === 'both' ? 'Drop-off date' : isReturn ? 'Outward date' : 'Date'}</label>
                <input id={fid('travelDate')} name="travelDate" type="date" className="field-input tabular" min={today || undefined} value={data.travelDate} onChange={onText('travelDate')} onBlur={onBlur('travelDate')} required aria-invalid={errors.travelDate ? true : undefined} aria-describedby={described('travelDate', errors)} />
                <FieldError field="travelDate" errors={errors} />
              </div>
              <div>
                <label htmlFor={fid('travelTime')} className="field-label">Pick-up time</label>
                <input id={fid('travelTime')} name="travelTime" type="time" className="field-input tabular" value={data.travelTime} onChange={onText('travelTime')} onBlur={onBlur('travelTime')} required aria-invalid={errors.travelTime ? true : undefined} aria-describedby={described('travelTime', errors, dir === 'from')} />
                {dir === 'from' ? <span id={`${fid('travelTime')}-hint`} className="field-hint">Your scheduled landing time is fine.</span> : null}
                <FieldError field="travelTime" errors={errors} />
              </div>
            </div>

            {dir === 'both' ? null : (
              <label className="inline-flex min-h-[2.75rem] cursor-pointer items-center gap-2.5 text-[0.98rem] font-medium">
                <input type="checkbox" checked={isReturn} onChange={e => update('tripType', e.target.checked ? 'return' : 'one-way')} className="h-5 w-5 accent-[var(--tl-ink)]" />
                Add a return journey
              </label>
            )}

            {isReturn ? (
              <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:max-w-[36rem]">
                <div>
                  <label htmlFor={fid('returnDate')} className="field-label">{dir === 'both' ? 'Collection date' : 'Return date'}</label>
                  <input id={fid('returnDate')} name="returnDate" type="date" className="field-input tabular" min={data.travelDate || today || undefined} value={data.returnDate} onChange={onText('returnDate')} onBlur={onBlur('returnDate')} required aria-invalid={errors.returnDate ? true : undefined} aria-describedby={described('returnDate', errors)} />
                  <FieldError field="returnDate" errors={errors} />
                </div>
                <div>
                  <label htmlFor={fid('returnTime')} className="field-label">{dir === 'both' ? 'Collection time' : 'Return time'} <span className="font-normal text-steel">(optional)</span></label>
                  <input id={fid('returnTime')} name="returnTime" type="time" className="field-input tabular" value={data.returnTime} onChange={onText('returnTime')} onBlur={onBlur('returnTime')} aria-invalid={errors.returnTime ? true : undefined} aria-describedby={described('returnTime', errors, dir === 'both')} />
                  {dir === 'both' ? <span id={`${fid('returnTime')}-hint`} className="field-hint">Your scheduled landing time is fine.</span> : null}
                  <FieldError field="returnTime" errors={errors} />
                </div>
              </div>
            ) : null}

            {data.flying && dir ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {((toAirport ? ['flightOut', 'flightIn'] : ['flightIn', 'flightOut']) as ('flightIn' | 'flightOut')[]).filter(f => flights[f]).map(f => {
                  const outward = (toAirport && f === 'flightOut') || (dir === 'from' && f === 'flightIn')
                  const label = f === 'flightIn' ? (outward ? 'Arriving flight number' : dir === 'both' ? 'Flight home (landing)' : 'Return flight number (landing)') : (outward ? 'Departing flight number' : 'Return flight number (departing)')
                  const hint = f === 'flightIn' ? 'Optional. We monitor it and meet you in arrivals.' : 'Optional. Helps us time your journey.'
                  return (
                    <div key={f}>
                      <label htmlFor={fid(f)} className="field-label">{label}</label>
                      <input id={fid(f)} name={f} className="field-input uppercase tabular" value={data[f]} onChange={onText(f)} onBlur={onBlur(f)} placeholder="e.g. BA117" autoComplete="off" autoCapitalize="characters" spellCheck={false} aria-invalid={errors[f] ? true : undefined} aria-describedby={described(f, errors, true)} />
                      <span id={`${fid(f)}-hint`} className="field-hint">{hint}</span>
                      <FieldError field={f} errors={errors} />
                    </div>
                  )
                })}
              </div>
            ) : null}
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:max-w-[30rem]">
              <Stepper field="passengers" label="Passengers" value={data.passengers} min={1} max={MAX_SEATS} onChange={v => update('passengers', v)} errors={errors} unit={['passenger', 'passengers']} />
              <Stepper field="bags" label="Cases" value={data.bags} min={0} max={MAX_BAGS} onChange={v => update('bags', v)} errors={errors} unit={['case', 'cases']} />
            </div>
            <fieldset aria-describedby={errors.vehicle ? `${fid('vehicle')}-error` : undefined}>
              <legend className="field-label">Car</legend>
              <div id={fid('vehicle')} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <Choice name="vehicle" value="" checked={!data.vehicle} onChange={() => update('vehicle', '')} className="choice-car">
                  <span className="grid aspect-[3/2] w-full place-items-center rounded-lg bg-white text-steel"><Icon name="sparkle" className="h-6 w-6" /></span>
                  <span className="mt-3 block font-semibold text-ink">No preference</span>
                  <span className="mt-0.5 block text-[0.88rem] text-steel">We’ll recommend one</span>
                </Choice>
                {VEHICLES.map(v => {
                  const fits = pax <= v.seats && cases <= v.cases
                  const selected = data.vehicle === v.name
                  return (
                    <Choice key={v.name} name="vehicle" value={v.name} checked={selected} onChange={() => update('vehicle', v.name)} disabled={!fits && !selected} className="choice-car">
                      <img src={v.image} alt="" width={v.imageSize[0]} height={v.imageSize[1]} loading="lazy" decoding="async" className={`aspect-[3/2] w-full rounded-lg object-cover ${v.studio ? '' : 'bg-white object-contain'}`} />
                      <span className="mt-3 block font-semibold text-ink">{v.display}</span>
                      <span className="mt-0.5 block text-[0.88rem] text-steel">{fits ? `Seats ${v.seats} · ${v.cases} cases` : `Too small: seats ${v.seats}, ${v.cases} cases`}</span>
                    </Choice>
                  )
                })}
              </div>
              <FieldError field="vehicle" errors={errors} />
            </fieldset>
            <div className="max-w-[40rem]">
              <label htmlFor={fid('notes')} className="field-label">Anything we should know? <span className="font-normal text-steel">(optional)</span></label>
              <textarea id={fid('notes')} name="notes" className="field-input" rows={2} value={data.notes} onChange={onText('notes')} onBlur={onBlur('notes')} maxLength={800} placeholder="Extra stops, child seats, accessibility needs…" aria-invalid={errors.notes || notesLeft < 0 ? true : undefined} aria-describedby={described('notes', errors, true)} />
              <span id={`${fid('notes')}-hint`} className={`field-hint tabular ${notesLeft < 0 ? 'font-semibold text-error' : ''}`} aria-live="polite">
                {notesLeft < 0 ? `${-notesLeft} characters over the limit` : `${Math.min(notesLeft, 800 - data.notes.length)} characters left`}
              </span>
              <FieldError field="notes" errors={errors} />
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-7">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label htmlFor={fid('name')} className="field-label">Name</label>
                <input id={fid('name')} name="name" className="field-input" value={data.name} onChange={onText('name')} onBlur={onBlur('name')} autoComplete="name" required aria-invalid={errors.name ? true : undefined} aria-describedby={described('name', errors)} />
                <FieldError field="name" errors={errors} />
              </div>
              <div>
                <label htmlFor={fid('phone')} className="field-label">Phone</label>
                <input id={fid('phone')} name="phone" type="tel" className="field-input tabular" value={data.phone} onChange={onText('phone')} onBlur={onBlur('phone')} autoComplete="tel" inputMode="tel" required aria-invalid={errors.phone ? true : undefined} aria-describedby={described('phone', errors)} />
                <FieldError field="phone" errors={errors} />
              </div>
              <div>
                <label htmlFor={fid('email')} className="field-label">Email</label>
                <input id={fid('email')} name="email" type="email" className="field-input" value={data.email} onChange={onText('email')} onBlur={onBlur('email')} autoComplete="email" inputMode="email" autoCapitalize="none" spellCheck={false} required aria-invalid={errors.email ? true : undefined} aria-describedby={described('email', errors)} />
                <FieldError field="email" errors={errors} />
              </div>
            </div>

            <section aria-labelledby={`${uid}-review`} className="rounded-2xl bg-white p-5 sm:p-6">
              <h4 id={`${uid}-review`} className="font-semibold text-ink">Check your journey</h4>
              <div className="mt-4 grid gap-5 lg:grid-cols-3">
                {reviewGroups.map(g => (
                  <div key={g.title}>
                    <div className="flex items-center justify-between gap-3">
                      <p className="label text-[0.72rem]">{g.title}</p>
                      <button type="button" onClick={() => goTo(g.step)} className="text-link inline-flex min-h-[2.75rem] items-center text-[0.9rem] text-ink-2" aria-label={`Edit ${g.title.toLowerCase()}`}>Edit</button>
                    </div>
                    <dl className="grid gap-1.5 text-[0.95rem]">
                      {g.rows.map(r => (
                        <div key={r.label} className="grid grid-cols-[6.5rem_1fr] gap-2">
                          <dt className="text-steel">{r.label}</dt>
                          <dd className="break-words text-ink">{r.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                ))}
              </div>
            </section>
          </div>
        ) : null}
      </div>

      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor={`${uid}-website`}>Leave this empty</label>
        <input id={`${uid}-website`} name="website" tabIndex={-1} autoComplete="off" value={data.website} onChange={e => update('website', e.target.value)} />
      </div>

      {status === 'error' ? (
        <div role="alert" className="mt-6 rounded-2xl bg-white p-5 shadow-[inset_0_0_0_2px_var(--tl-error)]">
          <p className="font-semibold text-error">{serverMessage && !/couldn’t send/i.test(serverMessage) ? serverMessage : 'We couldn’t send your request just now.'}</p>
          <p className="mt-1.5 text-ink-2">Your details are still here. Try again, or reach us directly:</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a href={BUSINESS.phoneHref} className="btn btn-dark tabular"><Icon name="phone" className="h-[1.05rem] w-[1.05rem]" />Call {BUSINESS.phoneDisplay}</a>
            <a href={mailto} className="btn btn-ghost"><Icon name="mail" className="h-[1.05rem] w-[1.05rem]" />Email these details</a>
          </div>
        </div>
      ) : null}

      <div className="mt-8 flex flex-col-reverse gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          {step > 0 ? (
            <button type="button" onClick={() => goTo(step - 1)} className="btn btn-ghost px-6 text-ink">
              <Icon name="arrowRight" className="h-5 w-5 rotate-180" />Back
            </button>
          ) : null}
          {step === STEPS.length - 1 ? (
            <p className="max-w-[24rem] text-[0.9rem] leading-relaxed text-steel">
              This is a request for a quote, not a booking. Details are used only to reply (<a href="/privacy" className="text-link text-ink-2">privacy</a>).
            </p>
          ) : (
            <p className="text-[0.9rem] text-steel tabular" aria-hidden="true">Step {step + 1} of {STEPS.length}{kindInfo ? ` · ${kindInfo.label}` : ''}</p>
          )}
        </div>
        <button type="submit" className="btn btn-dark min-h-[3.5rem] px-9 text-[1.05rem]" disabled={status === 'sending'}>
          {status === 'sending' ? (
            <><span className="h-5 w-5 animate-spin rounded-full border-2 border-[rgba(255,255,255,0.4)] border-t-white motion-reduce:animate-none" aria-hidden="true" />Sending…</>
          ) : step === STEPS.length - 1 ? (
            <>Send quote request<Icon name="arrowRight" className="h-5 w-5" /></>
          ) : (
            <>Continue<Icon name="arrowRight" className="h-5 w-5" /></>
          )}
        </button>
      </div>
      <p className="sr-only" aria-live="polite">{status === 'sending' ? 'Sending your request' : ''}</p>
    </form>
  )
}
