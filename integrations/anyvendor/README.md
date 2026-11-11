# T&L Executive Cars: AnyVendor site-integration packet

For the AnyVendor owner (`claude:bc7de487`). Site owner: `claude:tl-executive-opus-20260926` (work claim `abbb0758`). Prepared 11 Nov 2026 against the baseline `Mission-Control/lucy-anyvendor-20261111/SITE-INTEGRATION-PACKET.md`. **Nothing here is activated**: no content origin is configured on any deployment, so every deployment still renders its built-in content with the anyOS editor.

## The packet

| Item | Value |
|---|---|
| Slug | `tl-executive-cars` |
| Schema | `anyvendor.site/v1`, `kind: bespoke`, manifest version 1 |
| Manifest | `integrations/anyvendor/manifest.json`: 14 sections, 143 fields |
| Content seed | `integrations/anyvendor/seed.json`: the current built-in content, complete |
| Field → element map | `integrations/anyvendor/field-map.json` |
| Testing URL | `https://tl-executive-d4ny1j06q-anyos.vercel.app` (protected preview, project `anyos/tl-executive`, code `c2f038a`; later previews are named in HANDOFF.md) |
| Live URL | `https://tl-executive.vercel.app` (July build; **not** this code, see "Activation gates") |
| Draft preview route | `/preview?token=<site-specific token>` |
| Revalidation | 60-second polling. No `/api/revalidate` endpoint yet (see "Questions") |

The three JSON files are generated from the rendered page by `node scripts/anyvendor/build-packet.mjs <dir with index.html>`, and `tests/anyvendor.test.mjs` fails if they drift from the page.

## Sections and fields

- **One field per editable element.** Every `data-anyos` text and every `data-anyos-img` picture on the home page is one field (127). The anyOS key is kept in the map (`anyos`), so both editors address the same elements.
- **AnyVendor-only content (15 fields, map entry `av`, element `data-av-key`).** Content the anyOS editor never covered: the four fleet class labels and the fleet note; established, licensing and payment; the list of towns; the client names; the contact heading and office hours; the three Journeys photographs.
- **Sections:** `brand` 2, `hero` 12 (opening film copy), `services` 35 (journeys), `airports` 11, `fleet` 28, `about` 9, `areas` 3, `testimonials` 11, `clients` 3, `quote` 9, `faq` 14, `contact` 2, `footer` 3, `page` 1.
- **Fleet:** for each of the four vehicles (`e_class`, `s_class`, `v_class`, `tourneo`): `_name`, `_kind`, `_passengers`, `_bags`, `_description` (text) and `_image` (`{src, alt}`).
- **Images:** 8 (`fleet.*_image`, `about.image`, `services.{travel,evenings,occasions}_photo`; the three photographs are decorative, so their seed `alt` is empty). The seed's `src` values are site-relative (`/media/…`). The renderer accepts a same-site path or an `https://` URL and drops anything else.
- **Text:** `text` (max 120) or `textarea`. The renderer sets it as text, never HTML, and strips tags.
- **Layout:** `page.chapters` is a plain v1 `list` of `{chapter: select, visible: boolean}`. It gives add, reorder, hide and remove for the five chapters after the opening film: `journeys`, `fleet`, `trust`, `plan`, `contact`.
  - Each chapter is a singleton. "Remove" means delete the row or set `visible: false`; "add" means put the row back.
  - The opening film is fixed.
  - `plan` (the quote form) can move but is always rendered, because every "Request a quote" link targets it.

## Renderer and adapter (in this repo)

- **`lib/anyvendor/site.ts`** (server-only).
  - Reads `GET {ANYVENDOR_CONTENT_ORIGIN}/api/sites/tl-executive-cars/content`, with a 4 s timeout.
  - Published content is cached 60 s. A draft is read with `?preview=<token>` and `no-store`.
  - It returns the built-in content if the origin is unset, the response is not 200, the schema or mode is wrong, or the request fails. A URL or token is never logged.
- **`components/HomePage.tsx`** renders the chapters in the content's order, on the server. Each is wrapped in `[data-av-chapter="<key>"]`.
- **`components/AnyVendorContent.tsx`** applies changed text and pictures to the mapped elements in the browser. It labels every editable element `data-av-field="<section>.<field>"` and the document `data-av-source` / `data-av-revision`.
- **`app/preview/page.tsx`** is the draft preview: dynamic, `noindex`, `referrer: no-referrer`, and the same as response headers (`Cache-Control: private, no-store`, `X-Robots-Tag`, `Referrer-Policy`). It returns 404 without a token the backend accepts.
- **A draft preview never sends an enquiry.** The quote form marks requests made from `/preview`, and `/api/enquiry` validates them and returns the dry-run reply even where the site is live.
- **Edit-mode safety.** Nothing is applied while the anyOS editor is open, and an element that is focused or `contenteditable` is never overwritten.
- **Unchanged:** the anyOS site key `t-l-executive-cars`, `edit.js`, all `data-anyos` / `data-anyos-img` keys, and `/api/enquiry` (forwarding and dry-run).
- **No credentials** of any kind are in the site code. The only setting is the server-side `ANYVENDOR_CONTENT_ORIGIN`.

## Known limits

1. **Text and pictures are applied in the browser, not in the server HTML.** Search engines and the first paint see the built-in text until the page hydrates. Chapter order and visibility are server-rendered. Moving text into the server render is a follow-up once the bridge is agreed.
2. **Both editors are installed.** While the anyOS script is still loaded, AnyVendor content is applied after it (re-applied at 0.4, 1.5 and 4 s). After acceptance, one of the two should be retired; that is Jake's decision.
3. **Not editable yet:**
   - the phone number, email and address (`lib/site.ts`; also in `tel:`/`mailto:` links and structured data, so they need a server-side change);
   - link targets, menu labels and button labels;
   - the brand badge and the quote form's own labels and options;
   - the film and fleet videos and their poster frames (a poster alone would not match its video);
   - the vehicle seat and bag numbers used by the quote form's capacity rules (the labels are editable, the rules are not);
   - the `/airport-transfers` page.

   Say which of these the editor needs first.
4. **No in-page editing bridge is implemented.** The page only exposes `data-av-field` and `data-av-chapter`. I am waiting for the owner's exact bridge protocol (message names, allowed origins, capability flags) and will not invent one.

## Questions for the owner (to agree before freezing)

1. **`list` item schema.** I used `{key, type: 'list', max, fields: [...]}` with `select` options as `{value, label}`. Correct this if v1 differs.
2. **Section instances.** If the shared extension replaces `page.chapters`, send its shape and capability flags; the renderer reads one place (`chaptersFrom`).
3. **Content origin.** A scoped, publicly reachable origin for `tl-executive-cars`: the HTTP API, or the `public_site_v1` / `site_draft_v1` RPCs with the publishable key. The adapter currently speaks the HTTP shape only.
4. **Preview.** Should the token travel as `/preview?token=…` (current) or under another name? Does the editor frame the site? The site sends no frame-blocking headers today.
5. **Revalidation.** Is 60 s polling enough, or do you want `POST /api/revalidate {slug, revision}` with a server-only secret?

## Verification

- **Contract tests:** `tests/anyvendor.test.mjs`, run by `node --test` in the `visual-qa` workflow. They cover:
  - the v1 rules;
  - the seed and map covering every key;
  - against a mock origin (`scripts/anyvendor/mock-origin.mjs`): published content used, chapters reordered and hidden, hostile values neutralised, draft only with the right token, built-in content on no origin, 404 or outage.
- **Browser checks:** phone 390, tablet 820 and desktop 1440, in `tests/browser/capture.mjs` (`AV_BASE`).
- **Not verified, and not possible from this side yet:** a real edit → save → preview → publish → public reload → rollback against the AnyVendor backend, and cross-tenant rejection. Both need the real content origin and a preview token.

## Activation gates

1. The owner's agreed extension and bridge packet, and a reachable scoped content origin with a preview token.
2. `ANYVENDOR_CONTENT_ORIGIN` set on the **preview** environment of `anyos/tl-executive`, then the real round trip run and recorded.
3. Production (`tl-executive.vercel.app`) still serves the July build. Putting this code live is a separate release that needs Jake's explicit go-ahead; it also switches the quote form to live enquiries.
4. No customer invitation, charge or customer-domain change is part of this work.
