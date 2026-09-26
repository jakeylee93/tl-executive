# Asset log

| Asset | Source | Method | Cost | Use |
|---|---|---|---|---|
| `public/brand/tl-badge-{96,192,512}.{png,webp}` | Existing `public/logo.jpg` (T&L badge) | Circle mask and resize (Pillow) | £0 | Header, footer, About slot, structured-data logo |
| `app/icon.png`, `app/favicon.ico`, `app/apple-icon.png` | Same badge | Resize; the Apple icon sits on the paper background | £0 | Browser and home-screen icons |
| `public/og.jpg` (1200×630) | Original typographic layout (site fonts, badge, airport codes) | HTML rendered to JPEG locally | £0 | Open Graph / social preview |
| Maps (`components/Maps.tsx`) | Drawn from public coordinates of places and airports | Hand-built SVG | £0 | Airports section, coverage section |
| `docs/evidence/*.jpg` | Screenshots of the local production build | Headless Chromium | £0 | Review evidence only; not served |

**No AI image generation was used.** The design does not need a hero photograph. The only photographs on the site are the existing four vehicle renders. They are adequate at card size, and fabricating T&L's vehicles, staff or premises is out of scope.

**Untouched originals, kept for review:** `public/logo.jpg`, `public/car-*.jpg` and `public/clients/*.jpg`. The client logo images are no longer displayed, because client names are shown as text.
