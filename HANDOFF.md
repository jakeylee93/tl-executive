# Handoff — T&L Executive Cars rebuild (26 September 2026)

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

_Filled in after deployment; see the section at the end of this file._

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
