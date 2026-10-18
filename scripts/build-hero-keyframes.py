#!/usr/bin/env python3
"""Web versions of the three same-car journey keyframes (OpenArt, 18 Oct 2026).

    python3 scripts/build-hero-keyframes.py [frames-dir]

Reads the 5504x3072 masters straight from root's canonical archive
(Mission Control hero-storyboard-4k.zip, hashes checked against
hero-master-receipt.json) and writes public/media/journey/k-*.webp.
Edits: resize; 9:16 phone crops of the cabin and aerial; a global evening
grade of the opening frame; on the aerial, the generated rear-plate and
boot-badge lettering and a tiny road sign are blurred until unreadable.
Nothing else.

With [frames-dir], also writes full-size JPEG copies (same pixels, < 10 MB)
for use as video start/end frames; those are never committed.
"""
import hashlib
import io
import json
import sys
import zipfile
from pathlib import Path
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter

ASSETS = Path('/Users/margaritabot/Mission-Control/tl-executive-rethink-20261018/assets')
OUT = Path(__file__).resolve().parent.parent / 'public' / 'media' / 'journey'
FRAMES = Path(sys.argv[1]) if len(sys.argv) > 1 else None

receipt = json.loads((ASSETS / 'hero-master-receipt.json').read_text())
masters = {}
with zipfile.ZipFile(ASSETS / 'hero-storyboard-4k.zip') as z:
    for f in receipt['files']:
        data = z.read(f['zip_entry'])
        assert hashlib.sha256(data).hexdigest() == f['sha256'], f['zip_entry']
        masters[f['subject']] = Image.open(io.BytesIO(data)).convert('RGB')


def blur_box(im, box, radius=28):
    patch = im.crop(box).filter(ImageFilter.GaussianBlur(radius)).filter(ImageFilter.GaussianBlur(radius))
    mask = Image.new('L', patch.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((4, 4, patch.width - 4, patch.height - 4), radius=8, fill=255)
    im.paste(patch, box[:2], mask.filter(ImageFilter.GaussianBlur(4)))


def save(im, name, widths):
    for w in widths:
        h = round(im.height * w / im.width)
        im.resize((w, h), Image.LANCZOS).save(OUT / f'{name}-{w}.webp', 'WEBP', quality=80, method=6)
        print(f'{name}-{w}.webp {w}x{h}')


def portrait(im, name, cx):
    w = round(im.height * 9 / 16)
    x0 = max(0, min(im.width - w, round(im.width * cx - w / 2)))
    crop = im.crop((x0, 0, x0 + w, im.height))
    for pw in (720, 1080):
        ph = round(crop.height * pw / crop.width)
        crop.resize((pw, ph), Image.LANCZOS).save(OUT / f'{name}-p{pw}.webp', 'WEBP', quality=80, method=6)
        print(f'{name}-p{pw}.webp {pw}x{ph}')


opening = masters['hero-opening']
cabin = masters['hero-cabin']
aerial = masters['hero-aerial'].copy()
blur_box(aerial, (3168, 2300, 3310, 2368))   # generated rear-plate lettering
blur_box(aerial, (3116, 2308, 3180, 2344), 12)  # generated boot-badge lettering
blur_box(aerial, (1176, 808, 1248, 880), 14)  # tiny blue road sign, top left

save(opening, 'k-opening', [960, 1600, 2400])
eve = ImageEnhance.Brightness(opening).enhance(0.62)
eve = ImageEnhance.Contrast(eve).enhance(1.08)
r, g, b = eve.split()
eve = Image.merge('RGB', (r.point(lambda v: int(v * 0.93)), g.point(lambda v: int(v * 0.97)), b.point(lambda v: min(255, int(v * 1.08)))))
save(eve, 'k-opening-eve', [960, 1600, 2400])
save(cabin, 'k-cabin', [960, 1600, 2400])
portrait(cabin, 'k-cabin', 0.56)
save(aerial, 'k-aerial', [960, 1600, 2400])
portrait(aerial, 'k-aerial', 0.56)

if FRAMES:
    FRAMES.mkdir(parents=True, exist_ok=True)
    for subject, im in (('opening', opening), ('cabin', cabin), ('aerial', aerial)):
        p = FRAMES / f'frame-{subject}.jpg'
        im.save(p, 'JPEG', quality=92, subsampling=0, optimize=True)
        size = p.stat().st_size
        assert size < 10_000_000, (p, size)
        print(f'{p.name} {im.size} {size} bytes sha256 {hashlib.sha256(p.read_bytes()).hexdigest()}')
