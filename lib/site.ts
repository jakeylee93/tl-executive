// Business content for the T&L website: the single source for copy defaults,
// contact details and structured data.
//
// Every text default here can be overridden live from anyOS (data-anyos keys).
// The KEYS never change once published: saved overrides are looked up by key,
// and tests/fixtures/cms-keys.json pins all 114 text + 5 image keys.
//
// Facts follow T&L's own website as inspected in a browser on 12 Oct 2026
// (tlexecutivecars.co.uk) and the September source audit (RESEARCH.md). They
// are the business's published statements, not independent certification;
// uncertainty is recorded in AUDIT.md, never in visitor-facing copy.

export const BUSINESS = {
  name: 'Theydon & Loughton Executive Cars',
  shortName: 'T&L Executive Cars',
  founded: 2008,
  locality: 'Theydon Bois',
  region: 'Essex',
  country: 'GB',
  phoneDisplay: '07904 428896',
  phoneHref: 'tel:+447904428896',
  phoneE164: '+447904428896',
  email: 'simonemburns@gmail.com',
  // Published footer hours on the official site. No 24-hour claim is made.
  hours: 'Mon–Fri, 9.00am–6.30pm',
  hoursSpec: { days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '09:00', closes: '18:30' },
  founder: 'Simon Burns',
  licensing: 'Drivers and vehicles licensed by Epping Forest District Council',
  payments: 'Visa, Mastercard, American Express and Apple Pay',
  siteUrl: 'https://tl-executive.vercel.app',
  officialSite: 'https://tlexecutivecars.co.uk/',
} as const

/** Stable CMS key fragment for a vehicle, so edits survive a rename. */
export const slug = (name: string) => name.toLowerCase().replaceAll(' ', '-')

export type IconName =
  | 'plane' | 'briefcase' | 'sparkle' | 'rings' | 'theatre' | 'flag' | 'stadium'
  | 'ship' | 'dining' | 'road' | 'music' | 'care' | 'bag'

export type Service = { idx: number; title: string; description: string; icon: IconName }

// Indices are the published CMS keys (services.0 … services.12). Keys 7, 8, 9,
// 10 and 11 now carry services T&L's official site describes (seaports, fine
// dining, VIP aviation terminals, media/production work, speaker transfers);
// none of those keys had a saved override when re-worded (checked 12 Oct).
export const SERVICES: Service[] = [
  { idx: 0, title: 'Airport transfers', icon: 'plane', description: 'Heathrow, Gatwick, London City, Luton, Stansted and Southend. Flights are monitored, and arrivals are met in the terminal.' },
  { idx: 1, title: 'Corporate travel', icon: 'briefcase', description: 'Meetings, roadshows and client collections, with discreet, punctual drivers who know London and the M25.' },
  { idx: 2, title: 'Special occasions', icon: 'sparkle', description: 'Birthdays, anniversaries and red-carpet evenings: arrive together and leave the driving to us.' },
  { idx: 3, title: 'Weddings', icon: 'rings', description: 'The couple, the family and guest transfers between hotel and venue, planned around your day.' },
  { idx: 4, title: 'Theatre', icon: 'theatre', description: 'Door to door for West End shows, with no parking to find and no last train to catch.' },
  { idx: 5, title: 'Race days', icon: 'flag', description: 'Cheltenham, Ascot and Newmarket: enjoy the racing and travel home in comfort.' },
  { idx: 6, title: 'Sporting events', icon: 'stadium', description: 'Rugby and football fixtures, dropped at the venue and collected afterwards.' },
  { idx: 7, title: 'Seaport & cruise', icon: 'ship', description: 'Southampton, Dover, Tilbury and Harwich, with help for the luggage at the terminal.' },
  { idx: 8, title: 'Fine dining', icon: 'dining', description: 'Dinner in London or closer to home, with the journey back taken care of.' },
  { idx: 9, title: 'VIP & private aviation', icon: 'road', description: 'Drivers familiar with the VIP and private terminals, including the Windsor Suite, Harrods Aviation, TAG Aviation and Signature.' },
  { idx: 10, title: 'Media & production', icon: 'music', description: 'Talent, crew and guests moved between locations, studios and events on a production schedule.' },
  { idx: 11, title: 'Speakers & keynotes', icon: 'care', description: 'Speaker-bureau clients collected, briefed and delivered on time to conferences and events.' },
  { idx: 12, title: 'West End shopping', icon: 'bag', description: 'A day in the West End without the parking: dropped off and collected when you are ready.' },
]

export type ServiceGroup = { key: 'travel' | 'evenings' | 'occasions'; title: string; plate: PlateName; items: number[] }

// Group keys are published (services.group.<key>); titles may change.
export const SERVICE_GROUPS: ServiceGroup[] = [
  { key: 'travel', title: 'Airports & travel', plate: 'airport', items: [0, 9, 7] },
  { key: 'evenings', title: 'Business & London', plate: 'london', items: [1, 11, 10, 4, 8, 12] },
  { key: 'occasions', title: 'Occasions & events', plate: 'village', items: [3, 2, 5, 6] },
]

export type Vehicle = {
  /** CMS key source. NEVER rename: slug(name) is the CMS key. */
  name: string
  display: string
  tab: string
  seats: number
  cases: number
  passengersLabel: string
  bagsLabel: string
  description: string
  /** Body type, as the model is sold: the useful distinction at a glance. */
  kind: string
  image: string
  /** Intrinsic size of `image`. */
  imageSize: [number, number]
  /** true: generated 4K studio photograph on the shared greige stage;
   *  false: the older 600×320 model render on white. */
  studio: boolean
  alt: string
}

// As published on the official site: E-Class 4/3, S-Class 4/3, V-Class 7/7,
// Tourneo Custom executive 8/8. Pictures show each MODEL, not Simon's own
// cars (exact year, colour and trim unknown). E-Class, S-Class and Tourneo:
// generated 4K studio images, each made from that model's official picture
// (OpenArt Nano Banana 2, 18 Oct 2026). V-Class: still the official render
// (its studio job was not submitted).
// Every image is replaceable in anyOS (fleet.<slug>.image).
export const VEHICLES: Vehicle[] = [
  { name: 'Mercedes E Class', display: 'Mercedes-Benz E-Class', tab: 'E-Class', kind: 'Executive saloon', seats: 4, cases: 3, passengersLabel: '4 Passengers', bagsLabel: '3 Bags', image: '/media/fleet/eclass-1600.webp', imageSize: [1600, 1073], studio: true, alt: 'Mercedes-Benz E-Class saloon', description: 'The executive saloon for airport runs and business travel.' },
  { name: 'Mercedes S Class', display: 'Mercedes-Benz S-Class', tab: 'S-Class', kind: 'Flagship saloon', seats: 4, cases: 3, passengersLabel: '4 Passengers', bagsLabel: '3 Bags', image: '/media/fleet/sclass-1600.webp', imageSize: [1600, 1073], studio: true, alt: 'Mercedes-Benz S-Class saloon', description: 'Mercedes’ flagship saloon for occasions and VIP travel.' },
  { name: 'Mercedes V Class', display: 'Mercedes-Benz V-Class', tab: 'V-Class', kind: 'People carrier', seats: 7, cases: 7, passengersLabel: '7 Passengers', bagsLabel: '7 Bags', image: '/car-vclass.jpg', imageSize: [600, 320], studio: false, alt: 'Mercedes-Benz V-Class people carrier', description: 'Room for families and small groups, and their luggage.' },
  { name: 'Tourneo Custom Executive Spec', display: 'Tourneo Custom Executive', tab: 'Tourneo', kind: 'Executive minibus', seats: 8, cases: 8, passengersLabel: '8 Passengers', bagsLabel: '8 Bags', image: '/media/fleet/tourneo-1600.webp', imageSize: [1600, 1073], studio: true, alt: 'Ford Tourneo Custom executive minibus', description: 'Executive-specification minibus for larger parties and events.' },
]

export const MAX_PASSENGERS = Math.max(...VEHICLES.map(v => v.seats))

export type Airport = { code: string; name: string; short: string }

export const AIRPORTS: Airport[] = [
  { code: 'LHR', name: 'Heathrow', short: 'Heathrow' },
  { code: 'STN', name: 'Stansted', short: 'Stansted' },
  { code: 'LGW', name: 'Gatwick', short: 'Gatwick' },
  { code: 'LCY', name: 'London City', short: 'London City' },
  { code: 'LTN', name: 'Luton', short: 'Luton' },
  { code: 'SEN', name: 'Southend', short: 'Southend' },
]

export const AREAS = ['Theydon Bois', 'Loughton', 'Epping', 'Abridge', 'Ongar', 'Buckhurst Hill', 'Chigwell', 'Woodford Green'] as const

/** Airport service notes, paraphrasing T&L's own airport page. */
export const AIRPORT_NOTES = [
  { title: 'Your flight, monitored', text: 'Share your flight number and your driver knows your actual arrival time.' },
  { title: 'Met in arrivals', text: 'A full meet-and-greet in the arrivals hall.' },
  { title: 'Ten minutes early', text: 'For departures, at your door ten minutes before the agreed time.' },
  { title: 'To the check-in desk', text: 'A chaperone to check-in when you need one; mention it when you book.' },
] as const

export const TAGLINE = 'Taking you on your journey' // T&L's own strapline

export type Testimonial = { quote: string; name: string; role: string }

// Published on T&L's own website.
export const TESTIMONIALS: Testimonial[] = [
  {
    quote: 'As a busy international speaker, my reputation is dependent upon reliable logistics. I have used Simon’s services for a number of years, and have been absolutely delighted on every occasion. Simon is extremely professional, 100% reliable, and balances all this with a friendly and personable manner.',
    name: 'Jamil Qureshi',
    role: 'International Speaker',
  },
  {
    quote: 'We have been using T&L Executive Cars both for family trips to London and airport transfers, for some years. Their service has always been friendly and reliable. It does take some of the pressure off any journey when you know that the car you have organised will arrive in plenty of time.',
    name: 'Ken Spry',
    role: 'Client',
  },
  {
    quote: 'I have been a client of Simon Burns and T&L Executive Cars for many years, initially for my personal executive car needs but then after experiencing their extraordinarily professional service, I began using them for my business requirements as well.',
    name: 'Peter Joarder',
    role: 'Chapman Freeborn',
  },
]

export const testimonialKey = (name: string) => name.toLowerCase().replaceAll(' ', '-')

export const CLIENTS = [
  'London Speaker Bureau', 'Speakers Corner', 'Jamil Qureshi', 'The Jockey Club', 'EndemolShine Group',
  'Chapman Freeborn', 'JLA', 'GB Helicopters', 'Fresh Partners', 'Precision',
]

export const NAV = [
  { href: '/#fleet', label: 'Fleet' },
  { href: '/#services', label: 'Services' },
  { href: '/#airports', label: 'Airports' },
  { href: '/#about', label: 'About' },
  { href: '/#contact', label: 'Contact' },
] as const

// ---- Photography (see /credits and ASSET-LOG.md) ---------------------------
export type PlateName = 'day' | 'night' | 'airport' | 'london' | 'village' | 'forest'

export const PLATES: Record<PlateName, { alt: string; widths: number[]; portrait: number[]; credit: { title: string; author: string; license: string; source: string } }> = {
  day: { alt: 'Epping Road through Epping Forest by day', widths: [960, 1600, 2400], portrait: [720, 1080], credit: { title: 'Epping Road in Epping Forest', author: 'Marathon', license: 'CC BY-SA 2.0', source: 'https://commons.wikimedia.org/wiki/File:Epping_Road_in_Epping_Forest_-_geograph.org.uk_-_5574243.jpg' } },
  night: { alt: 'Light trails on the M25 at night', widths: [960, 1600, 2400], portrait: [720, 1080], credit: { title: 'M25 at Night – Looking West', author: 'Christine Matthews', license: 'CC BY-SA 2.0', source: 'https://commons.wikimedia.org/wiki/File:M25_at_Night_-_Looking_West_-_geograph.org.uk_-_5612086.jpg' } },
  airport: { alt: 'London Heathrow Terminal 5', widths: [960, 1600, 2400], portrait: [720, 1080], credit: { title: 'London Heathrow Terminal 5', author: 'James Emmans', license: 'CC BY-SA 2.0', source: 'https://commons.wikimedia.org/wiki/File:London_Heathrow_Terminal_5_-_geograph.org.uk_-_5327180.jpg' } },
  london: { alt: 'Evening light trails across Tower Bridge', widths: [960, 1600, 2400], portrait: [720, 1080], credit: { title: 'Tower Bridge Light Trails', author: 'Barney Moss', license: 'CC BY 2.0', source: 'https://commons.wikimedia.org/wiki/File:Tower_Bridge_Light_Trails.jpg' } },
  village: { alt: 'Theydon Bois village green', widths: [960, 1600, 2400], portrait: [720, 1080], credit: { title: 'Theydon Bois village green', author: 'Peter S', license: 'CC BY-SA 2.0', source: 'https://commons.wikimedia.org/wiki/File:Theydon_Bois_village_green_-_geograph.org.uk_-_7214628.jpg' } },
  forest: { alt: 'Lodge Road in Epping Forest', widths: [960, 1600, 2400], portrait: [720, 1080], credit: { title: 'Lodge Road in Epping Forest', author: 'Chris Heaton', license: 'CC BY-SA 2.0', source: 'https://commons.wikimedia.org/wiki/File:Lodge_Road_in_Epping_Forest_-_geograph.org.uk_-_5531763.jpg' } },
}

export const plateSrcSet = (name: PlateName) => PLATES[name].widths.map(w => `/media/${name}-${w}.webp ${w}w`).join(', ')
export const platePortraitSrcSet = (name: PlateName) => PLATES[name].portrait.map(w => `/media/${name}-p${w}.webp ${w}w`).join(', ')
