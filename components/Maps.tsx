import { AIRPORTS, AREAS, BUSINESS } from '@/lib/site'

// Original line maps drawn from real coordinates (equirectangular projection,
// longitude scaled by cos(latitude) so distances read true). Simplified on
// purpose: a river, the forest and the places that matter — no roads, so
// nothing implies a specific route or journey time.

type LatLon = [number, number] // [lat, lon]

function projector(bounds: { west: number; east: number; south: number; north: number }, k: number) {
  const midLat = (bounds.north + bounds.south) / 2
  const c = Math.cos((midLat * Math.PI) / 180)
  const width = (bounds.east - bounds.west) * c * k
  const height = (bounds.north - bounds.south) * k
  const p = ([lat, lon]: LatLon) => [+(((lon - bounds.west) * c * k).toFixed(1)), +(((bounds.north - lat) * k).toFixed(1))] as const
  // Kilometres → map units (1° latitude ≈ 111.2 km).
  const km = (d: number) => (d / 111.2) * k
  return { p, width: Math.round(width), height: Math.round(height), km }
}

const smooth = (pts: readonly (readonly [number, number])[]) => {
  // Catmull-Rom → cubic Bézier, for an organic river line.
  let d = `M${pts[0][0]} ${pts[0][1]}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] || p2
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0]} ${p2[1]}`
  }
  return d
}

const smoothClosed = (pts: readonly (readonly [number, number])[]) => {
  const n = pts.length
  let d = `M${pts[0][0]} ${pts[0][1]}`
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n]
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0]} ${p2[1]}`
  }
  return d + ' Z'
}

const THAMES: LatLon[] = [
  [51.4035, -0.3375], [51.41, -0.307], [51.458, -0.305], [51.48, -0.26], [51.488, -0.228], [51.48, -0.16],
  [51.5005, -0.1215], [51.509, -0.105], [51.5055, -0.075], [51.505, -0.035], [51.485, -0.01], [51.5, 0.005],
  [51.494, 0.07], [51.482, 0.18], [51.463, 0.255], [51.45, 0.36], [51.49, 0.5], [51.505, 0.58], [51.515, 0.72], [51.52, 0.8],
]

const FOREST: LatLon[] = [
  [51.615, -0.01], [51.64, 0.01], [51.67, 0.06], [51.7, 0.1], [51.71, 0.125], [51.7, 0.135],
  [51.675, 0.09], [51.645, 0.045], [51.62, 0.02],
]

type Side = 'right' | 'above' | 'below' | 'below-left'
// Placed to keep each label clear of its own route line.
const AIRPORT_LABEL: Record<string, Side> = { STN: 'right', LTN: 'above', LHR: 'below', LGW: 'right', LCY: 'right', SEN: 'below-left' }

function labelPos(x: number, y: number, side: Side) {
  switch (side) {
    case 'right': return { x: x + 18, codeY: y - 2, nameY: y + 21, anchor: 'start' as const }
    case 'above': return { x: x - 10, codeY: y - 40, nameY: y - 18, anchor: 'start' as const }
    case 'below': return { x: x - 10, codeY: y + 40, nameY: y + 62, anchor: 'start' as const }
    case 'below-left': return { x: x + 10, codeY: y + 40, nameY: y + 62, anchor: 'end' as const }
  }
}

/** Regional map: Theydon Bois and the six London airports. */
export function AirportMap({ className = '' }: { className?: string }) {
  const { p, width, height, km } = projector({ west: -0.56, east: 0.8, south: 51.08, north: 51.97 }, 1000)
  const home = p([BUSINESS.geo.lat, BUSINESS.geo.lon])
  const london = p([51.5074, -0.1278])
  const tenMiles = km(16.09)
  const titleId = 'airport-map-title'
  const descId = 'airport-map-desc'

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={className} role="img" aria-labelledby={`${titleId} ${descId}`}>
      <title id={titleId}>Map of the London airports around Theydon Bois</title>
      <desc id={descId}>
        Theydon Bois sits on the edge of Epping Forest, north-east of London. Stansted lies to the north, Luton to the north-west,
        Heathrow to the west, Gatwick to the south, London City to the south and Southend to the east.
      </desc>

      {/* Fine survey grid */}
      <defs>
        <pattern id="map-grid" width="56" height="56" patternUnits="userSpaceOnUse">
          <path d="M56 0H0V56" fill="none" stroke="var(--tl-line)" strokeWidth="1" opacity=".55" />
        </pattern>
      </defs>
      <rect width={width} height={height} fill="url(#map-grid)" />

      {/* River Thames and Epping Forest */}
      <path d={smooth(THAMES.map(p))} fill="none" stroke="#c9d3cf" strokeWidth="7" strokeLinecap="round" />
      <text x={p([51.44, 0.44])[0]} y={p([51.44, 0.44])[1] + 34} className="map-note fill-muted" fontStyle="italic" fontFamily="var(--font-display)">River Thames</text>
      <path d={smoothClosed(FOREST.map(p))} fill="#d7dfd3" stroke="#b7c4b2" strokeWidth="1.5" />

      {/* Central London reference */}
      <circle cx={london[0]} cy={london[1]} r="5" fill="none" stroke="var(--tl-muted)" strokeWidth="1.5" />
      <text x={london[0]} y={london[1] - 14} textAnchor="middle" className="map-note fill-muted" fontFamily="var(--font-sans)">Central London</text>

      {/* Routes: gentle arcs from Theydon Bois to each airport */}
      <g data-reveal>
        {AIRPORTS.map((a, i) => {
          const [x, y] = p([a.lat, a.lon])
          const mx = (home[0] + x) / 2
          const my = (home[1] + y) / 2
          const dx = x - home[0]
          const dy = y - home[1]
          const len = Math.hypot(dx, dy)
          const bend = 0.12 * len
          const cx = mx - (dy / len) * bend
          const cy = my + (dx / len) * bend
          const approx = Math.round(len * 1.05)
          return (
            <path
              key={a.code}
              d={`M${home[0]} ${home[1]} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${x} ${y}`}
              fill="none"
              stroke="var(--tl-brass)"
              strokeWidth="2"
              strokeLinecap="round"
              className="route-draw"
              style={{ ['--len' as string]: approx, ['--draw-delay' as string]: `${150 + i * 110}ms` }}
            />
          )
        })}
      </g>

      {/* Airports */}
      {AIRPORTS.map(a => {
        const [x, y] = p([a.lat, a.lon])
        const l = labelPos(x, y, AIRPORT_LABEL[a.code] || 'right')
        return (
          <g key={a.code}>
            <circle cx={x} cy={y} r="9" fill="var(--tl-surface)" stroke="var(--tl-ink)" strokeWidth="2" />
            <circle cx={x} cy={y} r="3" fill="var(--tl-ink)" />
            <text x={l.x} y={l.codeY} textAnchor={l.anchor} fontWeight="700" letterSpacing="1.5" className="map-code fill-ink" fontFamily="var(--font-sans)">{a.code}</text>
            <text x={l.x} y={l.nameY} textAnchor={l.anchor} className="map-name fill-muted" fontFamily="var(--font-sans)">{a.short}</text>
          </g>
        )
      })}

      {/* Home */}
      <circle cx={home[0]} cy={home[1]} r="22" fill="var(--tl-brass)" opacity=".14" />
      <circle cx={home[0]} cy={home[1]} r="11" fill="var(--tl-brass)" stroke="var(--tl-surface)" strokeWidth="3" />
      <text x={home[0] + 24} y={home[1] - 20} fontWeight="500" className="map-home fill-ink" fontFamily="var(--font-display)">Theydon Bois</text>
      <text x={p([51.66, -0.02])[0] - 8} y={p([51.66, -0.02])[1] + 4} textAnchor="end" fontStyle="italic" className="map-note fill-muted" fontFamily="var(--font-display)">Epping Forest</text>

      {/* Scale and north */}
      <g className="map-note" transform={`translate(${width - 40 - tenMiles} ${height - 44})`}>
        <path d={`M0 0V8H${tenMiles.toFixed(1)}V0`} fill="none" stroke="var(--tl-ink-2)" strokeWidth="1.5" />
        <text x={tenMiles / 2} y="-8" textAnchor="middle" className="fill-muted" fontFamily="var(--font-sans)">10 miles</text>
      </g>
      <g transform={`translate(${width - 42} 44)`} aria-hidden="true">
        <path d="M0 -18 7 8 0 3 -7 8Z" fill="var(--tl-ink-2)" />
        <text y="30" textAnchor="middle" fontSize="16" fontWeight="600" className="fill-muted" fontFamily="var(--font-sans)">N</text>
      </g>
    </svg>
  )
}

type LocalSide = 'right' | 'left' | 'below'
const AREA_LABEL: Record<string, LocalSide> = {
  'Theydon Bois': 'right', Loughton: 'left', Epping: 'right', Abridge: 'right', Ongar: 'below',
  'Buckhurst Hill': 'left', Chigwell: 'right', 'Woodford Green': 'right',
}

/** Local map: the villages and towns T&L collects from. */
export function LocalMap({ className = '' }: { className?: string }) {
  const { p, width, height, km } = projector({ west: -0.065, east: 0.3, south: 51.595, north: 51.725 }, 4000)
  const twoMiles = km(3.219)

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={className} role="img" aria-labelledby="local-map-title">
      {/* One text node: mixed JSX text inside an SVG <title> breaks hydration. */}
      <title id="local-map-title">{`Map of local pick-up areas: ${AREAS.map(a => a.name).join(', ')}, with Epping Forest running between them.`}</title>
      <defs>
        <pattern id="local-grid" width="48" height="48" patternUnits="userSpaceOnUse">
          <path d="M48 0H0V48" fill="none" stroke="rgba(243,240,232,.08)" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width={width} height={height} fill="url(#local-grid)" />
      <path d={smoothClosed(FOREST.map(p))} fill="rgba(180,190,182,.16)" stroke="rgba(180,190,182,.35)" strokeWidth="1.5" />
      <text x={p([51.652, 0.018])[0]} y={p([51.652, 0.018])[1]} className="map-note" fontStyle="italic" fill="var(--tl-on-forest-muted)" fontFamily="var(--font-display)" transform={`rotate(-38 ${p([51.652, 0.018])[0]} ${p([51.652, 0.018])[1]})`}>Epping Forest</text>

      {AREAS.map(a => {
        const [x, y] = p([a.lat, a.lon])
        const home = a.name === BUSINESS.locality
        const side = AREA_LABEL[a.name] || 'right'
        const lx = side === 'right' ? x + (home ? 24 : 15) : side === 'left' ? x - 15 : x
        const ly = side === 'below' ? y + 16 : y
        const anchor = side === 'left' ? 'end' : side === 'right' ? 'start' : 'middle'
        return (
          <g key={a.name}>
            {home ? <circle cx={x} cy={y} r="20" fill="var(--tl-brass-light)" opacity=".18" /> : null}
            <circle cx={x} cy={y} r={home ? 9 : 6} fill={home ? 'var(--tl-brass-light)' : 'var(--tl-on-forest)'} stroke="var(--tl-forest)" strokeWidth="2" />
            <text x={lx} y={ly} textAnchor={anchor} dominantBaseline={side === 'below' ? 'hanging' : 'central'} fontWeight={home ? 600 : 400} className={home ? 'map-area-home' : 'map-area'} fill="var(--tl-on-forest)" fontFamily="var(--font-sans)">{a.name}</text>
          </g>
        )
      })}

      <g className="map-note" transform={`translate(${width - 32 - twoMiles} ${height - 36})`}>
        <path d={`M0 0V7H${twoMiles.toFixed(1)}V0`} fill="none" stroke="var(--tl-on-forest-muted)" strokeWidth="1.5" />
        <text x={twoMiles / 2} y="-8" textAnchor="middle" fill="var(--tl-on-forest-muted)" fontFamily="var(--font-sans)">2 miles</text>
      </g>
    </svg>
  )
}
