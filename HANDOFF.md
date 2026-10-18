# Handoff — T&L Executive Cars redesign (18 October 2026, evening: protected candidate)

Jake rejected the afternoon build: too much text, and keyframe zooms instead of real motion. This is the redesign that replaces it. The afternoon checkpoint (`40c77d5`, preview `tl-executive-rdh98hgh2`) is untouched and documented further down.

## In plain English

- **A protected preview (Vercel login needed) is ready for review.** The public site `tl-executive.vercel.app` is unchanged.
- **The opening scenes genuinely move.** Three photographs of one S-Class are cut into layers:
  - **Lane:** the car rolls up and stops, its wheels turning and its lamps coming on.
  - **Door glass:** the camera moves to the rear door.
  - **Cabin:** the countryside moves past the windows as the light falls.
  - **Motorway:** the same car drives away at night.

  It ends on "Where are we taking you?". There's no video and no crossfade between photographs. MOTION.md says exactly what moves and what was retouched.
- **The fleet:** Simon's four cars stand together in one studio, at their true sizes. Choosing a car drives the whole line forward or back until that car stops in the light, and every wheel turns.
- **Five short chapters:** Arrival, Journeys, Fleet, Trust, Quote. The quote form and all its rules are unchanged, and test enquiries still go nowhere.
- **Still to come:** the V-Class picture is soft (its only source is 600×320). Only the S-Class has a matching interior. Both need media that isn't approved yet.

## State (18 Oct 2026, ~19:20 BST)

| | |
|---|---|
| Owner | `claude:tl-executive-opus-20260926`, this conversation. The work claim `abbb0758` is retained. Preview release claim `63d0f081-d2ef-4ed7-bae8-9d084908b901` is held for this candidate and will be released after handoff. |
| Branch | **`claude/tl-executive-redesign-20261018`** (new). It was cut from `bdb6190` and pushed; the old branch was not modified. `BRIEF.md` is left untracked. |
| Code commit | **`8f1d92a`** (redesign `7cc489c` and its fixes `653a86f`, `2da619d`, `8f1d92a`). |
| Testing URL | **https://tl-executive-jiwar8shb-anyos.vercel.app**: `dpl_4yqTe4hVSz8t2dUWBGi53XGfFaMr`, target preview, Ready. It is a Vercel cloud build with type check; Vercel SSO applies. |
| Production | Untouched. `tl-executive.vercel.app` was last changed about 23 days ago (cache age checked). No DNS, data, environment, billing or security changes. |

## Checks actually run

**Cloud CI** (GitHub Actions `visual-qa`; the repo is public, so minutes are free). It ran on `2da619d` and then `8f1d92a`:
- `pnpm build` passed, including the type check.
- `node --test tests/*.test.mjs` passed. That is the CMS contract (all 114 text and 5 image keys on the homepage, shared defaults, `edit.js` site key, no frame blocking) and the enquiry contract (mock platform only).
- **Headless Chromium on a local `next start` (dry-run) passed 31/31 checks on `2da619d`.** Covered:
  - 390, 375, 430 and 1440 widths;
  - the hero is pinned;
  - **reverse scrolling gives byte-identical frames at three positions**;
  - Next drives to the fourth car;
  - no horizontal overflow;
  - all 114 keys are in the DOM;
  - no console errors (the blocked third-party `edit.js` is excluded);
  - reduced motion does not pin;
  - the phone menu opens and Escape closes it.
- **Evidence:** journey MP4s (1440×900 and 390×844 at 2×, 121 scroll positions, 24 fps), plus frames at 13 scroll stops per viewport, fleet drive frames and section shots. They are in the run artifact `visual-qa` (14-day retention).

**On the deployed preview** (`vercel curl`):
- `GET /api/enquiry` returns `{"ok":true,"mode":"dry-run"}`.
- The CMS contract against the deployed homepage and airport-page HTML passes **8/8**.

**Not run:**
- the old `tests/browser/site.mjs` suite (it targets the afternoon layout and needs rewriting for this one);
- axe;
- 200% zoom;
- a real-device phone test;
- an anyOS edit session (the edit-mode CSS lays all copy out, but nobody opened the editor).

Nothing heavy ran on the Mac: memory stayed at WARNING, so builds and browsers ran in the cloud.

## Media and budget (facts)

- **OpenArt:** 9,639 credits, unchanged; **no paid job this pass**. TL spend to date: stills 300, video 175 (VIDEO-008, rejected, unused). 175 of the approved 350 for video is still unspent and held.
- **OpenAI:** the shell's `OPENAI_API_KEY` is invalid (401 on the free model list), and no credential was created. Codex is signed in with ChatGPT, but I didn't use it, so nothing ran on Jake's subscription. OpenAI images are reachable only through OpenArt (GPT Image 2/2.5, 40–42 credits). No OpenAI video was found.
- **No photo of Simon's own cars exists** in his site's public media library. The four models' generations, identified from his published renders, are in MOTION.md.

## Blockers that need a decision (MOTION.md has quotes)

1. **V-Class studio master (FLEET-003):** held by root and not retried by any route. Until it exists, the V-Class is visibly softer.
2. **Matching E-Class, V-Class and Tourneo interiors:** not available; no stills budget.
3. **A longer arrival drive:** needs a clean plate of the lane (one generative fill); no stills budget.
4. **Simon's real cars, colours and interiors:** to be confirmed by Simon.

## Files

- `components/arrival/*`, `components/fleet/*`, `components/Journeys.tsx`, `components/Trust.tsx`, `components/HomeContact.tsx`
- `lib/motion/*`
- `scripts/motion/*`
- `public/media/motion/*` (about 4.9 MB, served responsively)
- `.github/workflows/visual-qa.yml`, `tests/browser/capture.mjs`
- `MOTION.md`, with the `DESIGN.md` chapters updated

**Removed:** the afternoon `Hero`, `HeroMotion`, `FleetSection`, `FleetSelector`, `ServicesChapter` and `StoryChapter` components, the keyframe webps and `lib/journey.ts`. They're all in git history.

---

# Previous checkpoint — testing rebuild (18 October 2026 afternoon, root QA PASS: reviewable; superseded by the redesign above)

## In plain English

- **A new testing version is on a private preview link (below).** The public site `tl-executive.vercel.app` is unchanged.
- **It opens with one journey, not a road slideshow.** One representative black S-Class appears complete on an English lane at golden hour. As you scroll, the camera moves in toward its windscreen, then you're in its cabin at dusk, then it draws back above the motorway at night and settles on "Where are we taking you?".
- **These are three still pictures moved by scrolling. It is not yet a film.** The one video clip tried (VIDEO-008) dissolved instead of moving through the window, so it was rejected and is not used.
- **The pictures are generated images of the model**, made from the official S-Class picture. They are not Simon's own car, and `/credits` says so.
- **New header:** a quiet name and badge, with Quote and Call always visible. On phones, a proper menu drawer.
- **New fleet section:** one car at a time, full width, with Previous, Next, tabs and "Choose this car". The E-Class, S-Class and Tourneo have new matching studio pictures; the V-Class keeps its old render for now.
- **The quote form is now four short steps:**
  - journey type ("Other" asks you to describe it);
  - route and time (for airports, which way, then only the relevant flight numbers, plus a return if wanted);
  - car and passengers (cars that are too small can't be chosen);
  - your details, with a review.
- **Test enquiries never reach Simon:** the preview says "Test mode: this enquiry was not sent". No real enquiry was made.

## State (18 Oct 2026, ~15:45 BST)

| | |
|---|---|
| Owner | `claude:tl-executive-opus-20260926`, the same conversation. Work claim `abbb0758-614f-4b52-a94f-bc93e2702b2e` is retained. The preview release claim `41d1c7fd-3534-45ac-a524-a790e230d389` was released after this checkpoint. |
| Worktree / branch | `/Users/margaritabot/.openclaw/workspace/tl-executive-opus-20260926`, `claude/tl-executive-rebuild-20260926`, pushed. `BRIEF.md` left untracked. |
| **Code commit** | **`40c77d5`**, on top of `4463b3b` (same-car keyframes and the terminal fix), `34a9444` and `20560c0` (rebuild). The handoff commits after it (`bd9890a` and this wrap-up) are docs-only, so the deployed code equals `40c77d5`. The working tree is clean apart from `BRIEF.md`, which is deliberately left untracked. |
| **Testing URL** | **https://tl-executive-rdh98hgh2-anyos.vercel.app**, deployment `dpl_ALZtMXMBkuVAPZXRiFWaFmMvnuzS`, target preview, READY. Cloud build with `--force`, which includes the type check and lint. Vercel SSO applies. |
| Production | Untouched. `tl-executive.vercel.app` still serves the July build. No DNS, data, env, billing or security changes. |

## Checks actually run

**On the deployed preview:**
- `GET /api/enquiry` returns `{"ok":true,"mode":"dry-run"}`.
- The CMS contract (`tests/cms-contract.test.mjs` against the deployed HTML) passes **8/8**. This covers:
  - all 114 text keys and 5 image keys;
  - the saved `hero.eyebrow` and `services.title` overrides;
  - edit.js with `data-site=t-l-executive-cars`;
  - text-leaf keys;
  - only the two brand colours exposed;
  - no frame-blocking and no 24-hour claim.
- Dry-run `POST`s (nothing sent) behave as specified:
  - a valid "Other" journey is accepted with its description in the notes;
  - a missing "Other" or Seaport description is refused;
  - a leftover link from an abandoned "Other" draft is ignored and not sent;
  - an E-Class with 5 passengers, or an S-Class with 4 cases, is refused;
  - **notes boundary:** with a 300-character description, 545 characters of notes compose to exactly 1,000 and arrive whole; 546 is refused with "Too long by 1 character…".

**Root's manual QA on the preview (not my run):**
- At 390px, the form passed end to end in dry-run:
  - an "Other" description;
  - the date and time, set accessibly;
  - an E-Class with 5 passengers was blocked, and the error link focused the E-Class radio;
  - switching to the Tourneo;
  - the details step and the test-mode receipt.
- The menu, Escape and focus behaviour passed at 390px.
- Desktop at 1512×805 looks good.
- Root found three bugs, all fixed in `40c77d5` / `4463b3b`:
  - the top Quote link left the drawer open;
  - the notes were silently truncated;
  - the mobile intro text lost contrast over the bright sky.

**Not run:**
- The browser suite `tests/browser/site.mjs` was rewritten and extended for the journey, drawer, fleet, every wizard branch and all the regressions.
- It, the `npm test` enquiry contract (now 17 tests) and the axe audit were **not run** here. The Mac stayed at **memory-pressure WARNING** (swap 8–9.5 GB), and Jake's rule forbids heavy local builds and browsers.
- Run them when memory is normal or in a cloud worker:
  - `npm run build && npm test`;
  - `node tests/browser/site.mjs <url> <shots>`.
- The phone hero framing was fixed by layout arithmetic (the car's centre at 64%, or 62% on short screens where the intro is hidden, plus a shade that fades out with the headline). Root then verified it on screen (below).

**Root final manual QA: PASS** on `40c77d5` / `dpl_ALZtMXMBkuVAPZXRiFWaFmMvnuzS`, 18 Oct. Root's run, not mine; root saved the evidence (`ROOT-SERVER-NOTES-RECEIPT.json` and the final hero screenshots) in the Mission Control coordination folder.
- **Phone hero:** at 375×667, 390×844 and 430×932 the text has enough contrast and does not collide with the car.
- **Drawer:** open the menu, tap the top-bar Quote, and the drawer closes and page scrolling is restored.
- **Quote form:**
  - a native "Other" with a 300-character description and the route "Southampton cruise terminal" is no longer treated as an airport;
  - the date and time work;
  - 800 characters of notes are kept exactly, with the visible counter and `aria-invalid` blocking the step;
  - shortened notes then go through the details step to a fresh, full dry-run receipt.
- **API:** a fresh `GET` reports dry-run; short notes return 200 with `dryRun: true`; the maximum "Other" (300) plus 800 characters of notes returns 400 with the notes error. No real enquiry was sent.
- **Desktop 1512×805:**
  - the scene runs 0 → 0.5 (cabin) → 0.8 (aerial), and reversing to 0.5 → 0 gives exactly the same positions;
  - the quote scene is visible at 0.95;
  - there is no horizontal overflow.

## Media

Full ledger: `JOURNEY-STORYBOARD.md`.
- **Spent:** 300 credits on six still jobs and 175 on one video (VIDEO-008, rejected).
- **Held:** 175 video credits (VIDEO-009), plus the V-Class studio photo (FLEET-003, which root holds).
- **Balance:** 9,639.
- **Classifier blocks:** the auto-mode classifier blocked three actions: the V-Class submission, one download of the outputs, and one style-reference check. None was retried, and no permission rules were changed.

## Remaining scope

1. **A true continuous film** (not started beyond the rejected VIDEO-008): add an in-between "at the glass" keyframe and shorter clips (quote in `JOURNEY-STORYBOARD.md`, about 575 credits), and review every frame for morphs and generated text. A **fresh decision** is needed.
2. **V-Class studio image** (FLEET-003, root-held).
3. **Run the browser, axe and enquiry-contract suites** when the Mac is at normal pressure, and save the screenshots to `docs/evidence/`.
4. **Simon:** his real cars and photos; confirmation of the fleet, licensing and payments; testimonial permission; fares; renewal of `tlexecutivecars.co.uk` by 23 Jan 2027.

---

# Handoff — T&L Executive Cars testing rebuild (12 October 2026)

## For Jake and Simon, in plain English

- **The new testing website is live on a private preview link (below).** The public site `tl-executive.vercel.app` has not been changed.
- **It opens with a short scroll scene.** Simon's real badge (rebuilt as crisp vector artwork from his logo, not retyped in a font) sits over a photograph of Epping Road in Epping Forest by day. As you scroll, it turns to the M25 at night, and the light catches the badge's silver rim.
- **Right under that is "Plan your journey".** It is the quote form itself:
  - journey type, from/to, date, time, passengers and luggage;
  - flight details appear for airport trips.
- **Then come four short chapters:**
  - a centred fleet selector (pick a car and it fills in the form);
  - services that change in place, with photographs;
  - an airport and area chooser ("Loughton to Stansted, plan this journey");
  - Simon's story with his clients' testimonials, then contact details and FAQs.
- **Only true facts.** Everything follows what Simon's own website says, including his published hours (Mon–Fri 9.00–6.30). The "Open 24 hours" line is gone everywhere.
- **anyOS editing still works.** All 114 editable texts and all 5 editable photos are kept. Simon's two saved edits still show.
- **Test enquiries are safe.** The form on this link never sends anything to Simon; it says "Test mode: this enquiry was not sent".
- **What would make it better still:** real photos of Simon's own cars and jobs (see "What we still need").

## State

| | |
|---|---|
| Owner | `claude:tl-executive-opus-20260926`, Mission Control work claim `abbb0758-614f-4b52-a94f-bc93e2702b2e` (retained for review) |
| Worktree / branch | `/Users/margaritabot/.openclaw/workspace/tl-executive-opus-20260926`, `claude/tl-executive-rebuild-20260926` (pushed). `BRIEF.md` left untracked. |
| Commits | `ee3f45c` badge reconstruction and photographic plates, `1d65cc3` complete rebuild, then this handoff/evidence commit |
| **Testing URL** | **https://tl-executive-a3xoelp1p-anyos.vercel.app** (also `/airport-transfers`, `/credits`, `/privacy`, `/cookies`). Vercel SSO: sign in to Vercel to open it. |
| Deployment | `dpl_CC8s2GL2FNP4nBci2sKojD2ndaCz`, target preview, READY, cloud build with `--force` (no cache) |
| Commit ↔ deployment | Built from a clean tree at `1d65cc3`. The CLI records no git metadata for this non-Git-connected project, so this was verified by content instead (four committed assets byte-identical, plus markup unique to the commit). |
| Production | Untouched. `tl-executive.vercel.app` still serves the July site. No DNS, data or settings changes. |

## Checks actually run (12 Oct, against the deployed preview unless stated)

- **Type check:** `npm run typecheck` is clean (local).
- **CMS contract:** `tests/cms-contract.test.mjs` run on the deployment's HTML (`CMS_HTML_DIR`) passes **8/8**.
  - All 114 text keys and 5 image keys; text leaves; edit.js tag with `data-site="t-l-executive-cars"`.
  - Settings limited to two colour variables; no frame-blocking; no 24-hour claim.
- **Browser suite:** `tests/browser/site.mjs` passes **52/52**. Log: `docs/evidence/browser-qa-dpl_CC8s2GL2FNP4nBci2sKojD2ndaCz.txt`.
  - **Hero motion at 375, 390, 430 and 1440:** the day→night scene plays forward (night 0→1, light −60°→+55°) and returns to identical frames in reverse. It is pinned for 609–699px, and native wheel scrolling drives it.
  - **Reduced motion and text zoom:** reduced motion gives a static frame with no pin. At 200% text zoom the hero unpins with no clipping.
  - **Navigation:** skip link; phone menu with Escape and focus return.
  - **Planner and selectors:**
    - journey types show and hide the flight fields;
    - the fleet tab and "Choose this car" prefill the form;
    - services change their panel and photograph in place;
    - the route builder prefills pick-up, airport and flight fields;
    - an empty submit focuses a 7-item error summary.
  - **Enquiry, dry-run only:** the submission shows the test-mode result. The API reports `dry-run` on this deployment.
  - **anyOS:** the live saved override applies to the new markup. The edit-mode smoke test used a dummy token and never saved: edit bar, in-place text edit, and the image picker opening through the story photo's overlays.
  - **Fixed action bar:** hidden over the hero, shown after it, and steps aside for the planner and while typing.
  - **Layout:** no horizontal overflow at 375/390/430/820/1440; 44px touch targets.
  - **Accessibility:** axe WCAG 2.2 AA plus best practice finds **0 violations** on `/` and `/airport-transfers` at 390 and 1440, `/privacy`, `/credits`, and the planner's error state.
  - **Console:** no console or page errors.
- **Badge fidelity:** glyph IoU 0.959 and 0.954 against the original (ASSET-LOG.md).
- **Not run this round:** a local `next build` and the enquiry contract test, which starts a local server (`npm test` includes it). The Mac stayed at **warning** memory pressure throughout, so heavy local jobs were not started. Builds ran on Vercel, and QA ran as one serialised headless browser. `app/api/enquiry/route.ts` and `lib/enquiry.ts` are unchanged since `8bd310e`, where those 17 tests passed. Re-run `npm run build && npm test` when the Mac is at normal pressure.
- **Evidence:** `docs/evidence/` holds the hero storyboard sheets (375/390/430/1440), the phone chapter sheet and the desktop chapter frames.

## Media and OpenArt

- **Photographs:** CC-licensed photographs of the real places T&L serves: Epping Forest, Theydon Bois, the M25, Heathrow T5 and Tower Bridge. Authors, licences and processing are listed on `/credits` and in ASSET-LOG.md.
- **No AI images were made and no credits were spent.**
- **OpenArt needs re-authentication** (`/mcp` → openart). Until then, account, models, project, upload and download cannot be verified.
- **Proposed job, ceiling 800 credits** (Nano Banana Pro 4K at the recorded 80 per job; to be re-quoted live):
  - remaster the two hero plates, plus phone versions (320);
  - one retry each (160);
  - a four-car studio set made **only from Simon's own vehicle photos** (320).
- Waiting for Jake's answer on T&L's optional allowance. Kuruma's budget is not used.

## What we still need (from Simon or the browser)

1. **Photos of Simon's actual cars**, plus any wedding, airport or event photos (the originals behind the official site's hero). These are the single biggest upgrade. The four fleet images are model renders, not his cars; each is replaceable in anyOS.
2. The official site's media list: `https://tlexecutivecars.co.uk/wp-json/wp/v2/media?per_page=100` (source URLs and sizes). It is reachable in a normal browser only.
3. Confirmation that the published fleet and capacities, the licensing and plate exemption, and the payment methods are still current. They are shown as T&L's own statements.
4. Permission to keep naming the three testimonial authors and the ten clients.
5. Whether to show early-morning and weekend availability. Nothing is claimed beyond the published Mon–Fri hours.
6. A business email in place of the Gmail address, if preferred.
7. Any "from" fares he wants published.
8. Renew `tlexecutivecars.co.uk` before **23 Jan 2027**.

## Release checklist (only on Jake's decision)

1. Mission Control **release** claim: `--kind release --project tl-executive`.
2. `vercel deploy --prod --force` from the approved commit. Then confirm `GET /api/enquiry` reports `"mode":"live"`, and check the font classes match between HTML and CSS.
3. Re-verify the live enquiry route before claiming the September production form defect is fixed. **It has not been re-tested since 26 Sep.**

---

## History: September 2026 rebuild (superseded)


## For Jake, in plain English

- **There's a new version of the website ready to review on a private preview link** (below). The live site at `tl-executive.vercel.app` has **not** been changed.
- **Urgent: the live site's quote form doesn't work today.**
  - It was built against an older anyOS route that now refuses it, so every customer who fills it in sees an error. I checked this safely, without creating anything.
  - The fix was already on `main` (August) but was never deployed. This rebuild includes it.
  - Putting it live is your call.
- **Look and feel.** Calm, local and trustworthy rather than "black-and-gold luxury". The page leads with "Executive cars from Theydon Bois", with maps drawn from real geography, a fast quote form that works properly on a phone, and a separate airport page.
- **Honest content.** Everything on the page is backed by T&L's own website (live since 2013) or public listings. The fake-sounding claims are gone: "15,000 journeys", "100% reliability", fixed prices, refreshments, and "reply in 30 minutes".
- **anyOS editing still works.** Every piece of text Simon could edit before is still editable, along with more (FAQ, airports, an About photo). His two saved edits show up on the new design.
- **Preview-safe enquiries.** On the preview, the form **doesn't send** enquiries. It shows "Preview mode: this enquiry was not sent" and exactly what would be sent, so testing never pings Simon's phone.
- **Simon needs to answer a few questions** before this goes live (see below). The main one is opening hours.

## Ownership and state

| | |
|---|---|
| Owner | `claude:tl-executive-opus-20260926` — Mission Control work claim `abbb0758-614f-4b52-a94f-bc93e2702b2e` (retained until Jake reviews) |
| Worktree | `/Users/margaritabot/.openclaw/workspace/tl-executive-opus-20260926` |
| Branch | `claude/tl-executive-rebuild-20260926` (pushed to `origin`), based on `main` `aab90e8` |
| Vercel | `anyos/tl-executive` (`prj_E7ZwodmMjG0HxIWFmbeLyELCit7W`), **preview only** |
| Production | Unchanged: `dpl_J5NyesoC12NnKoCgWQC6d5jeqrxG` (19 Jul 2026) is still `tl-executive.vercel.app` |
| Not touched | DNS, the production alias, anyOS data, env vars, the old `tl-executive-cars` project, `BRIEF.md` (left untracked) |

## Preview deployment

- **URL:** https://tl-executive-iehmwvbj3-anyos.vercel.app — also `/airport-transfers`, `/privacy`, `/cookies`.
- **Deployment:** `dpl_ChGiuHrFUchjypEFMSuiHmTWW2z7`, target **preview**, status Ready.
  - Built on Vercel with pnpm 10 / Next 14.2.35 from commit **`8bd310e`**. Later commits only touch this handoff.
- **Protection:** Vercel SSO applies to previews, so sign in to Vercel to open it, including on a phone.
- **Verified on the preview** (26 Sep, 23:13 BST, via `vercel curl`):
  - `GET /api/enquiry` returns `{"mode":"dry-run"}`, so preview submissions are never sent.
  - The home page carries the new design and the unchanged edit.js tag with `data-site="t-l-executive-cars"`.
  - It has **the same 114 anyOS keys** as the tested local build.
  - `/airport-transfers` renders.
- **Production:** `tl-executive.vercel.app` still serves the July site (checked after deploying). Nothing was promoted.

## What changed (files)

- **Pages:**
  - `app/page.tsx` (home)
  - `app/airport-transfers/page.tsx` (new)
  - `app/privacy`, `app/cookies` (rewritten to match what the site actually does)
  - `app/not-found.tsx`, `app/sitemap.ts`, `app/robots.ts`
  - icons: `app/icon.png`, `apple-icon.png`, `favicon.ico`
- **Layout:** `app/layout.tsx`
  - self-hosted fonts, metadata and Open Graph
  - the edit.js tag, unchanged
  - `ANYOS_SETTINGS` (two brand colours)
  - a boot script, preconnect and a skip link
- **Enquiry:** `app/api/enquiry/route.ts` + `lib/enquiry.ts`
  - Validation is shared with the form.
  - Same structured `transfer-enquiry` payload, now with `travelTime`.
  - Token-gated `site-lead` fallback.
  - Dry-run by default outside production.
  - `GET` reports the mode.
- **Components (`components/`):**
  - Header, Hero, JourneyStarter, ServicesSection/ServiceGroup, AirportsSection, Maps, FleetSection, AboutSection, ProofSection, CoverageSection, FaqSection, QuoteSection, QuoteForm, MobileActionBar, Footer, LegalPage, Icon, QuoteLink, SectionHeading, RevealObserver.
- **Content and data:** `lib/site.ts` (business facts, services, fleet, airports, areas, testimonials, each tagged by evidence), `lib/schema.ts` (JSON-LD), `lib/prefill.ts`.
- **Styles:** `app/globals.css` (tokens, type, components, motion), `tailwind.config.ts`.
- **Assets:** `public/brand/*`, `public/og.jpg`. The originals are kept.
- **Tests:** `tests/cms-contract.test.mjs`, `tests/enquiry-contract.test.mjs`, `tests/browser/site.mjs`.
- **Docs:** `AUDIT.md`, `RESEARCH.md`, `DESIGN.md`, `ASSET-LOG.md`, `README.md`, `docs/evidence/*.jpg`.
- **Tooling:** `package.json` scripts (`typecheck`, `test`, `test:browser`), `.gitignore`, `.vercelignore`.

## Test evidence (local production build, 26 Sep 2026)

- **`npm run typecheck`:** clean.
- **`npm run build`:** passes (12 routes; home 104 kB first-load JS).
- **`npm test`:** 17/17 pass.
  - **CMS contract:** the edit.js tag is unchanged; every legacy key and both live-saved keys are present; image keys are on `<img>`; text elements are leaves; shared keys have consistent defaults; settings are limited to two variables.
  - **Enquiry contract, against a local mock platform:**
    - the exact structured payload;
    - 12 validation cases;
    - malformed and oversized bodies;
    - honeypot;
    - 4xx passthrough without retry, and 429;
    - 5xx fallback with the token;
    - 502 when both routes fail;
    - GET mode;
    - default dry-run sends nothing.
- **`npm run test:browser`:** 37/37 pass (Playwright, fresh contexts).
  - **Keyboard:** skip link; mobile menu (Escape and focus return).
  - **Prefill:** hero starter → form, with focus on the next field; car and service prefills.
  - **Validation:** error summary focus; aria-invalid.
  - **Form behaviour:** passenger-fit flags; return fields; a dry-run submission with the payload.
  - **Live anyOS hydration** (the saved "Tailored to Your Needs" appears on the new markup).
  - **Edit-mode smoke test** with a dummy token (edit bar, settings gear, in-place edit, Cancel, image picker; **never saved**).
  - **General:** reduced motion; 44 px touch targets; zero console errors.
  - **axe WCAG 2.2 AA + best practice:** zero violations on `/` and `/airport-transfers` at 390 and 1440, `/privacy` at 390, `/cookies` at 1440, and the form's error state.
- **Pinned web-interface guideline audit:** no anti-patterns found (no `transition: all`, zoom allowed, labelled icon buttons, sized images, no paste blocking).
- **Performance (throttled phone: slow 4G, 4× CPU):**
  - New: LCP **0.78 s**, CLS 0.016, no long tasks.
  - Current live site: LCP 3.98 s.
- **Responsive evidence:** `docs/evidence/` (390, 820, 1440, and a 390 scroll sheet). No horizontal overflow at 390, 820 or 1440.

## Questions for Simon (needed before going live)

1. **Opening hours.** Yell and Yelp say "Open 24 hours"; T&L's own website says "Mon–Fri 9.00am–6.30pm, we reply within 24 hrs". The new site says "Open 24 hours" (hero, About, footer, structured data). Which is right? Perhaps office hours versus driving hours?
2. **Licensing.** Are drivers and vehicles *currently* licensed by Epping Forest District Council, with executive plate exemption? Would he like the operator licence number shown?
3. **Fleet.** Are the E-Class, S-Class, V-Class and Ford Tourneo Custom all still in service, with 4/4/7/8 seats and 3/3/7/8 cases? Real photos of his cars would replace the model renders; he can upload them in anyOS by clicking each photo.
4. **Testimonials and clients.** Is he still happy to name Jamil Qureshi, Ken Spry and Peter Joarder, and the ten clients (London Speaker Bureau … Precision)? Each can be switched off in `lib/site.ts`.
5. **Drivers.** Does Simon drive every job, or are there other drivers? A directory review mentions "Omar". The copy currently says "drivers" and "your driver", never "always Simon".
6. **Payments.** Does he still accept Visa, Mastercard, Amex and Apple Pay? Cash? Account invoicing for businesses?
7. **Email.** Keep `simonemburns@gmail.com`, or use a business address?
8. **Services** not found on his own site: concerts, hospital visits and long-distance. Keep them?
9. **Prices.** Any "from" fares he'd publish (for example Theydon Bois → Stansted or Heathrow)? Competitors do.
10. **Domain.** Renew `tlexecutivecars.co.uk` before **23 Jan 2027**. Point it at this site when ready (DNS change, Jake's approval).

## Release checklist (only when Jake approves production)

1. Hold a Mission Control **release** claim: `--kind release --project tl-executive`.
2. Deploy this exact commit to production and **verify `GET https://tl-executive.vercel.app/api/enquiry` returns `"mode":"live"`**. If it says `dry-run`, stop: enquiries would not be sent.
3. Test the live route without creating a booking: POST with the honeypot filled should return `{"ok":true}`. For a single real end-to-end test, agree with Simon first; it creates a booking and a push notification.
4. Optional: ask anyOS for the site's lead token, and set `ANYOS_SITE_LEAD_TOKEN` in Vercel (production only) to enable the fallback.
5. In anyOS, re-save `services.title` in sentence case ("Tailored to your needs") if wanted; the saved value currently overrides the design default.

## Remaining work and ideas (not done)

- Town pages (Loughton, Epping, Chigwell, Buckhurst Hill) once there is real local detail. A claimed Google Business Profile and a review link.
- Remove the unused `package-lock.json` (Vercel uses pnpm) in a separate change.
- The Vercel preview is SSO-protected. Jake must be signed in to Vercel on his phone, or create a Vercel share link himself.
