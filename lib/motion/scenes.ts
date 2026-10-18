// Geometry for the three opening scenes and the fleet studio, written by
// scripts/motion/build_*.py from the canonical masters (see MOTION.md).
// Every coordinate is a fraction of its scene's full frame unless noted.
import arrival from './arrival.json'
import cabin from './cabin.json'
import night from './night.json'
import fleet from './fleet.json'

export const ARRIVAL = arrival
export const CABIN = cabin
export const NIGHT = night
export const FLEET_GEO = fleet

export const FRAME_WIDTHS = [960, 1600, 2400]
export const PORTRAIT_WIDTHS = [720, 1080]

export const srcSet = (base: string, widths: number[] = FRAME_WIDTHS, prefix = '') =>
  widths.map(w => `${base}-${prefix}${w}.webp ${w}w`).join(', ')

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v))
/** 0 → 1 between a and b, eased (smoothstep). */
export const smooth = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a))
  return t * t * (3 - 2 * t)
}
/** 0 → 1 between a and b, decelerating like a car braking to a stop. */
export const brake = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a))
  return 1 - (1 - t) * (1 - t)
}
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t

// --- Scene 3 (night): the car drives away up its lane -----------------------
// Ground plane: horizon where the carriageway edge lines meet; the car keeps
// its distance from the offside edge line, scaled by perspective.
const GROUND_X = 0.556
export function nightPath(t: number) {
  const [[ex0, ey0], [ex1, ey1]] = NIGHT.edge
  const edgeX = (y: number) => ex0 + ((y - ey0) * (ex1 - ex0)) / (ey1 - ey0)
  const h = NIGHT.horizon
  const d0 = 1 / (NIGHT.groundY - h)
  const d1 = 1 / (NIGHT.endY - h)
  const y = h + 1 / lerp(d0, d1, t) // constant ground speed: depth is linear
  const s = (y - h) / (NIGHT.groundY - h)
  const x = edgeX(y) - (edgeX(NIGHT.groundY) - GROUND_X) * s
  return { x, y, s, x0: GROUND_X, y0: NIGHT.groundY }
}
