# T&L Executive Cars — design system (October 2026 rebuild)

**Design read.** Simon's firm: a local, owner-run executive car service in Theydon Bois since 2008. It should feel established, discreet and precise, like a well-kept car rather than a "luxury" template.

**Strongest idea.** The authentic silver-rimmed badge, presented as a physical object that catches the light of the journey.

**What the design avoids:**
- black and gold;
- generic chauffeur stock;
- card collages and decorative rules;
- tooltips, marquees and fake counters;
- visitor-facing production or "preview" copy.

## Page chapters

Photographic chapters alternate with white ones.

1. **Opening scene** (photographic, scroll storyboard). Full-width hero with the badge, the headline, **Request a quote** and **Call**.
2. **Plan your journey** (white). The enquiry form itself, directly under the hero.
   - Journey type: Airport, Business, Occasion, Other.
   - Pick-up and destination, with swap.
   - Date, time, passenger and luggage steppers.
   - Return trip and flight details appear when relevant.
   - Preferred car, notes, then contact details.
3. **The fleet** (white). A centred selector with four tabs.
   - The chosen vehicle, its capacity and description change in place.
   - "Choose this car" prefills the planner.
4. **Services** (photographic). Three category tabs change the photograph and the list in place: Airports & travel (Heathrow T5), Business & London (Tower Bridge light trails), Occasions & events (Theydon Bois green).
5. **Airports** (mist). Airport service notes, plus a route builder: choose a collection area and an airport, then "Plan this journey" prefills the planner.
6. **Story & trust** (charcoal).
   - The badge large beside Simon's own words.
   - A full-width Epping Forest photograph carrying the lead testimonial. It is the editable `about.image` slot, so Simon can swap in his own photo.
   - The other testimonials and client names follow.
7. **Contact** (white). Large phone number, email, published hours, area, and the FAQ.

## Hero storyboard

Two different scenes of one journey, not the same road relit. Motion is driven purely by native scroll, so there is no Pause control (and no autonomous loop to justify one).

| | Start (p = 0) | Middle (p ≈ 0.5) | End (p = 1) |
|---|---|---|---|
| Scene | Epping Road through Epping Forest, daylight | Camera moves down the road; warm dusk light rises at the horizon | The M25 at night, light trails |
| Badge | Turned −11°, tilted 4°, light from the upper left (sun, −60°) | Facing forward, light overhead | Turned +11°, slightly smaller and higher, light from the upper right (street lamp, +55°), warmer sheen |
| Caption | "Epping Forest · Theydon Bois" | Hand-over (never both visible) | "The M25 · towards London & the airports" |

**How it works:**
- The pin lasts about 75% of the viewport height (609–699px measured at 375–1440 wide). The sticky stage is 100svh inside a 175svh track.
- Everything is transform or opacity. Each value is a pure function of scroll position, so reverse scrolling returns identical frames (verified).
- **Reduced motion:** a static daylight frame, no pin.
- **Text zoom:** if the hero content becomes taller than the viewport, the pin switches off so nothing is clipped (verified at 200%).

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
- **Vehicles:** the four existing model renders, shown at native size in the fleet selector on a neutral stage. Never stretched as a hero.
- **Rule:** no fabricated vehicles, people or premises.

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
