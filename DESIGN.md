# T&L Executive Cars — design system (October 2026 rebuild)

**Design read.** Simon's firm: a local, owner-run executive car service in Theydon Bois since 2008. It should feel established, discreet and precise, like a well-kept car rather than a "luxury" template.

**Strongest idea.** The authentic silver-rimmed badge, presented as a physical object that catches the light of the journey.

**What the design avoids:**
- black and gold;
- generic chauffeur stock;
- card collages and decorative rules;
- tooltips, marquees and fake counters;
- visitor-facing production or "preview" copy.

## Page chapters (18 Oct 2026, evening redesign)

Jake rejected the earlier layout as too wordy, and the keyframe zoom as not real motion. There are now five chapters, each built around one picture and one decision, in the pattern of the N2 Acoustics, Kuruma and Rusty Bike sites: short headlines, one line of copy, details revealed in place.

1. **Arrival** (photographic, pinned for about 2.4 screens). One W222 rolls up on a country lane with its lamps coming on. Through the dark glass is the cabin at dusk, with the land moving past. Then the motorway at night, as the car drives away. It ends on "Where are we taking you?" and four journey shortcuts. MOTION.md explains how each part genuinely moves.
2. **Journeys** (photographic). There are three kinds of trip, one photograph each. Each trip is one line until it is picked. Airports sit inside the travel tab.
3. **Fleet** (studio). Simon's four published models stand nose to tail in one light studio, at their true relative size. Choosing a car drives the convoy until that car stops in the light, with every wheel turning. The card shows the body type, seats, cases, one sentence and "Choose this car".
4. **Trust** (charcoal):
   - the badge, Simon's two-sentence guarantee and three facts;
   - the areas covered;
   - one client voice at a time over the editable forest photograph (`about.image`);
   - the client list.
5. **Quote** (white, then mist). The four-step wizard (unchanged), then phone, email and hours, and the FAQs closed until opened.

All 114 published CMS text keys and 5 image keys are still on the homepage (contract test). Copy that isn't on show (other trips, other cars, other quotes, FAQ answers) stays in the DOM behind tabs, toggles and accordions.

## Navigation

- **Bar:** fixed. Transparent with white type over the journey (the large badge is in the journey), then solid white with the compact badge.
- **Always visible:** Request a quote ("Quote" on phones) and Call.
- **Phone drawer:** opens below the bar. Large display-type links, then Request a quote and Call, then strapline and hours. Focus moves in and is trapped with the toggle; Escape or the toggle closes it and returns focus; the page behind does not scroll.
- **Links:** Journeys, Fleet, About, Contact. The homepage has no mobile action bar: the header already keeps Quote and Call in view, and a bar would cover the studio and the form. The airport page keeps its bar.

## Quote wizard

Four steps:
1. **Journey:** native radio cards. "Other" (and Seaport & cruise) opens a required "Describe your journey".
2. **Route and time:** for airports, "Which way?" comes first. The direction decides which flight numbers are asked. A return asks for its date and time, plus the flight home.
3. **Car and passengers:** steppers, then car cards. Cars that cannot take the party or luggage are disabled; a chosen car that stops fitting is flagged at once.
4. **Details:** contact fields, a review with Edit links, then Send.

**Behaviour:**
- Typed values survive Back, Forward and car changes.
- Errors: a focused summary with links to the exact field, or to the radio in a group.
- The server re-checks everything, including capacity and the "Other" description.
- Copy keeps the request-versus-booking line: "a request for a quote, not a booking".
- Extra context travels in the platform's bounded notes; the transfer-enquiry payload is unchanged.

## Colour

| Role | Token | Value | Contrast |
|---|---|---|---|
| Page | `--tl-white` | #FFFFFF | — |
| Soft surface (form, airports) | `--tl-mist` | #F3F3F1 | — |
| Text | `--tl-ink` | #17181A | 17.8:1 |
| Body secondary | `--tl-ink-2` | #3A3C40 | 11.1:1 |
| Labels, hints | `--tl-steel` | #63676C | 5.7:1 on white, 5.1:1 on mist |
| Silver (decorative only) | `--tl-silver` | #B8BABD | — |
| Field borders | `--tl-field` | #8B8F94 | 3.25:1 (non-text) |
| Story band | `--tl-charcoal` | #1C1D20 | on-dark text 15.3:1 |
| On dark, muted | `--tl-on-dark-muted` | #B4B7BB | 8.4:1 |
| Focus | `--tl-focus` | #1F5FBF | 3px ring; white on dark or photo |

**Site settings.** anyOS exposes `--tl-charcoal` and `--tl-silver` through its Site settings panel.

## Type

- **Newsreader** (variable, optical size) is used for headlines and quotes. Display sizes use `opsz` 60–72 for tight, refined letterforms.
- **Hanken Grotesk** is used for text and controls.
- Labels are small tracked capitals (0.16em), echoing the badge's inscriptional lettering.
- Both families are self-hosted by `next/font`. The display font's optical axis costs about 280 KB. Keep it: tested against static weights, it is visibly better at display sizes.

The badge lettering is never set in a font. It is the traced original.

## The badge

- `components/Badge.tsx` renders it inline in the hero with live lighting: `--badge-light` rim sweep, `--badge-gloss-*` and `--badge-sheen`.
- `public/brand/tl-badge.svg` is the static version, used in the header, footer and story chapter.
- Provenance and verification are in ASSET-LOG.md. To rebuild the static file after changing paths, run `python3 scripts/build-badge-svg.py`.

## Photography

- Licensed Creative Commons photographs of the real places the business serves. They are cropped on each road's vanishing point, lightly graded (muted greens) and exported as responsive WebP: 960/1600/2400 landscape and 720/1080 portrait.
- Credits are on `/credits`; provenance is in ASSET-LOG.md.
- **Vehicles:** generated 4K studio images of each model (E-Class, S-Class, Tourneo), each made from that model's official picture. The V-Class keeps its render, shown at its own size on a matching stage. All are captioned as the model, not Simon's car.
- **Rule:** no fabricated people or premises, and no claim that an image shows Simon's own vehicle or trim. Generated lettering is blurred.

## Interaction rules

- **Selectors** (fleet tabs, services tabs, journey type, route builder) change content in place.
  - Tabs follow the ARIA tab pattern with Arrow, Home and End keys.
  - Every anyOS key stays in the DOM.
- **Fixed controls:**
  - The header is transparent over the pinned hero and turns solid white as the hero leaves.
  - On phones and tablets, the action bar (Call / Request a quote) appears only after the hero. It steps aside over the planner, contact and footer, and while typing.
- **Targets** are at least 44×44px; inputs use ≥16px text (no iOS zoom).

## anyOS editing rules

1. Keys are permanent. `tests/fixtures/cms-keys.json` pins all 114 text keys and 5 image keys; `npm test` fails if any disappears.
2. `data-anyos` elements contain text only. They carry `suppressHydrationWarning`, because edit.js may apply saved text before React hydrates.
3. Editable images are real `<img>` elements. Anything layered over them is `pointer-events: none`.
4. Never send `X-Frame-Options` or `frame-ancestors`: the platform previews the site in an iframe.
