# Opening film — what it is and where it came from

One continuous shot, played by scroll in the full-screen `#top` section (`components/film/Journey.tsx`, `FilmScene.tsx`).

## What the visitor sees

The camera is locked off. A black Mercedes-Benz S-Class stands on a hilltop road with the London skyline behind it: the Shard, the City and Canary Wharf.

1. **Dusk.** "Executive cars from Theydon Bois", with *Request a quote* and *Call*.
2. **Night falls.** The city windows and the car's headlights come on. One line of copy: "Day or night, door to door."
3. **The car pulls away** and drives out of shot. Focus settles on the lit city, and "Where are we taking you?" appears with four buttons. Each button opens the quote form prefilled.

The video reaches its last frame at 84% of the scroll and holds it for the rest, so the closing words only arrive once the car has gone (on desktop it leaves the wide frame late). Scrolling back plays the shot in reverse. On phones (portrait, `max-aspect-ratio: 4/5`), a 9:16 crop of the same 4K master is used. It is framed on the car's front (the TLE plate, the headlights, Canary Wharf) and eases left onto the Shard as the car leaves. With reduced motion, or in the anyOS editor, the dusk poster and all the copy stand still.

## Section 2: inside the car (`#inside`)

The cabin dissolves in over the hero's held London frame. `#inside` starts 170svh up inside the hero's 470svh track (`overlap`), and its stage fades from transparent over the first 27% of its own track (`fadeIn`) while the hero stays pinned beneath. The overlapping layer is click-through until it has faded in, so the hero's quote buttons stay tappable; QA checks this.

- **What it shows:** night, seen from the rear seat. The chauffeur is in the right-hand seat, seen only from behind, making small steering movements while the road and hedges stream past, with London lit ahead.
- **Copy:** "Settle in."
- **Phones:** a static 9:16 crop at 0.57 of the width, showing the Shard and the City through the windscreen, the hand on the wheel and the dash.

| Asset | Model | Job | Credits |
|---|---|---|---|
| Interior at dusk (round 4) | Nano Banana Pro 4K, styled on the hero | `YvG7MQBe19Gnm3oyqS7M` | 80 |
| Interior at night (start frame; the mirror shows no face) | Nano Banana Pro 4K edit | `j5SaT8DLlpVI0tOsLhCB` | 80 |
| Clip: driving towards London | Kling 3.0, 4K, 5 s, start = night interior | `hxdTlwyAHC6rWcQcw3YK` | 600 |

Encodes come from `scripts/film/build_film.py inside --crop 0.57 VI.mp4`:

| File | Size |
|---|---|
| `inside-wide.mp4` | 2560 px, 5.3 MB |
| `inside-tall.mp4` | 1080×1920, 3.4 MB |
| `.webm` twins and `inside-poster-*` | |

## Provenance (generated, not filmed)

All jobs ran in OpenArt project `tRnDk9awTx3wZPXHM5vj` on Jake's account, on 19 Oct 2026.

| Asset | Model | Job | Credits |
|---|---|---|---|
| Car reference (TLE S-Class, golden lane) | GPT Image 2.5 Sunburst, 2K high, from our S-Class studio picture | `Lu1qKeKRX6QZ3Sebz8ab` | 172 |
| Dusk frame (hilltop road, 135 mm, London behind) | Nano Banana Pro 4K, image-to-image from the car reference | `7iBGBqsHMYrMVysXUJtJ` (2nd of 2) | 160 |
| Night frame (same framing, city and headlights on) | Nano Banana Pro 4K edit of the dusk frame | `TdEe73UMS20PfRvRTor9` | 80 |
| Clip A: dusk → night, lights on | Kling 3.0, 4K, 5 s, start = dusk, end = night | `f4WiU9dLTndGMVKiSW7b` | 600 |
| Clip B: the car pulls away | Kling 3.0, 4K, 5 s, start = night | `ngcOJVK3vY91tazWB1Wn` | 600 |

- **Masters:** 3852×2152, 24 fps, 121 frames each. B's first frame repeats A's last (measured difference 2.2/255, shift under 0.1 px), so it is dropped and the two play as one shot.
- **Plate and car:** the "TLE" plate is illustrative, as Jake asked. The car is a representative W222 S-Class, not Simon's own. The credits page says so.
- **Driver:** the driver's face is softly visible through the windscreen for about one second as the car passes.

## Web encodes (`scripts/film/build_hero.py`)

| File | Size | Notes |
|---|---|---|
| `hero-wide.mp4` | 2560×1430, 12.6 MB | H.264 CRF 20 |
| `hero-wide.webm` | 4.5 MB | VP9 CRF 33 twin, for browsers without H.264 (and CI Chromium) |
| `hero-tall.mp4` | 1080×1920, 6.6 MB | |
| `hero-tall.webm` | 2.3 MB | |
| `hero-poster-{960,1600,2560}.webp`, `-p{720,1080}.webp` | | First frame |

- **Encoding:** a keyframe every 12 frames, no B-frames, faststart, so scroll-seeking stays responsive in both directions.
- **Masters not in the repo:** they can be fetched again from the OpenArt jobs above, then rebuilt with `python3 scripts/film/build_hero.py A.mp4 B.mp4`.

## History

These replace the Veo 3.1 *fast* shots of 18–19 Oct. Jake judged those low quality, and the fast tier plus my 720 px phone encodes were the cause. The still rounds that led here are in HANDOFF.md, rounds 1–4.
