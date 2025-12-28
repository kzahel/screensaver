#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "Generating icons from SVG..."

for size in 16 32 48 128; do
  convert -background none -density 256 \
    "$PROJECT_DIR/icons/icon.svg" \
    -resize "${size}x${size}" \
    "$PROJECT_DIR/icon${size}.png"
  echo "  Generated icon${size}.png"
done

echo "Done!"
