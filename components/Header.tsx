'use client'

import { useEffect, useRef, useState } from 'react'
import { BUSINESS, NAV } from '@/lib/site'
import { Icon } from './Icon'

/** Fixed, discreet header: white type over the hero photograph, solid white
 *  once the hero has gone. The menu is a disclosure with Escape and focus
 *  return; links are real anchors. */
export function Header({ overPhoto = true }: { overPhoto?: boolean }) {
  const [solid, setSolid] = useState(!overPhoto)
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!overPhoto) return
    const hero = document.querySelector<HTMLElement>('[data-hero]')
    if (!hero) { setSolid(true); return }
    // Solid as soon as the hero starts to leave, so its content never
    // slides under transparent header text.
    const onScroll = () => setSolid(hero.getBoundingClientRect().bottom < window.innerHeight - 1)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll) }
  }, [overPhoto])

  useEffect(() => {
    if (!open) return
    menuRef.current?.querySelector<HTMLElement>('a')?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); buttonRef.current?.focus() } }
    const onPointer = (e: PointerEvent) => {
      const t = e.target as Node
      if (!menuRef.current?.contains(t) && !buttonRef.current?.contains(t)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('pointerdown', onPointer) }
  }, [open])

  const light = !solid && !open // white type on the photograph
  return (
    <header
      className={`no-print fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,color] duration-300 ${light ? 'text-white' : 'bg-white text-ink shadow-[0_1px_0_rgba(0,0,0,0.06),0_10px_30px_-24px_rgba(0,0,0,0.5)]'}`}
    >
      <div className="page-x flex h-[var(--tl-header-h)] items-center gap-3">
        <a href="/" className="-ml-1 flex min-w-0 flex-1 items-center gap-3 rounded-full p-1 lg:flex-none" aria-label={`${BUSINESS.name}, home`}>
          <img src="/brand/tl-badge.svg" alt="" width={48} height={45} className="h-10 w-auto flex-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)] lg:h-12" />
          <span className="min-w-0">
            <span suppressHydrationWarning data-anyos="brand.name" translate="no" className="block font-display text-[1rem] leading-[1.15] [text-wrap:balance] tracking-[-0.005em] sm:text-[1.1rem] lg:text-[1.18rem]">
              Theydon &amp; Loughton Executive Cars
            </span>
            <span suppressHydrationWarning data-anyos="brand.strapline" className={`mt-0.5 hidden text-[0.74rem] font-semibold uppercase tracking-[0.16em] sm:block ${light ? 'text-[rgba(255,255,255,0.78)]' : 'text-steel'}`}>
              Theydon Bois · Est. 2008
            </span>
          </span>
        </a>

        <nav aria-label="Main" className="ml-auto hidden lg:block">
          <ul className="flex items-center gap-0.5">
            {NAV.map(item => (
              <li key={item.href}>
                <a href={item.href} className={`rounded-full px-3.5 py-2.5 text-[0.95rem] font-medium transition-colors ${light ? 'text-[rgba(255,255,255,0.88)] hover:text-white' : 'text-ink-2 hover:text-ink'}`}>{item.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        <a href={BUSINESS.phoneHref} className="hidden items-center gap-2 rounded-full px-3 py-2.5 text-[0.95rem] font-semibold tabular lg:inline-flex">
          <Icon name="phone" className="h-[1.05rem] w-[1.05rem]" />
          {BUSINESS.phoneDisplay}
        </a>
        <a href="/#plan" className={`btn hidden min-h-[2.8rem] px-5 text-[0.95rem] lg:inline-flex ${light ? 'btn-light' : 'btn-dark'}`}>Request a quote</a>

        <a
          href={BUSINESS.phoneHref}
          className={`grid h-11 w-11 flex-none place-items-center rounded-full lg:hidden ${light ? 'bg-[rgba(255,255,255,0.16)] backdrop-blur-md' : 'bg-mist'}`}
          aria-label={`Call ${BUSINESS.phoneDisplay}`}
        >
          <Icon name="phone" className="h-5 w-5" />
        </a>
        <button
          ref={buttonRef}
          type="button"
          className={`grid h-11 w-11 flex-none place-items-center rounded-full lg:hidden ${light ? 'bg-[rgba(255,255,255,0.16)] backdrop-blur-md' : 'bg-mist'}`}
          aria-expanded={open}
          aria-controls="site-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen(o => !o)}
        >
          <Icon name={open ? 'close' : 'menu'} className="h-5 w-5" />
        </button>
      </div>

      <div id="site-menu" ref={menuRef} hidden={!open} className="bg-white text-ink lg:hidden">
        <nav aria-label="Main" className="page-x pb-5 pt-1">
          <ul>
            {NAV.map(item => (
              <li key={item.href}>
                <a href={item.href} onClick={() => setOpen(false)} className="flex min-h-[3.25rem] items-center justify-between text-[1.15rem] font-medium">
                  {item.label}
                  <Icon name="arrowRight" className="h-4 w-4 text-steel" />
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-3 grid gap-3 xs:grid-cols-2">
            <a href="/#plan" onClick={() => setOpen(false)} className="btn btn-dark">Request a quote</a>
            <a href={BUSINESS.phoneHref} className="btn btn-ghost tabular">
              <Icon name="phone" className="h-[1.05rem] w-[1.05rem]" />
              {BUSINESS.phoneDisplay}
            </a>
          </div>
        </nav>
      </div>
    </header>
  )
}
