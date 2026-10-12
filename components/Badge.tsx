import { BADGE } from '@/lib/badgePaths'

// The authentic T&L badge as vector artwork (see lib/badgePaths.ts for its
// provenance). Lighting is exposed as CSS custom properties so a parent can
// move the light without re-rendering:
//   --badge-light   rotation of the rim's specular sweep (deg)
//   --badge-gloss-x / --badge-gloss-y   disc gloss offset (px in badge units)
//   --badge-gloss   gloss strength (0–1)
//   --badge-warm    0 = cool daylight, 1 = warm evening light
// Defaults reproduce the original logo's top-left light.

const { cx, cy, rim, disc } = BADGE

export function Badge({ id = 'tlb', className = '', title = 'Theydon & Loughton Executive Cars', decorative = false }: { id?: string; className?: string; title?: string; decorative?: boolean }) {
  const u = (s: string) => `${id}-${s}`
  const ref = (s: string) => `url(#${u(s)})`
  return (
    <svg
      viewBox={BADGE.viewBox}
      className={className}
      role={decorative ? undefined : 'img'}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : title}
      focusable="false"
    >
      <defs>
        <linearGradient id={u('rim')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f8f8f8" />
          <stop offset="0.07" stopColor="#dcdcdc" />
          <stop offset="0.18" stopColor="#c4c4c4" />
          <stop offset="0.33" stopColor="#afafaf" />
          <stop offset="0.5" stopColor="#a6a6a6" />
          <stop offset="0.67" stopColor="#b6b6b6" />
          <stop offset="0.82" stopColor="#c3c3c3" />
          <stop offset="0.93" stopColor="#e0e0e0" />
          <stop offset="1" stopColor="#f8f8f8" />
        </linearGradient>
        <linearGradient id={u('rimShade')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0.5" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.55" />
        </linearGradient>
        <linearGradient id={u('bevel')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a3a3a" />
          <stop offset="1" stopColor="#8d8d8d" />
        </linearGradient>
        <radialGradient id={u('disc')} cx={cx} cy={330} r={590} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#5e5e5e" />
          <stop offset="0.5" stopColor="#3d3d3d" />
          <stop offset="1" stopColor="#1b1b1b" />
        </radialGradient>
        <linearGradient id={u('band')} x1="35" y1="0" x2="1006" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#8a8a8a" />
          <stop offset="0.5" stopColor="#c8c8c8" />
          <stop offset="1" stopColor="#8a8a8a" />
        </linearGradient>
        <linearGradient id={u('bandV')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.45" />
          <stop offset="0.07" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.86" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.14" />
        </linearGradient>
        <linearGradient id={u('lip')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5a5a5a" />
          <stop offset="1" stopColor="#7c7c7c" />
        </linearGradient>
        <linearGradient id={u('letters')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f7f7f7" />
          <stop offset="1" stopColor="#d4d4d4" />
        </linearGradient>
        <linearGradient id={u('sheen')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0.3" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.5" style={{ stopColor: 'var(--badge-sheen, #ffffff)', stopOpacity: 0.95 }} />
          <stop offset="0.7" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={u('gloss')}>
          <stop offset="0" style={{ stopColor: 'var(--badge-sheen, #ffffff)', stopOpacity: 0.5 }} />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <clipPath id={u('discClip')}>
          <circle cx={cx} cy={cy} r={disc} />
        </clipPath>
        <filter id={u('soft')} x="-10%" y="-30%" width="120%" height="160%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
        <filter id={u('lift')} x="-5%" y="-5%" width="110%" height="115%">
          <feDropShadow dx="1.5" dy="4" stdDeviation="2.2" floodColor="#000" floodOpacity="0.6" />
        </filter>
      </defs>

      {/* Rim, bevel and disc */}
      <circle cx={cx} cy={cy} r={rim} fill={ref('rim')} />
      <circle cx={cx} cy={cy} r={rim} fill={ref('rimShade')} />
      <circle cx={cx} cy={cy} r={rim - 0.8} fill="none" stroke="#8a8a8a" strokeWidth="1.6" />
      <circle cx={cx} cy={cy} r={disc + 7} fill={ref('bevel')} />
      <circle cx={cx} cy={cy} r={disc} fill={ref('disc')} />

      {/* Moving gloss across the dark disc */}
      <g clipPath={ref('discClip')}>
        <ellipse
          className="badge-gloss"
          cx={cx - 120}
          cy={cy - 210}
          rx={360}
          ry={230}
          fill={ref('gloss')}
          style={{ opacity: 'var(--badge-gloss, 0.35)', transform: 'translate(var(--badge-gloss-x, 0px), var(--badge-gloss-y, 0px))' }}
        />
      </g>

      {/* THEYDON / LOUGHTON — traced from the original letterforms */}
      <path d={BADGE.lightLetters} transform={BADGE.letterTransform} fill={ref('letters')} filter={ref('lift')} />

      {/* Ribbon: cast shadow, lip, face and engraved lettering */}
      <path d={BADGE.ribbonFace} transform="translate(0 16)" fill="#000" opacity="0.5" filter={ref('soft')} />
      <path d={BADGE.ribbonLip} fill={ref('lip')} />
      <path d={BADGE.ribbonFace} fill={ref('band')} />
      <path d={BADGE.ribbonFace} fill={ref('bandV')} />
      <path d={BADGE.engravedLetters} transform={`translate(0.7 1.3) ${BADGE.letterTransform}`} fill="#f4f4f4" opacity="0.55" />
      <path d={BADGE.engravedLetters} transform={BADGE.letterTransform} fill="#272727" />

      {/* Specular sweep around the rim: rotate to move the light */}
      <g style={{ transformOrigin: `${cx}px ${cy}px`, transformBox: 'view-box', transform: 'rotate(var(--badge-light, -8deg))' }}>
        <circle cx={cx} cy={cy} r={rim - 13} fill="none" stroke={ref('sheen')} strokeWidth="20" opacity="0.85" />
      </g>
    </svg>
  )
}
