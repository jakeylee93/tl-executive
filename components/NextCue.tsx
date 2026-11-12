'use client'

import { useEffect, useRef, useState } from 'react'
import { Icon } from './Icon'

// A small, deliberate way on: "Next: The fleet". It names the chapter that
// follows this one on the page as it is actually ordered (the chapters can be
// reordered and hidden in the site content) and scrolls to it when pressed.
// Nothing moves on its own.
export function NextCue({ className = '' }: { className?: string }) {
  const ref = useRef<HTMLButtonElement>(null)
  const [name, setName] = useState('')
  const next = () => {
    const here = ref.current?.closest<HTMLElement>('[data-snap]')
    if (!here) return null
    const all = Array.from(document.querySelectorAll<HTMLElement>('[data-snap]')).filter(el => el.offsetParent !== null || el.getClientRects().length > 0)
    return all[all.indexOf(here) + 1] || null
  }
  useEffect(() => { setName(next()?.dataset.snapName || '') }, [])
  return (
    <button
      ref={ref}
      type="button"
      className={`next-cue ${className}`}
      hidden={name === ''}
      onClick={() => {
        const el = next()
        if (!el) return
        const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        el.scrollIntoView({ block: 'start', behavior: calm ? 'auto' : 'smooth' })
      }}
    >
      <span className="next-cue-label">Next</span>
      <span>{name}</span>
      <Icon name="arrowRight" className="h-4 w-4 rotate-90" />
    </button>
  )
}
