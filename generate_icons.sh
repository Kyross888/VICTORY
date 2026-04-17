#!/bin/bash
# ============================================================
#  generate_icons.sh
#  Run this ONCE on your server to create the PNG icons
#  required for PWA installability.
#
#  Usage:
#    chmod +x generate_icons.sh
#    bash generate_icons.sh
#
#  Requires: ImageMagick (apt install imagemagick)
# ============================================================

SOURCE="img/350980067_209708485284413_3662357125511446837_n.jpg"

if [ ! -f "$SOURCE" ]; then
  echo "ERROR: Source image not found at $SOURCE"
  echo "Run this from your project root (same folder as login.html)"
  exit 1
fi

echo "Installing ImageMagick if needed..."
apt-get install -y imagemagick 2>/dev/null || true

echo "Generating img/icon-192.png ..."
convert "$SOURCE" -resize 192x192! img/icon-192.png

echo "Generating img/icon-512.png ..."
convert "$SOURCE" -resize 512x512! img/icon-512.png

echo ""
echo "Done! Icons created:"
ls -lh img/icon-192.png img/icon-512.png
echo ""
echo "Now rebuild/restart your Docker container."
