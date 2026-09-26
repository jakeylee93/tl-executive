'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent, ReactNode } from 'react'
import {
  emptyEnquiry, looksLikeAirport, MAX_BAGS, summariseEnquiry, ukToday, validateEnquiry,
  type EnquiryInput, type FieldErrors, type FieldName,
} from '@/lib/enquiry'
import { PREFILL_EVENT, readPrefillFromUrl, type Prefill } from '@/lib/prefill'
import { BUSINESS, MAX_PASSENGERS, SERVICES, VEHICLES, slug } from '@/lib/site'
import { Icon } from './Icon'

type Status = 'idle' | 'sending' | 'sent' | 'dry-run' | 'error'

// Order the form is read in — used for the error summary and "focus the next
// field that still needs an answer".
const FIELD_ORDER: FieldName[] = [
  'pickup', 'destination', 'travelDate', 'travelTime', 'returnDate', 'returnTime', 'flightIn', 'flightOut',
  'passengers', 'bags', 'name', 'phone', 'email', 'notes',
]
const REQUIRED_ORDER: FieldName[] = ['pickup', 'destination', 'travelDate', 'travelTime', 'name', 'phone', 'email']

const FIELD_LABEL: Record<FieldName, string> = {
  pickup: 'Pick-up', destination: 'Destination', travelDate: 'Date', travelTime: 'Pick-up time',
  returnDate: 'Return date', returnTime: 'Return time', flightIn: 'Arriving flight', flightOut: 'Departing flight',
  passengers: 'Passengers', bags: 'Cases', vehicle: 'Vehicle', occasion: 'Occasion',
  name: 'Name', phone: 'Phone', email: 'Email', notes: 'Anything else',
}

const id = (f: FieldName) => `q-${f}`

function describedBy(f: FieldName, errors: FieldErrors, hint?: boolean) {
  return [hint ? `${id(f)}-hint` : '', errors[f] ? `${id(f)}-error` : ''].filter(Boolean).join(' ') || undefined
}

function FieldError({ field, errors }: { field: FieldName; errors: FieldErrors }) {
  if (!errors[field]) return null
  return (
    <span id={`${id(field)}-error`} className="field-error">
      <Icon name="alert" className="mt-[0.1rem] h-4 w-4 flex-none" />
      {errors[field]}
    </span>
  )
}

function Step({ n, title, children, hint }: { n: number; title: string; children: ReactNode; hint?: string }) {
  return (
    <fieldset className="border-t border-line pt-7 first:border-t-0 first:pt-0">
      <legend className="float-left mb-5 flex w-full items-baseline gap-3">
        <span className="grid h-7 w-7 flex-none place-items-center rounded-full bg-ink text-[0.85rem] font-semibold text-white tabular" aria-hidden="true">{n}</span>
        <span className="font-display text-[1.45rem] font-medium leading-tight text-ink">{title}</span>
        {hint ? <span className="ml-auto hidden text-[0.875rem] text-muted sm:inline">{hint}</span> : null}
      </legend>
      <div className="clear-left grid gap-5">{children}</div>
    </fieldset>
  )
}

function Stepper({ field, label, value, min, max, onChange, errors, hint, unitWord }: {
  field: 'passengers' | 'bags'; label: string; value: string; min: number; max: number
  onChange: (v: string) => void; errors: FieldErrors; hint?: string; unitWord: [string, string]
}) {
  const n = Number(value) || 0
  const set = (next: number) => onChange(String(Math.min(max, Math.max(min, next))))
  return (
    <div>
      <label htmlFor={id(field)} className="field-label">{label}</label>
      <div className="flex items-stretch overflow-hidden rounded-md border border-line-strong bg-surface focus-within:border-focus focus-within:shadow-[0_0_0_3px_rgba(31,95,191,0.28)]">
        <button
          type="button"
          className="grid w-12 flex-none place-items-center text-ink transition-colors hover:bg-stone disabled:text-line-strong disabled:hover:bg-transparent"
          onClick={() => set(n - 1)}
          disabled={n <= min}
          aria-label={`One fewer ${unitWord[0]}`}
          aria-controls={id(field)}
        >
          <Icon name="minus" className="h-5 w-5" strokeWidth={2} />
        </button>
        <input
          id={id(field)}
          name={field}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          value={value}
          onChange={e => onChange(e.target.value.replace(/\D/g, '').slice(0, 2))}
          onBlur={() => value !== '' && set(n)}
          className="h-[3.25rem] w-full min-w-0 border-x border-line bg-transparent text-center text-[1.15rem] font-semibold text-ink tabular focus:outline-none"
          aria-invalid={errors[field] ? true : undefined}
          aria-describedby={describedBy(field, errors, Boolean(hint))}
        />
        <button
          type="button"
          className="grid w-12 flex-none place-items-center text-ink transition-colors hover:bg-stone disabled:text-line-strong disabled:hover:bg-transparent"
          onClick={() => set(n + 1)}
          disabled={n >= max}
          aria-label={`One more ${unitWord[0]}`}
          aria-controls={id(field)}
        >
          <Icon name="plus" className="h-5 w-5" strokeWidth={2} />
        </button>
      </div>
      <span className="sr-only" aria-live="polite">{n} {n === 1 ? unitWord[0] : unitWord[1]}</span>
      {hint ? <span id={`${id(field)}-hint`} className="field-hint">{hint}</span> : null}
      <FieldError field={field} errors={errors} />
    </div>
  )
}

export function QuoteForm() {
  const [data, setData] = useState<EnquiryInput>(emptyEnquiry)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [summaryErrors, setSummaryErrors] = useState<FieldName[]>([])
  const [status, setStatus] = useState<Status>('idle')
  const [serverMessage, setServerMessage] = useState('')
  const [sent, setSent] = useState<{ rows: { label: string; value: string }[]; payload?: unknown; firstName: string } | null>(null)
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
    const section = document.getElementById('quote')
    const form = formRef.current
    if (!form) return
    const next = REQUIRED_ORDER.map(f => form.querySelector<HTMLElement>(`#${id(f)}`)).find(el => el && !(el as HTMLInputElement).value)
    const target = next || form.querySelector<HTMLElement>('button[type="submit"]')
    const early = !next || next.id === id('pickup') || next.id === id('destination')
    if (early && section) section.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
    else target?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' })
    target?.focus({ preventScroll: true })
  }, [])

  const applyPrefill = useCallback((p: Prefill, focus: boolean) => {
    if (p.flying !== undefined) flyingChosen.current = true
    setStatus(s => (s === 'sent' || s === 'dry-run' ? 'idle' : s))
    setSent(null)
    setData(d => {
      const next = { ...d, ...p }
      if (!flyingChosen.current) next.flying = looksLikeAirport(next.pickup) || looksLikeAirport(next.destination)
      return next
    })
    if (focus) pendingFocus.current = true
  }, [])

  // Prefill from the URL (links from other pages / no-JS starter form) …
  useEffect(() => {
    const p = readPrefillFromUrl(window.location.search)
    if (Object.keys(p).length) applyPrefill(p, false)
  }, [applyPrefill])

  // … and from buttons elsewhere on this page.
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
      if ((field === 'pickup' || field === 'destination') && !flyingChosen.current) {
        next.flying = looksLikeAirport(next.pickup) || looksLikeAirport(next.destination)
      }
      // Re-check a field the visitor is correcting, so the message clears as
      // soon as it's fixed (never nag before they've tried).
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

  const onText = (field: FieldName) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => update(field, e.target.value as never)

  const onBlurField = (field: FieldName) => () => {
    const value = data[field]
    if (value === '' || value === undefined) return // don't scold an untouched field
    const check = validateEnquiry(data, today || undefined)
    setErrors(prev => {
      const out = { ...prev }
      if (check[field]) out[field] = check[field]
      else delete out[field]
      return out
    })
  }

  const swap = () => setData(d => ({ ...d, pickup: d.destination, destination: d.pickup }))

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (status === 'sending') return

    const check = validateEnquiry(data, today || undefined)
    const failed = FIELD_ORDER.filter(f => check[f])
    setErrors(check)
    if (failed.length) {
      setSummaryErrors(failed)
      setStatus('idle')
      requestAnimationFrame(() => {
        summaryRef.current?.scrollIntoView({ behavior: 'auto', block: 'center' })
        summaryRef.current?.focus({ preventScroll: true })
      })
      return
    }
    setSummaryErrors([])
    setServerMessage('')
    setStatus('sending')

    // Send the vehicle name exactly as the visitor saw it (it may have been
    // renamed in anyOS).
    const shownVehicle = data.vehicle
      ? document.querySelector(`[data-vehicle-name="${slug(data.vehicle)}"]`)?.textContent?.trim() || data.vehicle
      : ''
    // Flight numbers only travel if the visitor still says they're flying.
    const payload = { ...data, vehicle: shownVehicle, ...(data.flying ? {} : { flightIn: '', flightOut: '' }) }

    try {
      const response = await fetch('/api/enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const result = (await response.json().catch(() => ({}))) as { ok?: boolean; dryRun?: boolean; payload?: unknown; error?: string; fields?: FieldErrors }
      if (response.ok && result.ok) {
        setSent({ rows: summariseEnquiry(payload), payload: result.payload, firstName: data.name.split(' ')[0] })
        setStatus(result.dryRun ? 'dry-run' : 'sent')
        requestAnimationFrame(() => {
          document.getElementById('quote-result')?.scrollIntoView({ behavior: 'auto', block: 'start' })
          resultRef.current?.focus({ preventScroll: true })
        })
        return
      }
      if (result.fields && Object.keys(result.fields).length) {
        setErrors(result.fields)
        setSummaryErrors(FIELD_ORDER.filter(f => result.fields?.[f]))
        setStatus('idle')
        requestAnimationFrame(() => summaryRef.current?.focus())
        return
      }
      setServerMessage(result.error || '')
      setStatus('error')
    } catch {
      setServerMessage('')
      setStatus('error')
    }
  }

  const reset = () => {
    setData(emptyEnquiry())
    setErrors({})
    setSent(null)
    setStatus('idle')
    flyingChosen.current = false
    requestAnimationFrame(() => {
      document.getElementById('quote')?.scrollIntoView({ block: 'start' })
      formRef.current?.querySelector<HTMLElement>(`#${id('pickup')}`)?.focus({ preventScroll: true })
    })
  }

  const pax = Number(data.passengers) || 1
  const mailto = (() => {
    const rows = summariseEnquiry(data)
    const body = [
      `Hello, I'd like a quote please.`,
      '',
      ...rows.map(r => `${r.label}: ${r.value}`),
      '',
      `Name: ${data.name}`,
      `Phone: ${data.phone}`,
    ].join('\n')
    const subject = `Quote request: ${data.pickup || 'pick-up'} to ${data.destination || 'destination'}`
    return `mailto:${BUSINESS.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  })()

  if ((status === 'sent' || status === 'dry-run') && sent) {
    const preview = status === 'dry-run'
    return (
      <div id="quote-result" className="card p-6 sm:p-9" role="status">
        <div className={`mb-5 grid h-12 w-12 place-items-center rounded-full ${preview ? 'bg-stone text-ink' : 'bg-success text-white'}`}>
          <Icon name={preview ? 'info' : 'check'} className="h-6 w-6" strokeWidth={2} />
        </div>
        <h3 ref={resultRef} tabIndex={-1} className="t-h3 text-[1.75rem] text-ink focus:outline-none">
          {preview ? 'Preview mode: this enquiry was not sent' : `Thank you${sent.firstName ? `, ${sent.firstName}` : ''}. Your enquiry is with us.`}
        </h3>
        <p className="mt-3 max-w-prose text-ink-2">
          {preview
            ? 'This is a review copy of the website, so the form checks everything and stops short of delivering it. On the live site this enquiry would go straight to T&L.'
            : `We’ll reply with a quote by email or phone. Nothing is booked until you accept it. If it’s urgent, call ${BUSINESS.phoneDisplay}.`}
        </p>
        <dl className="mt-6 divide-y divide-line rounded-md border border-line bg-paper">
          {sent.rows.map(r => (
            <div key={r.label} className="grid gap-1 px-4 py-3 sm:grid-cols-[9rem_1fr] sm:gap-4">
              <dt className="text-[0.9rem] font-semibold text-muted">{r.label}</dt>
              <dd className="break-words text-ink">{r.value}</dd>
            </div>
          ))}
        </dl>
        {preview && sent.payload ? (
          <details className="mt-4 rounded-md border border-line bg-paper px-4 py-3 text-[0.9rem]">
            <summary className="cursor-pointer font-semibold text-ink">Technical details: what the platform would receive</summary>
            <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-words text-[0.8rem] leading-relaxed text-ink-2">{JSON.stringify(sent.payload, null, 2)}</pre>
          </details>
        ) : null}
        <div className="mt-7 flex flex-wrap gap-3">
          <button type="button" onClick={reset} className="btn btn-secondary">Start another enquiry</button>
          <a href={BUSINESS.phoneHref} className="btn btn-primary tabular"><Icon name="phone" className="h-[1.1rem] w-[1.1rem]" />Call {BUSINESS.phoneDisplay}</a>
        </div>
      </div>
    )
  }

  const isReturn = data.tripType === 'return'

  return (
    <form ref={formRef} onSubmit={submit} noValidate className="card p-5 sm:p-8 lg:p-10" aria-labelledby="quote-heading" aria-busy={status === 'sending'}>
      {summaryErrors.length ? (
        <div ref={summaryRef} tabIndex={-1} role="alert" className="mb-8 rounded-md border-2 border-error bg-[#fbf1ee] p-5 focus:outline-none focus-visible:outline-focus">
          <p className="flex items-center gap-2 font-semibold text-error">
            <Icon name="alert" className="h-5 w-5" strokeWidth={2} />
            {summaryErrors.length === 1 ? 'One detail needs checking' : `${summaryErrors.length} details need checking`}
          </p>
          <ul className="mt-3 grid gap-1.5 pl-7">
            {summaryErrors.map(f => (
              <li key={f}>
                <a
                  href={`#${id(f)}`}
                  className="text-link text-ink"
                  onClick={e => {
                    e.preventDefault()
                    const el = document.getElementById(id(f))
                    el?.scrollIntoView({ block: 'center' })
                    el?.focus({ preventScroll: true })
                  }}
                >
                  {FIELD_LABEL[f]}: {errors[f] || 'please check'}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="grid gap-9">
        <Step n={1} title="Your journey">
          <fieldset>
            <legend className="field-label">Trip type</legend>
            <div className="grid grid-cols-2 gap-1 rounded-md border border-line-strong bg-paper p-1">
              {(['one-way', 'return'] as const).map(t => (
                <label key={t} className="relative">
                  <input
                    type="radio"
                    name={`${uid}-trip`}
                    value={t}
                    checked={data.tripType === t}
                    onChange={() => update('tripType', t)}
                    className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  />
                  <span className="pointer-events-none flex min-h-[2.9rem] items-center justify-center rounded-[5px] text-[1rem] font-semibold text-ink-2 transition-colors peer-checked:bg-ink peer-checked:text-white peer-focus-visible:outline peer-focus-visible:outline-[3px] peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus">
                    {t === 'one-way' ? 'One way' : 'Return'}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* Route: two places joined by the route line */}
          <div className="grid gap-4">
            <div className="relative pl-8">
              <span aria-hidden="true" className="absolute left-[3px] top-[5px] h-3.5 w-3.5 rounded-full border-[2.5px] border-ink bg-surface" />
              <span aria-hidden="true" className="absolute bottom-[-21px] left-[9px] top-[21px] w-[1.5px] bg-line-strong" />
              <label htmlFor={id('pickup')} className="field-label">Pick-up</label>
              <input
                id={id('pickup')}
                name="pickup"
                className="field-input"
                value={data.pickup}
                onChange={onText('pickup')}
                onBlur={onBlurField('pickup')}
                placeholder="House number and postcode, station or airport…"
                autoComplete="street-address"
                required
                aria-invalid={errors.pickup ? true : undefined}
                aria-describedby={describedBy('pickup', errors)}
              />
              <FieldError field="pickup" errors={errors} />
            </div>
            <div className="relative pl-8">
              <span aria-hidden="true" className="absolute left-[3px] top-[5px] h-3.5 w-3.5 rotate-45 rounded-[2px] bg-brass" />
              <div className="flex items-end justify-between gap-3">
                <label htmlFor={id('destination')} className="field-label">Destination</label>
                <button type="button" onClick={swap} className="-mt-3 mb-0.5 inline-flex min-h-[2.75rem] items-center gap-1.5 rounded-md px-2.5 text-[0.9rem] font-semibold text-ink-2 hover:text-ink" aria-label="Swap pick-up and destination">
                  <Icon name="swap" className="h-4 w-4" />Swap
                </button>
              </div>
              <input
                id={id('destination')}
                name="destination"
                className="field-input"
                value={data.destination}
                onChange={onText('destination')}
                onBlur={onBlurField('destination')}
                placeholder="Address, venue, port or airport…"
                autoComplete="off"
                required
                aria-invalid={errors.destination ? true : undefined}
                aria-describedby={describedBy('destination', errors)}
              />
              <FieldError field="destination" errors={errors} />
            </div>
          </div>

          <div className="grid grid-cols-[1.45fr_1fr] gap-3 sm:gap-4">
            <div>
              <label htmlFor={id('travelDate')} className="field-label">{isReturn ? 'Outward date' : 'Date'}</label>
              <input
                id={id('travelDate')}
                name="travelDate"
                type="date"
                className="field-input tabular"
                min={today || undefined}
                value={data.travelDate}
                onChange={onText('travelDate')}
                onBlur={onBlurField('travelDate')}
                required
                aria-invalid={errors.travelDate ? true : undefined}
                aria-describedby={describedBy('travelDate', errors)}
              />
              <FieldError field="travelDate" errors={errors} />
            </div>
            <div>
              <label htmlFor={id('travelTime')} className="field-label">Pick-up time</label>
              <input
                id={id('travelTime')}
                name="travelTime"
                type="time"
                className="field-input tabular"
                value={data.travelTime}
                onChange={onText('travelTime')}
                onBlur={onBlurField('travelTime')}
                required
                aria-invalid={errors.travelTime ? true : undefined}
                aria-describedby={describedBy('travelTime', errors)}
              />
              <FieldError field="travelTime" errors={errors} />
            </div>
          </div>

          {isReturn ? (
            <div className="grid grid-cols-[1.45fr_1fr] gap-3 sm:gap-4">
              <div>
                <label htmlFor={id('returnDate')} className="field-label">Return date</label>
                <input
                  id={id('returnDate')}
                  name="returnDate"
                  type="date"
                  className="field-input tabular"
                  min={data.travelDate || today || undefined}
                  value={data.returnDate}
                  onChange={onText('returnDate')}
                  onBlur={onBlurField('returnDate')}
                  required
                  aria-invalid={errors.returnDate ? true : undefined}
                  aria-describedby={describedBy('returnDate', errors)}
                />
                <FieldError field="returnDate" errors={errors} />
              </div>
              <div>
                <label htmlFor={id('returnTime')} className="field-label">Return time</label>
                <input
                  id={id('returnTime')}
                  name="returnTime"
                  type="time"
                  className="field-input tabular"
                  value={data.returnTime}
                  onChange={onText('returnTime')}
                  onBlur={onBlurField('returnTime')}
                  aria-invalid={errors.returnTime ? true : undefined}
                  aria-describedby={describedBy('returnTime', errors, true)}
                />
                <span id={`${id('returnTime')}-hint`} className="field-hint">If known</span>
                <FieldError field="returnTime" errors={errors} />
              </div>
            </div>
          ) : null}

          <div className="rounded-md border border-line bg-paper p-4">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={data.flying}
                onChange={e => { flyingChosen.current = true; update('flying', e.target.checked) }}
                className="mt-0.5 h-5 w-5 flex-none cursor-pointer rounded-sm border-line-strong accent-[var(--tl-ink)]"
                aria-describedby={`${uid}-flying-hint`}
              />
              <span>
                <span className="block font-semibold text-ink">I’m catching or landing on a flight</span>
                <span id={`${uid}-flying-hint`} className="block text-[0.9rem] leading-snug text-muted">Add flight numbers so they’re on your booking from the start.</span>
              </span>
            </label>
            {data.flying ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor={id('flightIn')} className="field-label">Arriving flight number</label>
                  <input
                    id={id('flightIn')}
                    name="flightIn"
                    className="field-input uppercase tabular"
                    value={data.flightIn}
                    onChange={onText('flightIn')}
                    onBlur={onBlurField('flightIn')}
                    placeholder="e.g. BA117…"
                    autoComplete="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                    aria-invalid={errors.flightIn ? true : undefined}
                    aria-describedby={describedBy('flightIn', errors, true)}
                  />
                  <span id={`${id('flightIn')}-hint`} className="field-hint">If we’re meeting you off a flight</span>
                  <FieldError field="flightIn" errors={errors} />
                </div>
                <div>
                  <label htmlFor={id('flightOut')} className="field-label">Departing flight number</label>
                  <input
                    id={id('flightOut')}
                    name="flightOut"
                    className="field-input uppercase tabular"
                    value={data.flightOut}
                    onChange={onText('flightOut')}
                    onBlur={onBlurField('flightOut')}
                    placeholder="e.g. EZY8234…"
                    autoComplete="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                    aria-invalid={errors.flightOut ? true : undefined}
                    aria-describedby={describedBy('flightOut', errors, true)}
                  />
                  <span id={`${id('flightOut')}-hint`} className="field-hint">If we’re taking you to catch one</span>
                  <FieldError field="flightOut" errors={errors} />
                </div>
              </div>
            ) : null}
          </div>

          <div>
            <label htmlFor={id('occasion')} className="field-label">What’s the journey for? <span className="font-normal text-muted">(optional)</span></label>
            <select id={id('occasion')} name="occasion" className="field-input" value={data.occasion} onChange={onText('occasion')}>
              <option value="">Choose if you like</option>
              {SERVICES.map(s => <option key={s.idx} value={s.title}>{s.title}</option>)}
              <option value="Something else">Something else</option>
            </select>
          </div>
        </Step>

        <Step n={2} title="Passengers & car">
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <Stepper
              field="passengers" label="Passengers" value={data.passengers} min={1} max={MAX_PASSENGERS}
              onChange={v => update('passengers', v)} errors={errors} unitWord={['passenger', 'passengers']}
              hint={pax >= MAX_PASSENGERS ? `More than ${MAX_PASSENGERS}? Call us.` : undefined}
            />
            <Stepper
              field="bags" label="Suitcases" value={data.bags} min={0} max={MAX_BAGS}
              onChange={v => update('bags', v)} errors={errors} unitWord={['suitcase', 'suitcases']}
            />
          </div>

          <fieldset>
            <legend className="field-label">Preferred car <span className="font-normal text-muted">(optional)</span></legend>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {[{ name: '' }, ...VEHICLES].map(v => {
                const vehicle = 'seats' in v ? v : null
                const checked = data.vehicle === v.name
                const tooSmall = vehicle ? pax > vehicle.seats : false
                const noteId = vehicle ? `${uid}-${slug(vehicle.name)}-fit` : undefined
                return (
                  <label key={v.name || 'none'} className="relative block">
                    <input
                      type="radio"
                      name={`${uid}-vehicle`}
                      value={v.name}
                      checked={checked}
                      onChange={() => update('vehicle', v.name)}
                      className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0"
                      aria-describedby={tooSmall ? noteId : undefined}
                    />
                    <span className={`pointer-events-none flex min-h-[4.5rem] items-center gap-3 rounded-md border bg-surface p-2.5 pr-10 transition-colors peer-checked:border-ink peer-checked:bg-paper peer-checked:shadow-[inset_0_0_0_1px_var(--tl-ink)] peer-focus-visible:outline peer-focus-visible:outline-[3px] peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus ${tooSmall ? 'border-line' : 'border-line-strong'}`}>
                      {vehicle ? (
                        <img
                          src={vehicle.image}
                          data-anyos-img={`fleet.${slug(vehicle.name)}.image`}
                          alt=""
                          width={600}
                          height={320}
                          loading="lazy"
                          decoding="async"
                          className={`h-[3.1rem] w-[5.8rem] flex-none rounded-[4px] object-cover mix-blend-multiply ${tooSmall ? 'opacity-50' : ''}`}
                        />
                      ) : (
                        <span className="grid h-[3.1rem] w-[5.8rem] flex-none place-items-center rounded-[4px] bg-stone text-ink-2">
                          <Icon name="sparkle" className="h-6 w-6" />
                        </span>
                      )}
                      <span className="min-w-0 leading-snug">
                        {vehicle ? (
                          <>
                            <span className="block font-semibold text-ink" data-vehicle-name={slug(vehicle.name)} suppressHydrationWarning data-anyos={`fleet.${slug(vehicle.name)}.name`}>{vehicle.name}</span>
                            <span className={`block text-[0.875rem] ${tooSmall ? 'font-semibold text-error' : 'text-muted'}`} id={noteId}>
                              {tooSmall ? `Seats up to ${vehicle.seats}` : `${vehicle.seats} seats · ${vehicle.cases} cases`}
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="block font-semibold text-ink">No preference</span>
                            <span className="block text-[0.875rem] text-muted">We’ll recommend the right car</span>
                          </>
                        )}
                      </span>
                      <span aria-hidden="true" className={`absolute right-3 top-1/2 grid h-5 w-5 -translate-y-1/2 place-items-center rounded-full border-2 ${checked ? 'border-ink bg-ink text-white' : 'border-line-strong bg-surface'}`}>
                        {checked ? <Icon name="check" className="h-3 w-3" strokeWidth={3} /> : null}
                      </span>
                    </span>
                  </label>
                )
              })}
            </div>
          </fieldset>
        </Step>

        <Step n={3} title="Your details">
          <div>
            <label htmlFor={id('name')} className="field-label">Name</label>
            <input
              id={id('name')} name="name" className="field-input" value={data.name}
              onChange={onText('name')} onBlur={onBlurField('name')}
              autoComplete="name" required
              aria-invalid={errors.name ? true : undefined} aria-describedby={describedBy('name', errors)}
            />
            <FieldError field="name" errors={errors} />
          </div>
          <div className="grid gap-5 sm:grid-cols-2 sm:gap-4">
            <div>
              <label htmlFor={id('phone')} className="field-label">Phone</label>
              <input
                id={id('phone')} name="phone" type="tel" className="field-input tabular" value={data.phone}
                onChange={onText('phone')} onBlur={onBlurField('phone')}
                autoComplete="tel" inputMode="tel" required
                aria-invalid={errors.phone ? true : undefined} aria-describedby={describedBy('phone', errors)}
              />
              <FieldError field="phone" errors={errors} />
            </div>
            <div>
              <label htmlFor={id('email')} className="field-label">Email</label>
              <input
                id={id('email')} name="email" type="email" className="field-input" value={data.email}
                onChange={onText('email')} onBlur={onBlurField('email')}
                autoComplete="email" inputMode="email" autoCapitalize="none" spellCheck={false} required
                aria-invalid={errors.email ? true : undefined} aria-describedby={describedBy('email', errors)}
              />
              <FieldError field="email" errors={errors} />
            </div>
          </div>
          <div>
            <label htmlFor={id('notes')} className="field-label">Anything else? <span className="font-normal text-muted">(optional)</span></label>
            <textarea
              id={id('notes')} name="notes" className="field-input" value={data.notes}
              onChange={onText('notes')} onBlur={onBlurField('notes')} rows={4} maxLength={800}
              aria-invalid={errors.notes ? true : undefined} aria-describedby={describedBy('notes', errors, true)}
            />
            <span id={`${id('notes')}-hint`} className="field-hint">Extra stops, child seats, accessibility needs, or a time you’d like us to call.</span>
            <FieldError field="notes" errors={errors} />
          </div>

          {/* Honeypot: hidden from people and assistive tech; bots fill it. */}
          <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
            <label htmlFor={`${uid}-website`}>Leave this empty</label>
            <input id={`${uid}-website`} name="website" tabIndex={-1} autoComplete="off" value={data.website} onChange={e => update('website', e.target.value)} />
          </div>
        </Step>
      </div>

      {status === 'error' ? (
        <div role="alert" className="mt-8 rounded-md border-2 border-error bg-[#fbf1ee] p-5">
          <p className="font-semibold text-error">{serverMessage && !/couldn’t send/i.test(serverMessage) ? serverMessage : 'We couldn’t send your enquiry just now.'}</p>
          <p className="mt-2 text-ink-2">Your details are still here. Please try again, or reach us directly:</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a href={BUSINESS.phoneHref} className="btn btn-primary tabular"><Icon name="phone" className="h-[1.1rem] w-[1.1rem]" />Call {BUSINESS.phoneDisplay}</a>
            <a href={mailto} className="btn btn-secondary"><Icon name="mail" className="h-[1.1rem] w-[1.1rem]" />Email these details</a>
          </div>
        </div>
      ) : null}

      <div className="mt-9 border-t border-line pt-7">
        <button type="submit" className="btn btn-primary w-full min-h-[3.6rem] text-[1.08rem]" disabled={status === 'sending'}>
          {status === 'sending' ? (
            <>
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white motion-reduce:animate-none" aria-hidden="true" />
              Sending your enquiry…
            </>
          ) : (
            <>
              Send enquiry
              <Icon name="arrowRight" className="h-5 w-5" />
            </>
          )}
        </button>
        <p className="mt-4 text-center text-[0.9rem] leading-relaxed text-muted">
          Nothing is booked until you accept our quote. We use these details only to reply —{' '}
          <a href="/privacy" className="text-link text-ink-2">privacy notice</a>.
        </p>
        <p className="sr-only" aria-live="polite">{status === 'sending' ? 'Sending your enquiry' : ''}</p>
      </div>
    </form>
  )
}
