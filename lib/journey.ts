// The opening journey: one car, one trip (see DESIGN.md "Opening journey").
//
//   arrival  the car, complete, in low evening light → the camera moves in
//            toward its windscreen
//   cabin    inside: settle in → the camera draws back and rises
//   road     the motorway at night, light trails → settles on the quote
//
// MEDIA STATUS (18 Oct 2026): every scene is a PROVISIONAL still photograph
// moved by scroll (transform/opacity only). This is NOT a film: no video is
// implemented or delivered. The exterior is a W223 S-Class and the cabin a
// W222: the same model line, not the same car. The same-car keyframes and
// any video are pending review (JOURNEY-STORYBOARD.md, ASSET-LOG.md).

export type JourneyCredit = { title: string; author: string; license: string; source: string; licenseUrl: string; edits: string }

export type JourneyScene = {
  id: 'arrival' | 'cabin' | 'road'
  status: 'provisional-still' | 'delivered-still'
  /** Landscape widths available as /media/<base>-<w>.webp */
  base: string
  widths: number[]
  /** Optional 9:16 phone crop as /media/<base>-p<w>.webp */
  portrait?: number[]
  /** Evening state of the same frame (global grade only). */
  evening?: string
  /** Width / height of the frame, and where the camera heads (windscreen),
   *  as fractions of the frame. Used by the arrival scene. */
  aspect?: number
  focal?: { x: number; y: number }
  alt: string
  credit: JourneyCredit
}

export const JOURNEY: JourneyScene[] = [
  {
    id: 'arrival',
    status: 'provisional-still',
    base: 'journey/exterior',
    widths: [960, 1600, 2400],
    evening: 'journey/exterior-eve',
    aspect: 1.6,
    focal: { x: 0.5, y: 0.33 },
    alt: 'A black Mercedes-Benz S-Class waiting in a garage doorway',
    credit: {
      title: 'Mercedes-Benz S-Class, Mayfair, London 01',
      author: 'Jason Lawrence',
      license: 'CC BY 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
      source: 'https://commons.wikimedia.org/wiki/File:Mercedes-Benz_S-Class,_Mayfair,_London_01.jpg',
      edits: 'cropped, resized, colour-graded (a day and an evening grade); registration plate blurred',
    },
  },
  {
    id: 'cabin',
    status: 'provisional-still',
    base: 'journey/cabin',
    widths: [960, 1600, 2400],
    portrait: [720, 1080],
    alt: 'Inside a Mercedes-Benz S-Class: cream leather, wood and the dashboard',
    credit: {
      title: 'The interior of Mercedes-Benz S400 HYBRID (W222)',
      author: 'Tokumeigakarinoaoshima',
      license: 'CC0',
      licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
      source: 'https://commons.wikimedia.org/wiki/File:The_interior_of_Mercedes-Benz_S400_HYBRID_(W222).JPG',
      edits: 'cropped below the windscreen, resized, colour-graded',
    },
  },
  {
    id: 'road',
    status: 'provisional-still',
    base: 'night',
    widths: [960, 1600, 2400],
    portrait: [720, 1080],
    alt: 'Light trails on the M25 at night',
    credit: {
      title: 'M25 at Night – Looking West',
      author: 'Christine Matthews',
      license: 'CC BY-SA 2.0',
      licenseUrl: 'https://creativecommons.org/licenses/by-sa/2.0/',
      source: 'https://commons.wikimedia.org/wiki/File:M25_at_Night_-_Looking_West_-_geograph.org.uk_-_5612086.jpg',
      edits: 'cropped, resized, colour-graded',
    },
  },
]

export const srcSet = (base: string, widths: number[], prefix = '') => widths.map(w => `/media/${base}-${prefix}${w}.webp ${w}w`).join(', ')
