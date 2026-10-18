#!/usr/bin/env python3
"""Scene 3 (night) layers from HERO-007, the same W222 seen from above on the motorway.

    python3 scripts/motion/build_night.py <workdir> [--preview out.jpg]

The car is cut out and genuinely drives away up its lane: its position follows
the lane (parallel to the offside edge line) and its size follows the ground
plane (proportional to distance below the horizon). The pool of light its
headlamps throw on the road is lifted off the photograph as a light map and
travels with it; its tail-light glow travels with it too. The road under the
car is rebuilt from the surrounding asphalt. The generated number plate,
boot-badge lettering and a tiny road sign stay blurred, as in every derivative.
Outputs: public/media/motion/night/*, lib/motion/night.json.
"""
import json
import sys
from pathlib import Path

import cv2
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from seg import grabcut  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'public' / 'media' / 'motion' / 'night'
GEO = ROOT / 'lib' / 'motion' / 'night.json'

HORIZON = 0.260          # ground-plane horizon: where the two carriageway edge lines meet
EDGE = ((0.6545, 0.805), (0.3606, 0.423))  # offside edge line, near → far (measured)
GROUND_Y = 0.805         # where the car meets the road now
END_Y = 0.470            # where it is when the scene settles
BLUR = [(1584, 1150, 1655, 1184, 14), (1558, 1154, 1590, 1172, 6), (588, 404, 624, 440, 7)]  # at 2752 px


def blur_boxes(img):
    out = img.copy()
    for x0, y0, x1, y1, r in BLUR:
        patch = out[y0:y1, x0:x1]
        out[y0:y1, x0:x1] = cv2.GaussianBlur(cv2.GaussianBlur(patch, (0, 0), r), (0, 0), r)
    return out


def edge_x(y):
    (ex0, ey0), (ex1, ey1) = EDGE
    return ex0 + (y - ey0) * (ex1 - ex0) / (ey1 - ey0)


def lane_fill(img, hole, split_y):
    """Fill hole pixels with road from further along the same lane (perspective-correct):
    keep each pixel's across-lane position relative to the offside edge line, move its
    depth (1/(y - horizon)) by dz, and sample there. Above split_y use road further
    away, below it road nearer the camera."""
    H, W = hole.shape
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    y = yy / H
    x = xx / W
    s = (y - HORIZON) / (GROUND_Y - HORIZON)
    a = (edge_x(y) - x) / np.maximum(s, 1e-3)
    z = 1 / np.maximum(y - HORIZON, 1e-3)
    fills = []
    for dz in (0.56, -0.40):
        z2 = z + dz
        y2 = HORIZON + 1 / z2
        y2 = np.where(y2 > 0.995, 1.99 - y2, y2)  # mirror at the bottom edge
        s2 = (y2 - HORIZON) / (GROUND_Y - HORIZON)
        x2 = edge_x(y2) - a * s2
        fills.append(cv2.remap(img, (x2 * W).astype(np.float32), (y2 * H).astype(np.float32), cv2.INTER_LINEAR,
                               borderMode=cv2.BORDER_REFLECT).astype(np.float32))
    # match each copy's tone to the road just outside the hole, then cross-blend across split_y
    ring = (cv2.dilate(hole, np.ones((25, 25), np.uint8)) > 0) & (hole == 0)
    ref = img[ring].reshape(-1, 3).astype(np.float32).mean(0)
    for i, f in enumerate(fills):
        fills[i] = f * (ref / np.maximum(f[hole > 0].reshape(-1, 3).mean(0), 1))[None, None, :]
    w = np.clip((y - (split_y - 0.025)) / 0.05, 0, 1)[..., None]
    blend = fills[0] * (1 - w) + fills[1] * w
    out = img.astype(np.float32).copy()
    out[hole > 0] = blend[hole > 0]
    out = np.clip(out, 0, 255).astype(np.uint8)
    return out


def main():
    work = Path(sys.argv[1])
    preview = sys.argv[sys.argv.index('--preview') + 1] if '--preview' in sys.argv else None
    OUT.mkdir(parents=True, exist_ok=True)
    rgb = cv2.cvtColor(cv2.imread(str(work / 'hero-aerial-2752.png')), cv2.COLOR_BGR2RGB)
    raw = rgb.copy()
    rgb = blur_boxes(rgb)
    H, W = rgb.shape[:2]
    alpha = grabcut(rgb, rect=(0.498, 0.655, 0.622, 0.83),
                    fg=[[(0.515, 0.69), (0.55, 0.675), (0.585, 0.68), (0.605, 0.72), (0.608, 0.775), (0.55, 0.785), (0.52, 0.76)]],
                    bg=[[(0, 0), (1, 0), (1, 0.645), (0, 0.645)], [(0, 0.84), (1, 0.84), (1, 1), (0, 1)],
                        [(0, 0), (0.496, 0), (0.496, 1), (0, 1)], [(0.635, 0), (1, 0), (1, 1), (0.635, 1)],
                        [(0.578, 0.645), (0.64, 0.645), (0.64, 0.745), (0.622, 0.745), (0.598, 0.676)],
                        [(0.622, 0.745), (0.64, 0.745), (0.64, 0.84), (0.60, 0.84), (0.617, 0.80)]],
                    iters=10, scale=1.0)
    car = (alpha > 0.03).astype(np.uint8)
    f = rgb.astype(np.float32) / 255
    # tail-light glow on the road around the car: red excess near the lamps
    red = np.clip(f[..., 0] - 0.5 * (f[..., 1] + f[..., 2]), 0, 1)
    lamps = (red > 0.35) & (car > 0)
    near = cv2.GaussianBlur(cv2.dilate(lamps.astype(np.uint8), np.ones((45, 45), np.uint8)).astype(np.float32), (0, 0), 12)
    redglow = cv2.GaussianBlur(red * near * (1 - alpha), (0, 0), 3) * 0.8
    glowzone = ((cv2.GaussianBlur(redglow, (0, 0), 6) > 0.012) & (cv2.dilate(car, np.ones((41, 41), np.uint8)) > 0)).astype(np.uint8)
    # the lane dash just left of the car must survive untouched
    keep = np.zeros((H, W), np.uint8)
    cv2.fillPoly(keep, [np.array([[int(x * W), int(y * H)] for x, y in [(0.474, 0.697), (0.497, 0.697), (0.497, 0.737), (0.474, 0.737)]], np.int32)], 1)
    hole0 = cv2.dilate(car, np.ones((17, 17), np.uint8)) | glowzone
    # headlamp pool ahead: divide out the low-frequency brightening relative to the asphalt around it
    lowf = cv2.GaussianBlur(f, (0, 0), 14)
    pool_zone = np.zeros((H, W), np.uint8)
    poly = np.array([[int(x * W), int(y * H)] for x, y in [(0.43, 0.50), (0.59, 0.50), (0.63, 0.67), (0.50, 0.70), (0.44, 0.63)]], np.int32)
    cv2.fillPoly(pool_zone, [poly], 1)
    zone = cv2.dilate(pool_zone | hole0, np.ones((41, 41), np.uint8))
    k = 4
    small = cv2.resize(lowf, (W // k, H // k), interpolation=cv2.INTER_AREA)
    zsmall = cv2.resize(zone * 255, (W // k, H // k), interpolation=cv2.INTER_NEAREST)
    exp_small = cv2.inpaint((small * 255).astype(np.uint8), zsmall, 12, cv2.INPAINT_TELEA).astype(np.float32) / 255
    expected = cv2.resize(cv2.GaussianBlur(exp_small, (0, 0), 4), (W, H), interpolation=cv2.INTER_CUBIC)
    lum = lambda x: x.mean(2)
    wz = cv2.GaussianBlur(pool_zone.astype(np.float32), (0, 0), 30)
    gain = np.clip(lum(expected) / np.maximum(lum(lowf), 1e-3), 0.15, 1.0)
    gain = 1 - (1 - gain) * wz
    plate = f * gain[..., None]
    pl_small = cv2.resize(plate, (W // 4, H // 4), interpolation=cv2.INTER_AREA)
    hz = cv2.resize(cv2.dilate(car, np.ones((61, 61), np.uint8)) * 255, (W // 4, H // 4), interpolation=cv2.INTER_NEAREST)
    road_l = cv2.resize(cv2.inpaint((pl_small * 255).astype(np.uint8), hz, 8, cv2.INPAINT_TELEA), (W, H)).astype(np.float32).mean(2) / 255
    road_l = cv2.GaussianBlur(road_l, (0, 0), 8)
    yyg = np.mgrid[0:H, 0:W][0] / H
    hug = (cv2.dilate(car, np.ones((61, 61), np.uint8)) > 0) & (car == 0) & (yyg > 0.700)
    shade = np.clip(1 - plate.mean(2) / np.maximum(road_l, 1e-3), 0, 0.7) * hug
    shade = cv2.GaussianBlur(shade.astype(np.float32), (0, 0), 3)
    shade[shade < 0.06] = 0
    hole = hole0 | cv2.dilate((shade > 0.06).astype(np.uint8), np.ones((13, 13), np.uint8))
    boost = np.clip(f - plate, 0, 1).mean(2) * (1 - cv2.GaussianBlur(hole.astype(np.float32), (0, 0), 5))
    # rebuild the road under the car from the same lane further up / nearer, then Poisson-blend it in
    p8 = (np.clip(plate, 0, 1) * 255).astype(np.uint8)
    copy = lane_fill(p8, cv2.dilate(hole, np.ones((15, 15), np.uint8)), split_y=0.735).astype(np.float32)
    ha = cv2.GaussianBlur(cv2.dilate(hole, np.ones((9, 9), np.uint8)).astype(np.float32), (0, 0), 4)[..., None]
    filled = np.clip(p8 * (1 - ha) + copy * ha, 0, 255).astype(np.uint8)
    ys_, xs_ = np.nonzero(hole)
    x0, y0, x1, y1 = xs_.min() - 8, ys_.min() - 8, xs_.max() + 8, ys_.max() + 8
    mask = cv2.dilate(hole * 255, np.ones((7, 7), np.uint8))[y0:y1, x0:x1]
    plate8 = cv2.seamlessClone(filled[y0:y1, x0:x1], p8, mask, ((x0 + x1) // 2, (y0 + y1) // 2), cv2.NORMAL_CLONE)
    # the lane dash beside the car's nose: put back only its paint
    paint = (keep > 0) & (cv2.cvtColor(p8, cv2.COLOR_RGB2GRAY) > 120)
    paint = cv2.GaussianBlur(paint.astype(np.float32), (0, 0), 1.0)[..., None]
    plate8 = np.clip(plate8 * (1 - paint) + p8 * paint, 0, 255).astype(np.uint8)
    # a blank yellow plate (no generated lettering) on the car layer
    px0, py0, px1, py1 = 1584, 1150, 1655, 1184
    yel = raw[py0:py1, px0:px1].reshape(-1, 3).astype(np.float32)
    bright = yel[yel.mean(1) > np.percentile(yel.mean(1), 70)].mean(0)
    rgb[py0 + 2:py1 - 2, px0 + 2:px1 - 2] = (bright * np.linspace(1.0, 0.86, py1 - py0 - 4)[:, None, None]).astype(np.uint8)
    # crop layers
    ys, xs = np.nonzero(car)
    pad = 10
    cx0, cy0, cx1, cy1 = xs.min() - pad, ys.min() - pad, xs.max() + pad, ys.max() + pad
    sh_crop = shade[cy0 - 30:cy1 + 30, cx0 - 30:cx1 + 30]
    shadow_rgba = np.dstack([np.zeros(sh_crop.shape + (3,), np.uint8), (sh_crop * 255).astype(np.uint8)])
    car_rgba = np.dstack([rgb[cy0:cy1, cx0:cx1], (alpha[cy0:cy1, cx0:cx1] * 255).astype(np.uint8)])
    gy0, gy1, gx0, gx1 = cy0 - 40, cy1 + 120, cx0 - 80, cx1 + 80
    tail = (np.clip(redglow[gy0:gy1, gx0:gx1] * 2.2, 0, 1)[..., None] * np.array([255, 40, 30])).astype(np.uint8)
    py, px = np.nonzero(boost > 0.004)
    bx0, by0, bx1, by1 = px.min(), py.min(), px.max(), py.max()
    pool = (np.clip(boost[by0:by1, bx0:bx1] * 3.0, 0, 1)[..., None] * np.array([255, 238, 205])).astype(np.uint8)
    for fw in (2400, 1600, 960):
        s = fw / W
        rs = lambda im, interp=cv2.INTER_AREA: cv2.resize(im, (max(1, int(round(im.shape[1] * s))), max(1, int(round(im.shape[0] * s)))), interpolation=interp)
        cv2.imwrite(str(OUT / f'plate-{fw}.webp'), cv2.cvtColor(rs(plate8), cv2.COLOR_RGB2BGR), [cv2.IMWRITE_WEBP_QUALITY, 80])
        cv2.imwrite(str(OUT / f'car-{fw}.webp'), cv2.cvtColor(rs(car_rgba), cv2.COLOR_RGBA2BGRA), [cv2.IMWRITE_WEBP_QUALITY, 86])
    cv2.imwrite(str(OUT / 'shadow.webp'), cv2.cvtColor(cv2.resize(shadow_rgba, (shadow_rgba.shape[1] // 2, shadow_rgba.shape[0] // 2), interpolation=cv2.INTER_AREA), cv2.COLOR_RGBA2BGRA), [cv2.IMWRITE_WEBP_QUALITY, 80])
    cv2.imwrite(str(OUT / 'tail.webp'), cv2.cvtColor(cv2.resize(tail, (tail.shape[1] // 2, tail.shape[0] // 2)), cv2.COLOR_RGB2BGR), [cv2.IMWRITE_WEBP_QUALITY, 82])
    cv2.imwrite(str(OUT / 'pool.webp'), cv2.cvtColor(cv2.resize(pool, (pool.shape[1] // 3, pool.shape[0] // 3)), cv2.COLOR_RGB2BGR), [cv2.IMWRITE_WEBP_QUALITY, 82])
    # portrait crops of the plate for phones
    for pw in (720, 1080):
        cw = int(round(H * 9 / 16))
        x0 = int(min(W - cw, max(0, 0.50 * W - cw / 2)))
        crop = plate8[:, x0:x0 + cw]
        cv2.imwrite(str(OUT / f'plate-p{pw}.webp'), cv2.cvtColor(cv2.resize(crop, (pw, int(round(H * pw / cw))), interpolation=cv2.INTER_AREA), cv2.COLOR_RGB2BGR), [cv2.IMWRITE_WEBP_QUALITY, 80])
    geo = dict(frame=[W, H], aspect=W / H, horizon=HORIZON, edge=EDGE, groundY=GROUND_Y, endY=END_Y,
               car=dict(box=[cx0 / W, cy0 / H, cx1 / W, cy1 / H]),
               shadow=dict(box=[(cx0 - 30) / W, (cy0 - 30) / H, (cx1 + 30) / W, (cy1 + 30) / H]),
               tail=dict(box=[gx0 / W, gy0 / H, gx1 / W, gy1 / H]),
               pool=dict(box=[bx0 / W, by0 / H, bx1 / W, by1 / H]),
               portraitX=float(min(W - H * 9 / 16, max(0, 0.50 * W - H * 9 / 32)) / W))
    GEO.write_text(json.dumps(geo, indent=1))
    print('car box', [round(v, 3) for v in geo['car']['box']], 'pool', [round(v, 3) for v in geo['pool']['box']])
    if preview:
        frames = []
        for t in (0.0, 0.5, 1.0):
            frames.append(render(plate8, car_rgba, (cx0, cy0), tail, (gx0, gy0), pool, (bx0, by0), t, W, H, (shadow_rgba, (cx0 - 30, cy0 - 30))))
        cv2.imwrite(preview, cv2.cvtColor(np.vstack([cv2.resize(fr, (1376, 768), interpolation=cv2.INTER_AREA) for fr in frames]), cv2.COLOR_RGB2BGR), [cv2.IMWRITE_JPEG_QUALITY, 84])


def remove_red_glow(p8, redglow):
    f = p8.astype(np.float32)
    f[..., 0] -= np.clip(redglow * 255 * 0.9, 0, 255)
    return np.clip(f, 0, 255).astype(np.uint8)


def path(t, W, H):
    """Ground point and scale of the car at progress t (0 = as photographed)."""
    # ease out: quick start, settles far up the lane
    e = 1 - (1 - t) ** 2.2
    # constant speed on the ground: distance ∝ 1/(y - horizon); interpolate in that space
    d0, d1 = 1 / (GROUND_Y - HORIZON), 1 / (END_Y - HORIZON)
    d = d0 + (d1 - d0) * e
    y = HORIZON + 1 / d
    s = (y - HORIZON) / (GROUND_Y - HORIZON)
    off = (edge_x(GROUND_Y) - 0.556) * s
    return edge_x(y) - off, y, s


def render(plate, car, cpos, tail, tpos, pool, ppos, t, W, H, shadow=None):
    out = plate.astype(np.float32)
    gx, gy, s = path(t, W, H)
    gx0, gy0 = 0.556 * W, GROUND_Y * H
    def place(img, pos, add=False, alpha=None):
        nonlocal out
        x0, y0 = pos
        M = np.float32([[s, 0, gx * W + (x0 - gx0) * s], [0, s, gy * H + (y0 - gy0) * s]])
        if add:
            im = cv2.warpAffine(img.astype(np.float32), M, (W, H))
            out = 255 - (255 - out) * (1 - im / 255)
        else:
            im = cv2.warpAffine(img.astype(np.float32), M, (W, H))
            a = im[..., 3:] / 255
            out = out * (1 - a) + im[..., :3] * a
    place(pool, ppos, add=True)
    place(tail, tpos, add=True)
    if shadow is not None:
        place(shadow[0], shadow[1])
    place(car, cpos)
    return np.clip(out, 0, 255).astype(np.uint8)


if __name__ == '__main__':
    main()
