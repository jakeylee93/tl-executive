// Geometry for the fleet convoy, written by scripts/motion/build_fleet.py
// (layer sizes, wheel discs, ground contacts, road perspective).
import fleet from './fleet.json'

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
