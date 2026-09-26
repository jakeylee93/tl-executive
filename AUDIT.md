# T&L Executive Cars — audit (26 September 2026)

Scope: the canonical repository `jakeylee93/tl-executive` (worktree branch
`claude/tl-executive-rebuild-20260926`, based on `main` at `aab90e8`), the Vercel
project `anyos/tl-executive`, and its anyOS connection (site key
`t-l-executive-cars`). Every probe below was read-only or used a no-write path;
no enquiry was created and nothing was saved in anyOS.

## 1. Inventory

| Item | Finding (evidence) |
|---|---|
| Stack | Next.js 14.2.35 App Router, React 18, Tailwind 3.4, TypeScript. Single client-rendered page plus `/privacy`, `/cookies` and `/api/enquiry`. |
| Package manager | Vercel installs with **pnpm 10** from `pnpm-lock.yaml`, confirmed in the production build log. A stale `package-lock.json` also exists and is unused by Vercel. |
| Vercel project | `anyos/tl-executive` (`prj_E7ZwodmMjG0HxIWFmbeLyELCit7W`), Node 24.x. |
| Git connection | **Not Git-connected.** Every deployment was a CLI upload, so pushing a branch does not deploy. |
| Protection | Vercel SSO protection on every deployment except custom domains. `tl-executive.vercel.app` is public; preview URLs need a Vercel sign-in. |
| Production | `dpl_J5NyesoC12NnKoCgWQC6d5jeqrxG` (`tl-executive-30rjhg26n-anyos.vercel.app`), built 19 Jul 2026 from the July code (`29157bb`/`376d47f`). |
| Undeployed work | `main` has two commits from 4 Aug 2026 (`dbd395d` structured enquiry with flight numbers; `aab90e8` editable fleet photos and capacities) that **never reached production**. The live HTML has no flight fields and no `data-anyos-img`. |
| Duplicate project | `tl-executive-cars` (per the old HANDOFF) serves an old copy. It is not a deployment target. |
| Owned domain | T&L's own WordPress site at **tlexecutivecars.co.uk** is live on separate hosting (LiteSpeed, 91.238.161.176). The domain was registered 23 Jan 2013 and **expires 23 Jan 2027** (Nominet whois). |

### anyOS contracts found

- **Live-edit script:** `<script src="https://platform.anyos.co.uk/edit.js" data-site="t-l-executive-cars" defer>`.
  - On load it makes one request: `GET /api/site-cms/t-l-executive-cars/content`.
  - It replaces the `innerHTML` of every `[data-anyos="key"]` and the `src` of every `img[data-anyos-img="key"]`.
  - A MutationObserver re-applies content after React re-renders.
  - Edit mode starts from `?anyos_edit=<secret>`, and the token is kept in `sessionStorage`.
  - Writes (PUT content, upload, generate, upscale) happen only on explicit Save, Upload or Generate actions.
  - Optional v6 `window.ANYOS_SETTINGS` exposes CSS custom properties.
- **Platform previews:** the platform shows client sites inside iframes (`SitePreview`, `ConnectedSite`), so the site **must not** send `X-Frame-Options` or `frame-ancestors`.
- **Saved overrides (live read, 26 Sep):** only two:
  - `hero.eyebrow` = "Theydon Bois · Essex · London"
  - `services.title` = "Tailored to Your Needs"
- **Enquiry, primary route:** `POST https://platform.anyos.co.uk/api/public/transfer-enquiry`.
  - Fields: `siteKey`, name, email, phone, pickup, destination, travelDate (YYYY-MM-DD, not past), travelTime, passengers, flightIn, flightOut, notes, website (honeypot).
  - CORS is `*`.
  - Rate limit: 6 per hour per IP, per instance.
  - Links and markup are refused in name, pickup, destination and notes.
  - It flattens all whitespace, so multi-line notes arrive as one line.
  - It creates an `enquiry` booking, a notification and a push to the owner.
- **Enquiry, legacy fallback:** `POST /api/public/site-lead` with `clientId` `2f9b5bf7-…` (a public routing ID).
  - It needs a browser `Origin` on the client's allow-list **or** an `x-anyos-site-token` header.
  - A server-to-server call with neither is refused with 403.

## 2. Critical findings

1. **The live quote form cannot deliver enquiries (P0, production).**
   - Production still runs the July route, which posts server-to-server to `site-lead` with no Origin and no token.
   - A honeypot probe (which cannot create a booking) against `https://tl-executive.vercel.app/api/enquiry` returned `403 {"error":"This form is not enabled for that website."}`. A direct probe of `site-lead` returned the same.
   - Every real customer who submits the form today is shown the "please call" error.
   - The working route (`transfer-enquiry`) is in `main` and in this branch. A safe probe confirmed the platform recognises the site key: missing name gives 400 "Please give your name and email."; a bogus key gives 400 "Missing site.".
   - **Fixing production needs Jake's release decision.**
2. **The `main` fallback would also fail.** `main`'s route falls back to `site-lead` without a token, so it would 403 too.
   - This branch sends `x-anyos-site-token` only when `ANYOS_SITE_LEAD_TOKEN` is configured server-side (it is not configured today).
   - Otherwise it tells the visitor plainly and offers phone and a pre-filled email, so the enquiry is never silently lost.
3. **Two websites compete for the same business.**
   - tlexecutivecars.co.uk (owned, WordPress) already ranks for "airport transfer Loughton executive car".
   - The Vercel site only has a `vercel.app` address.
   - The owned domain must be renewed before 23 Jan 2027 and eventually pointed at the new site. That is a DNS change, not made here.

## 3. Defects in the current live site

**Accessibility**
- 29 axe `color-contrast` failures (grey #667085 on #f1ece3).
- Four auto-scrolling marquees, one of them made of *buttons* (WCAG 2.2.2 pause/stop/hide).
- The service modal has no dialog role, no focus trap and no Escape key, and its close control is an unlabelled "✕".
- Form labels are not associated with their inputs (aria-label only).
- The brand name in the nav is the `<h1>`; the hero is an `<h2>`.
- Emoji icons (👤 🧳) are announced.
- No skip link.

**Conversion**
- There is no time field, although the platform accepts `travelTime`.
- Validation is browser-default only, with no error summary.
- Hand-luggage copy asserts a policy.
- The success message promises "within 30 minutes", which is unverified.
- On mobile the form is the last thing on a long page, with no persistent call or quote access.

**Trust**
- Unverified counters: "15,000+ journeys completed" and "100% reliability rate / never late".
- Payment brand icons, plus cash, with no source.
- A licence claim with no explanation.
- Service bullets promising fixed prices, refreshments, ribbons and packages. See section 4.

**Performance**
- The hero is a **600×320** JPEG stretched to full viewport width as a CSS background (blurry, washed out, not editable).
- Throttled phone LCP was 3.98 s (slow 4G, 4× CPU).
- Google Fonts are loaded from Google's servers, with an IP transfer and no consent note.

**SEO**
- One page only.
- Title and description are generic; there is no JSON-LD, Open Graph image, sitemap, robots, favicon or `en-GB` language tag.

**Legal pages**
- The cookies page mentions analytics cookies the site does not use.
- The privacy notice names payment processing and analytics generically.

## 4. Claims audit (what the rebuild shows, softens or drops)

Sources: RESEARCH.md §1. "OA" means owned asset, i.e. T&L's own site, archived back to 2013. "VP" means verified by a public third party.

| Claim | Evidence | Rebuild |
|---|---|---|
| Name; Theydon Bois; phone 07904 428896 | VP (Yelp, Bizify, Yell snippets) and OA | Shown |
| Established 2008 | OA since 2013, and Yell (named as verified in the brief) | Shown |
| Open 24 hours | Yell and Yelp say 24 h, 7 days. **Own site says Mon–Fri 9.00–18.30** | Shown, per the brief; **question 1 for Simon** |
| Founder Simon Burns; first-person "About" text | OA (WordPress author, privacy data controller) | Kept verbatim |
| Drivers and vehicles licensed by Epping Forest DC; exempt from standard plates | OA since 2013; EFDC policy §5.10–5.12 provides the exemption; no public register exists | Shown with careful wording ("exempt from displaying standard private hire plates and signs"); **confirm current licence** |
| Fleet E/S/V-Class and Tourneo Custom, with 4/4/7/8 seats and 3/3/7/8 cases | OA since 2020 | Shown, captioned "Photos show each model. Your car is confirmed with your quote." |
| Airports (6), VIP terminals, flight monitoring, meet and greet, 10 minutes early, check-in chaperone | OA since 2014 (airport page) | Shown, paraphrased faithfully |
| Seaports (Southampton, Dover, Tilbury, Harwich…) | OA | Shown |
| Visa, Mastercard, Amex, Apple Pay | OA since 2020 | Shown as text. **Cash dropped** (no source) |
| Testimonials (Qureshi, Spry, Joarder) and 10 client names | OA since Aug 2020; Joarder's Chapman Freeborn role is on Companies House | Shown. Clients as **text, not logos**. Switch off via `SHOW_TESTIMONIALS` / `SHOW_CLIENTS` if permission is withdrawn |
| West End shopping | Yell snippet and OA | Added as service 12 |
| Concerts, hospital visits, long distance | Not in OA or public sources; present in the Vercel copy | Kept as plain journey types; no promises |
| 15,000+ journeys; 100% reliability; "never late" | None | **Removed** |
| Fixed prices, no surge, packages, refreshments, ribbons, red carpet, "no curfew", waiting service, corporate billing, commute packages | None | **Removed** |
| Named stadiums (Wembley, Twickenham, O2, Lord's) | None (OA says "rugby and football") | Removed from copy |
| "Reply within 30 minutes" | None (OA says "within 24 hrs") | Removed; no reply-time promise |
| Cash payment | None | Removed |
| Street address (Thrifts Mead, CM16 7NE) | OA and directories; appears to be a home address | **Not published**; locality only |

## 5. Retained contracts (verified by `tests/cms-contract.test.mjs`)

- **edit.js tag** is unchanged on every page: same `src`, same `data-site="t-l-executive-cars"`.
- **Every legacy text key** from `aab90e8` is present on the home page as a **text-leaf** element:
  - `brand.*`, `hero.*` (4), `services.eyebrow/title`, `services.0–11.title` and `.description`
  - `fleet.eyebrow/title/intro`, `fleet.<slug>.name/passengers/bags/description` for all four vehicles
  - `clients.*`, `testimonials.*` (including per-person quote/name/role), `about.*` (5), `areas.title`, `quote.*` (3), `footer.*` (3)
- **Image keys:** `fleet.<slug>.image` stay on real `<img>` elements with no overlays, so the picker opens on click.
- **Additive new keys:**
  - `services.intro`, `services.group.*`, `services.12.*`
  - `airports.*`, `airports.note.*`, `airportsPage.*`
  - `areas.intro`, `faq.*`, `quote.step.*`
  - `about.image` (an editable portrait slot; defaults to the badge)
- **Consistency:** keys shared between pages carry identical defaults.
- **Site settings:** `ANYOS_SETTINGS` exposes only `--tl-forest` and `--tl-brass`.
- **Enquiry:** `/api/enquiry` still takes the same JSON and posts the same structured `transfer-enquiry` payload, with the same `siteKey` and client ID. Notes are now joined with " · " because the platform flattens newlines. `travelTime` is now sent. Verified by `tests/enquiry-contract.test.mjs` against a local mock platform.
- **Hydration race:** edit.js can apply saved text *before* React hydrates. CMS text nodes carry `suppressHydrationWarning` so React keeps anyOS content instead of discarding the page. The browser suite shows zero console errors.

## 6. Risks and limits

- **Preview mode.** Enquiries are a **dry run** on anything but the production deployment (`VERCEL_ENV !== 'production'`), so reviewers never write into Simon's account. After any production release, `GET /api/enquiry` must report `"mode":"live"` (see HANDOFF.md release checklist).
- **Shared rate limit.** Enquiries are proxied from Vercel functions, so the platform's per-IP rate limit counts Vercel egress IPs, not customers. The risk is low at T&L's volume. A 429 is shown to the visitor with phone and email fallbacks.
- **Hours conflict.** The 24-hour claim in copy and structured data depends on question 1.
- **Vehicle photos** are manufacturer-style renders at 600×320 of unknown licence. They are adequate at card size, and Simon can replace each from anyOS.
- **Edit mode with a real secret** was not exercised (no secret held). The smoke test used a dummy token and never pressed Save.
