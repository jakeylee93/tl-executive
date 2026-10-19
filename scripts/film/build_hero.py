#!/usr/bin/env python3
"""Build the opening film's web media from the two Kling 3.0 4K masters.

    python3 scripts/film/build_hero.py A.mp4 B.mp4

A  dusk -> night, city and headlights on   (OpenArt f4WiU9dLTndGMVKiSW7b)
B  night, the car pulls away and leaves     (OpenArt ngcOJVK3vY91tazWB1Wn)
Both 3852x2152, 24 fps, 121 frames; B's first frame repeats A's last, so it
is dropped. Writes to public/media/film/:

  hero-wide.mp4 / .webm   2560x1430, the full frame
  hero-tall.mp4 / .webm   1080x1920, a 9:16 crop of the same master: framed on
                          the car's front (TLE plate, headlights, Canary
                          Wharf), then easing left onto the Shard and the City
                          as the car drives out, so the ending shows London
  hero-poster-*.webp      first frame, for first paint and reduced motion

Seek-friendly: a keyframe every 12 frames, no B-frames, faststart.
"""
import subprocess
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

OUT = Path(__file__).resolve().parents[2] / 'public' / 'media' / 'film'
WIDE = (2560, 1430)
TALL = (1080, 1920)
PAN = (190, 240, 0.68, 0.36)  # frames from-to, crop centre from-to (fraction of width)


def frames(a, b):
    for i, path in enumerate((a, b)):
        cap = cv2.VideoCapture(str(path))
        n = 0
        while True:
            ok, fr = cap.read()
            if not ok:
                break
            if not (i == 1 and n == 0):
                yield fr
            n += 1
        cap.release()


def tall_crop(fr, n):
    H, W = fr.shape[:2]
    cw = int(round(H * 9 / 16))
    f0, f1, c0, c1 = PAN
    t = min(1.0, max(0.0, (n - f0) / (f1 - f0)))
    s = t * t * (3 - 2 * t)
    cx = c0 + (c1 - c0) * s
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
    a, b = sys.argv[1], sys.argv[2]
    OUT.mkdir(parents=True, exist_ok=True)
    for codec, ext in (('h264', 'mp4'), ('vp9', 'webm')):
        pw = ffmpeg(OUT / f'hero-wide.{ext}', WIDE, codec)
        pt = ffmpeg(OUT / f'hero-tall.{ext}', TALL, codec)
        first = None
        for n, fr in enumerate(frames(a, b)):
            wide = cv2.resize(fr, WIDE, interpolation=cv2.INTER_AREA)
            tall = tall_crop(fr, n)
            if first is None:
                first = (wide, tall)
            pw.stdin.write(wide.tobytes())
            pt.stdin.write(tall.tobytes())
        for p in (pw, pt):
            p.stdin.close()
            p.wait()
        print(ext, 'frames', n + 1)
    poster(first[0], 'hero-poster', (960, 1600, 2560))
    poster(first[1], 'hero-poster', (720, 1080), 'p')
    for f in sorted(OUT.glob('hero-*')):
        print(f.name, f.stat().st_size)


if __name__ == '__main__':
    main()
