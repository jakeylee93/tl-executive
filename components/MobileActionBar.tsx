'use client'

import { useEffect, useRef, useState } from 'react'
import { BUSINESS } from '@/lib/site'
import { Icon } from './Icon'

/** Call / quote bar for phones and small tablets. It waits until the hero's
 *  own buttons have scrolled away, and steps aside while the quote form or
 *  footer is on screen, or while the keyboard is open, so it never covers
 *  the thing you're trying to use. */
export function MobileActionBar() {
  const [pastHero, setPastHero] = useState(false)
  const [blocked, setBlocked] = useState(false)
  const [typing, setTyping] = useState(false)
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const hero = document.querySelector('[data-hero]') || document.getElementById('top')
    const targets = ['quote', 'site-footer'].map(id => document.getElementById(id)).filter((el): el is HTMLElement => Boolean(el))
    const visible = new Set<Element>()

    const heroObserver = new IntersectionObserver(([entry]) => setPastHero(!entry.isIntersecting), { rootMargin: '0px 0px -40% 0px' })
    if (hero) heroObserver.observe(hero)

    const blockObserver = new IntersectionObserver(entries => {
      entries.forEach(e => (e.isIntersecting ? visible.add(e.target) : visible.delete(e.target)))
      setBlocked(visible.size > 0)
    }, { rootMargin: '0px 0px -12% 0px' })
    targets.forEach(t => blockObserver.observe(t))

    const onFocusIn = (e: FocusEvent) => {
      const t = e.target as HTMLElement
      setTyping(t.matches('input:not([type=checkbox]):not([type=radio]), textarea, select'))
    }
    const onFocusOut = () => setTyping(false)
    document.addEventListener('focusin', onFocusIn)
    document.addEventListener('focusout', onFocusOut)

    return () => {
      heroObserver.disconnect()
      blockObserver.disconnect()
      document.removeEventListener('focusin', onFocusIn)
      document.removeEventListener('focusout', onFocusOut)
    }
  }, [])

  const show = pastHero && !blocked && !typing

  // Hidden bar: out of the tab order and the accessibility tree.
  useEffect(() => {
    const el = barRef.current
    if (!el) return
    if (show) el.removeAttribute('inert')
    else el.setAttribute('inert', '')
  }, [show])

  return (
    <div
      ref={barRef}
      className={`mobile-bar fixed inset-x-0 bottom-0 z-40 border-t border-line px-4 pt-3 pb-safe shadow-[0_-12px_32px_-20px_rgba(24,33,28,0.45)] lg:hidden no-print ${
        show ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-full opacity-0'
      }`}
      style={{ backgroundColor: 'color-mix(in srgb, var(--tl-paper) 96%, transparent)' }}
      aria-hidden={!show}
    >
      <div className="mx-auto grid max-w-md grid-cols-[1fr_1.35fr] gap-3">
        <a href={BUSINESS.phoneHref} className="btn btn-secondary min-h-[3.1rem] px-3" aria-label={`Call ${BUSINESS.phoneDisplay}`}>
          <Icon name="phone" className="h-[1.1rem] w-[1.1rem]" />
          Call
        </a>
        <a href="#quote" className="btn btn-primary min-h-[3.1rem] px-3">Get a quote</a>
      </div>
    </div>
  )
}
