#!/usr/bin/env python3
"""Fleet studio layers: each published vehicle as a cut-out body, rotating wheel
discs and a floor shadow, all scaled to one real-world scale (px per metre).

    python3 scripts/motion/build_fleet.py <workdir> [--preview out.jpg]

<workdir> holds the half-size masters made from root's canonical files
(Mission Control tl-executive-rethink-20261018/assets/*-studio-4k.png, and the
published V-Class render public/car-vclass.jpg upscaled 3x). Writes
public/media/motion/fleet/* and lib/motion/fleet.json.

The S-Class, E-Class and Tourneo come from the generated studio masters (each
made from Simon's published picture of that model). The V-Class is the
published 600x320 render: it is cut out and warmed to the same studio, but it
stays softer than the others until a studio master exists (FLEET-003).
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
OUT = ROOT / 'public' / 'media' / 'motion' / 'fleet'
GEO = ROOT / 'lib' / 'motion' / 'fleet.json'
PX_PER_M = 190.0  # export scale for the desktop set; the phone set is half

LAMPS = {
    'eclass': [[(0.285, 0.50), (0.31, 0.44), (0.36, 0.41), (0.40, 0.42), (0.39, 0.47), (0.33, 0.53), (0.29, 0.545)],
               [(0.075, 0.46), (0.09, 0.44), (0.095, 0.50), (0.08, 0.51)]],
    'sclass': [[(0.265, 0.53), (0.28, 0.47), (0.33, 0.44), (0.385, 0.44), (0.37, 0.49), (0.31, 0.535), (0.27, 0.55)],
               [(0.025, 0.47), (0.04, 0.44), (0.045, 0.52), (0.03, 0.53)]],
    'vclass': [[(0.255, 0.57), (0.29, 0.49), (0.36, 0.45), (0.40, 0.44), (0.39, 0.49), (0.32, 0.55), (0.27, 0.59)],
               [(0.02, 0.51), (0.035, 0.49), (0.04, 0.57), (0.025, 0.58)]],
    'tourneo': [[(0.31, 0.50), (0.34, 0.45), (0.40, 0.41), (0.445, 0.40), (0.44, 0.46), (0.39, 0.52), (0.33, 0.56), (0.31, 0.54)],
                [(0.012, 0.46), (0.03, 0.45), (0.032, 0.55), (0.015, 0.56)]],
}
ROAD_SRC = 'still016-road.png'  # STILL-016, country road at blue hour with London on the horizon
ROAD_PORTRAIT_CX = 0.44


def dusk_body(rgb, alpha):
    """Studio light → blue hour: darker, cooler, and studio-white highlights become sky reflections."""
    f = rgb.astype(np.float32) / 255
    L = (0.2126 * f[..., 0] + 0.7152 * f[..., 1] + 0.0722 * f[..., 2])[..., None]
    hm = np.clip((L - 0.5) / 0.45, 0, 1) ** 1.2
    base = np.power(f, 1.12) * np.array([0.60, 0.68, 0.84], np.float32)
    sky = np.array([0.36, 0.45, 0.62], np.float32)
    out = base * (1 - 0.45 * hm) + sky * 0.45 * hm
    return np.clip(out * 255, 0, 255)


def lamp_layer(rgb, alpha, polys):
    H, W = alpha.shape
    m = np.zeros((H, W), np.float32)
    for p in polys:
        cv2.fillPoly(m, [np.array([[int(x * W), int(y * H)] for x, y in p], np.int32)], 1.0)
    g = cv2.cvtColor(rgb.astype(np.uint8), cv2.COLOR_RGB2GRAY).astype(np.float32) / 255
    m = m * cv2.erode((alpha > 0.9).astype(np.float32), np.ones((5, 5), np.uint8))  # only lamps on the body itself
    core = np.clip((g - 0.25) / 0.5, 0, 1) * m
    glow = np.zeros((H, W, 3), np.float32)
    tint = np.array([1.0, 0.98, 0.94], np.float32)
    for sig, k in ((1.2, 1.4), (4, 0.9), (12, 0.55), (36, 0.32)):
        glow += cv2.GaussianBlur(core + m * 0.35, (0, 0), sig)[..., None] * k * tint
    glow = np.clip(glow, 0, 1)
    a = np.clip(glow.max(2, keepdims=True), 1e-4, 1)
    return np.dstack([np.clip(glow / a, 0, 1) * 255, a * 255]).astype(np.uint8)


CARS = [
    dict(slug='eclass', src='eclass-studio-2528.png', wheelbase=2.939, length=4.923, tyre_d=0.68,
         rect=(0.10, 0.355, 0.905, 0.85),
         fg=[[(0.25, 0.56), (0.55, 0.47), (0.85, 0.50), (0.86, 0.62), (0.55, 0.68), (0.26, 0.68)],
             [(0.45, 0.42), (0.62, 0.40), (0.72, 0.44), (0.50, 0.46)]],
         prbg=[[(0.51, 0.79), (0.76, 0.735), (0.77, 0.80), (0.52, 0.84)]],
         bg=[[(0, 0.86), (1, 0.86), (1, 1), (0, 1)], [(0, 0), (1, 0), (1, 0.33), (0, 0.33)]],
         wheels=[((1142, 1225), (224, 314), 0), ((2101, 1146), (142, 248), 0)]),
    dict(slug='sclass', src='sclass-studio-pilot-2528.png', wheelbase=3.165, length=5.255, tyre_d=0.71,
         rect=(0.15, 0.335, 0.88, 0.77),
         fg=[[(0.30, 0.50), (0.60, 0.43), (0.80, 0.46), (0.82, 0.58), (0.60, 0.62), (0.32, 0.62)],
             [(0.45, 0.38), (0.62, 0.36), (0.70, 0.40), (0.50, 0.42)]],
         prbg=[[(0.52, 0.705), (0.74, 0.66), (0.75, 0.72), (0.53, 0.76)]],
         bg=[[(0, 0.77), (1, 0.77), (1, 1), (0, 1)], [(0, 0), (1, 0), (1, 0.30), (0, 0.30)]],
         wheels=[((1197.3, 1124.7), (193.8, 279.3), 2.1), ((2040, 1045), (110, 205), 0)]),
    dict(slug='vclass', src='vclass-1800.png', wheelbase=3.200, length=5.140, tyre_d=0.71, warm=True,
         rect=(0.04, 0.09, 0.915, 0.89), scale=1.0,
         fg=[[(0.15, 0.50), (0.40, 0.30), (0.85, 0.30), (0.88, 0.60), (0.55, 0.70), (0.15, 0.68)]],
         prbg=[[(0.60, 0.80), (0.79, 0.75), (0.80, 0.80), (0.61, 0.86)]],
         bg=[[(0, 0.90), (1, 0.90), (1, 1), (0, 1)], [(0, 0), (1, 0), (1, 0.07), (0, 0.07)],
             [(0.93, 0), (1, 0), (1, 1), (0.93, 1)]],
         wheels=[((788.4, 702.8), (180.6, 250.7), 0), ((1511, 656), (118, 190), 0)]),
    dict(slug='tourneo', src='tourneo-studio-2528.png', wheelbase=2.933, length=4.973, tyre_d=0.70,
         rect=(0.135, 0.225, 0.88, 0.87),
         fg=[[(0.20, 0.45), (0.50, 0.30), (0.84, 0.32), (0.86, 0.62), (0.55, 0.70), (0.22, 0.68)]],
         prbg=[[(0.60, 0.835), (0.79, 0.76), (0.80, 0.83), (0.61, 0.87)]],
         bg=[[(0, 0.875), (1, 0.875), (1, 1), (0, 1)], [(0, 0), (1, 0), (1, 0.21), (0, 0.21)]],
         wheels=[((1399.4, 1282.8), (151.3, 294.9), 1.3), ((2099.5, 1177.0), (72.7, 195.8), 179.9)]),
]


def lum(rgb):
    return (0.2126 * rgb[..., 0] + 0.7152 * rgb[..., 1] + 0.0722 * rgb[..., 2]).astype(np.float32)


def plate_estimate(rgb, hole):
    """Smooth background under/around the car: inpaint the dilated car region at 1/8 size."""
    H, W = hole.shape
    f = 8
    small = cv2.resize(rgb, (W // f, H // f), interpolation=cv2.INTER_AREA)
    m = cv2.resize((hole > 0).astype(np.uint8) * 255, (W // f, H // f), interpolation=cv2.INTER_NEAREST)
    m = cv2.dilate(m, np.ones((3, 3), np.uint8))
    fill = cv2.inpaint(small, m, 6, cv2.INPAINT_TELEA)
    fill = cv2.GaussianBlur(fill, (0, 0), 2)
    return cv2.resize(fill, (W, H), interpolation=cv2.INTER_CUBIC).astype(np.float32)


def shadow_layer(rgb, alpha, ground_y):
    """Floor darkening caused by the car, as an alpha map for a black layer."""
    H, W = alpha.shape
    car = (alpha > 0.03).astype(np.uint8)
    ys, xs = np.nonzero(car)
    x0, x1 = xs.min(), xs.max()
    y0 = ys.min()
    # region where shadow may live: below the body's mid-height, around the car
    zone = np.zeros_like(car)
    zx0, zx1 = max(0, x0 - int(0.08 * W)), min(W, x1 + int(0.08 * W))
    zone[int(y0 + 0.45 * (ground_y - y0)):min(H, int(ground_y + 0.07 * H)), zx0:zx1] = 1
    hole = cv2.dilate(car, np.ones((25, 25), np.uint8)) | (zone * 0)
    hole = cv2.dilate(np.maximum(car, zone), np.ones((9, 9), np.uint8))
    plate = plate_estimate(rgb, hole)
    ratio = np.clip(lum(rgb.astype(np.float32)) / np.maximum(lum(plate), 1), 0, 1)
    s = (1 - ratio) * zone
    # under the body we cannot see the floor: fill from the surrounding shadow
    s8 = (np.clip(s, 0, 1) * 255).astype(np.uint8)
    under = cv2.dilate(car, np.ones((5, 5), np.uint8)) * zone
    s8 = cv2.inpaint(s8, under * 255, 9, cv2.INPAINT_TELEA)
    s = s8.astype(np.float32) / 255
    s = cv2.morphologyEx(s, cv2.MORPH_OPEN, np.ones((11, 1), np.uint8))  # drop thin horizontal floor (tile) lines
    s = cv2.GaussianBlur(s, (0, 0), 5.0)
    s[s < 0.03] = 0
    return np.clip(s * 1.05, 0, 0.92), plate


def warm_to_studio(rgb, alpha, ref_mean):
    """Pull the white-studio render's colour towards the warm studio (body only)."""
    a = alpha > 0.5
    m = rgb[a].reshape(-1, 3).mean(0)
    out = rgb.astype(np.float32) * (ref_mean / np.maximum(m, 1))[None, None, :]
    return np.clip(out, 0, 255)


def main():
    work = Path(sys.argv[1])
    preview = sys.argv[sys.argv.index('--preview') + 1] if '--preview' in sys.argv else None
    OUT.mkdir(parents=True, exist_ok=True)
    GEO.parent.mkdir(parents=True, exist_ok=True)
    geo = dict(pxPerM=PX_PER_M, cars=[])
    ref_mean = None
    layers = []
    for c in CARS:
        rgb = cv2.cvtColor(cv2.imread(str(work / c['src'])), cv2.COLOR_BGR2RGB)
        if c['slug'] == 'vclass':
            rgb = cv2.fastNlMeansDenoisingColored(rgb, None, 5, 5, 7, 21)
        H, W = rgb.shape[:2]
        alpha = grabcut(rgb, rect=c['rect'], fg=c['fg'], bg=c['bg'], prbg=c['prbg'], scale=c.get('scale', 0.5))
        wheels = [extract_wheel(rgb, g, n=5, R=150) for g in c['wheels']]
        front, rear = wheels
        hf, hr = np.array(front['hub_img']), np.array(rear['hub_img'])
        k = np.linalg.norm(hf - hr) / c['wheelbase']  # source px per metre
        # ground: lowest tyre pixel under each wheel
        def tyre_bottom(w):
            x = int(w['hub_img'][0])
            col = alpha[:, max(0, x - 3):x + 4].mean(1)
            return int(np.nonzero(col > 0.5)[0].max())
        gf, gr = tyre_bottom(front), tyre_bottom(rear)
        # trim anything below the line through the tyre contacts (floor shadow caught by the cut)
        yy, xx = np.mgrid[0:H, 0:W]
        xf, xr = hf[0], hr[0]
        line = gf + (xx - xf) * (gr - gf) / (xr - xf)
        alpha = np.where(yy > line + 2, 0, alpha).astype(np.float32)
        if c['slug'] == 'vclass':
            # the render's white floor shows under the body between the wheels: not part of the van
            lum0 = rgb.astype(np.float32).mean(2)
            sill = line - 0.07 * H
            under = (yy > sill) & (xx > xf + 0.06 * W) & (xx < xr - 0.05 * W) & (lum0 > 150)
            alpha = np.where(under, 0, alpha)
            alpha = cv2.GaussianBlur(alpha, (0, 0), 0.8)
        shadow, _ = shadow_layer(rgb, alpha, max(gf, gr))
        body = rgb.astype(np.float32)
        if c.get('warm') and ref_mean is not None:
            body = warm_to_studio(body, alpha, ref_mean)
        if c['slug'] == 'sclass':
            ref_mean = rgb[alpha > 0.5].reshape(-1, 3).astype(np.float32).mean(0)
        if c['slug'] == 'vclass':
            # blank the generic "V-Class" plate like the generated masters
            px0, py0, px1, py1 = int(0.085 * W), int(0.655 * H), int(0.165 * W), int(0.695 * H)
            body[py0:py1, px0:px1] = np.median(body[py0:py1, px0:px1].reshape(-1, 3), 0) * 0 + 205
        s = PX_PER_M / k
        # crop to the car + shadow, then scale
        ys, xs = np.nonzero((alpha > 0.01) | (shadow > 0.01))
        pad = 8
        cx0, cy0 = max(0, xs.min() - pad), max(0, ys.min() - pad)
        cx1, cy1 = min(W, xs.max() + pad), min(H, ys.max() + pad)
        def crop_scale(img, interp=cv2.INTER_AREA):
            im = img[cy0:cy1, cx0:cx1]
            return cv2.resize(im, (int(round(im.shape[1] * s)), int(round(im.shape[0] * s))), interpolation=interp if s < 1 else cv2.INTER_LANCZOS4)
        b = crop_scale(body)
        a = np.clip(crop_scale(alpha), 0, 1)
        sh = np.clip(crop_scale(shadow), 0, 1)
        lw, lh = b.shape[1], b.shape[0]
        def to_layer(p):
            return [(p[0] - cx0) * s, (p[1] - cy0) * s]
        entry = dict(slug=c['slug'], w=lw, h=lh, wheelbase=c['wheelbase'], length=c['length'], tyreD=c['tyre_d'],
                     ground=[to_layer((xf, gf)), to_layer((xr, gr))], wheels=[])
        for tag, wh in (('f', front), ('r', rear)):
            disc = wh['disc']
            ds = int(round(disc.shape[0] * s * 1.0))
            # keep disc texture at its native rectified scale; the matrix accounts for size
            name = f"{c['slug']}-w{tag}.webp"
            cv2.imwrite(str(OUT / name), cv2.cvtColor(disc, cv2.COLOR_RGBA2BGRA), [cv2.IMWRITE_WEBP_QUALITY, 86])
            dd = disc.copy()
            dd[..., :3] = dusk_body(dd[..., :3], None).astype(np.uint8)
            cv2.imwrite(str(OUT / name.replace('.webp', '-dusk.webp')), cv2.cvtColor(dd, cv2.COLOR_RGBA2BGRA), [cv2.IMWRITE_WEBP_QUALITY, 86])
            M = (np.array(wh['M']) * s).tolist()  # disc px -> layer px
            entry['wheels'].append(dict(src=name, size=wh['size'], c=to_layer(wh['lip_img']), hub=to_layer(wh['hub_img']), M=M))
        bgra = cv2.cvtColor(np.dstack([np.clip(b, 0, 255), a * 255]).astype(np.uint8), cv2.COLOR_RGBA2BGRA)
        cv2.imwrite(str(OUT / f"{c['slug']}.webp"), bgra, [cv2.IMWRITE_WEBP_QUALITY, 84])
        half = cv2.resize(bgra, (lw // 2, lh // 2), interpolation=cv2.INTER_AREA)
        cv2.imwrite(str(OUT / f"{c['slug']}-half.webp"), half, [cv2.IMWRITE_WEBP_QUALITY, 82])
        shb = np.zeros((lh, lw, 4), np.uint8)
        shb[..., 3] = (sh * 255).astype(np.uint8)
        cv2.imwrite(str(OUT / f"{c['slug']}-shadow.webp"), cv2.resize(shb, (lw // 2, lh // 2), interpolation=cv2.INTER_AREA), [cv2.IMWRITE_WEBP_QUALITY, 80])
        # dusk road variants (STILL-016 scene)
        db = dusk_body(b, a)
        cv2.imwrite(str(OUT / f"{c['slug']}-dusk.webp"), cv2.cvtColor(np.dstack([db, a * 255]).astype(np.uint8), cv2.COLOR_RGBA2BGRA), [cv2.IMWRITE_WEBP_QUALITY, 84])
        lamps = lamp_layer(b, a, LAMPS[c['slug']])
        cv2.imwrite(str(OUT / f"{c['slug']}-lamps.webp"), cv2.cvtColor(cv2.resize(lamps, (lw // 2, lh // 2), interpolation=cv2.INTER_AREA), cv2.COLOR_RGBA2BGRA), [cv2.IMWRITE_WEBP_QUALITY, 85])
        # heavier contact shadow on asphalt: the studio shadow plus occlusion right under the body
        yy2, xx2 = np.mgrid[0:lh, 0:lw].astype(np.float32)
        (gfx, gfy), (grx, gry) = entry['ground']
        line2 = gfy + (xx2 - gfx) * (gry - gfy) / (grx - gfx)
        occ = ((yy2 > line2 - 0.05 * lh) & (yy2 < line2 + 0.012 * lh) & (xx2 > gfx - 0.12 * lw) & (xx2 < grx + 0.06 * lw)).astype(np.float32)
        occ = cv2.GaussianBlur(occ, (0, 0), 0.02 * lw) * 0.85
        road_sh = np.clip(np.maximum(sh * 1.5, occ), 0, 0.92)
        rsb = np.zeros((lh, lw, 4), np.uint8)
        rsb[..., 3] = (road_sh * 255).astype(np.uint8)
        cv2.imwrite(str(OUT / f"{c['slug']}-shadow-road.webp"), cv2.resize(rsb, (lw // 2, lh // 2), interpolation=cv2.INTER_AREA), [cv2.IMWRITE_WEBP_QUALITY, 80])
        geo['cars'].append(entry)
        layers.append(dict(entry=entry, body=b, alpha=a, shadow=sh))
        print(c['slug'], f'k={k:.1f}px/m scale={s:.3f} layer={lw}x{lh}', 'ground', [[round(v) for v in g] for g in entry['ground']])
    # the studio itself, for the page background (wide and portrait)
    for name, (pw, ph) in (('garage-wide', (2400, 1100)), ('garage-tall', (1080, 1500))):
        cv2.imwrite(str(OUT / f'{name}.webp'), cv2.cvtColor(studio_plate(pw, ph).astype(np.uint8), cv2.COLOR_RGB2BGR), [cv2.IMWRITE_WEBP_QUALITY, 82])
    road_path = work / ROAD_SRC
    if road_path.exists():
        road = cv2.imread(str(road_path))
        RH, RW = road.shape[:2]
        for fw in (2400, 1600, 960):
            cv2.imwrite(str(OUT / f'road-{fw}.webp'), cv2.resize(road, (fw, int(round(RH * fw / RW))), interpolation=cv2.INTER_AREA), [cv2.IMWRITE_WEBP_QUALITY, 82])
        cw = int(round(RH * 9 / 16))
        x0 = int(min(RW - cw, max(0, ROAD_PORTRAIT_CX * RW - cw / 2)))
        for pw in (720, 1080):
            cv2.imwrite(str(OUT / f'road-p{pw}.webp'), cv2.resize(road[:, x0:x0 + cw], (pw, int(round(RH * pw / cw))), interpolation=cv2.INTER_AREA), [cv2.IMWRITE_WEBP_QUALITY, 82])
        geo['road'] = dict(aspect=RW / RH, vp=[0.9235, 0.335], lane0=[0.32, 1.0], z0=7.8, portraitX=x0 / RW, portraitW=cw / RW)
    GEO.write_text(json.dumps(geo, indent=1))
    if preview:
        compose_preview(layers, preview)


def studio_plate(W, H):
    """Warm light studio sampled from the S-Class master's clear background."""
    prof_y = np.array([0, 0.12, 0.25, 0.35, 0.45, 0.55, 0.62, 0.66, 0.70, 0.80, 0.90, 1.0])
    prof_c = np.array([[238, 236, 234], [126, 118, 116], [153, 144, 141], [169, 160, 156], [173, 164, 159], [170, 161, 157],
                       [166, 157, 153], [196, 185, 178], [214, 203, 196], [212, 202, 194], [197, 186, 180], [184, 174, 169]], np.float32)
    ys = np.linspace(0, 1, H)
    col = np.stack([np.interp(ys, prof_y, prof_c[:, i]) for i in range(3)], 1)
    img = np.repeat(col[:, None, :], W, 1)
    xs = np.linspace(-1, 1, W)
    vig = 1 - 0.10 * xs ** 2
    img *= vig[None, :, None]
    rng = np.random.default_rng(7)
    img += rng.normal(0, 2.2, img.shape)
    return np.clip(img, 0, 255)


def convoy_frame(layers, W, H, world, spot_m, spot_x, spot_y, gap=2.6, persp_per_m=0.035, lit=None, plate=None):
    """Nose-to-tail convoy along the cars' shared heading (from the S-Class wheelbase vector).
    spot_m: convoy position (metres) that sits on the light mark at (spot_x, spot_y)."""
    ref = next(L for L in layers if L['entry']['slug'] == 'sclass')['entry']
    (fx, fy), (rx, ry) = ref['ground']
    axis = np.array([rx - fx, ry - fy]) / ref['wheelbase']  # layer px per metre, pointing rearwards
    out = (studio_plate(W, H) if plate is None else plate).copy()
    pos, cur = [], 0.0
    for L in layers:
        pos.append(cur)
        cur += L['entry']['length'] + gap
    for i in range(len(layers) - 1, -1, -1):
        L = layers[i]
        e = L['entry']
        d = pos[i] - spot_m
        persp = 1.0 / (1 + persp_per_m * d)
        sc = world * persp
        gx, gy = e['ground'][0]
        tx = spot_x + d * axis[0] * world * persp - gx * sc
        ty = spot_y + d * axis[1] * world * persp - gy * sc
        Mt = np.float32([[sc, 0, tx], [0, sc, ty]])
        b = cv2.warpAffine(L['body'].astype(np.float32), Mt, (W, H), flags=cv2.INTER_AREA)
        a = cv2.warpAffine(L['alpha'], Mt, (W, H), flags=cv2.INTER_LINEAR)[..., None]
        sh = cv2.warpAffine(L['shadow'], Mt, (W, H), flags=cv2.INTER_LINEAR)[..., None]
        dim = 1.0 if (lit is None or i == lit) else 0.80
        out = out * (1 - sh)
        out = out * (1 - a) + b * dim * a
    return out, pos


def compose_preview(layers, path):
    W, H = 1920, 1080
    wide, pos = convoy_frame(layers, W, H, world=0.34, spot_m=0.0, spot_x=0.20 * W, spot_y=0.80 * H)
    near, _ = convoy_frame(layers, W, H, world=0.52, spot_m=pos[1], spot_x=0.36 * W, spot_y=0.80 * H, lit=1)
    sheet = np.vstack([wide, near])
    cv2.imwrite(path, cv2.cvtColor(np.clip(sheet, 0, 255).astype(np.uint8), cv2.COLOR_RGB2BGR), [cv2.IMWRITE_JPEG_QUALITY, 86])


if __name__ == '__main__':
    main()
