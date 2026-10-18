#!/usr/bin/env python3
"""Scene 1 (arrival) layers from HERO-005, the W222 on the lane at golden hour.

    python3 scripts/motion/build_arrival.py <workdir> [--preview out.jpg]

The car is cut out of the photograph and genuinely moves: it rolls ROLL_M
metres forward along its own axis and settles, its wheels turn by the
distance travelled, and its lamps come on. Nothing is morphed or dissolved.

Because the car moves, a little background is uncovered behind its tail and
under its roof line. That strip is clone-filled from neighbouring hedge, verge
and road (Poisson blend) — ordinary retouching of an empty background, never
of the car. Outputs: public/media/motion/arrival/*, lib/motion/arrival.json.
"""
import json
import sys
from pathlib import Path

import cv2
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from seg import grabcut  # noqa: E402
from wheels import extract_wheel  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'public' / 'media' / 'motion' / 'arrival'
GEO = ROOT / 'lib' / 'motion' / 'arrival.json'
ROLL_M = 0.75
WHEELBASE = 3.165
TYRE_D = 0.71

SEG = dict(
    rect=(0.345, 0.405, 0.93, 0.85),
    fg=[[(0.40, 0.60), (0.55, 0.52), (0.70, 0.46), (0.88, 0.50), (0.90, 0.66), (0.70, 0.72), (0.42, 0.74)],
        [(0.52, 0.47), (0.62, 0.44), (0.70, 0.45), (0.58, 0.50)]],
    bg=[[(0, 0), (1, 0), (1, 0.39), (0, 0.39)], [(0, 0.86), (1, 0.86), (1, 1), (0, 1)],
        [(0, 0), (0.34, 0), (0.34, 1), (0, 1)], [(0.935, 0), (1, 0), (1, 1), (0.935, 1)],
        [(0.862, 0.475), (0.885, 0.475), (0.885, 0.505), (0.862, 0.505)]],
    prbg=[[(0.66, 0.80), (0.82, 0.775), (0.83, 0.83), (0.67, 0.85)]],
)
WHEELS = [((1712, 1137), (190, 270), 0), ((2408, 1075), (110, 215), 0)]
# headlamp (right, near the camera) and the far one, as polygons (normalised)
LAMPS = [
    [(0.503, 0.640), (0.540, 0.613), (0.585, 0.605), (0.584, 0.624), (0.548, 0.656), (0.508, 0.664)],
    [(0.362, 0.612), (0.378, 0.597), (0.382, 0.640), (0.366, 0.650)],
]


def shift(img, dx, dy):
    """S[p] = img[p + (dx, dy)], mirrored at the borders."""
    H, W = img.shape[:2]
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    return cv2.remap(img, xx + dx, yy + dy, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)


def warp_alpha(alpha, T):
    H, W = alpha.shape
    return cv2.warpAffine(alpha, T, (W, H), flags=cv2.INTER_LINEAR)


def main():
    work = Path(sys.argv[1])
    preview = sys.argv[sys.argv.index('--preview') + 1] if '--preview' in sys.argv else None
    OUT.mkdir(parents=True, exist_ok=True)
    GEO.parent.mkdir(parents=True, exist_ok=True)
    rgb = cv2.cvtColor(cv2.imread(str(work / 'hero-opening-2752.png')), cv2.COLOR_BGR2RGB)
    H, W = rgb.shape[:2]
    alpha = grabcut(rgb, iters=8, **SEG)
    wf, wr = [extract_wheel(rgb, g, n=5, R=150) for g in WHEELS]
    hf, hr = np.array(wf['hub_img']), np.array(wr['hub_img'])
    # contact line under the tyres; keep a soft shadow skirt below it
    def tyre_bottom(w):
        x = int(w['hub_img'][0])
        col = alpha[:, x - 3:x + 4].mean(1)
        return int(np.nonzero(col > 0.5)[0].max())
    gf, gr = tyre_bottom(wf), tyre_bottom(wr)
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    line = gf + (xx - hf[0]) * (gr - gf) / (hr[0] - hf[0])
    core = np.where(yy > line + 2, 0, alpha).astype(np.float32)
    skirt_h = 0.022 * H
    below = np.clip(1 - (yy - line) / skirt_h, 0, 1) * (yy > line)
    xs = np.nonzero(core.max(0) > 0.5)[0]
    span = ((xx >= xs.min() + 0.02 * W) & (xx <= xs.max() - 0.01 * W)).astype(np.float32)
    span = cv2.GaussianBlur(span, (0, 0), 0.01 * W)
    skirt = below * span * 0.85
    car_a = np.maximum(core, skirt)
    # motion: along the wheelbase vector, with the perspective growth measured from the two wheels
    axis = (hf - hr) / WHEELBASE  # image px per metre, forwards
    grow = (wf['lip']['h'] / wr['lip']['h']) ** (1 / WHEELBASE)  # scale per metre forwards
    d = axis * ROLL_M
    s_end = grow ** ROLL_M
    anchor = hf  # scale about the front hub
    T_end = np.float32([[s_end, 0, anchor[0] * (1 - s_end) + d[0]], [0, s_end, anchor[1] * (1 - s_end) + d[1]]])
    new_a = warp_alpha(car_a, T_end)
    old = (car_a > 0.02).astype(np.uint8)
    newm = (new_a > 0.98).astype(np.uint8)
    exposed = (cv2.dilate(old, np.ones((21, 21), np.uint8)) & (1 - cv2.erode(newm, np.ones((5, 5), np.uint8)))).astype(np.uint8)
    # three kinds of uncovered background, each cloned from where that texture continues:
    # behind the tail -> hedge/verge/road to its right; under the body -> road below; above the roof -> foliage above
    tail_x = int(hr[0] - 0.02 * W)
    tail = np.zeros_like(exposed)
    tail[:, tail_x:] = exposed[:, tail_x:]
    road = ((yy > line - 6) & (exposed > 0) & (tail == 0)).astype(np.uint8)
    roof = (exposed & (1 - tail) & (1 - road)).astype(np.uint8)
    # base: the whole original car region rebuilt from its surroundings (smooth), so every
    # clone below blends against background only, never against the old car's chrome
    full = cv2.dilate(old, np.ones((21, 21), np.uint8))
    f = 4
    small = cv2.resize(rgb, (W // f, H // f), interpolation=cv2.INTER_AREA)
    msmall = cv2.resize(full * 255, (W // f, H // f), interpolation=cv2.INTER_NEAREST)
    base_small = cv2.inpaint(small, cv2.dilate(msmall, np.ones((3, 3), np.uint8)), 8, cv2.INPAINT_TELEA)
    base = rgb.copy()
    up = cv2.resize(base_small, (W, H), interpolation=cv2.INTER_CUBIC)
    base[full > 0] = up[full > 0]
    plate = base.copy()
    for m, (dx, dy) in ((tail, (0.085 * W, 0.0)), (road, (0.0, 0.05 * H)), (roof, (0.0, -0.035 * H))):
        if m.sum() == 0:
            continue
        src = shift(rgb, dx, dy)
        n, lab, stats, _ = cv2.connectedComponentsWithStats(m, 8)
        for i in range(1, n):
            x, y, w, h, area = stats[i]
            sel = lab == i
            if area < 30:
                plate[sel] = src[sel]
                continue
            mm = sel.astype(np.uint8) * 255
            pad = 6
            x0, y0 = max(1, x - pad), max(1, y - pad)
            x1, y1 = min(W - 2, x + w + pad), min(H - 2, y + h + pad)
            sub = cv2.dilate(mm[y0:y1, x0:x1], np.ones((5, 5), np.uint8))
            patch = src[y0:y1, x0:x1]
            ctr = ((x0 + x1) // 2, (y0 + y1) // 2)
            try:
                plate = cv2.seamlessClone(patch, plate, sub, ctr, cv2.NORMAL_CLONE)
            except cv2.error:
                plate[sel] = src[sel]
    # lamps: their own brightest pixels, lifted and bloomed
    lampm = np.zeros((H, W), np.float32)
    for p in LAMPS:
        cv2.fillPoly(lampm, [np.array([[int(x * W), int(y * H)] for x, y in p], np.int32)], 1.0)
    lgrey = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY).astype(np.float32) / 255
    core_l = np.clip((lgrey - 0.35) / 0.4, 0, 1) * lampm
    tint = np.array([1.0, 0.97, 0.92], np.float32)
    glow = np.zeros((H, W, 3), np.float32)
    for sig, k in ((1.5, 1.6), (6, 0.9), (18, 0.55), (60, 0.35)):
        g = cv2.GaussianBlur(core_l + lampm * 0.25, (0, 0), sig)
        glow += g[..., None] * k * tint
    glow = np.clip(glow, 0, 1)
    # dusk version of plate and car: same pixels, cooler and darker (light falls, sky keeps glow)
    def dusk(img, sky_keep=True):
        f = img.astype(np.float32) / 255
        L = f.mean(2, keepdims=True)
        lift = np.clip((L - 0.72) / 0.28, 0, 1) if sky_keep else 0
        g = f * (0.58 + 0.22 * lift)
        g = g * np.array([0.90, 0.95, 1.10], np.float32) + np.array([0.0, 0.004, 0.018], np.float32)
        return np.clip(g * 255, 0, 255).astype(np.uint8)
    # crop the car layer
    ys, xs2 = np.nonzero(car_a > 0.01)
    pad = 12
    cx0, cy0, cx1, cy1 = max(0, xs2.min() - pad), max(0, ys.min() - pad), min(W, xs2.max() + pad), min(H, ys.max() + pad)
    def write_rgba(path, im, a, w_out):
        h_out = int(round(im.shape[0] * w_out / im.shape[1]))
        bgra = cv2.cvtColor(np.dstack([im, (np.clip(a, 0, 1) * 255).astype(np.uint8)]), cv2.COLOR_RGBA2BGRA)
        cv2.imwrite(str(path), cv2.resize(bgra, (w_out, h_out), interpolation=cv2.INTER_AREA), [cv2.IMWRITE_WEBP_QUALITY, 84])
    car_rgb = rgb[cy0:cy1, cx0:cx1]
    car_alpha = car_a[cy0:cy1, cx0:cx1]
    cw = cx1 - cx0
    for frame_w in (2400, 1600, 960):
        s = frame_w / W
        write_rgba(OUT / f'car-{frame_w}.webp', car_rgb, car_alpha, int(round(cw * s)))
        write_rgba(OUT / f'car-dusk-{frame_w}.webp', dusk(car_rgb, False), car_alpha, int(round(cw * s)))
        for name, im in (('plate', plate), ('plate-dusk', dusk(plate))):
            out = cv2.resize(im, (frame_w, int(round(H * s))), interpolation=cv2.INTER_AREA)
            cv2.imwrite(str(OUT / f'{name}-{frame_w}.webp'), cv2.cvtColor(out, cv2.COLOR_RGB2BGR), [cv2.IMWRITE_WEBP_QUALITY, 80])
    # glow layer (screen-blended over the car), cropped around the lamps
    gy, gx = np.nonzero(glow.max(2) > 0.01)
    gx0, gy0, gx1, gy1 = gx.min(), gy.min(), gx.max(), gy.max()
    g8 = (glow[gy0:gy1, gx0:gx1] * 255).astype(np.uint8)
    cv2.imwrite(str(OUT / 'glow.webp'), cv2.cvtColor(cv2.resize(g8, ((gx1 - gx0) // 2, (gy1 - gy0) // 2), interpolation=cv2.INTER_AREA), cv2.COLOR_RGB2BGR), [cv2.IMWRITE_WEBP_QUALITY, 85])
    wheels = []
    for tag, wh in (('f', wf), ('r', wr)):
        name = f'wheel-{tag}.webp'
        cv2.imwrite(str(OUT / name), cv2.cvtColor(wh['disc'], cv2.COLOR_RGBA2BGRA), [cv2.IMWRITE_WEBP_QUALITY, 88])
        dark = wh['disc'].copy()
        dark[..., :3] = dusk(dark[..., :3], False)
        cv2.imwrite(str(OUT / f'wheel-{tag}-dusk.webp'), cv2.cvtColor(dark, cv2.COLOR_RGBA2BGRA), [cv2.IMWRITE_WEBP_QUALITY, 88])
        wheels.append(dict(src=name, size=wh['size'], c=[wh['lip_img'][0] / W, wh['lip_img'][1] / H], M=(np.array(wh['M']) / W).tolist()))
    geo = dict(
        frame=[W, H], aspect=W / H,
        car=dict(box=[cx0 / W, cy0 / H, cx1 / W, cy1 / H]),
        glow=dict(box=[gx0 / W, gy0 / H, gx1 / W, gy1 / H]),
        wheels=wheels,
        roll=dict(metres=ROLL_M, axis=[float(axis[0] / W), float(axis[1] / W)], grow=float(grow), anchor=[float(anchor[0] / W), float(anchor[1] / H)],
                  wheelTurnDeg=float(ROLL_M / (np.pi * TYRE_D) * 360)),
    )
    GEO.write_text(json.dumps(geo, indent=1))
    print('wheels', [round(v, 1) for v in wf['hub_img']], [round(v, 1) for v in wr['hub_img']], 'axis px/m', axis.round(1), 'grow', round(grow, 4), 'turn', round(geo['roll']['wheelTurnDeg'], 1))
    if preview:
        frames = []
        for t in (0.0, 0.5, 1.0):
            m = ROLL_M * (1 - (1 - t) ** 2)
            s = grow ** m
            T = np.float32([[s, 0, anchor[0] * (1 - s) + axis[0] * m], [0, s, anchor[1] * (1 - s) + axis[1] * m]])
            car = cv2.warpAffine(rgb.astype(np.float32), T, (W, H))
            a = warp_alpha(car_a, T)[..., None]
            f = plate.astype(np.float32) * (1 - a) + car * a
            ang = m / (np.pi * TYRE_D) * 2 * np.pi
            for wh in (wf, wr):
                Mw = np.array(wh['M'])
                R = np.array([[np.cos(-ang), -np.sin(-ang)], [np.sin(-ang), np.cos(-ang)]])
                Tw = Mw @ R
                c = np.array(wh['lip_img'])
                c2 = np.array([s * c[0] + anchor[0] * (1 - s) + axis[0] * m, s * c[1] + anchor[1] * (1 - s) + axis[1] * m])
                oc = wh['size'] / 2
                Af = np.hstack([Tw * s, (c2 - (Tw * s) @ np.array([oc, oc]))[:, None]]).astype(np.float32)
                dw = cv2.warpAffine(wh['disc'], Af, (W, H), flags=cv2.INTER_LINEAR).astype(np.float32)
                da = dw[..., 3:] / 255
                f = f * (1 - da) + dw[..., :3] * da
            gl = cv2.warpAffine(glow, T, (W, H)) * t
            f = 255 - (255 - f) * (1 - gl)
            frames.append(cv2.resize(np.clip(f, 0, 255).astype(np.uint8), (1376, 768), interpolation=cv2.INTER_AREA))
        pl = cv2.resize(plate, (1376, 768), interpolation=cv2.INTER_AREA)
        cv2.imwrite(preview, cv2.cvtColor(np.vstack(frames + [pl]), cv2.COLOR_RGB2BGR), [cv2.IMWRITE_JPEG_QUALITY, 84])


if __name__ == '__main__':
    main()
