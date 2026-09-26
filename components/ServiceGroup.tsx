'use client'

import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Icon } from './Icon'

/** A service group that is a plain, always-open list on desktop and a
 *  collapsible group on phones and tablets (only the first starts open), so
 *  the page stays scannable on a small screen. Server-rendered open, so the
 *  content is always there without JavaScript and for search engines. */
export function ServiceGroup({ title, titleKey, defaultOpen, children }: { title: string; titleKey: string; defaultOpen: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(true)
  const [collapsible, setCollapsible] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)')
    const apply = () => {
      setCollapsible(mq.matches)
      setOpen(mq.matches ? defaultOpen : true)
    }
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [defaultOpen])

  return (
    <details
      open={open}
      onToggle={e => {
        const isOpen = (e.currentTarget as HTMLDetailsElement).open
        if (!collapsible && !isOpen) {
          ;(e.currentTarget as HTMLDetailsElement).open = true
          return
        }
        setOpen(isOpen)
      }}
      className="group/sg"
    >
      <summary
        className={`flex list-none items-center justify-between gap-4 border-b border-ink pb-3 [&::-webkit-details-marker]:hidden ${collapsible ? 'min-h-[3rem] cursor-pointer' : 'cursor-default'}`}
        tabIndex={collapsible ? undefined : -1}
        onClick={e => { if (!collapsible) e.preventDefault() }}
      >
        <h3 suppressHydrationWarning data-anyos={titleKey} className="text-[0.8125rem] font-semibold uppercase tracking-[0.12em] text-ink">{title}</h3>
        {collapsible ? (
          <span className="grid h-8 w-8 flex-none place-items-center rounded-full border border-line text-ink transition-transform duration-300 group-open/sg:rotate-180">
            <Icon name="chevronDown" className="h-4 w-4" />
          </span>
        ) : null}
      </summary>
      {children}
    </details>
  )
}
