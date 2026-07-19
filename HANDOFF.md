# Handoff

## Current

- Recovered the complete production source and image assets from the original Vercel deployment.
- Replaced the navy-heavy visual system with a bright white, warm silver and champagne design.
- Added anyOS Website 2.0 live-edit markers and the `t-l-executive-cars` site key.
- Replaced the fake quote alert with an anyOS enquiry handoff for the T&L client account.
- Production project: `anyos/tl-executive`.
- Canonical testing URL: `https://tl-executive.vercel.app`.

## Coordination

- This repository is separate from `anyos-platform`; Claude's module work is unaffected.
- Do not put anyOS credentials in this repository. The public T&L client ID is set server-side only to route enquiries to the correct account.
- The duplicate Vercel project `tl-executive-cars` serves the old copy and should not be used for future deployments.
