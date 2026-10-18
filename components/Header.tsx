'use client'

import { useEffect, useRef, useState } from 'react'
import { BUSINESS, NAV } from '@/lib/site'
import { Icon } from './Icon'

/** Fixed, quiet header. Over the opening journey it is transparent with
 *  white type, and the badge waits (the journey carries the large one); once
 *  the journey has gone it turns solid white with the compact badge.
 *  Request a quote and Call are always one tap away. On phones the menu is a
 *  drawer below the bar: focus moves in and is kept there, Escape or the same
 *  button closes it and focus returns, and the page behind does not scroll. */
export function Header({ overPhoto = true }: { overPhoto?: boolean }) {
  const [solid, setSolid] = useState(!overPhoto)
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!overPhoto) return
    const hero = document.querySelector<HTMLElement>('[data-hero]')
    if (!hero) { setSolid(true); return }
    const onScroll = () => setSolid(hero.getBoundingClientRect().bottom < window.innerHeight - 1)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll) }
  }, [overPhoto])

  useEffect(() => {
    if (!open) return
    const root = document.documentElement
    const prevOverflow = root.style.overflow
    root.style.overflow = 'hidden'
    menuRef.current?.querySelector<HTMLElement>('a')?.focus()
    const close = () => { setOpen(false); buttonRef.current?.focus() }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); close(); return }
      if (e.key !== 'Tab' || !menuRef.current) return
      // Keep focus within the drawer and its toggle.
      const items = [buttonRef.current, ...Array.from(menuRef.current.querySelectorAll<HTMLElement>('a[href], button'))].filter(Boolean) as HTMLElement[]
      const i = items.indexOf(document.activeElement as HTMLElement)
      if (e.shiftKey && i <= 0) { e.preventDefault(); items[items.length - 1].focus() }
      else if (!e.shiftKey && i === items.length - 1) { e.preventDefault(); items[0].focus() }
    }
    const onResize = () => { if (window.innerWidth >= 1024) setOpen(false) }
    document.addEventListener('keydown', onKey)
    window.addEventListener('resize', onResize)
    return () => {
      root.style.overflow = prevOverflow
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', onResize)
    }
  }, [open])

  const light = !solid && !open // white type over the journey
  const iconBtn = `grid h-11 w-11 flex-none place-items-center rounded-full transition-colors ${light ? 'bg-[rgba(255,255,255,0.14)] backdrop-blur-md hover:bg-[rgba(255,255,255,0.24)]' : 'bg-mist hover:bg-cloud'}`
  return (
    <header
      className={`no-print fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,color] duration-300 ${light ? 'text-white' : 'bg-white text-ink shadow-[0_1px_0_rgba(0,0,0,0.06),0_10px_30px_-24px_rgba(0,0,0,0.5)]'}`}
    >
      <div className="page-x flex h-[var(--tl-header-h)] items-center gap-2 sm:gap-3">
        <a href="/" className="-ml-1 mr-auto flex min-h-[2.75rem] min-w-0 items-center gap-2.5 rounded-full p-1 lg:mr-0" aria-label={`${BUSINESS.name}, home`}>
          <img
            src="/brand/tl-badge.svg"
            alt=""
            width={40}
            height={38}
            className={`h-9 w-auto flex-none lg:h-10 ${light && overPhoto ? 'hidden' : ''}`}
          />
          <span className="min-w-0">
            <span suppressHydrationWarning data-anyos="brand.name" translate="no" className="block max-w-[8.6rem] font-display text-[0.92rem] leading-[1.12] tracking-[-0.005em] [text-wrap:balance] xs:max-w-[12rem] xs:text-[0.98rem] sm:max-w-none sm:text-[1.06rem]">
              Theydon &amp; Loughton Executive Cars
            </span>
          </span>
        </a>

        <nav aria-label="Main" className="mx-auto hidden lg:block">
          <ul className="flex items-center">
            {NAV.map(item => (
              <li key={item.href}>
                <a href={item.href} className={`inline-flex min-h-[2.75rem] items-center rounded-full px-3 text-[0.95rem] xl:px-3.5 font-medium transition-colors ${light ? 'text-[rgba(255,255,255,0.86)] hover:text-white' : 'text-ink-2 hover:text-ink'}`}>{item.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        <a href={BUSINESS.phoneHref} className="hidden min-h-[2.75rem] items-center gap-2 rounded-full px-3 text-[0.95rem] font-semibold tabular xl:inline-flex">
          <Icon name="phone" className="h-[1.05rem] w-[1.05rem]" />
          {BUSINESS.phoneDisplay}
        </a>
        <a href="/#plan" className={`btn min-h-[2.75rem] flex-none px-4 text-[0.92rem] sm:px-5 sm:text-[0.95rem] ${light ? 'btn-light' : 'btn-dark'}`}>
          <span className="sm:hidden">Quote</span>
          <span className="hidden sm:inline">Request a quote</span>
        </a>
        <a href={BUSINESS.phoneHref} className={`${iconBtn} xl:hidden`} aria-label={`Call ${BUSINESS.phoneDisplay}`}>
          <Icon name="phone" className="h-5 w-5" />
        </a>
        <button
          ref={buttonRef}
          type="button"
          className={`${iconBtn} lg:hidden`}
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
        className="fixed inset-x-0 bottom-0 top-[var(--tl-header-h)] overflow-y-auto overscroll-contain bg-white text-ink lg:hidden"
      >
        <nav aria-label="Menu" className="page-x flex min-h-full flex-col pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4">
          <ul className="border-t border-line">
            {NAV.map(item => (
              <li key={item.href} className="border-b border-line">
                <a href={item.href} onClick={() => setOpen(false)} className="flex min-h-[3.75rem] items-center justify-between font-display text-[1.6rem] leading-none">
                  {item.label}
                  <Icon name="arrowRight" className="h-5 w-5 text-steel" />
                </a>
              </li>
            ))}
            <li className="border-b border-line">
              <a href="/airport-transfers" onClick={() => setOpen(false)} className="flex min-h-[3.75rem] items-center justify-between font-display text-[1.6rem] leading-none">
                Airport transfers
                <Icon name="arrowRight" className="h-5 w-5 text-steel" />
              </a>
            </li>
          </ul>
          <div className="mt-8 grid gap-3">
            <a href="/#plan" onClick={() => setOpen(false)} className="btn btn-dark">Request a quote<Icon name="arrowRight" className="h-5 w-5" /></a>
            <a href={BUSINESS.phoneHref} className="btn btn-ghost tabular">
              <Icon name="phone" className="h-[1.05rem] w-[1.05rem]" />
              Call {BUSINESS.phoneDisplay}
            </a>
          </div>
          <div className="mt-auto flex items-center gap-4 pt-10 text-[0.92rem] text-steel">
            <img src="/brand/tl-badge.svg" alt="" width={44} height={42} loading="lazy" className="h-11 w-auto flex-none" />
            <p>
              <span suppressHydrationWarning data-anyos="brand.strapline" className="block font-semibold uppercase tracking-[0.16em] text-ink-2">Theydon Bois · Est. 2008</span>
              <span className="mt-0.5 block">Office hours {BUSINESS.hours}</span>
            </p>
          </div>
        </nav>
      </div>
    </header>
  )
}
