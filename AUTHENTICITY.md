# Project rule: authenticity (Jake, 13 Oct 2026)

Applies to every existing and new asset on this site.

- **Logo:** use the official logo, either as source pixels or as a faithful trace. Never substitute a font, redraw lettering or change shapes, colours or heraldry.
- **Venues:** never invent signage or fixtures, or alter a real building or interior.
- **Audits:** audit each asset at full size against its ORIGINAL, including day and night states. Reject any drift and replace it with original pixels; a convincing result is not proof of fidelity.
- **Logo as a feature:** feature the genuine logo with believable materials and lighting, without changing its geometry. Interface fonts are separate from brand lettering.
- **Imagery:** use real references at their best resolution. Crop, correct perspective, clean and relight carefully, but never invent unseen subjects. Do not invent Simon's vehicles; anything missing stays pending.
- **AI edits:** OpenArt edits only within an evidenced allowance. Record the model, source, job IDs, outputs, credits, and any failures or retries. The 800-credit figure (12 Oct) was only a quote. Since 18 Oct, Jake's allowance is existing credits at up to 70 per photo, plus two 1080p clips up to 350 credits (see the 18 Oct audit).
- **Scope:** no DNS, payment or production changes. Never claim an unconfigured form sends mail.

## Audit, 13 Oct 2026

| Asset | Original | Result |
|---|---|---|
| `public/brand/tl-badge.svg`, `lib/badgePaths.ts` | `public/logo.jpg` | Faithful trace. Glyph IoU 0.959 and 0.954; geometry fitted to the original; no font. **Pass.** |
| `public/media/day-*` | Epping Road, Commons original | Crop, resize and global saturation/contrast only. No AI; no pixels invented. **Pass.** |
| `public/media/night-*` | M25 at Night, Commons original | Same processing; a separate real photograph, not a relit day image. **Pass.** |
| `airport-*`, `london-*`, `village-*`, `forest-*` | Commons originals | Same processing. **Pass.** |
| `public/car-*.jpg` | Existing manufacturer model renders | Not Simon's cars, and labelled as models on `/credits`. **Pending real photos.** |
| Generated (AI) assets | none | Nothing to audit. |

The hero's dusk tint is a CSS light overlay on the real photograph; no pixels are altered.

## Audit, 18 Oct 2026

**Allowance (Jake):** existing OpenArt credits at up to 70 per photo for this website, plus two 1080p clips up to 350 credits in total. **Spent:** 300 on stills and 175 on video. Full ledger in `JOURNEY-STORYBOARD.md`.

| Asset | Source / reference | Result |
|---|---|---|
| `public/media/fleet/{sclass,eclass,tourneo}-1600.webp` | Generated 4K studio images (OpenArt Nano Banana 2), each made from that model's own official picture (`public/car-*.jpg`) | Shape checked against each reference: body, grille, emblem, lamps and wheels match, and plates are blank. Root accepted them. They show the **model**, not Simon's car; `/credits` and the fleet note say so. **Pass, as model imagery.** |
| `public/car-vclass.jpg` | Official model render | Its studio job was never submitted, so the render stays as the disclosed fallback. **Pending.** |
| `public/media/journey/k-*` | HERO-005/006/007: generated images of one conceptual W222 S-Class, made from the official S-Class picture | Root inspected the full-size masters. The aerial's generated plate and badge lettering are blurred. Captioned on `/credits` as generated, not our car. **Pass, as concept keyframes.** |
| VIDEO-008 (K1 → K2 clip) | Kling 3.0 from HERO-005 and HERO-006 | **Rejected:** the cabin dissolves over the body, with no coherent window entry. Not used. |
| Retired from the site | W223 exterior (Jason Lawrence), W222 Commons cabin, Epping Road and M25 photos | Replaced by the same-car keyframes; removed or no longer credited. |

The badge is unchanged: the traced original, never generated.


## Audit, 18 Oct 2026 (evening redesign)

- **Vehicles:** the four models and their seats and cases are exactly as on tlexecutivecars.co.uk. Generations, identified from Simon's published renders:
  - S-Class: W222 facelift LWB;
  - E-Class: W213 pre-facelift;
  - V-Class: W447 pre-facelift;
  - Tourneo Custom: Gen 1 facelift.

  No photograph of his own cars was found. The visitor note "Pictures show each model. Your car may differ in year, colour and specification." stays.
- **The opening scenes:** one generated W222 (the same model as his S-Class), cut into moving layers. They're disclosed on /credits and not presented as his car. Only this model has a matching cabin.
- **Fleet studio:** the cars are shown together at true relative size (by wheelbase). The V-Class is the published render, and visibly softer.
- **No new claims:** no fares, no 24-hour claim, and testimonials and clients as published.
