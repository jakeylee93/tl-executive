# T&L Executive Cars — design system

**Design read.** Local households, PAs and bureaux booking a dependable driver from Theydon Bois. It should feel discreet, established, calm and precise, with a person behind it. The strongest idea is **the route line**: a ring for where you start, a brass diamond for where you're going, and a quiet line between them. It runs through the section labels, the journey form, the maps and the booking steps.

**What it deliberately avoids:**
- black and gold;
- Cinzel or Cormorant pastiche;
- numbered "No. 01" editorial labels (a competitor's trade dress);
- marquees, fake counters, stock "luxury" imagery, and badges nobody can verify.

## Colour

Tokens live as CSS variables in `app/globals.css` and are mapped into Tailwind (`tailwind.config.ts`). Two of them, `--tl-forest` and `--tl-brass`, are exposed to the anyOS Site settings panel.

| Role | Token | Hex | Contrast |
|---|---|---|---|
| Page background ("paper") | `--tl-paper` | #F6F4EE | — |
| Cards, form | `--tl-surface` | #FFFFFF | — |
| Alternate band | `--tl-stone` | #ECE8DF | — |
| Text, primary buttons | `--tl-ink` | #18211C (forest-black) | 15.0:1 on paper |
| Body copy | `--tl-ink-2` | #3F4943 | 8.5:1 |
| Secondary text | `--tl-muted` | #58625C | 5.8:1 on paper, 5.2:1 on stone |
| Hairlines (decorative only) | `--tl-line` | #D8D3C7 | — |
| Form borders (non-text UI) | `--tl-line-strong` | #7D857F | 3.8:1 on white |
| Quote band, reviews band | `--tl-forest` | #1F2B25 | on-forest text 12.9:1 |
| Accent: labels, route nodes, icons | `--tl-brass` | #7A5B28 | ≥ 5:1 on paper and stone |
| Accent on dark | `--tl-brass-light` | #D1B07A | 7.1:1 on forest |
| Focus ring | `--tl-focus` | #1F5FBF | 3 px outline; brass-light on dark bands |
| Error / success | `--tl-error` / `--tl-success` | #A8321F / #2D6A45 | ≥ 6.4:1 on white |

**Rules:**
- Brass is an accent for labels, nodes and icons. It is never used for body text or buttons.
- Primary action is ink on paper, or paper on forest.
- There is exactly one dark band per page region: the reviews band and the quote band. The footer is darker still.

## Type

Both families are self-hosted by `next/font`, so there is no request to Google.

**Display: Newsreader** (variable, optical size axis `opsz` 36–72).
- Calm, editorial and legible.
- The optical size keeps large headings tight and refined.
- Italic is reserved for the hero's second clause, the founder's sign-off and map annotations.

**Text and UI: Hanken Grotesk** (variable).
- Clear, slightly condensed and friendly.
- Tabular figures for phone numbers, times and airport codes.

| Role | Class | Size | Notes |
|---|---|---|---|
| Hero | `.t-display` | clamp(2.5rem → 4.9rem) | lh 1.02, −0.022em, `text-wrap: balance` |
| Section heading | `.t-h2` | clamp(2rem → 3.2rem) | lh 1.08 |
| Card / step heading | `.t-h3` | clamp(1.3rem → 1.55rem) | Newsreader 500 |
| Lead | `.t-lead` | clamp(1.0625rem → 1.25rem) | lh 1.6 |
| Body | body | 1.0625rem (17 px) | lh 1.6. Inputs are ≥ 16 px (no iOS zoom) |
| Label / eyebrow | `.eyebrow` | 0.8125rem, 600, caps, +0.12em | Preceded by the route-line glyph |

**Copy style:**
- Sentence case for headings and buttons. This is British usage and deliberately calmer than Title Case.
- Curly quotes and ellipses.
- "We" for the firm. The owner's own first-person words stay intact in About.

## Space and layout

- **Container** `.page-x`: max 76 rem. Gutters 20 px (phone), 32 px (≥ 640), 48 px (≥ 1024).
- **Section rhythm:** 64 px (phone), 80 px (tablet), 112 px (desktop).
- **Grid:** 12 columns on desktop. Headings sit in the left 7–8 columns, reading measure ≤ 44 rem.
- **Radii:** 6 px for controls and buttons, 12 px for cards. Precise, not pill-soft.
- **Breakpoints designed for:**
  - **390:** single column, collapsible service groups, swipeable fleet, form first in the quote band.
  - **768/820:** stacked hero with a full-width journey card, two-column fleet, 44 px targets, action bar.
  - **1024:** full navigation, sticky left column in the quote band.
  - **1440:** 7/5 hero, three service columns, four fleet cards.

## Components

- **Header.** Badge and name, with nav and phone on desktop. On phone and tablet: phone and menu buttons, a disclosure menu that supports Escape, focus management and outside click.
- **Hero.** Eyebrow, H1 in two clauses, lead, two actions (quote and call), three verified facts, and the **journey starter card**.
  - The starter card is a GET form (From, To with airport chips, Date). It hands its values to the quote form and focuses the next unanswered field.
  - Below it sits a static strip listing the six airports.
- **Service groups.** Three columns on desktop. On smaller screens they become accordions (first open). Each service has a circular arrow that prefills the form's occasion.
- **Maps.** Original SVG drawn from real coordinates, not a map tile and not a copy.
  - Regional: Theydon Bois, six airports, the Thames, Epping Forest, a scale bar.
  - Local: the eight pick-up villages.
  - Labels resize on phones. Lines "show direction, not routes".
- **Fleet cards.** Each photo is an editable `<img>`. Capacity chips; a "Request this car" link prefills the form. Photos are captioned as representative.
- **Quote form**, in three numbered fieldsets:
  - **Journey:** trip type, the route pair with swap, date and time, return, flight fields, occasion.
  - **Passengers & car:** steppers, and vehicle radio cards that flag cars too small for the party.
  - **Details.**
  - Validation is shared with the server (`lib/enquiry.ts`). An error summary takes focus; inline errors are wired with `aria-describedby`.
  - **States:** sending, success, **preview (dry-run)**, and failure with call and pre-filled-email fallbacks.
- **Mobile action bar.** Call and Get a quote. It appears after the hero and steps aside at the form, the footer and while typing. Hidden bars are made `inert`.
- **FAQ.** `<details>` rows. The answers restate owned facts only.

## Imagery

- **Brand badge:** existing logo, circle-masked to a transparent PNG/WebP. Used for the favicon and the About slot.
- **Fleet photos:**
  - These are the existing 600×320 model renders, blended onto one neutral background so their backdrops match.
  - Replace them with real photos of T&L's cars through anyOS (click the image in edit mode).
- **No AI-generated vehicles, people or premises.** Maps and the OG card are original vector and typographic work (see ASSET-LOG.md).

## Motion

- **Reveal:** 14 px rise and fade over 0.7 s, staggered by up to 300 ms. It only runs when JS is on and motion is allowed. It is disabled in the anyOS editor, and printing shows everything.
- **Route lines** on the airport map draw once on reveal.
- **Everything else:** colour and transform transitions under 0.3 s.
- `prefers-reduced-motion: reduce` gives instant content and no smooth scrolling.

## anyOS editing rules for future changes

1. Keys are forever. Never rename a published `data-anyos` or `data-anyos-img` key; add new ones.
2. A `data-anyos` element must contain text only. edit.js replaces its `innerHTML`.
3. Mark CMS text elements `suppressHydrationWarning`, because edit.js may apply saved text before React hydrates.
4. Editable images must be real `<img>` elements with nothing layered on top.
5. Run `npm test` after any template change; it checks every published key.
