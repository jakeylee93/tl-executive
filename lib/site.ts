// Business content for the T&L website — the single source for copy defaults,
// contact details and structured data.
//
// Every text default here can be overridden live from anyOS (data-anyos keys);
// the KEYS must never change once published, because saved overrides are
// looked up by key. See AUDIT.md "Retained contracts" before renaming anything.
//
// Verification: facts marked VERIFIED are corroborated by the public Yell
// listing or T&L's own earlier website (see RESEARCH.md). Anything else is the
// owner's existing content, kept deliberately modest and listed in AUDIT.md.

export const BUSINESS = {
  name: 'Theydon & Loughton Executive Cars', // VERIFIED (Yell, own site)
  shortName: 'T&L Executive Cars',
  founded: 2008, // VERIFIED (Yell, own site)
  locality: 'Theydon Bois', // VERIFIED
  region: 'Essex',
  country: 'GB',
  phoneDisplay: '07904 428896', // VERIFIED (Yell)
  phoneHref: 'tel:+447904428896',
  phoneE164: '+447904428896',
  email: 'simonemburns@gmail.com', // own site since 2018 (owned asset)
  hours: 'Open 24 hours', // Yell + Yelp; own site says Mon–Fri 9–6.30 — confirm (HANDOFF.md)
  founder: 'Simon Burns', // own site: author + privacy-policy data controller
  // Own site since 2013; EFDC policy §5.10–5.12 provides the executive exemption.
  licensing: 'Drivers and vehicles licensed by Epping Forest District Council',
  payments: 'Visa, Mastercard, American Express and Apple Pay', // own site since 2020
  siteUrl: 'https://tl-executive.vercel.app',
  // Approximate centre of Theydon Bois village — used only for the map and
  // for areaServed geo; not a street address.
  geo: { lat: 51.6715, lon: 0.0985 },
} as const

/** Stable CMS key fragment for a vehicle, so edits survive a rename. */
export const slug = (name: string) => name.toLowerCase().replaceAll(' ', '-')

export type Service = {
  /** Index = CMS key: services.<idx>.title / services.<idx>.description */
  idx: number
  title: string
  description: string
  icon: IconName
}

export type IconName =
  | 'plane' | 'briefcase' | 'sparkle' | 'rings' | 'theatre' | 'flag' | 'stadium'
  | 'ship' | 'dining' | 'road' | 'music' | 'care' | 'bag'

// Order and indices match the published CMS keys (services.0 … services.11).
// Index 12 is new and additive. Wording sticks to what T&L's own site and
// directory listings already say (RESEARCH.md §1) — no packages, prices or
// guarantees that nobody has confirmed.
export const SERVICES: Service[] = [
  { idx: 0, title: 'Airport transfers', icon: 'plane', description: 'Heathrow, Gatwick, London City, Luton, Stansted and Southend, including private and VIP terminals. Flights are monitored, with meet and greet on arrival.' },
  { idx: 1, title: 'Corporate travel', icon: 'briefcase', description: 'Executives, keynote speakers and production teams: punctual, discreet travel for businesses since 2008.' },
  { idx: 2, title: 'Special occasions', icon: 'sparkle', description: 'Birthdays, anniversaries and red-carpet evenings. Arrive together and leave the driving to us.' },
  { idx: 3, title: 'Weddings', icon: 'rings', description: 'The couple, the family and guest transfers between hotel and venue, planned around your day.' },
  { idx: 4, title: 'Theatre trips', icon: 'theatre', description: 'Door to door for West End shows, with no parking to find and no last train to catch.' },
  { idx: 5, title: 'Race days', icon: 'flag', description: 'Cheltenham, Ascot, Newmarket and other meetings. Enjoy the racing and let someone else drive home.' },
  { idx: 6, title: 'Sporting events', icon: 'stadium', description: 'Rugby, football and the big fixtures: dropped at the venue and collected afterwards.' },
  { idx: 7, title: 'Cruise terminals', icon: 'ship', description: 'Southampton, Dover, Tilbury, Harwich and other ports, with room for holiday luggage.' },
  { idx: 8, title: 'Restaurant evenings', icon: 'dining', description: 'Fine dining in London or closer to home, with the journey back taken care of.' },
  { idx: 9, title: 'Long distance', icon: 'road', description: 'Longer journeys beyond London and the M25. Tell us where and we’ll quote.' },
  { idx: 10, title: 'Concerts & gigs', icon: 'music', description: 'Gigs and concerts in London without the car-park queue or the night bus home.' },
  { idx: 11, title: 'Hospital visits', icon: 'care', description: 'Calm, punctual transport to and from appointments and visits.' },
  { idx: 12, title: 'West End shopping', icon: 'bag', description: 'A day in the West End without the parking: dropped off and collected when you’re ready.' },
]

export const SERVICE_GROUPS: { title: string; key: string; items: number[] }[] = [
  { key: 'travel', title: 'Airports & longer journeys', items: [0, 7, 9, 1] },
  { key: 'evenings', title: 'Evenings & events', items: [4, 8, 10, 6, 5] },
  { key: 'occasions', title: 'Occasions & everyday', items: [2, 3, 12, 11] },
]

export type Vehicle = {
  /** Display + CMS key source. NEVER rename: slug(name) is the CMS key. */
  name: string
  seats: number
  cases: number
  passengersLabel: string
  bagsLabel: string
  description: string
  image: string
  alt: string
}

// Names are the published CMS keys (fleet.<slug>.*). Capacities are the
// owner's existing figures (see AUDIT.md) and editable from anyOS.
export const VEHICLES: Vehicle[] = [
  { name: 'Mercedes E Class', seats: 4, cases: 3, passengersLabel: '4 Passengers', bagsLabel: '3 Bags', image: '/car-eclass.jpg', alt: 'Black Mercedes E-Class saloon, front three-quarter view', description: 'Executive saloon, well suited to airport runs and business travel.' },
  { name: 'Mercedes S Class', seats: 4, cases: 3, passengersLabel: '4 Passengers', bagsLabel: '3 Bags', image: '/car-sclass.jpg', alt: 'Dark grey Mercedes S-Class saloon, front three-quarter view', description: 'Mercedes’ flagship saloon, for occasions and VIP travel.' },
  { name: 'Mercedes V Class', seats: 7, cases: 7, passengersLabel: '7 Passengers', bagsLabel: '7 Bags', image: '/car-vclass.jpg', alt: 'Black Mercedes V-Class people carrier, front three-quarter view', description: 'Spacious people carrier for families and small groups.' },
  { name: 'Tourneo Custom Executive Spec', seats: 8, cases: 8, passengersLabel: '8 Passengers', bagsLabel: '8 Bags', image: '/car-tourneo.jpg', alt: 'Black Ford Tourneo Custom minibus, front three-quarter view', description: 'Executive-spec minibus for larger groups and events.' },
]

export const MAX_PASSENGERS = Math.max(...VEHICLES.map(v => v.seats))

/** Airport service notes — each paraphrases T&L's own airport page
 *  (tlexecutivecars.co.uk/airport-seaport-transfers, stated since 2014). */
export const AIRPORT_NOTES = [
  { title: 'Your flight, monitored', text: 'Share your flight number and your driver knows your actual arrival time.' },
  { title: 'Met in arrivals', text: 'Welcomed in the arrivals hall with a full meet-and-greet service.' },
  { title: 'Ten minutes early', text: 'For departures, we arrive at your door ten minutes before the agreed time.' },
  { title: 'To the check-in desk', text: 'A chaperone to check-in when you need one. Just mention it when you book.' },
] as const

export const VIP_TERMINALS = 'Drivers are familiar with the VIP and private-aviation terminals, including the Windsor Suite, Harrods Aviation, TAG Aviation and Signature.'

export const TAGLINE = 'Taking you on your journey' // T&L's own strapline

export type Airport = { code: string; name: string; short: string; lat: number; lon: number }

export const AIRPORTS: Airport[] = [
  { code: 'STN', name: 'London Stansted', short: 'Stansted', lat: 51.886, lon: 0.2389 },
  { code: 'LCY', name: 'London City', short: 'London City', lat: 51.5048, lon: 0.0495 },
  { code: 'LHR', name: 'London Heathrow', short: 'Heathrow', lat: 51.47, lon: -0.4543 },
  { code: 'LGW', name: 'London Gatwick', short: 'Gatwick', lat: 51.1537, lon: -0.1821 },
  { code: 'LTN', name: 'London Luton', short: 'Luton', lat: 51.8747, lon: -0.3683 },
  { code: 'SEN', name: 'London Southend', short: 'Southend', lat: 51.5714, lon: 0.6956 },
]

export const AREAS: { name: string; lat: number; lon: number }[] = [
  { name: 'Theydon Bois', lat: 51.6715, lon: 0.0985 },
  { name: 'Loughton', lat: 51.6494, lon: 0.0735 },
  { name: 'Epping', lat: 51.6995, lon: 0.1107 },
  { name: 'Abridge', lat: 51.6474, lon: 0.1197 },
  { name: 'Ongar', lat: 51.704, lon: 0.244 },
  { name: 'Buckhurst Hill', lat: 51.6243, lon: 0.045 },
  { name: 'Chigwell', lat: 51.6225, lon: 0.0723 },
  { name: 'Woodford Green', lat: 51.609, lon: 0.024 },
]

export type Testimonial = { quote: string; name: string; role: string }

// Published on T&L's own website since at least August 2020 (owned asset,
// RESEARCH.md §1). Peter Joarder's Chapman Freeborn role is on Companies House.
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

export const CLIENTS: { name: string; src: string }[] = [
  { name: 'London Speaker Bureau', src: '/clients/londonspeakerbureau.jpg' },
  { name: 'Speakers Corner', src: '/clients/speakerscorner.jpg' },
  { name: 'Jamil Qureshi', src: '/clients/jamilqureshi.jpg' },
  { name: 'The Jockey Club', src: '/clients/jockeyclub.jpg' },
  { name: 'EndemolShine Group', src: '/clients/endemolshine.jpg' },
  { name: 'Chapman Freeborn', src: '/clients/chapmanfreeborn.jpg' },
  { name: 'JLA', src: '/clients/jla.jpg' },
  { name: 'GB Helicopters', src: '/clients/gbhelicopters.jpg' },
  { name: 'Fresh Partners', src: '/clients/freshpartners.jpg' },
  { name: 'Precision', src: '/clients/precision.jpg' },
]

/** Social-proof switches. Both are owned-asset content (own site since 2020);
 *  turn off here if the owner withdraws permission for any of them. */
export const SHOW_TESTIMONIALS = true
export const SHOW_CLIENTS = true

export const NAV = [
  { href: '/#services', label: 'Services' },
  { href: '/#airports', label: 'Airports' },
  { href: '/#fleet', label: 'Fleet' },
  { href: '/#about', label: 'About' },
] as const
