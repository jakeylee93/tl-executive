# Project rule: authenticity (Jake, 13 Oct 2026)

Applies to every existing and new asset on this site.

- **Logo:** use the official logo, either as source pixels or as a faithful trace. Never substitute a font, redraw lettering or change shapes, colours or heraldry.
- **Venues:** never invent signage or fixtures, or alter a real building or interior.
- **Audits:** audit each asset at full size against its ORIGINAL, including day and night states. Reject any drift and replace it with original pixels; a convincing result is not proof of fidelity.
- **Logo as a feature:** feature the genuine logo with believable materials and lighting, without changing its geometry. Interface fonts are separate from brand lettering.
- **Imagery:** use real references at their best resolution. Crop, correct perspective, clean and relight carefully, but never invent unseen subjects. Do not invent Simon's vehicles; anything missing stays pending.
- **AI edits:** OpenArt Nano Banana Pro edits only within an evidenced allowance. Record the model, source, job IDs, outputs, credits, and any failures or retries. T&L currently has **no** allowance: the 800-credit figure was only a quote.
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
