#!/usr/bin/env python3
"""Build one film section's web media from its 4K master clip(s).

    python3 scripts/film/build_film.py NAME [--crop CX] [--pan F0 F1 C0 C1] [--keys N:CX,N:CX,...] clip.mp4 [...]

Clips are joined in order; a clip's first frame is dropped when it repeats
the previous clip's last frame (start = previous end). Writes to
public/media/film/:

  NAME-wide.mp4 / .webm   2560 wide, the full frame
  NAME-tall.mp4 / .webm   1080x1920, a 9:16 crop of the same master centred
                          at CX (fraction of the width), optionally easing
                          from C0 to C1 between frames F0 and F1, or following
                          --keys (frame:centre pairs, eased between them) to
                          keep a moving car in frame
  NAME-poster-*.webp      first frame, for first paint and reduced motion

Seek-friendly: a keyframe every 12 frames, no B-frames, faststart.
(The hero uses scripts/film/build_hero.py, which is this with its pan fixed.)
"""
import argparse
import subprocess
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

OUT = Path(__file__).resolve().parents[2] / 'public' / 'media' / 'film'
TALL = (1080, 1920)


def frames(paths):
    last = None
    for i, path in enumerate(paths):
        cap = cv2.VideoCapture(str(path))
        n = 0
        while True:
            ok, fr = cap.read()
            if not ok:
                break
            if not (i > 0 and n == 0 and last is not None and np.abs(fr.astype(np.int16) - last.astype(np.int16)).mean() < 6):
                yield fr
            last = fr
            n += 1
        cap.release()


def crop_centre(n, cx, pan, keys=None):
    if keys:
        if n <= keys[0][0]:
            return keys[0][1]
        for (n0, c0), (n1, c1) in zip(keys, keys[1:]):
            if n <= n1:
                t = (n - n0) / (n1 - n0)
                return c0 + (c1 - c0) * t * t * (3 - 2 * t)
        return keys[-1][1]
    if not pan:
        return cx
    f0, f1, c0, c1 = pan
    t = min(1.0, max(0.0, (n - f0) / (f1 - f0)))
    return c0 + (c1 - c0) * t * t * (3 - 2 * t)


def tall_crop(fr, cx):
    H, W = fr.shape[:2]
    cw = int(round(H * 9 / 16))
    x0 = int(round(min(max(cx * W - cw / 2, 0), W - cw)))
    return cv2.resize(fr[:, x0:x0 + cw], TALL, interpolation=cv2.INTER_AREA)


def ffmpeg(path, size, codec):
    w, h = size
    common = ['ffmpeg', '-loglevel', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{w}x{h}', '-r', '24', '-i', '-', '-threads', '2']
    if codec == 'h264':
        enc = ['-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-g', '12', '-keyint_min', '12', '-bf', '0', '-pix_fmt', 'yuv420p', '-movflags', '+faststart']
    else:
        enc = ['-c:v', 'libvpx-vp9', '-crf', '33', '-b:v', '0', '-g', '12', '-row-mt', '1', '-pix_fmt', 'yuv420p']
    return subprocess.Popen(common + enc + [str(path)], stdin=subprocess.PIPE)


def poster(img_bgr, base, widths, prefix=''):
    im = Image.fromarray(cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB))
    for w in widths:
        im.resize((w, round(im.height * w / im.width)), Image.LANCZOS).save(OUT / f'{base}-{prefix}{w}.webp', quality=86, method=6)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('name')
    ap.add_argument('clips', nargs='+')
    ap.add_argument('--crop', type=float, default=0.5)
    ap.add_argument('--pan', type=float, nargs=4)
    ap.add_argument('--keys')
    a = ap.parse_args()
    keys = [(int(k.split(':')[0]), float(k.split(':')[1])) for k in a.keys.split(',')] if a.keys else None
    OUT.mkdir(parents=True, exist_ok=True)
    first = None
    for codec, ext in (('h264', 'mp4'), ('vp9', 'webm')):
        pw = pt = None
        for n, fr in enumerate(frames(a.clips)):
            H, W = fr.shape[:2]
            wide_size = (2560, int(round(H * 2560 / W / 2)) * 2)
            if pw is None:
                pw = ffmpeg(OUT / f'{a.name}-wide.{ext}', wide_size, codec)
                pt = ffmpeg(OUT / f'{a.name}-tall.{ext}', TALL, codec)
            wide = cv2.resize(fr, wide_size, interpolation=cv2.INTER_AREA)
            tall = tall_crop(fr, crop_centre(n, a.crop, a.pan, keys))
            if first is None:
                first = (wide, tall)
            pw.stdin.write(wide.tobytes())
            pt.stdin.write(tall.tobytes())
        for p in (pw, pt):
            p.stdin.close()
            p.wait()
        print(ext, 'frames', n + 1)
    poster(first[0], f'{a.name}-poster', (960, 1600, 2560))
    poster(first[1], f'{a.name}-poster', (720, 1080), 'p')
    for f in sorted(OUT.glob(f'{a.name}-*')):
        print(f.name, f.stat().st_size)


if __name__ == '__main__':
    main()
