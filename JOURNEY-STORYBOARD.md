# Opening journey: storyboard, media and quotes (18 Oct 2026)

**Superseded on 18 Oct (evening) by MOTION.md.** The scrolled keyframe journey described here was rejected by Jake. It has been replaced by real-time animation of cut-out layers made from the same three masters. The ledger below is still correct.

**Status at the time: a keyframe scene journey. The continuous film is NOT finished.**

The site shows three still keyframes of one conceptual car, a black W222 S-Class. Native scroll moves a virtual camera through them (transform and opacity only). The one video clip made so far, VIDEO-008, was **rejected** in root QC and is not used.

## Shots

| Key | Scene | Start / middle / end on the page | Asset |
|---|---|---|---|
| K1 | **Arrival.** The car, complete, on an English country lane at golden hour, sitting right of centre with space for type | Start: the full car with the headline. Middle: the camera moves in toward the windscreen while the light turns to evening (global grade) and a reflection travels along the body. End: through the glass. | HERO-005 |
| K2 | **Cabin.** A matching right-hand-drive W222 cabin at dusk: cream leather, wood, amber ambient light | Start: inside, slightly close. Middle: the camera settles, with "Settle in." End: it draws back and rises. | HERO-006 |
| K3 | **Road.** The same car from above on a UK motorway at blue hour turning to night, with restrained light trails | Start: close. Middle: it draws back, with the airports copy. End: it settles under "Where are we taking you?" and the quote shortcuts. | HERO-007 |

The pinned scroll is about two screens. Scrolling back returns identical frames. Reduced motion, or text too large for the screen, shows the K1 still with its copy and nothing pinned.

## Ledger: all TL OpenArt spend, 18 Oct

Everything is in project `tRnDk9awTx3wZPXHM5vj`, from existing credits only: no top-ups, subscriptions or retries. Every image job is Nano Banana 2 image2image at 4K, with one output.

| Reservation | Job (historyId) | Output asset | Size | Credits |
|---|---|---|---|---|
| PILOT-001 S-Class studio | `ofeFylf6zeOaT4pPxZ74` | `odo1aZpBQ2H11C1PoVEb` | 5056×3392 | 50 |
| FLEET-002 E-Class studio | `U9mA9chz1bZfwfMlG7Zu` | `0y6JbzyLT0SNCHEzRWUs` | 5056×3392 | 50 |
| FLEET-003 V-Class studio | **not submitted**: the auto-mode classifier denied it before submission; root holds it | — | — | 0 |
| FLEET-004 Tourneo studio | `7Vmi8Guz9O1uIeudU5C0` | `Biv3Ah4wAnYZ8ZaX7gfR` | 5056×3392 | 50 |
| HERO-005 opening (16:9) | `OppTcrQ37tpX8tJ1RGC3` | `NYGhrBTI8oNPZt2kmg6D` | 5504×3072 | 50 |
| HERO-006 cabin (16:9) | `PlGgh798LFzPNbkPqCt6` | `ESFHlOOMinoz3vYkbVyT` | 5504×3072 | 50 |
| HERO-007 aerial (16:9) | `lPH9akUPyC0oPean425G` | `lVpvq6zEJ5L66vONaeJm` | 5504×3072 | 50 |
| VIDEO-008 K1 → K2 | `lvRn0ZVrgWrjhCBEnCzV` | `JK1nleigCPJm596X9CPU` | 1928×1072, 5.04 s, 24 fps, 121 frames, H.264, no audio | 175 |
| VIDEO-009 K2 → K3 | **held, not submitted** | — | — | 0 |

**Totals:**
- Stills: 300 credits.
- Video: 175 of the 350 Jake approved; 175 remains held.
- Account balance: 10,114 before, 9,639 after. The debits were checked after each job.

**VIDEO-008:**
- **Settings:** Kling 3.0 image2video, `pro` 1080p, 5 s, `generateSound=false`, no multi-shot.
- **Frames:** start upload `b2kY54uekQchd9euG6IV`, end upload `EKHe7EiAC6M3eToU2oH1`. These are same-pixel JPEG q92 copies of HERO-005 and HERO-006, because Kling refuses images over 10 MB. An earlier attempt with the PNG masters was refused for size before submission, at no charge.
- **Local copy:** `…/scratchpad/video008/clip-008.mp4`, 17,073,287 B, SHA-256 `62a6d7bd4820bdca2457c2f0a12dab5ddc3d210f382b933ea272a9bab6f02b59`.
- **Verdict:** **rejected** (root QC). The camera moves sideways along the car, then the cabin is dissolved over the doors and body, so it never makes a coherent entry through the window. Evidence: root's `VIDEO-008-REJECTED-DISSOLVE.png` in the coordination folder. It is not integrated.

## Web derivatives (from root's canonical masters)

`scripts/build-hero-keyframes.py` builds them. It reads `hero-storyboard-4k.zip` directly and checks every hash against `hero-master-receipt.json`. It writes these files to `public/media/journey/`:

| Files | Sizes | Processing |
|---|---|---|
| `k-opening-*` | 960, 1600, 2400 | Resize only |
| `k-opening-eve-*` | 960, 1600, 2400 | Resize plus a global evening grade of the same frame |
| `k-cabin-*` | 960, 1600, 2400, plus 9:16 phone crops at 720 and 1080 | Resize and crop |
| `k-aerial-*` | Same as the cabin | Resize and crop. The generated rear-plate lettering, boot-badge lettering and one tiny road sign are blurred until unreadable. |

## What a finished film needs (not approved; quote only)

- **What went wrong:** with end-frame interpolation, the model dissolved between two very different camera positions.
- **More reliable:** an in-between keyframe, K1b: the same car, the camera at the windscreen glass, the cabin seen through it. Then two shorter clips, K1 → K1b (a push in) and K1b → K2 (a pass through the glass).
- **Live quotes (MCP, 18 Oct, per clip, silent):**
  - Kling 3.0 `pro` 1080p, 5 s: **175**. `std` 720p, 5 s: **125**.
  - Veo 3.1 1080p, 6 s: **210**; 8 s: **280**.
  - Nano Banana 2 4K 16:9 still: **50**.
- **Example plan:** K1b still (50) + two Kling pro clips (350) + K2 → K3 (175) = **575 credits**. That needs a fresh decision; the remaining 175 does not cover it.
- **Before any web use:** check every frame for body morphs and for generated plate or text. Encode short-GOP (all-intra) H.264/WebM for scroll scrubbing, with posters equal to the keyframes, and keep reduced motion on the stills.
