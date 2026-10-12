'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import {
  emptyEnquiry, looksLikeAirport, MAX_BAGS, summariseEnquiry, ukToday, validateEnquiry,
  type EnquiryInput, type FieldErrors, type FieldName,
} from '@/lib/enquiry'
import { PREFILL_EVENT, readPrefillFromUrl, type Prefill } from '@/lib/prefill'
import { BUSINESS, MAX_PASSENGERS, SERVICE_GROUPS, SERVICES, VEHICLES, slug } from '@/lib/site'
import { Icon } from './Icon'

type Status = 'idle' | 'sending' | 'sent' | 'dry-run' | 'error'

const FIELD_ORDER: FieldName[] = ['pickup', 'destination', 'travelDate', 'travelTime', 'returnDate', 'returnTime', 'flightIn', 'flightOut', 'passengers', 'bags', 'name', 'phone', 'email', 'notes']
const REQUIRED_ORDER: FieldName[] = ['pickup', 'destination', 'travelDate', 'travelTime', 'name', 'phone', 'email']
const FIELD_LABEL: Record<FieldName, string> = {
  pickup: 'Pick-up', destination: 'Destination', travelDate: 'Date', travelTime: 'Time',
  returnDate: 'Return date', returnTime: 'Return time', flightIn: 'Arriving flight', flightOut: 'Departing flight',
  passengers: 'Passengers', bags: 'Luggage', vehicle: 'Vehicle', occasion: 'Journey type',
  name: 'Name', phone: 'Phone', email: 'Email', notes: 'Notes',
}

// Journey types: each sends a plain occasion string the owner already uses.
const TYPES = [
  { id: 'airport', label: 'Airport', occasion: 'Airport transfers', icon: 'plane' as const },
  { id: 'business', label: 'Business', occasion: 'Corporate travel', icon: 'briefcase' as const },
  { id: 'occasion', label: 'Occasion', occasion: 'Special occasions', icon: 'sparkle' as const },
  { id: 'other', label: 'Other', occasion: 'Something else', icon: 'road' as const },
]
const typeFor = (occasion: string) => {
  if (!occasion) return '' // nothing chosen yet
  const direct = TYPES.find(t => t.occasion === occasion)
  if (direct) return direct.id
  const svc = SERVICES.find(s => s.title === occasion)
  const group = svc ? SERVICE_GROUPS.find(g => g.items.includes(svc.idx)) : null
  if (group?.key === 'travel') return svc?.idx === 7 ? 'other' : 'airport'
  if (group?.key === 'evenings') return 'business'
  if (group?.key === 'occasions') return 'occasion'
  return 'other'
}

const fid = (f: FieldName) => `plan-${f}`
const described = (f: FieldName, errors: FieldErrors, hint?: boolean) =>
  [hint ? `${fid(f)}-hint` : '', errors[f] ? `${fid(f)}-error` : ''].filter(Boolean).join(' ') || undefined

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
        <button type="button" className="grid w-11 flex-none place-items-center text-ink hover:bg-mist disabled:text-silver disabled:hover:bg-transparent" onClick={() => set(n - 1)} disabled={n <= min} aria-label={`One fewer ${unit[0]}`} aria-controls={fid(field)}>
          <Icon name="minus" className="h-5 w-5" strokeWidth={2} />
        </button>
        <input
          id={fid(field)} name={field} type="number" inputMode="numeric" min={min} max={max} value={value}
          onChange={e => onChange(e.target.value.replace(/\D/g, '').slice(0, 2))}
          onBlur={() => value !== '' && set(n)}
          className="w-full min-w-0 bg-transparent text-center text-[1.1rem] font-semibold text-ink tabular focus:outline-none"
          aria-invalid={errors[field] ? true : undefined} aria-describedby={described(field, errors)}
        />
        <button type="button" className="grid w-11 flex-none place-items-center text-ink hover:bg-mist disabled:text-silver disabled:hover:bg-transparent" onClick={() => set(n + 1)} disabled={n >= max} aria-label={`One more ${unit[0]}`} aria-controls={fid(field)}>
          <Icon name="plus" className="h-5 w-5" strokeWidth={2} />
        </button>
      </div>
      <span className="sr-only" aria-live="polite">{n} {n === 1 ? unit[0] : unit[1]}</span>
      <FieldError field={field} errors={errors} />
    </div>
  )
}

export function JourneyPlanner() {
  const [data, setData] = useState<EnquiryInput>(emptyEnquiry)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [summary, setSummary] = useState<FieldName[]>([])
  const [status, setStatus] = useState<Status>('idle')
  const [serverMessage, setServerMessage] = useState('')
  const [sent, setSent] = useState<{ rows: { label: string; value: string }[]; firstName: string } | null>(null)
  const [today, setToday] = useState('')
  const flyingChosen = useRef(false)
  const pendingFocus = useRef(false)
  const summaryRef = useRef<HTMLDivElement>(null)
  const resultRef = useRef<HTMLHeadingElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const uid = useId()

  useEffect(() => setToday(ukToday()), [])

  const focusNext = useCallback(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const form = formRef.current
    if (!form) return
    const next = REQUIRED_ORDER.map(f => form.querySelector<HTMLElement>(`#${fid(f)}`)).find(el => el && !(el as HTMLInputElement).value)
    const target = next || form.querySelector<HTMLElement>('button[type="submit"]')
    const early = !next || next.id === fid('pickup') || next.id === fid('destination')
    if (early) document.getElementById('plan')?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
    else target?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' })
    target?.focus({ preventScroll: true })
  }, [])

  const applyPrefill = useCallback((p: Prefill, focus: boolean) => {
    if (p.flying !== undefined) flyingChosen.current = true
    setStatus(s => (s === 'sent' || s === 'dry-run' ? 'idle' : s))
    setSent(null)
    setData(d => {
      const next = { ...d, ...p }
      if (!flyingChosen.current) next.flying = looksLikeAirport(next.pickup) || looksLikeAirport(next.destination) || next.occasion === 'Airport transfers'
      return next
    })
    if (focus) pendingFocus.current = true
  }, [])

  useEffect(() => {
    const p = readPrefillFromUrl(window.location.search)
    if (Object.keys(p).length) applyPrefill(p, false)
  }, [applyPrefill])

  useEffect(() => {
    const onPrefill = (e: Event) => applyPrefill((e as CustomEvent<Prefill>).detail || {}, true)
    window.addEventListener(PREFILL_EVENT, onPrefill)
    return () => window.removeEventListener(PREFILL_EVENT, onPrefill)
  }, [applyPrefill])

  useEffect(() => {
    if (!pendingFocus.current) return
    pendingFocus.current = false
    requestAnimationFrame(focusNext)
  }, [data, focusNext])

  const update = <K extends keyof EnquiryInput>(field: K, value: EnquiryInput[K]) => {
    setData(d => {
      const next = { ...d, [field]: value }
      if ((field === 'pickup' || field === 'destination' || field === 'occasion') && !flyingChosen.current) {
        next.flying = looksLikeAirport(next.pickup) || looksLikeAirport(next.destination) || next.occasion === 'Airport transfers'
      }
      if (field in errors) {
        const recheck = validateEnquiry(next, today || undefined)
        setErrors(prev => {
          const out = { ...prev }
          const f = field as FieldName
          if (recheck[f]) out[f] = recheck[f]
          else delete out[f]
          return out
        })
      }
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

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (status === 'sending') return
    const check = validateEnquiry(data, today || undefined)
    const failed = FIELD_ORDER.filter(f => check[f])
    setErrors(check)
    if (failed.length) {
      setSummary(failed)
      setStatus('idle')
      requestAnimationFrame(() => { summaryRef.current?.scrollIntoView({ block: 'center' }); summaryRef.current?.focus({ preventScroll: true }) })
      return
    }
    setSummary([])
    setServerMessage('')
    setStatus('sending')
    const shownVehicle = data.vehicle ? document.querySelector(`[data-vehicle-name="${slug(data.vehicle)}"]`)?.textContent?.trim() || data.vehicle : ''
    const payload = { ...data, vehicle: shownVehicle, ...(data.flying ? {} : { flightIn: '', flightOut: '' }) }
    try {
      const res = await fetch('/api/enquiry', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const result = (await res.json().catch(() => ({}))) as { ok?: boolean; dryRun?: boolean; error?: string; fields?: FieldErrors }
      if (res.ok && result.ok) {
        setSent({ rows: summariseEnquiry(payload), firstName: data.name.split(' ')[0] })
        setStatus(result.dryRun ? 'dry-run' : 'sent')
        requestAnimationFrame(() => { document.getElementById('plan-result')?.scrollIntoView({ block: 'start' }); resultRef.current?.focus({ preventScroll: true }) })
        return
      }
      if (result.fields && Object.keys(result.fields).length) {
        setErrors(result.fields)
        setSummary(FIELD_ORDER.filter(f => result.fields?.[f]))
        setStatus('idle')
        requestAnimationFrame(() => summaryRef.current?.focus())
        return
      }
      setServerMessage(result.error || '')
      setStatus('error')
    } catch {
      setStatus('error')
    }
  }

  const reset = () => {
    setData(emptyEnquiry()); setErrors({}); setSent(null); setStatus('idle'); flyingChosen.current = false
    requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>(`#${fid('pickup')}`)?.focus())
  }

  const type = typeFor(data.occasion)
  const isReturn = data.tripType === 'return'
  const pax = Number(data.passengers) || 1
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
          {test ? 'Test mode: this enquiry was not sent' : `Thank you${sent.firstName ? `, ${sent.firstName}` : ''}. Your enquiry is with us.`}
        </h3>
        <p className="mt-3 max-w-prose text-ink-2">
          {test ? 'This copy of the website checks enquiries without delivering them.' : `We’ll reply with a quote by email or phone. Nothing is booked until you accept it. For anything urgent, call ${BUSINESS.phoneDisplay}.`}
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

  return (
    <form ref={formRef} onSubmit={submit} noValidate aria-labelledby="plan-title" aria-busy={status === 'sending'} className="rounded-3xl bg-mist p-5 sm:p-8 lg:p-10">
      {summary.length ? (
        <div ref={summaryRef} tabIndex={-1} role="alert" className="mb-7 rounded-2xl bg-white p-5 shadow-[inset_0_0_0_2px_var(--tl-error)] focus:outline-none">
          <p className="flex items-center gap-2 font-semibold text-error"><Icon name="alert" className="h-5 w-5" strokeWidth={2} />{summary.length === 1 ? 'One detail needs checking' : `${summary.length} details need checking`}</p>
          <ul className="mt-3 grid gap-1.5 pl-7">
            {summary.map(f => (
              <li key={f}>
                <a href={`#${fid(f)}`} className="text-link text-ink" onClick={e => { e.preventDefault(); const el = document.getElementById(fid(f)); el?.scrollIntoView({ block: 'center' }); el?.focus({ preventScroll: true }) }}>
                  {FIELD_LABEL[f]}: {errors[f] || 'please check'}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <fieldset>
        <legend className="field-label">Journey type</legend>
        <div className="seg-grid w-full sm:w-auto" role="radiogroup" aria-label="Journey type">
          {TYPES.map(t => (
            <button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={type === t.id}
              className="seg-btn"
              onClick={() => { flyingChosen.current = false; update('occasion', type === t.id ? '' : t.occasion) }}
            >
              <Icon name={t.icon} className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </div>
        {data.occasion && !TYPES.some(t => t.occasion === data.occasion) ? (
          <p className="mt-2 text-[0.9rem] text-steel">Occasion: <span className="font-semibold text-ink">{data.occasion}</span> <button type="button" className="text-link ml-1 text-ink-2" onClick={() => update('occasion', '')}>Clear</button></p>
        ) : null}
      </fieldset>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor={fid('pickup')} className="field-label">Pick-up</label>
          <input id={fid('pickup')} name="pickup" className="field-input" value={data.pickup} onChange={onText('pickup')} onBlur={onBlur('pickup')} placeholder="Address, station or airport…" autoComplete="street-address" required aria-invalid={errors.pickup ? true : undefined} aria-describedby={described('pickup', errors)} />
          <FieldError field="pickup" errors={errors} />
        </div>
        <div>
          <div className="flex items-end justify-between">
            <label htmlFor={fid('destination')} className="field-label">Destination</label>
            <button type="button" onClick={() => setData(d => ({ ...d, pickup: d.destination, destination: d.pickup }))} className="-mt-3 mb-0.5 inline-flex min-h-[2.75rem] items-center gap-1.5 rounded-full px-2.5 text-[0.86rem] font-semibold text-ink-2 hover:text-ink" aria-label="Swap pick-up and destination">
              <Icon name="swap" className="h-4 w-4" />Swap
            </button>
          </div>
          <input id={fid('destination')} name="destination" className="field-input" value={data.destination} onChange={onText('destination')} onBlur={onBlur('destination')} placeholder="Address, venue, port or airport…" autoComplete="off" required aria-invalid={errors.destination ? true : undefined} aria-describedby={described('destination', errors)} />
          <FieldError field="destination" errors={errors} />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <div>
          <label htmlFor={fid('travelDate')} className="field-label">{isReturn ? 'Outward date' : 'Date'}</label>
          <input id={fid('travelDate')} name="travelDate" type="date" className="field-input tabular" min={today || undefined} value={data.travelDate} onChange={onText('travelDate')} onBlur={onBlur('travelDate')} required aria-invalid={errors.travelDate ? true : undefined} aria-describedby={described('travelDate', errors)} />
          <FieldError field="travelDate" errors={errors} />
        </div>
        <div>
          <label htmlFor={fid('travelTime')} className="field-label">Time</label>
          <input id={fid('travelTime')} name="travelTime" type="time" className="field-input tabular" value={data.travelTime} onChange={onText('travelTime')} onBlur={onBlur('travelTime')} required aria-invalid={errors.travelTime ? true : undefined} aria-describedby={described('travelTime', errors)} />
          <FieldError field="travelTime" errors={errors} />
        </div>
        <Stepper field="passengers" label="Passengers" value={data.passengers} min={1} max={MAX_PASSENGERS} onChange={v => update('passengers', v)} errors={errors} unit={['passenger', 'passengers']} />
        <Stepper field="bags" label="Luggage" value={data.bags} min={0} max={MAX_BAGS} onChange={v => update('bags', v)} errors={errors} unit={['case', 'cases']} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
        <label className="inline-flex min-h-[2.75rem] cursor-pointer items-center gap-2.5 text-[0.95rem] font-medium">
          <input type="checkbox" checked={isReturn} onChange={e => update('tripType', e.target.checked ? 'return' : 'one-way')} className="h-5 w-5 accent-[var(--tl-ink)]" />
          Return journey
        </label>
        <label className="inline-flex min-h-[2.75rem] cursor-pointer items-center gap-2.5 text-[0.95rem] font-medium">
          <input type="checkbox" checked={data.flying} onChange={e => { flyingChosen.current = true; update('flying', e.target.checked) }} className="h-5 w-5 accent-[var(--tl-ink)]" />
          Includes a flight
        </label>
        {pax > 4 ? <span className="text-[0.9rem] text-steel">For {pax} passengers: the V-Class or Tourneo Custom.</span> : null}
      </div>

      {isReturn ? (
        <div className="mt-2 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <div>
            <label htmlFor={fid('returnDate')} className="field-label">Return date</label>
            <input id={fid('returnDate')} name="returnDate" type="date" className="field-input tabular" min={data.travelDate || today || undefined} value={data.returnDate} onChange={onText('returnDate')} onBlur={onBlur('returnDate')} required aria-invalid={errors.returnDate ? true : undefined} aria-describedby={described('returnDate', errors)} />
            <FieldError field="returnDate" errors={errors} />
          </div>
          <div>
            <label htmlFor={fid('returnTime')} className="field-label">Return time</label>
            <input id={fid('returnTime')} name="returnTime" type="time" className="field-input tabular" value={data.returnTime} onChange={onText('returnTime')} onBlur={onBlur('returnTime')} aria-invalid={errors.returnTime ? true : undefined} aria-describedby={described('returnTime', errors)} />
            <FieldError field="returnTime" errors={errors} />
          </div>
        </div>
      ) : null}

      {data.flying ? (
        <div className="mt-2 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor={fid('flightIn')} className="field-label">Arriving flight</label>
            <input id={fid('flightIn')} name="flightIn" className="field-input uppercase tabular" value={data.flightIn} onChange={onText('flightIn')} onBlur={onBlur('flightIn')} placeholder="e.g. BA117…" autoComplete="off" autoCapitalize="characters" spellCheck={false} aria-invalid={errors.flightIn ? true : undefined} aria-describedby={described('flightIn', errors, true)} />
            <span id={`${fid('flightIn')}-hint`} className="field-hint">If we’re meeting you off a flight</span>
            <FieldError field="flightIn" errors={errors} />
          </div>
          <div>
            <label htmlFor={fid('flightOut')} className="field-label">Departing flight</label>
            <input id={fid('flightOut')} name="flightOut" className="field-input uppercase tabular" value={data.flightOut} onChange={onText('flightOut')} onBlur={onBlur('flightOut')} placeholder="e.g. EZY8234…" autoComplete="off" autoCapitalize="characters" spellCheck={false} aria-invalid={errors.flightOut ? true : undefined} aria-describedby={described('flightOut', errors, true)} />
            <span id={`${fid('flightOut')}-hint`} className="field-hint">If we’re taking you to catch one</span>
            <FieldError field="flightOut" errors={errors} />
          </div>
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div>
          <label htmlFor={fid('vehicle')} className="field-label">Preferred car</label>
          <select id={fid('vehicle')} name="vehicle" className="field-input" value={data.vehicle} onChange={onText('vehicle')}>
            <option value="">No preference</option>
            {VEHICLES.map(v => (
              <option key={v.name} value={v.name} disabled={pax > v.seats}>{v.display}{pax > v.seats ? ` (seats ${v.seats})` : ''}</option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label htmlFor={fid('notes')} className="field-label">Anything else? <span className="font-normal text-steel">(optional)</span></label>
          <input id={fid('notes')} name="notes" className="field-input" value={data.notes} onChange={onText('notes')} onBlur={onBlur('notes')} maxLength={800} placeholder="Extra stops, child seats, accessibility needs…" aria-invalid={errors.notes ? true : undefined} aria-describedby={described('notes', errors)} />
          <FieldError field="notes" errors={errors} />
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
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

      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor={`${uid}-website`}>Leave this empty</label>
        <input id={`${uid}-website`} name="website" tabIndex={-1} autoComplete="off" value={data.website} onChange={e => update('website', e.target.value)} />
      </div>

      {status === 'error' ? (
        <div role="alert" className="mt-6 rounded-2xl bg-white p-5 shadow-[inset_0_0_0_2px_var(--tl-error)]">
          <p className="font-semibold text-error">{serverMessage && !/couldn’t send/i.test(serverMessage) ? serverMessage : 'We couldn’t send your enquiry just now.'}</p>
          <p className="mt-1.5 text-ink-2">Your details are still here. Try again, or reach us directly:</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a href={BUSINESS.phoneHref} className="btn btn-dark tabular"><Icon name="phone" className="h-[1.05rem] w-[1.05rem]" />Call {BUSINESS.phoneDisplay}</a>
            <a href={mailto} className="btn btn-ghost"><Icon name="mail" className="h-[1.05rem] w-[1.05rem]" />Email these details</a>
          </div>
        </div>
      ) : null}

      <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-[26rem] text-[0.9rem] leading-relaxed text-steel">
          Nothing is booked until you accept the quote. Your details are used only to reply (<a href="/privacy" className="text-link text-ink-2">privacy</a>).
        </p>
        <button type="submit" className="btn btn-dark min-h-[3.5rem] px-9 text-[1.05rem]" disabled={status === 'sending'}>
          {status === 'sending' ? (
            <><span className="h-5 w-5 animate-spin rounded-full border-2 border-[rgba(255,255,255,0.4)] border-t-white motion-reduce:animate-none" aria-hidden="true" />Sending…</>
          ) : (
            <>Request a quote<Icon name="arrowRight" className="h-5 w-5" /></>
          )}
        </button>
      </div>
      <p className="sr-only" aria-live="polite">{status === 'sending' ? 'Sending your enquiry' : ''}</p>
    </form>
  )
}
