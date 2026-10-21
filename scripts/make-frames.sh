#!/usr/bin/env bash
# Extrait la séquence d'images de l'intro : 24 i/s (ordinateur) et 12 i/s (mobile), WebP 720 px de large.
# Usage : scripts/make-frames.sh [qualité_desktop] [qualité_mobile]
set -euo pipefail
cd "$(dirname "$0")/.."
SRC=assets/intro-source.mp4
QD=${1:-70}
QM=${2:-70}
rm -rf public/frames && mkdir -p public/frames/desktop public/frames/mobile
ffmpeg -v error -y -i "$SRC" -an -vf "fps=24,scale=720:-2:flags=lanczos" -c:v libwebp -quality "$QD" -compression_level 6 -start_number 1 public/frames/desktop/frame_%03d.webp
ffmpeg -v error -y -i "$SRC" -an -vf "fps=12,scale=720:-2:flags=lanczos" -c:v libwebp -quality "$QM" -compression_level 6 -start_number 1 public/frames/mobile/frame_%03d.webp
for d in desktop mobile; do
  echo "$d : $(ls public/frames/$d | wc -l) images, $(du -sh public/frames/$d | cut -f1)"
done
