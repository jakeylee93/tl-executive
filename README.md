# T&L Executive Cars

Website for Theydon & Loughton Executive Cars (Theydon Bois, est. 2008), hosted on Vercel
(`anyos/tl-executive`) and connected to the T&L client account in anyOS (site key `t-l-executive-cars`).

## Development

```bash
pnpm install --frozen-lockfile   # Vercel builds with pnpm from pnpm-lock.yaml
npm run dev
npm run typecheck
npm run build
npm test                         # anyOS CMS + enquiry contract tests (needs a build)
npm run test:browser -- http://localhost:3100   # browser QA; see tests/browser/site.mjs for env vars
```

## anyOS

- `platform.anyos.co.uk/edit.js` hydrates every `data-anyos` / `data-anyos-img` element with the owner's saved
  content and powers live editing (`?anyos_edit=…` from the anyOS Website module). Rules: DESIGN.md → "anyOS editing rules".
- Enquiries post to `/api/enquiry`, which forwards the structured fields to the platform's
  `/api/public/transfer-enquiry` (a booking to quote in the T&L account).

| Env var | Purpose |
|---|---|
| `ENQUIRY_MODE` | `live` or `dry-run`. Default: `live` only on the production deployment, `dry-run` everywhere else (previews, local). |
| `ANYOS_SITE_LEAD_TOKEN` | Optional server-side token enabling the legacy `site-lead` fallback. Never commit it. |
| `ANYOS_PLATFORM_ORIGIN` | Tests only: point the route at a mock platform. |

`GET /api/enquiry` reports the current mode (no secrets).

See AUDIT.md, RESEARCH.md, DESIGN.md and HANDOFF.md.
