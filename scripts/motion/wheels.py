"""Turn a photographed wheel into a disc that can genuinely rotate.

A wheel seen at three-quarters is an ellipse, and an alloy is dished: the hub
sits further in than the lip, so in the picture the two are not concentric.
`extract_wheel` therefore
  1. refines the lip ellipse from the bright-rim/dark-tyre edge along rays,
  2. maps that ellipse to a circle (affine rectification),
  3. measures, ring by ring, the centre about which the spokes are N-fold
     symmetric (the hub drifts towards the lip as the radius grows), and
  4. resamples the wheel so every ring is centred on the same point.
The result is a flat, concentric disc. It is placed on the lip centre
(`lip_img`), so lip and tyre line up exactly with the photograph, and rotating
it about its own centre turns the spokes without any wobble; the only
approximation is that the recessed hub is drawn on the lip axis (a few px).
"""
import cv2
import numpy as np


def ellipse_affine(a, b, ang_deg):
    """2x2 matrix mapping the unit circle onto an ellipse with semi-axes a (x') and b (y') rotated by ang."""
    t = np.deg2rad(ang_deg)
    R = np.array([[np.cos(t), -np.sin(t)], [np.sin(t), np.cos(t)]])
    return R @ np.diag([a, b])


def refine_lip(grey, cx, cy, a, b, ang, lo=0.72, hi=1.22, rays=240):
    """Points where brightness drops most steeply going outwards (alloy lip → tyre)."""
    A = ellipse_affine(a, b, ang)
    pts = []
    ts = np.linspace(lo, hi, 90)
    for th in np.linspace(0, 2 * np.pi, rays, endpoint=False):
        d = A @ np.array([np.cos(th), np.sin(th)])
        xs = (cx + ts * d[0]).astype(np.float32)
        ys = (cy + ts * d[1]).astype(np.float32)
        prof = cv2.remap(grey, xs[None, :], ys[None, :], cv2.INTER_LINEAR)[0]
        prof = cv2.GaussianBlur(prof[None, :], (1, 5), 0)[0] if prof.size > 5 else prof
        g = np.diff(prof)
        i = int(np.argmin(g))
        if g[i] < -2.0:
            pts.append((xs[i], ys[i]))
    return np.array(pts, np.float32)


def fit_robust(pts, iters=3):
    keep = pts
    e = cv2.fitEllipse(keep)
    for _ in range(iters):
        (ex, ey), (w, h), ang = e
        A = ellipse_affine(w / 2, h / 2, ang)
        inv = np.linalg.inv(A)
        r = np.linalg.norm((pts - [ex, ey]) @ inv.T, axis=1)
        dev = np.abs(r - 1)
        mad = np.median(dev) + 1e-6
        keep = pts[dev < max(3.0 * mad, 0.015)]
        if len(keep) < 20:
            break
        e = cv2.fitEllipse(keep)
    return e


def rectify(img, cx, cy, A, R, size):
    """Sample img so that the ellipse (cx, cy, A) becomes a circle of radius R centred in a size x size image."""
    c = size / 2
    yy, xx = np.mgrid[0:size, 0:size].astype(np.float32)
    u = (xx - c) / R
    v = (yy - c) / R
    sx = cx + A[0, 0] * u + A[0, 1] * v
    sy = cy + A[1, 0] * u + A[1, 1] * v
    return cv2.remap(img, sx.astype(np.float32), sy.astype(np.float32), cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT)


def ring_centre(rect, R, r0, r1, n, search=0.16, step=0.5):
    """Offset (dx, dy) from the rect centre about which the band r0..r1 (fractions of R) is most n-fold symmetric."""
    grey = rect if rect.ndim == 2 else cv2.cvtColor(rect, cv2.COLOR_RGB2GRAY)
    grey = grey.astype(np.float32)
    c = rect.shape[0] / 2
    th = np.linspace(0, 2 * np.pi, 360, endpoint=False).astype(np.float32)
    rs = np.linspace(r0, r1, 10).astype(np.float32) * R
    TT, RR = np.meshgrid(th, rs)
    best = (1e18, 0.0, 0.0)
    lim = search * R

    def cost(dx, dy):
        x0 = (c + dx + RR * np.cos(TT)).astype(np.float32)
        y0 = (c + dy + RR * np.sin(TT)).astype(np.float32)
        s0 = cv2.remap(grey, x0, y0, cv2.INTER_LINEAR)
        tot = 0.0
        for k in range(1, n):
            s1 = np.roll(s0, -int(round(360 * k / n)), axis=1)
            tot += float(np.mean((s0 - s1) ** 2))
        return tot / (n - 1)

    for dy in np.arange(-lim, lim + 1e-6, 2.0):
        for dx in np.arange(-lim, lim + 1e-6, 2.0):
            v = cost(dx, dy)
            if v < best[0]:
                best = (v, dx, dy)
    _, bx, by = best
    for dy in np.arange(by - 2, by + 2 + 1e-6, step):
        for dx in np.arange(bx - 2, bx + 2 + 1e-6, step):
            v = cost(dx, dy)
            if v < best[0]:
                best = (v, dx, dy)
    return best[1], best[2], best[0]


def extract_wheel(rgb, guess, n=5, margin=0.07, R=180, bands=None, top_clear=None):
    """guess: ((cx, cy), (w, h), ang) cv2-style ellipse in image px.
    Returns dict with the disc (RGBA uint8), metadata in image px."""
    grey = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY).astype(np.float32)
    (gx, gy), (gw, gh), gang = guess
    pts = refine_lip(grey, gx, gy, gw / 2, gh / 2, gang)
    e = fit_robust(pts) if len(pts) > 40 else guess
    (cx, cy), (w, h), ang = e
    A = ellipse_affine(w / 2, h / 2, ang)
    size = int(2 * R * (1 + margin + 0.25)) // 2 * 2
    rect = rectify(rgb, cx, cy, A, R, size)
    bands = bands or [(0.06, 0.22), (0.2, 0.4), (0.38, 0.58), (0.56, 0.76), (0.74, 0.94)]
    offs = []
    for (r0, r1) in bands:
        dx, dy, cst = ring_centre(rect, R, r0, r1, n)
        offs.append(((r0 + r1) / 2, dx, dy, cst))
    rmid = np.array([o[0] for o in offs])
    dxs = np.array([o[1] for o in offs])
    dys = np.array([o[2] for o in offs])
    # smooth linear model of centre against radius (the dish is close to a cone)
    px = np.polyfit(rmid, dxs, 1)
    py = np.polyfit(rmid, dys, 1)
    # concentric resample: output ring rho is centred on c(rho)
    Rout = R * (1 + margin)
    osz = int(np.ceil(2 * Rout)) + 4
    oc = osz / 2
    yy, xx = np.mgrid[0:osz, 0:osz].astype(np.float32)
    dx = xx - oc
    dy = yy - oc
    rho = np.sqrt(dx * dx + dy * dy) / R
    rc = np.clip(rho, 0, 1.0)
    cxr = np.polyval(px, rc).astype(np.float32)
    cyr = np.polyval(py, rc).astype(np.float32)
    hub = np.array([np.polyval(px, 0), np.polyval(py, 0)])
    # output ring rho (in R units) is sampled around its own centre c(rho); rho = 0 is the hub
    sx = (size / 2 + cxr + dx).astype(np.float32)
    sy = (size / 2 + cyr + dy).astype(np.float32)
    disc = cv2.remap(rect, sx, sy, cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT)
    rr = np.sqrt(dx * dx + dy * dy)
    alpha = np.clip((Rout - rr) / 1.5, 0, 1)
    rgba = np.dstack([disc, (alpha * 255).astype(np.uint8)])
    # where the disc's centre lands in the image: affine of the hub offset
    hub_img = np.array([cx, cy]) + A @ (hub / R)
    lip_img = np.array([cx, cy]) + A @ (np.array([np.polyval(px, 1), np.polyval(py, 1)]) / R)
    return dict(
        disc=rgba,
        R=R, Rout=Rout, size=osz,
        lip=dict(cx=float(cx), cy=float(cy), w=float(w), h=float(h), ang=float(ang)),
        hub_img=[float(hub_img[0]), float(hub_img[1])],
        lip_img=[float(lip_img[0]), float(lip_img[1])],
        # disc px → image px (2x2), with rotation applied on the disc first
        M=(A / R).tolist(),
        offsets=[[float(o[0]), float(o[1]), float(o[2]), float(o[3])] for o in offs],
        n=n,
    )
