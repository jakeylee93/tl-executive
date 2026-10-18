# Asset log

## 18 Oct 2026: generated fleet and journey imagery (OpenArt)

The full ledger (jobs, assets, sizes, credits and the rejected VIDEO-008) is in `JOURNEY-STORYBOARD.md`. Root keeps the canonical 4K masters in `Mission-Control/tl-executive-rethink-20261018/assets/`; this repo never commits them (`.gitignore`, `.vercelignore`).

| Web file | Built by | From |
|---|---|---|
| `public/media/fleet/{sclass,eclass,tourneo}-1600.webp` | `scripts/build-fleet-media.py` (resize only, one width, because anyOS replaces `src` and a srcset would override that) | PILOT-001, FLEET-002, FLEET-004 masters (SHA in root's receipts) |
| `public/media/journey/k-*` | `scripts/build-hero-keyframes.py` (reads root's zip and checks hashes) | HERO-005/006/007 masters |

The 12 Oct provisional W223 exterior and Commons cabin (`journey/exterior-*`, `journey/cabin-*`) were removed when the same-car keyframes arrived. The Epping Road `day-*` and M25 `night-*` plates are no longer shown; their files remain for history.


## Brand: badge reconstruction (12 Oct 2026)

| Item | Detail |
|---|---|
| Source | `public/logo.jpg`: T&L's existing raster badge, 1029×993. Kept unchanged. |
| Method | Geometry and lettering are rebuilt separately (below). |
| Output | `lib/badgePaths.ts` (paths), `components/Badge.tsx` (inline, live lighting), `public/brand/tl-badge.svg` (static, built by `scripts/build-badge-svg.py`) |
| Verification | Rendered with `rsvg-convert` at the original's size and compared pixel for pixel. Glyph mask IoU is **0.959** for THEYDON/LOUGHTON and **0.954** for EXECUTIVE CARS. Mean grey error is 15/255, mostly the original's raster drop-shadow halo, which the site renders with CSS instead. A 50% overlay shows no ghosting. |
| Cost | £0, no AI generation |

How each part was rebuilt:
- **Rim and disc:** circles fitted with a Hough transform (centre 519, 483.5; rim radius 463; disc radius 436).
- **Ribbon:** a curved band whose top and bottom edges were measured every 30px.
- **Lettering:** traced from the original with potrace at 4× upsampling. 15 light glyphs and 13 engraved glyphs; **no substitute font**.
- **Gradients:** rim shading fitted to samples taken around the original's circumference.

Superseded but kept: `public/brand/tl-badge-{96,192,512}.{png,webp}` (September circle-masked raster).

## Photographs (Wikimedia Commons, fetched 12 Oct 2026)

Every photograph has been cropped on its subject or vanishing point, colour-graded (saturation 0.82–0.95, contrast +3–5%) and resized to WebP: 960/1600/2400 landscape and 720/1080 portrait (9:16). Adapted versions are shared under the original licence. Credits appear on `/credits`.

| File prefix | Original | Author | Licence | Use |
|---|---|---|---|---|
| `public/media/day-*` | [Epping Road in Epping Forest](https://commons.wikimedia.org/wiki/File:Epping_Road_in_Epping_Forest_-_geograph.org.uk_-_5574243.jpg) (4000×3000) | Marathon | CC BY-SA 2.0 | Hero, start scene |
| `public/media/night-*` | [M25 at Night – Looking West](https://commons.wikimedia.org/wiki/File:M25_at_Night_-_Looking_West_-_geograph.org.uk_-_5612086.jpg) (6720×4480) | Christine Matthews | CC BY-SA 2.0 | Hero, end scene |
| `public/media/airport-*` | [London Heathrow Terminal 5](https://commons.wikimedia.org/wiki/File:London_Heathrow_Terminal_5_-_geograph.org.uk_-_5327180.jpg) (4608×3456) | James Emmans | CC BY-SA 2.0 | Services: airports; airport page |
| `public/media/london-*` | [Tower Bridge Light Trails](https://commons.wikimedia.org/wiki/File:Tower_Bridge_Light_Trails.jpg) (5148×3076) | Barney Moss | CC BY 2.0 | Services: business & London |
| `public/media/village-*` | [Theydon Bois village green](https://commons.wikimedia.org/wiki/File:Theydon_Bois_village_green_-_geograph.org.uk_-_7214628.jpg) (4608×3456) | Peter S | CC BY-SA 2.0 | Services: occasions |
| `public/media/forest-*` | [Lodge Road in Epping Forest](https://commons.wikimedia.org/wiki/File:Lodge_Road_in_Epping_Forest_-_geograph.org.uk_-_5531763.jpg) (5184×3456) | Chris Heaton | CC BY-SA 2.0 | Story band (`about.image`, replaceable in anyOS) |

Notes:
- Unsplash was not usable: its API sits behind a bot challenge.
- The official T&L gallery photos were not reachable by script (HTTP 500 to programmatic requests; Jake confirmed the site loads in a normal browser). Its hero photos are described as blurry. Real photographs of Simon's own cars, weddings or airport work remain the most valuable missing asset.

## Vehicles

`public/car-{eclass,sclass,vclass,tourneo}.jpg` (600×320) are manufacturer-style model renders, not photographs of T&L's fleet. They are shown at native size in the fleet selector only, and `/credits` says so. Each can be replaced from anyOS (`fleet.<slug>.image`).

## OpenArt / AI media

**Status, 12 Oct:**
- The OpenArt MCP returns "needs you to sign in again", so account, model list, project, upload and download could not be verified.
- No job was submitted and no credits were spent. Kuruma's allowance is not used for T&L.

**Proposed small media job.** Pending Jake's answer on T&L's optional 800-credit allowance; the price is to be re-verified live after re-authentication. In an OpenArt project named "TL Executive Cars", using Nano Banana Pro 4K (recorded OpenArt UI quote: 80 credits per image):

| # | Job | Reference | Credits |
|---|---|---|---|
| 1 | Hero day plate remaster: clean sky, 4K, same composition | `day` source (CC BY-SA, output stays CC BY-SA) | 80 |
| 2 | Hero night plate remaster, matched framing | `night` source | 80 |
| 3–4 | Native 9:16 phone recompositions of 1 and 2 | Outputs 1–2 | 160 |
| 5–8 | Studio fleet set: consistent camera and light, one per vehicle | **Only from Simon's own vehicle photos** (none yet) | 320 |
| | One retry each for jobs 1–2 | | 160 |
| | **Total ceiling** | | **800** |

Without an allowance, the site stands on the licensed photographs above.

## Earlier assets (September)

`public/og.jpg` (typographic share card) and `app/icon.png`, `apple-icon.png` and `favicon.ico` (from the badge raster) were made locally at no cost.
