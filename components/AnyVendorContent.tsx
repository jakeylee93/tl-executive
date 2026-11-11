'use client'

import { useEffect } from 'react'
import type { SiteOverrides } from '@/lib/anyvendor/site'

// Applies AnyVendor content to the page's editable elements (the same
// elements, by the same keys, that the anyOS editor addresses) and labels
// each with its AnyVendor field path (data-av-field) for the visual-editing
// bridge. With built-in content there is nothing to apply. Text is set as
// text, never HTML. Skipped while the anyOS editor is open.
export function AnyVendorContent({ site }: { site: SiteOverrides }) {
  useEffect(() => {
    const root = document.documentElement
    root.dataset.avSource = site.source
    if (site.revision) root.dataset.avRevision = site.revision
    const apply = () => {
      if (root.classList.contains('anyos-editing')) return
      document.querySelectorAll<HTMLElement>('[data-anyos]').forEach(el => {
        const key = el.dataset.anyos || ''
        if (site.fields[key]) el.dataset.avField = site.fields[key]
        const text = site.text[key]
        if (text !== undefined && el.textContent !== text) el.textContent = text
      })
      document.querySelectorAll<HTMLImageElement>('img[data-anyos-img]').forEach(img => {
        const key = img.dataset.anyosImg || ''
        if (site.fields[key]) img.dataset.avField = site.fields[key]
        const pic = site.images[key]
        if (!pic) return
        if (img.getAttribute('src') !== pic.src) { img.removeAttribute('srcset'); img.setAttribute('src', pic.src) }
        if (img.alt !== pic.alt) img.alt = pic.alt
      })
    }
    apply()
    if (site.source === 'built-in') return
    // the anyOS script applies its own saved content after load; while both
    // are installed, the published AnyVendor content is applied last
    const timers = [400, 1500, 4000].map(ms => window.setTimeout(apply, ms))
    return () => timers.forEach(t => window.clearTimeout(t))
  }, [site])
  return null
}
