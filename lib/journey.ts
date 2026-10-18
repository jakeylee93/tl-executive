// The opening journey: one car, one trip (see DESIGN.md "Opening journey").
//
//   arrival  the car, complete, at golden hour → the camera moves in toward
//            its windscreen
//   cabin    inside at dusk: settle in → the camera draws back and rises
//   road     the motorway at night from above → settles on the quote
//
// MEDIA STATUS (18 Oct 2026): three still keyframes of ONE conceptual car (a
// black W222 S-Class), generated with OpenArt Nano Banana 2 from the
// official S-Class model picture (TL-20261018-HERO-005/006/007), each moved
// by scroll (transform/opacity only). This is NOT yet a film: the joined
// camera clips are pending review (JOURNEY-STORYBOARD.md). Generated images
// of the model, not photographs of Simon's own car or trim.

export type JourneyCredit = { title: string; job: string; asset: string; edits: string }

export type JourneyScene = {
  id: 'arrival' | 'cabin' | 'road'
  status: 'keyframe-still'
  /** Landscape widths available as /media/<base>-<w>.webp */
  base: string
  widths: number[]
  /** Optional 9:16 phone crop as /media/<base>-p<w>.webp */
  portrait?: number[]
  /** Evening state of the same frame (global grade only). */
  evening?: string
  /** Width / height of the frame; where the camera heads (the windscreen)
   *  and the car's horizontal centre, as fractions of the frame. */
  aspect?: number
  focal?: { x: number; y: number }
  carCenter?: number
  alt: string
  credit: JourneyCredit
}

export const JOURNEY: JourneyScene[] = [
  {
    id: 'arrival',
    status: 'keyframe-still',
    base: 'journey/k-opening',
    widths: [960, 1600, 2400],
    evening: 'journey/k-opening-eve',
    aspect: 16 / 9,
    focal: { x: 0.605, y: 0.47 },
    carCenter: 0.635,
    alt: 'A black Mercedes-Benz S-Class on an English country lane at golden hour',
    credit: { title: 'Opening: the car on a country lane', job: 'OppTcrQ37tpX8tJ1RGC3', asset: 'NYGhrBTI8oNPZt2kmg6D', edits: 'resized; a global evening grade for the second state' },
  },
  {
    id: 'cabin',
    status: 'keyframe-still',
    base: 'journey/k-cabin',
    widths: [960, 1600, 2400],
    portrait: [720, 1080],
    alt: 'Inside the S-Class at dusk: cream leather, wood and soft ambient light',
    credit: { title: 'The cabin at dusk', job: 'PlGgh798LFzPNbkPqCt6', asset: 'ESFHlOOMinoz3vYkbVyT', edits: 'resized; 9:16 phone crop' },
  },
  {
    id: 'road',
    status: 'keyframe-still',
    base: 'journey/k-aerial',
    widths: [960, 1600, 2400],
    portrait: [720, 1080],
    alt: 'The S-Class on a motorway at night, seen from above',
    credit: { title: 'The motorway at night', job: 'lPH9akUPyC0oPean425G', asset: 'lVpvq6zEJ5L66vONaeJm', edits: 'resized; 9:16 phone crop; generated plate and badge lettering blurred' },
  },
]

export const srcSet = (base: string, widths: number[], prefix = '') => widths.map(w => `/media/${base}-${prefix}${w}.webp ${w}w`).join(', ')
