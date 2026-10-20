#!/usr/bin/env python3
"""Web stills (WebP at several widths) from a generated master.

    python3 scripts/media/build_stills.py SRC public/media/DIR/NAME [--aspect 4:3] [--cx 0.5] [--widths 960,1600,2400]

Crops to --aspect around --cx (fraction of the width; the full height is
kept) when the master is wider than that aspect, then writes NAME-<w>.webp.
Used for the Journeys photographs and the fleet's four parked cars (FILM.md).
"""
import argparse
from pathlib import Path

from PIL import Image


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('src')
    ap.add_argument('out')
    ap.add_argument('--aspect')
    ap.add_argument('--cx', type=float, default=0.5)
    ap.add_argument('--widths', default='960,1600,2400')
    a = ap.parse_args()
    im = Image.open(a.src).convert('RGB')
    if a.aspect:
        n, d = (float(x) for x in a.aspect.split(':'))
        cw = round(im.height * n / d)
        if cw < im.width:
            x0 = round(min(max(a.cx * im.width - cw / 2, 0), im.width - cw))
            im = im.crop((x0, 0, x0 + cw, im.height))
    out = Path(a.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    for w in (int(x) for x in a.widths.split(',')):
        w = min(w, im.width)
        im.resize((w, round(im.height * w / im.width)), Image.LANCZOS).save(f'{out}-{w}.webp', quality=86, method=6)
        print(f'{out}-{w}.webp', w)


if __name__ == '__main__':
    main()
