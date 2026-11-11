import 'server-only'
import fieldMap from '@/integrations/anyvendor/field-map.json'
import seed from '@/integrations/anyvendor/seed.json'

// AnyVendor site adapter (schema anyvendor.site/v1, slug tl-executive-cars).
// Server-side only: the page reads published content from the AnyVendor
// content origin and falls back to the built-in content on 404, outage or bad
// data, so the public site always renders. Nothing is fetched unless
// ANYVENDOR_CONTENT_ORIGIN is set, which keeps today's behaviour (anyOS
// edit.js, built-in defaults) until the integration is verified and switched
// on. No write or service credentials exist in this code: the backend owns
// auth, tenancy, drafts, revisions and publish. See integrations/anyvendor/README.md.

export const SLUG = 'tl-executive-cars'
export const CHAPTERS = ['journeys', 'fleet', 'trust', 'plan', 'contact'] as const
export type Chapter = (typeof CHAPTERS)[number]

export type SiteOverrides = {
  /** where the content came from */
  source: 'built-in' | 'published' | 'draft'
  revision: string
  /** anyOS key → text, only where it differs from the built-in content */
  text: Record<string, string>
  /** anyOS image key → picture */
  images: Record<string, { src: string; alt: string }>
  /** every editable element: anyOS key → AnyVendor field path (for the visual-editing bridge) */
  fields: Record<string, string>
  chapters: Chapter[]
}

type MapEntry = { kind: string; anyos?: string }
const MAP = fieldMap as Record<string, MapEntry>
const SEED = seed as unknown as Record<string, Record<string, unknown>>
const FIELDS: Record<string, string> = {}
Object.keys(MAP).forEach(path => { const a = MAP[path].anyos; if (a) FIELDS[a] = path })

const builtIn = (): SiteOverrides => ({ source: 'built-in', revision: '', text: {}, images: {}, fields: FIELDS, chapters: CHAPTERS.slice() })

function origin() {
  const o = (process.env.ANYVENDOR_CONTENT_ORIGIN || '').replace(/\/$/, '')
  if (/^https:\/\/[^\s/]+$/i.test(o)) return o
  // a local mock origin, for contract tests only (never on a Vercel deployment)
  return !process.env.VERCEL && /^http:\/\/127\.0\.0\.1:\d+$/.test(o) ? o : ''
}

/** Only same-site paths and https URLs may become an image source. */
const safeSrc = (v: unknown) => (typeof v === 'string' && (/^\/(?!\/)/.test(v) || /^https:\/\//i.test(v)) ? v : '')

function chaptersFrom(v: unknown): Chapter[] {
  if (!Array.isArray(v)) return CHAPTERS.slice()
  const out: Chapter[] = []
  v.forEach(item => {
    const c = item && typeof item === 'object' ? (item as { chapter?: unknown; visible?: unknown }) : {}
    const key = CHAPTERS.find(k => k === c.chapter)
    if (key && c.visible !== false && out.indexOf(key) < 0) out.push(key)
  })
  // the quote form is the site's purpose and the target of every "Request a
  // quote" link: it can move, but a layout without it is repaired
  if (out.indexOf('plan') < 0) out.push('plan')
  return out
}

export function toOverrides(content: unknown, source: SiteOverrides['source'], revision: string): SiteOverrides {
  const o = builtIn()
  if (!content || typeof content !== 'object') return o
  const c = content as Record<string, Record<string, unknown>>
  o.source = source
  o.revision = revision
  Object.keys(MAP).forEach(path => {
    const [sec, key] = path.split('.')
    const entry = MAP[path]
    const value = c[sec] ? c[sec][key] : undefined
    if (value === undefined || value === null) return
    if (entry.kind === 'text' && entry.anyos && typeof value === 'string') {
      const text = value.replace(/<[^>]*>/g, '').trim()
      if (text && text !== SEED[sec]?.[key]) o.text[entry.anyos] = text.slice(0, 2000)
    } else if (entry.kind === 'image' && entry.anyos && typeof value === 'object') {
      const img = value as { src?: unknown; alt?: unknown }
      const src = safeSrc(img.src)
      const was = SEED[sec]?.[key] as { src?: string; alt?: string } | undefined
      const alt = typeof img.alt === 'string' ? img.alt.slice(0, 300) : was?.alt || ''
      if (src && (src !== was?.src || alt !== was?.alt)) o.images[entry.anyos] = { src, alt }
    } else if (entry.kind === 'layout') {
      o.chapters = chaptersFrom(value)
    }
  })
  return o
}

/** Published content (cached 60 s), or a draft when a preview token is given (never cached). */
export async function getSite(previewToken?: string): Promise<SiteOverrides> {
  const base = origin()
  if (!base) return builtIn()
  const draft = Boolean(previewToken)
  const url = `${base}/api/sites/${SLUG}/content${draft ? `?preview=${encodeURIComponent(previewToken!)}` : ''}`
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 4000)
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
      ...(draft ? { cache: 'no-store' as const } : { next: { revalidate: 60, tags: [`anyvendor:${SLUG}`] } }),
    }).finally(() => clearTimeout(timer))
    if (!res.ok) return builtIn() // 404: unknown, unpublished or not entitled
    const body = (await res.json()) as { schema?: string; mode?: string; revision?: unknown; content?: unknown }
    if (body.schema !== 'anyvendor.site/v1' || (draft ? body.mode !== 'draft' : body.mode !== 'published')) return builtIn()
    return toOverrides(body.content, draft ? 'draft' : 'published', String(body.revision || ''))
  } catch {
    return builtIn() // outage or timeout: the built-in content stands. The URL (and any token) is never logged.
  }
}
