"""Shared helpers for the motion media pipeline (OpenCV + numpy only)."""
import cv2
import numpy as np


def box(img, r):
    return cv2.boxFilter(img, -1, (2 * r + 1, 2 * r + 1), borderType=cv2.BORDER_REFLECT)


def guided(I, p, r=8, eps=1e-3):
    """Guided filter (He et al.) — I: HxW float32 guide (grey 0..1), p: HxW float32."""
    mI, mp = box(I, r), box(p, r)
    cov = box(I * p, r) - mI * mp
    var = box(I * I, r) - mI * mI
    a = cov / (var + eps)
    b = mp - a * mI
    return box(a, r) * I + box(b, r)


def grabcut(rgb, rect=None, fg=(), bg=(), prfg=(), prbg=(), iters=6, scale=0.5, largest=True, min_frac=0.002):
    """rgb uint8 HxWx3. Polygons in normalised (x, y). Returns float32 alpha 0..1 at full size."""
    H, W = rgb.shape[:2]
    small = cv2.resize(rgb, (int(W * scale), int(H * scale)), interpolation=cv2.INTER_AREA)
    h, w = small.shape[:2]
    mask = np.full((h, w), cv2.GC_BGD, np.uint8)
    if rect:
        x0, y0, x1, y1 = rect
        mask[int(y0 * h):int(y1 * h), int(x0 * w):int(x1 * w)] = cv2.GC_PR_FGD
    def poly(ps, v):
        for p in ps:
            pts = np.array([[int(x * w), int(y * h)] for x, y in p], np.int32)
            cv2.fillPoly(mask, [pts], v)
    poly(prbg, cv2.GC_PR_BGD)
    poly(prfg, cv2.GC_PR_FGD)
    poly(bg, cv2.GC_BGD)
    poly(fg, cv2.GC_FGD)
    bgd, fgd = np.zeros((1, 65), np.float64), np.zeros((1, 65), np.float64)
    cv2.grabCut(cv2.cvtColor(small, cv2.COLOR_RGB2BGR), mask, None, bgd, fgd, iters, cv2.GC_INIT_WITH_MASK)
    a = np.where((mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD), 1.0, 0.0).astype(np.float32)
    # keep the largest component only
    n, lab, stats, _ = cv2.connectedComponentsWithStats((a > 0.5).astype(np.uint8), 8)
    if n > 1 and largest:
        k = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
        a = (lab == k).astype(np.float32)
    elif n > 1:
        keep = [i for i in range(1, n) if stats[i, cv2.CC_STAT_AREA] >= min_frac * h * w]
        a = np.isin(lab, keep).astype(np.float32)
    # fill holes
    inv = (a < 0.5).astype(np.uint8)
    n, lab, stats, _ = cv2.connectedComponentsWithStats(inv, 4)
    for i in range(1, n):
        x, y, ww, hh, area = stats[i]
        if x > 0 and y > 0 and x + ww < w and y + hh < h:
            a[lab == i] = 1.0
    a = cv2.resize(a, (W, H), interpolation=cv2.INTER_LINEAR)
    grey = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY).astype(np.float32) / 255
    a = np.clip(guided(grey, a, r=max(2, int(4 / scale)), eps=2e-4), 0, 1)
    return a


def fill_poly(shape, polys, v=1.0):
    H, W = shape[:2]
    m = np.zeros((H, W), np.float32)
    for p in polys:
        pts = np.array([[int(x * W), int(y * H)] for x, y in p], np.int32)
        cv2.fillPoly(m, [pts], v)
    return m


def fit_rim(rgb, cx, cy, r, thresh=None):
    """Find the bright alloy rim near (cx, cy) (px) within radius r. Returns ((cx,cy),(ax1,ax2),angle) like cv2.fitEllipse."""
    H, W = rgb.shape[:2]
    x0, y0 = max(0, int(cx - r)), max(0, int(cy - r))
    x1, y1 = min(W, int(cx + r)), min(H, int(cy + r))
    crop = cv2.cvtColor(rgb[y0:y1, x0:x1], cv2.COLOR_RGB2GRAY)
    blur = cv2.GaussianBlur(crop, (0, 0), 3)
    t = thresh if thresh is not None else int(np.percentile(blur, 62))
    bw = (blur > t).astype(np.uint8)
    bw = cv2.morphologyEx(bw, cv2.MORPH_CLOSE, np.ones((15, 15), np.uint8))
    cnts, _ = cv2.findContours(bw, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    best = None
    for c in cnts:
        if len(c) < 30:
            continue
        (ex, ey), (a1, a2), ang = cv2.fitEllipse(c)
        d = np.hypot(ex + x0 - cx, ey + y0 - cy)
        score = cv2.contourArea(c) - 4 * d * d
        if best is None or score > best[0]:
            best = (score, ((ex + x0, ey + y0), (a1, a2), ang))
    return best[1] if best else None
