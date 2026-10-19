# Opening film — what it is and where it came from

One continuous shot, played by scroll in the full-screen `#top` section (`components/film/Journey.tsx`, `FilmScene.tsx`).

## What the visitor sees

The camera is locked off. A black Mercedes-Benz S-Class stands on a hilltop road with the London skyline behind it: the Shard, the City and Canary Wharf.

1. **Dusk.** "Executive cars from Theydon Bois", with *Request a quote* and *Call*.
2. **Night falls.** The city windows and the car's headlights come on. One line of copy: "Day or night, door to door."
3. **The car pulls away** and drives out of shot. Focus settles on the lit city, and "Where are we taking you?" appears with four buttons. Each button opens the quote form prefilled.

The video reaches its last frame at 84% of the scroll and holds it for the rest, so the closing words only arrive once the car has gone (on desktop it leaves the wide frame late). Scrolling back plays the shot in reverse. On phones (portrait, `max-aspect-ratio: 4/5`), a 9:16 crop of the same 4K master is used. It is framed on the car's front (the TLE plate, the headlights, Canary Wharf) and eases left onto the Shard as the car leaves. With reduced motion, or in the anyOS editor, the dusk poster and all the copy stand still.

## The four sections (`components/film/Journey.tsx`)

Each later section starts 170svh up inside the previous one (`overlap`). Its stage fades in from transparent over its first ~60svh (`fadeIn`) while both sections are pinned, so every cut is a dissolve. Overlapping layers are click-through until they have faded in, and QA checks that the hero's "Request a quote" and the closing quote chips can be tapped.

1. **`#top` (hero).** Track 380svh; the video ends at 75% of it.
   - **Shot:** dusk turns to night, then the lights come on and the car drives off. The section ends on the empty road and the lit skyline.
   - **Copy:** the headline and CTAs, then "Day or night, door to door."
2. **`#drive`.** Track 300svh.
   - **Shot:** the TLE S-Class, seen from behind, drives calmly away along a straight road towards the city. The camera is locked off like the hero.
   - **Copy:** "Door to door, on time."
   - **Phones:** the crop follows the car (keys 0:0.36 → 120:0.67).
3. **`#space`.** Track 420svh.
   - **Shot:** the Tourneo stands with black cases beside its open boot. A dissolve follows: the cases are loaded and the tailgate shuts, then it pulls away.
   - **Copy:** "Room for everyone, and everything. Our Tourneo seats eight with room for eight cases" (the site's 8/8).
   - **Phones:** the crop runs from the cases to the TLE front, then follows the Tourneo out.
4. **`#where`.** A still: the hero's last 4K frame, the empty road under the lit skyline (phone crop at 0.36, onto the Shard).
   - **Copy:** "Where are we taking you?" and the four prefilled quote chips. This is the last section of the film, as Jake asked.

The interior shot (`#inside`, Kling `hxdTlwyAHC6rWcQcw3YK`) was rejected by Jake ("too rocky and looks like the car is driving into a bush") and removed.

### Media for sections 2–4

| Asset | Model | Job | Credits |
|---|---|---|---|
| S2 start: the S-Class from behind with a yellow TLE rear plate, road to the city | Nano Banana Pro 4K | `wrSIEBHee0JU4OpBmP69` | 80 |
| S2 clip: drives away along the road | Kling 3.0, 4K, 5 s | `lcFZIPcnQOHBabDCblYw` | 600 |
| S3 start: the Tourneo at night, cases out, tailgate up | Nano Banana Pro 4K edit of the round-4 Tourneo (`Hcj3ImJP4540k7bNcWRW`) | `PtJ3b9EQ8RelJu8X3ztw` | 80 |
| S3 clip: chauffeur loads, tailgate shuts, drives off | Kling 3.0, 4K, 10 s | `jYkw7E6egIr7ld5Xm2Nt` | 1,200 |

The S3 clip as generated showed the chauffeur's face (frames 24–48), and the loading looked unnatural. The web cut therefore keeps only frames 0–24 (cases beside the open boot, no one in shot), then a 0.6 s fade to frames 124–240 (tailgate shuts, Tourneo pulls away). The face never appears.

```
ffmpeg -i V3.mp4 -filter_complex "[0:v]trim=start_frame=0:end_frame=25,setpts=PTS-STARTPTS[a];[0:v]trim=start_frame=124,setpts=PTS-STARTPTS[b];[a][b]xfade=transition=fade:duration=0.6:offset=0.44" V3-edit.mp4
```

Encodes (`scripts/film/build_film.py`):

| Section | Command | Desktop | Phone |
|---|---|---|---|
| Drive | `drive --keys 0:0.36,40:0.52,70:0.6,120:0.67` | 6.0 MB | 3.5 MB |
| Space | `space --keys 0:0.36,30:0.5,62:0.62,128:0.8` | 6.5 MB | 4.0 MB |

The `final-poster-*` images are cut from the hero master's last frame.

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
