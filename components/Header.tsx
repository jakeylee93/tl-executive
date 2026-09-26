'use client'

import { useEffect, useRef, useState } from 'react'
import { BUSINESS, NAV } from '@/lib/site'
import { Icon } from './Icon'

export function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Menu: Escape closes and returns focus; clicks outside close; the first
  // link receives focus on open.
  useEffect(() => {
    if (!open) return
    const first = menuRef.current?.querySelector<HTMLElement>('a, button')
    first?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    const onPointer = (e: PointerEvent) => {
      const t = e.target as Node
      if (!menuRef.current?.contains(t) && !buttonRef.current?.contains(t)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [open])

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const onChange = () => mq.matches && setOpen(false)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return (
    <header
      className={`sticky top-0 z-50 border-b backdrop-blur-md transition-[border-color,box-shadow] duration-300 no-print ${
        scrolled || open ? 'border-line shadow-[0_1px_0_rgba(24,33,28,0.03),0_8px_24px_-18px_rgba(24,33,28,0.35)]' : 'border-transparent'
      }`}
      style={{ backgroundColor: 'color-mix(in srgb, var(--tl-paper) 94%, transparent)' }}
    >
      <div className="page-x flex h-[var(--tl-header-h)] items-center gap-3">
        <a href="/" className="group -ml-1 flex min-w-0 flex-1 items-center gap-3 rounded-md p-1 lg:flex-none" aria-label={`${BUSINESS.name}, home`}>
          <picture className="flex-none">
            <source srcSet="/brand/tl-badge-96.webp 1x, /brand/tl-badge-192.webp 2x" type="image/webp" />
            <img src="/brand/tl-badge-96.png" alt="" width={44} height={44} className="h-10 w-10 lg:h-12 lg:w-12" />
          </picture>
          <span className="min-w-0">
            <span suppressHydrationWarning data-anyos="brand.name" translate="no" className="block font-display text-[1.02rem] font-medium leading-[1.15] tracking-[-0.005em] text-ink sm:text-[1.12rem] lg:text-[1.2rem]">
              Theydon &amp; Loughton Executive Cars
            </span>
            <span suppressHydrationWarning data-anyos="brand.strapline" className="mt-0.5 hidden text-[0.78rem] font-medium tracking-[0.04em] text-muted sm:block">
              Theydon Bois · Est. 2008
            </span>
          </span>
        </a>

        <nav aria-label="Main" className="ml-auto hidden lg:block">
          <ul className="flex items-center gap-1">
            {NAV.map(item => (
              <li key={item.href}>
                <a href={item.href} className="rounded-md px-3.5 py-2.5 text-[0.98rem] font-medium text-ink-2 transition-colors hover:text-ink">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <a
          href={BUSINESS.phoneHref}
          className="hidden items-center gap-2 rounded-md px-3 py-2.5 text-[0.98rem] font-semibold text-ink tabular lg:inline-flex"
        >
          <Icon name="phone" className="h-[1.15rem] w-[1.15rem] text-brass" />
          {BUSINESS.phoneDisplay}
        </a>
        <a href="#quote" className="btn btn-primary hidden min-h-[2.9rem] px-5 lg:inline-flex">Get a quote</a>

        {/* Compact controls */}
        <a
          href={BUSINESS.phoneHref}
          className="grid h-11 w-11 flex-none place-items-center rounded-md border border-line bg-surface text-ink lg:hidden"
          aria-label={`Call ${BUSINESS.phoneDisplay}`}
        >
          <Icon name="phone" className="h-5 w-5" />
        </a>
        <button
          ref={buttonRef}
          type="button"
          className="grid h-11 w-11 flex-none place-items-center rounded-md border border-line bg-surface text-ink lg:hidden"
          aria-expanded={open}
          aria-controls="site-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen(o => !o)}
        >
          <Icon name={open ? 'close' : 'menu'} className="h-5 w-5" />
        </button>
      </div>

      <div
        id="site-menu"
        ref={menuRef}
        hidden={!open}
        className="border-t border-line bg-paper lg:hidden"
      >
        <nav aria-label="Main" className="page-x py-3">
          <ul className="divide-y divide-line">
            {NAV.map(item => (
              <li key={item.href}>
                <a
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex min-h-[3.25rem] items-center justify-between text-[1.1rem] font-medium text-ink"
                >
                  {item.label}
                  <Icon name="arrowRight" className="h-4 w-4 text-muted" />
                </a>
              </li>
            ))}
          </ul>
          <div className="grid gap-3 pb-3 pt-4 xs:grid-cols-2">
            <a href="#quote" onClick={() => setOpen(false)} className="btn btn-primary">Get a quote</a>
            <a href={BUSINESS.phoneHref} className="btn btn-secondary tabular">
              <Icon name="phone" className="h-[1.1rem] w-[1.1rem]" />
              {BUSINESS.phoneDisplay}
            </a>
          </div>
          <p className="pb-2 text-center text-[0.9rem] text-muted">{BUSINESS.hours} · {BUSINESS.locality}</p>
        </nav>
      </div>
    </header>
  )
}
