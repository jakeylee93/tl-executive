'use client'

import { useEffect, useId, useState } from 'react'
import type { FormEvent } from 'react'
import { ukToday } from '@/lib/enquiry'
import { requestQuote } from '@/lib/prefill'
import { Icon } from './Icon'

// Quick picks for the most-requested destinations (they fill the field,
// which stays editable).
const QUICK = [
  { label: 'Heathrow', value: 'Heathrow Airport' },
  { label: 'Stansted', value: 'Stansted Airport' },
  { label: 'Gatwick', value: 'Gatwick Airport' },
  { label: 'London City', value: 'London City Airport' },
]

/** Hero card: the first three answers of the quote, handed to the full form.
 *  A plain GET form underneath, so it still works before JavaScript loads. */
export function JourneyStarter() {
  const uid = useId()
  const [pickup, setPickup] = useState('')
  const [destination, setDestination] = useState('')
  const [travelDate, setTravelDate] = useState('')
  const [today, setToday] = useState('')
  useEffect(() => setToday(ukToday()), [])

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    requestQuote({ pickup: pickup.trim(), destination: destination.trim(), travelDate })
  }

  return (
    <form
      action="/#quote"
      method="get"
      onSubmit={onSubmit}
      className="relative rounded-xl border border-line bg-surface p-5 shadow-[0_1px_2px_rgba(24,33,28,0.05),0_24px_48px_-28px_rgba(24,33,28,0.35)] sm:p-7"
      aria-labelledby={`${uid}-title`}
    >
      <div className="mb-5">
        <h2 id={`${uid}-title`} className="font-display text-[1.5rem] font-medium leading-tight text-ink">Plan a journey</h2>
        <p className="mt-1 text-[0.9rem] text-muted">Three details to start. We reply with a quote.</p>
      </div>

      <div className="relative grid gap-4">
        <div className="relative pl-8">
          <span aria-hidden="true" className="absolute left-[3px] top-[5px] h-3.5 w-3.5 rounded-full border-[2.5px] border-ink bg-surface" />
          <span aria-hidden="true" className="absolute bottom-[-21px] left-[9px] top-[21px] w-[1.5px] bg-line-strong" />
          <label htmlFor={`${uid}-from`} className="field-label">From</label>
          <input id={`${uid}-from`} name="pickup" className="field-input" value={pickup} onChange={e => setPickup(e.target.value)} placeholder="Home address, station or airport…" autoComplete="street-address" />
        </div>
        <div className="relative pl-8">
          <span aria-hidden="true" className="absolute left-[3px] top-[5px] h-3.5 w-3.5 rotate-45 rounded-[2px] bg-brass" />
          <label htmlFor={`${uid}-to`} className="field-label">To</label>
          <input id={`${uid}-to`} name="destination" className="field-input" value={destination} onChange={e => setDestination(e.target.value)} placeholder="Where are you going?" autoComplete="off" aria-describedby={`${uid}-quick`} />
          <div id={`${uid}-quick`} className="mt-2.5 flex flex-wrap gap-2" role="group" aria-label="Popular airports">
            {QUICK.map(q => (
              <button
                key={q.label}
                type="button"
                onClick={() => setDestination(q.value)}
                aria-pressed={destination === q.value}
                className="inline-flex min-h-[2.75rem] items-center gap-1.5 rounded-full border border-line px-3.5 text-[0.9rem] font-medium text-ink-2 transition-colors hover:border-ink hover:text-ink aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-white"
              >
                <Icon name="plane" className="h-3.5 w-3.5" />
                {q.label}
              </button>
            ))}
          </div>
        </div>
        <div className="pl-8">
          <label htmlFor={`${uid}-date`} className="field-label">Date</label>
          <input id={`${uid}-date`} name="travelDate" type="date" className="field-input tabular" min={today || undefined} value={travelDate} onChange={e => setTravelDate(e.target.value)} />
        </div>
      </div>

      <button type="submit" className="btn btn-primary mt-6 w-full">
        Continue to your quote
        <Icon name="arrowRight" className="h-5 w-5" />
      </button>
    </form>
  )
}
