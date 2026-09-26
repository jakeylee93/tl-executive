'use client'

import type { ReactNode } from 'react'
import { prefillHref, requestQuote, type Prefill } from '@/lib/prefill'

/** A link to the quote form that carries context (a car, a service…). With
 *  JavaScript it hands the details straight to the form; without, the URL
 *  parameters do the same job on load. */
export function QuoteLink({ prefill = {}, className, children, ariaLabel }: { prefill?: Prefill; className?: string; children: ReactNode; ariaLabel?: string }) {
  return (
    <a
      href={prefillHref(prefill)}
      className={className}
      aria-label={ariaLabel}
      onClick={event => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return
        if (!document.getElementById('quote')) return // on another page: follow the link
        event.preventDefault()
        requestQuote(prefill)
      }}
    >
      {children}
    </a>
  )
}
