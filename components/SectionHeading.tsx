import type { ReactNode } from 'react'

/** Eyebrow + heading + optional intro. Keys are passed in so each section
 *  keeps its published anyOS keys. */
export function SectionHeading({
  id, eyebrowKey, eyebrow, titleKey, title, introKey, intro, className = '', align = 'left', children,
}: {
  id: string
  eyebrowKey?: string
  eyebrow?: string
  titleKey: string
  title: string
  introKey?: string
  intro?: string
  className?: string
  align?: 'left' | 'center'
  children?: ReactNode
}) {
  return (
    <div className={`${align === 'center' ? 'mx-auto text-center' : ''} max-w-[44rem] ${className}`} data-reveal>
      {eyebrow ? <p suppressHydrationWarning data-anyos={eyebrowKey} className="eyebrow">{eyebrow}</p> : null}
      <h2 id={id} suppressHydrationWarning data-anyos={titleKey} className="t-h2 mt-4">{title}</h2>
      {intro ? <p suppressHydrationWarning data-anyos={introKey} className="t-lead mt-5 text-ink-2 [.on-forest_&]:text-on-forest-muted">{intro}</p> : null}
      {children}
    </div>
  )
}
