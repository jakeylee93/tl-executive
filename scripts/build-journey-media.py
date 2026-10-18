#!/usr/bin/env python3
"""Builds the provisional opening-journey keyframes in public/media/journey/.

    python3 scripts/build-journey-media.py <source-dir>

<source-dir> holds the two Wikimedia Commons originals (see ASSET-LOG.md):
  car0.jpg   "Mercedes-Benz S-Class, Mayfair, London 01.jpg"  (Jason Lawrence, CC BY 4.0)
  cabin5.jpg "The interior of Mercedes-Benz S400 HYBRID (W222).JPG" (Tokumeigakarinoaoshima, CC0)

Edits, all recorded in ASSET-LOG.md: crop, resize, a GLOBAL colour grade, and
on the exterior one local privacy edit (the real registration plate is
blurred until unreadable). Nothing is added, removed or redrawn. The night
motorway scene reuses the existing /media/night-* plate.
"""
import sys
from pathlib import Path
from PIL import Image, ImageEnhance, ImageFilter, ImageDraw

SRC = Path(sys.argv[1])
OUT = Path(__file__).resolve().parent.parent / 'public' / 'media' / 'journey'
OUT.mkdir(parents=True, exist_ok=True)


def grade(im, brightness=1.0, contrast=1.0, saturation=1.0, rgb=(1.0, 1.0, 1.0)):
    im = ImageEnhance.Brightness(im).enhance(brightness)
    im = ImageEnhance.Contrast(im).enhance(contrast)
    im = ImageEnhance.Color(im).enhance(saturation)
    if rgb != (1.0, 1.0, 1.0):
        r, g, b = im.split()
        r, g, b = (ch.point(lambda v, k=k: min(255, int(v * k))) for ch, k in zip((r, g, b), rgb))
        im = Image.merge('RGB', (r, g, b))
    return im


def save(im, name, widths):
    for w in widths:
        h = round(im.height * w / im.width)
        im.resize((w, h), Image.LANCZOS).save(OUT / f'{name}-{w}.webp', 'WEBP', quality=80, method=6)
        print(f'{name}-{w}.webp {w}x{h}')


# Exterior: black W223 S-Class in a dark garage doorway, Mayfair. --------------
car = Image.open(SRC / 'car0.jpg').convert('RGB')
assert car.size == (5184, 3888), car.size
# Privacy: the real registration plate (x 3150-3950, y 2650-2865) is blurred
# until no character survives; feathered so no hard patch shows.
box = (3110, 2615, 3990, 2900)
patch = car.crop(box).filter(ImageFilter.GaussianBlur(70)).filter(ImageFilter.GaussianBlur(40))
mask = Image.new('L', patch.size, 0)
ImageDraw.Draw(mask).rounded_rectangle((18, 18, patch.width - 18, patch.height - 18), radius=24, fill=255)
car.paste(patch, box[:2], mask.filter(ImageFilter.GaussianBlur(10)))
# 16:10 crop that keeps the whole car and drops the signs at both edges.
ext = car.crop((150, 400, 5050, 3462))
save(grade(ext, 0.98, 1.04, 0.9), 'exterior', [960, 1600, 2400])
# Evening state of the SAME frame: a global grade only (darker, cooler).
save(grade(ext, 0.6, 1.1, 0.82, (0.92, 0.97, 1.08)), 'exterior-eve', [960, 1600, 2400])

# Cabin: W222 S-Class, cream leather, seen between the front seats. ---------
cab = Image.open(SRC / 'cabin5.jpg').convert('RGB')
assert cab.size == (2588, 1930), cab.size
# The windscreen (top 26%) shows a showroom with people and signage: cropped.
inner = cab.crop((0, 502, 2588, 1930))
cg = grade(inner, 0.84, 1.05, 0.9, (1.02, 1.0, 0.96))
save(cg, 'cabin', [960, 1600, 2400])
portrait = cg.crop((890, 0, 890 + 803, 1428))
for w in (720, 1080):
    h = round(1428 * w / 803)
    portrait.resize((w, h), Image.LANCZOS).save(OUT / f'cabin-p{w}.webp', 'WEBP', quality=80, method=6)
    print(f'cabin-p{w}.webp {w}x{h}')
