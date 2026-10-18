#!/usr/bin/env python3
"""Scene 2 (cabin) layers from HERO-006, the matching right-hand-drive W222 cabin.

    python3 scripts/motion/build_cabin.py <workdir> [--preview out.jpg]

The cabin itself never moves except for a gentle road sway. What moves is the
world outside the glass: it is cut out of the photograph, rebuilt behind the
pillars and mirror (row-wise, the landscape is horizontal bands), and split by
depth into sky and land, split in clear sky so no texture is ever doubled. As
the car drives on, the land spreads from the point straight ahead (the optical
flow of forward travel) while the sky barely moves. The sky dims towards dusk and the
cabin's amber ambient light rises. Outputs: public/media/motion/cabin/*,
lib/motion/cabin.json.
"""
import json
import sys
from pathlib import Path

import cv2
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from seg import grabcut  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'public' / 'media' / 'motion' / 'cabin'
GEO = ROOT / 'lib' / 'motion' / 'cabin.json'
FOE = (0.445, 0.258)       # straight ahead, on the horizon
BANDS = [('sky', 0.0, 0.212), ('land', 0.212, 1.0)]  # boundary sits in clear sky above the treeline
PORTRAIT_CX = 0.60         # phone crop centre (dash, wheel and side glass)


def row_fill(img, known):
    """Fill unknown pixels of each row by linear interpolation between known neighbours."""
    H, W = known.shape
    out = img.astype(np.float32).copy()
    xs = np.arange(W)
    last = None
    for y in range(H):
        k = known[y] > 0
        if k.sum() >= 2:
            for c in range(3):
                out[y, :, c] = np.interp(xs, xs[k], out[y, k, c])
            last = out[y].copy()
        elif last is not None:
            out[y] = last
    return out


def main():
    work = Path(sys.argv[1])
    preview = sys.argv[sys.argv.index('--preview') + 1] if '--preview' in sys.argv else None
    OUT.mkdir(parents=True, exist_ok=True)
    rgb = cv2.cvtColor(cv2.imread(str(work / 'hero-cabin-2752.png')), cv2.COLOR_BGR2RGB)
    H, W = rgb.shape[:2]
    win = grabcut(rgb, rect=(0.06, 0.0, 1.0, 0.44),
                  fg=[[(0.13, 0.03), (0.40, 0.03), (0.40, 0.18), (0.13, 0.20)], [(0.62, 0.04), (0.74, 0.04), (0.72, 0.15), (0.62, 0.17)],
                      [(0.12, 0.30), (0.60, 0.29), (0.60, 0.37), (0.12, 0.37)], [(0.88, 0.14), (0.99, 0.09), (0.99, 0.34), (0.89, 0.34)],
                      [(0.76, 0.05), (0.785, 0.05), (0.70, 0.30), (0.69, 0.27)]],
                  bg=[[(0, 0.44), (1, 0.44), (1, 1), (0, 1)], [(0, 0), (0.065, 0), (0.065, 0.44), (0, 0.44)],
                      [(0.44, 0.0), (0.60, 0.0), (0.60, 0.165), (0.44, 0.165)], [(0.805, 0.0), (0.835, 0.0), (0.725, 0.36), (0.70, 0.36)],
                      [(0.775, 0.30), (0.86, 0.30), (0.86, 0.40), (0.775, 0.40)], [(0.84, 0.0), (1, 0.0), (1, 0.03), (0.86, 0.07)]],
                  iters=8, scale=0.5, largest=False)
    # pick up stray sky next to the glass (cool, bright) that the cut missed
    f = rgb.astype(np.float32)
    skyish = ((f[..., 2] > f[..., 0] + 10) & (f.mean(2) > 95)).astype(np.float32)
    nearw = cv2.dilate((win > 0.5).astype(np.uint8), np.ones((61, 61), np.uint8)).astype(np.float32)
    yy = np.mgrid[0:H, 0:W][0] / H
    win = np.maximum(win, cv2.GaussianBlur(skyish * nearw * (yy < 0.30), (0, 0), 1.5))
    win = np.clip(win, 0, 1)
    known = (win > 0.9).astype(np.uint8)
    known = cv2.erode(known, np.ones((5, 5), np.uint8))  # avoid frame-edge pixels in the fill
    pano = row_fill(rgb, known)
    pano = cv2.GaussianBlur(pano, (0, 0), 0.6)
    # keep real pixels where the glass is clear
    k3 = cv2.GaussianBlur(known.astype(np.float32), (0, 0), 1.2)[..., None]
    pano = rgb * k3 + pano * (1 - k3)
    # below the windows nothing is visible; continue the fields downward (soft)
    def grade_dusk(img):
        g = img.astype(np.float32) / 255
        L = g.mean(2, keepdims=True)
        out = g * 0.56 * np.array([0.86, 0.92, 1.12], np.float32) + 0.02 * np.array([0.1, 0.15, 0.4], np.float32) * L
        return np.clip(out * 255, 0, 255)
    interior_a = 1 - win
    # amber ambient strips: saturated warm highlights inside the cabin
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV).astype(np.float32)
    amber = ((hsv[..., 0] >= 5) & (hsv[..., 0] <= 22) & (hsv[..., 1] > 120) & (hsv[..., 2] > 150)).astype(np.float32) * interior_a
    glow = np.zeros_like(f)
    for sig, k in ((2, 1.0), (10, 0.7), (34, 0.45)):
        glow += cv2.GaussianBlur(amber, (0, 0), sig)[..., None] * k * np.array([255, 150, 70], np.float32)
    glow = np.clip(glow * 0.8, 0, 255)

    def write(name, img, a=None, widths=(2400, 1600, 960), q=80):
        for fw in widths:
            s = fw / W
            im = cv2.resize(img.astype(np.float32), (fw, int(round(H * s))), interpolation=cv2.INTER_AREA)
            if a is not None:
                aa = cv2.resize(a.astype(np.float32), (fw, int(round(H * s))), interpolation=cv2.INTER_AREA)
                bgra = cv2.cvtColor(np.dstack([np.clip(im, 0, 255), np.clip(aa, 0, 1) * 255]).astype(np.uint8), cv2.COLOR_RGBA2BGRA)
                cv2.imwrite(str(OUT / f'{name}-{fw}.webp'), bgra, [cv2.IMWRITE_WEBP_QUALITY, q])
            else:
                cv2.imwrite(str(OUT / f'{name}-{fw}.webp'), cv2.cvtColor(np.clip(im, 0, 255).astype(np.uint8), cv2.COLOR_RGB2BGR), [cv2.IMWRITE_WEBP_QUALITY, q])
        # phone crop
        cw = int(round(H * 9 / 16))
        x0 = int(min(W - cw, max(0, PORTRAIT_CX * W - cw / 2)))
        for pw in (720, 1080):
            crop = img[:, x0:x0 + cw].astype(np.float32)
            ph = int(round(H * pw / cw))
            im = cv2.resize(crop, (pw, ph), interpolation=cv2.INTER_AREA)
            if a is not None:
                aa = cv2.resize(a[:, x0:x0 + cw].astype(np.float32), (pw, ph), interpolation=cv2.INTER_AREA)
                bgra = cv2.cvtColor(np.dstack([np.clip(im, 0, 255), np.clip(aa, 0, 1) * 255]).astype(np.uint8), cv2.COLOR_RGBA2BGRA)
                cv2.imwrite(str(OUT / f'{name}-p{pw}.webp'), bgra, [cv2.IMWRITE_WEBP_QUALITY, q])
            else:
                cv2.imwrite(str(OUT / f'{name}-p{pw}.webp'), cv2.cvtColor(np.clip(im, 0, 255).astype(np.uint8), cv2.COLOR_RGB2BGR), [cv2.IMWRITE_WEBP_QUALITY, q])
        return x0 / W

    write('interior', rgb, interior_a, q=82)
    write('glow', glow, None, widths=(1600, 960), q=78)
    band_alpha = {}
    # sky layer: opaque base; below the boundary it simply continues the sky
    sky = pano.copy()
    yb = int(0.205 * H)
    sky[yb:] = cv2.GaussianBlur(pano[yb - 8:yb], (0, 0), 3).mean(0, keepdims=True)
    land_a = np.clip((yy - 0.198) / 0.020, 0, 1)
    band_alpha['sky'] = np.ones((H, W), np.float32)
    band_alpha['land'] = land_a
    write('out-sky', sky, None, q=80)
    write('out-sky-dusk', grade_dusk(sky), None, q=78)
    write('out-land', pano, land_a, q=80)
    write('out-land-dusk', grade_dusk(pano), land_a, q=78)
    px = (min(W - H * 9 / 16, max(0, PORTRAIT_CX * W - H * 9 / 32))) / W
    geo = dict(frame=[W, H], aspect=W / H, foe=FOE, bands=[b[0] for b in BANDS], portraitX=px, portraitW=(H * 9 / 16) / W)
    GEO.write_text(json.dumps(geo, indent=1))
    print('cabin layers written; portraitX', round(px, 4))
    if preview:
        frames = []
        for t in (0.0, 0.5, 1.0):
            out = np.zeros_like(f)
            rates = dict(sky=0.01, land=0.16)
            layers = dict(sky=sky, land=pano)
            for name, _, _ in BANDS:
                s = 1 + rates[name] * t
                cx, cy = FOE[0] * W, FOE[1] * H
                M = np.float32([[s, 0, cx * (1 - s)], [0, s, cy * (1 - s)]])
                d = grade_dusk(layers[name]) * t + layers[name] * (1 - t)
                im = cv2.warpAffine(d.astype(np.float32), M, (W, H), borderMode=cv2.BORDER_REFLECT)
                a = cv2.warpAffine(band_alpha[name], M, (W, H))[..., None]
                out = out * (1 - a) + im * a
            out = out * win[..., None] + rgb * interior_a[..., None]
            out = 255 - (255 - out) * (1 - glow / 255 * 0.6 * t)
            frames.append(cv2.resize(np.clip(out, 0, 255).astype(np.uint8), (1376, 768), interpolation=cv2.INTER_AREA))
        cv2.imwrite(preview, cv2.cvtColor(np.vstack(frames), cv2.COLOR_RGB2BGR), [cv2.IMWRITE_JPEG_QUALITY, 84])


if __name__ == '__main__':
    main()
