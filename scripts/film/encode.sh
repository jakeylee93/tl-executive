#!/bin/sh
# Web encodes of the opening shots (FILM.md), from the delivered OpenArt/Veo
# originals in $1. H.264 with a keyframe every 6 frames so scroll scrubbing
# can seek instantly; no audio; +faststart. Posters are the first used frame.
#   sh scripts/film/encode.sh <dir-with-originals>
set -eu
SRC="$1"
OUT="$(cd "$(dirname "$0")/../.." && pwd)/public/media/film"
mkdir -p "$OUT"
enc() { # in out start_frame crf width
  ffmpeg -loglevel error -y -i "$SRC/$1" -vf "select='gte(n\,$3)',setpts=N/24/TB,scale=$5:-2:flags=lanczos" -an -c:v libx264 -preset slow -crf "$4" \
    -g 10 -keyint_min 10 -sc_threshold 0 -pix_fmt yuv420p -profile:v high -movflags +faststart "$OUT/$2"
  # VP9/WebM twin for browsers without H.264 (and for the cloud QA browser)
  ffmpeg -loglevel error -y -i "$SRC/$1" -vf "select='gte(n\,$3)',setpts=N/24/TB,scale=$5:-2:flags=lanczos" -an -c:v libvpx-vp9 -crf 42 -b:v 0 \
    -g 10 -keyint_min 10 -deadline good -cpu-used 4 -row-mt 1 -pix_fmt yuv420p "$OUT/${2%.mp4}.webm"
}
poster() { # in base start_frame tall(0/1)
  ffmpeg -loglevel error -y -i "$SRC/$1" -vf "select='eq(n\,$3)'" -frames:v 1 "$OUT/.$2.png"
  (cd / && python3 -E -c "
import sys
from PIL import Image
src, base, tall = sys.argv[1], sys.argv[2], sys.argv[3] == '1'
im = Image.open(src).convert('RGB')
for w in ((720, 1080) if tall else (960, 1600, 1920)):
    h = round(im.height * w / im.width)
    im.resize((w, h), Image.LANCZOS).save(base + ('-p%d' % w if tall else '-%d' % w) + '.webp', 'WEBP', quality=80, method=6)
" "$OUT/.$2.png" "$OUT/$2" "$4")
  rm -f "$OUT/.$2.png"
}
enc v010b-s1-wide.mp4 s1-wide.mp4 0 26 1600;   poster v010b-s1-wide.mp4 s1-poster 0 0
enc v011-s1-tall.mp4  s1-tall.mp4 0 26 720;   poster v011-s1-tall.mp4  s1-poster 0 1
enc v013-s2-tall.mp4  s2-tall.mp4 74 26 720;  poster v013-s2-tall.mp4  s2-poster 74 1
enc v014b-s3-wide.mp4 s3-wide.mp4 0 26 1600;   poster v014b-s3-wide.mp4 s3-poster 0 0
enc v015b-s3-tall.mp4 s3-tall.mp4 0 26 720;   poster v015b-s3-tall.mp4 s3-poster 0 1
if [ -f "$SRC/v012-s2-wide.mp4" ]; then enc v012-s2-wide.mp4 s2-wide.mp4 0 26 1600; poster v012-s2-wide.mp4 s2-poster 0 0; fi
ls -la "$OUT"
