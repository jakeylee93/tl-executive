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
