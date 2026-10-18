# Motion and media: how the moving scenes are made (18 Oct 2026)

**What this is:** real-time animation of photographic layers. Each scene's photograph is separated into the parts that would really move: the car, its wheels, its lamps and its shadow, or the world outside a window. Native scroll, or the fleet buttons, then moves those parts physically. There is no video and no AI interpolation. A still is never zoomed or dissolved into another still. Changing scene is a cut through darkness: the dark car glass, or the camera tilting up into the night.

**What it is not:** a filmed or 3D-rendered sequence. The camera cannot orbit a car, and the arrival only rolls the car 0.75 m (the reason is below).

## Scenes

All three scenes use one W222 S-Class (facelift, long wheelbase, AMG Line), the same model as Simon's published S-Class.

| Scene | Source master | What genuinely moves | Retouching |
|---|---|---|---|
| 1 Arrival (lane, golden hour) | HERO-005 | The car is cut out and rolls 0.75 m forward along its own axis, then stops. Its size follows the perspective measured from its two wheels. Both visible wheels turn 121°, the distance divided by the tyre circumference. The headlamps come on, using a bloom made from the lamps' own pixels. The light falls to dusk (a re-grade of the same pixels). The camera then moves to the rear door glass. | The roll uncovers a narrow strip behind the tail and under the roof line. It is filled from the hedge, verge and road next to it, with a Poisson blend. No pixel of the car is invented. |
| 2 Cabin (dusk) | HERO-006 | The view outside the glass is cut out and rebuilt behind the pillars and mirror, row by row (the landscape is horizontal bands). It is split into sky and land at a line of clear sky. As the car "drives", the land spreads out from the point straight ahead, which is the optical flow of travelling forward. The sky barely moves. Outside goes to dusk while the cabin's amber ambient light rises. The cabin sways gently. | The countryside hidden behind the pillars and mirror is continued from the visible rows. |
| 3 Night (motorway) | HERO-007 | The car is cut out and drives away up its lane. It keeps its distance from the offside edge line, and its size and speed follow the ground plane. That plane's horizon is where the two carriageway edge lines meet, at 26% of frame height (measured). Its headlight pool is lifted off the road as a light map and travels ahead of it. Its tail-light glow and shadow travel with it. | The road under the car is rebuilt by copying the same lane further along, with the perspective corrected. The edge line and the dash series stay continuous. The generated plate, badge and sign lettering are blank or blurred. |
| Fleet studio | PILOT-001, FLEET-002 and FLEET-004 studio masters, plus Simon's published V-Class render | The four cars stand nose to tail at their true relative size, scaled by wheelbase (2.939 / 3.165 / 3.200 / 2.933 m). Each has a floor shadow extracted from its own studio. Previous, Next and the tabs drive the whole convoy forward or back until the chosen car stops in the light. Every wheel turns by the distance driven. The convoy drives in once when the section first comes into view. | The V-Class render is denoised, warmed to the studio light, and its "V-Class" plate is blanked. |

### Wheels

`scripts/motion/wheels.py` makes the wheels:
1. It finds each alloy's lip ellipse from the bright-rim-to-dark-tyre edge.
2. It maps that ellipse to a circle.
3. Ring by ring, it measures where the spokes are five-fold symmetric. An alloy is dished, so the hub is not concentric with the lip in the picture.
4. It resamples everything concentric.

The browser rotates that disc and maps it back with the lip's matrix. At 0° it reproduces the photograph. At any other angle the spokes turn without wobbling. The only approximation is that the recessed hub is drawn on the lip axis, a few pixels off.

## Honest limits

- **Arrival roll (0.75 m):** a longer drive would uncover background that has to be invented. A clean plate of the lane with no car would allow one. Making it needs a generative fill, which is new media spend.
- **Cabin:** two depth layers, not a full parallax field. The rear-view and side mirrors show their original reflections.
- **Night:** a faint residue of the original headlight pool stays on the road after the car leaves. The baked long-exposure trails of the other traffic stay still.
- **Fleet:** every car is the same three-quarter view, placed in one shared perspective. That is close to what a single camera would see, but not identical. The V-Class source is only 600×320, so it is visibly softer than the other three, especially in the light.
- **Interiors:** only the W222 has a matching cabin. There are no matching E-Class, V-Class or Tourneo interiors.

## Source evidence for "Simon's four vehicles" (checked 18 Oct)

- **What Simon publishes:** tlexecutivecars.co.uk "Our Fleet" lists four vehicles:
  - Mercedes E Class, 4 passengers / 3 bags;
  - S Class, 4 / 3;
  - V Class, 7 / 7;
  - "Toureno Custom Executive Spec", 8 / 8.

  The images are 600×320 manufacturer configurator renders (`tl-fleet-*.jpg`).
- **Generations identified from those renders:**
  - S-Class: W222 facelift, long wheelbase, AMG Line, 2017–20.
  - E-Class: W213 pre-facelift saloon with AMG front and wheels, 2016–20.
  - V-Class: W447 pre-facelift, 2014–19.
  - Tourneo Custom: first-generation facelift, 2018–23.
- **No photograph of Simon's own cars was found:**
  - The site's public media library (112 items) is stock and theme-demo imagery.
  - The Yell listing refuses automated requests (403); I did not work around that.
  - Year, colour, trim and interior of his actual cars are unconfirmed. The site says "Pictures show each model. Your car may differ in year, colour and specification."

## Media tools and budget (verified 18 Oct, ~17:00 BST)

- **OpenArt (existing connector):** the Plus plan, with **9,639 credits**, the same as after the last pass.
  - **Spent on TL:** stills 300 (six images) and video 175 (VIDEO-008, rejected, not used).
  - **Unspent:** 175 of Jake's approved 350 for video, still held.
  - **This pass:** no paid job was submitted.
- **OpenAI:**
  - **Direct API:** the `OPENAI_API_KEY` in this shell is rejected (HTTP 401 on the free model list). There is no usable direct API entitlement, and none was created.
  - **Codex CLI:** it is signed in with ChatGPT, but I didn't use it; it would be a second agent on Jake's subscription, which Codex is using for Age of Voices.
  - **Through OpenArt:** OpenAI image models exist (GPT Image 2 / 2.5 Flare / 2.5 Sunburst, 40–42 credits per image).
  - **Video:** no OpenAI video model was found on either route.
- **Cheapest relevant OpenArt video quotes (default settings, list prices):** PixVerse V6 50, MiniMax H3 Max Turbo 75, Wan 3.0 100, Veo 3.1 lite 120, Kling 3.0 175. None was submitted.

## What would need new approval

| Item | Why | Cost and route |
|---|---|---|
| V-Class studio master (FLEET-003) | So the fourth car matches the others | Root holds it. The original job was blocked by the auto-review. It has not been retried by any route. |
| A clean lane plate for the arrival | So the car can drive in from out of frame, not just roll 0.75 m | One image-to-image job, about 20–50 credits. No stills budget is currently approved. |
| Matching E-Class, V-Class and Tourneo cabins | For a correct interior per vehicle | Three stills, about 60–150 credits. No stills budget is approved. |
| A continuous film | Optional; this build doesn't need one | Needs a fresh decision. The held 175 would buy one short clip, not a whole sequence. |

## Rebuilding

```
python3 scripts/motion/build_arrival.py <work> [--preview a.jpg]
python3 scripts/motion/build_cabin.py   <work> [--preview c.jpg]
python3 scripts/motion/build_night.py   <work> [--preview n.jpg]
python3 scripts/motion/build_fleet.py   <work> [--preview f.jpg]
```

`<work>` holds half-size PNGs extracted from root's canonical masters (`hero-storyboard-4k.zip`, with hashes checked against `hero-master-receipt.json`, and the `*-studio-4k.png` files). It also holds the published V-Class render upscaled 3×. All outputs go to `public/media/motion/` and `lib/motion/*.json`. The tools are OpenCV, numpy and Pillow only.

Cloud QA (`.github/workflows/visual-qa.yml`) builds the site and runs the contract tests. It then captures the scroll frames, an MP4 of the journey, and the convoy driving between cars, all from a local `next start` in dry-run mode.
