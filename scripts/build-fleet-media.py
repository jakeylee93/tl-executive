#!/usr/bin/env python3
"""Web versions of the 4K studio fleet masters (OpenArt, 18 Oct 2026).

    python3 scripts/build-fleet-media.py

Reads each master from root's canonical Mission Control copy, or the local
public/media/tl-20261018/ copy (ignored by git and Vercel, never served),
and writes
public/media/fleet/<slug>-1600.webp: resize only, no other edit. One width,
because anyOS replaces an editable image's src and a srcset would override
the owner's replacement. Provenance: ASSET-LOG.md.
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent / 'public' / 'media'
CANON = Path('/Users/margaritabot/Mission-Control/tl-executive-rethink-20261018/assets')
MASTERS = {
    'sclass': ['sclass-studio-pilot-4k.png', 'pilot-sclass-4k.png'],
    'eclass': ['eclass-studio-4k.png', 'fleet-eclass-4k.png'],
    'vclass': ['vclass-studio-4k.png', 'fleet-vclass-4k.png'],
    'tourneo': ['tourneo-studio-4k.png', 'fleet-tourneo-4k.png'],
}
out = ROOT / 'fleet'
out.mkdir(exist_ok=True)
for slug, names in MASTERS.items():
    found = [d / n for d in (CANON, ROOT / 'tl-20261018') for n in names if (d / n).exists()]
    if not found:
        print(f'skip {slug}: not delivered')
        continue
    src, name = found[0], found[0].name
    im = Image.open(src).convert('RGB')
    w = 1600
    h = round(im.height * w / im.width)
    im.resize((w, h), Image.LANCZOS).save(out / f'{slug}-{w}.webp', 'WEBP', quality=82, method=6)
    print(f'{slug}-{w}.webp {w}x{h} from {name} {im.size}')
