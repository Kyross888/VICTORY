#!/bin/bash
# ============================================================
#  generate_pwa_icons.sh
#  Run this ONCE on your server to create the PNG icons
#  required for PWA installability.
#
#  Usage:
#    chmod +x generate_pwa_icons.sh
#    bash generate_pwa_icons.sh
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

# Create img directory if it doesn't exist
mkdir -p img

echo "Generating icons..."

# Generate all required icon sizes
convert "$SOURCE" -resize 72x72! img/icon-72.png
convert "$SOURCE" -resize 96x96! img/icon-96.png
convert "$SOURCE" -resize 128x128! img/icon-128.png
convert "$SOURCE" -resize 144x144! img/icon-144.png
convert "$SOURCE" -resize 152x152! img/icon-152.png
convert "$SOURCE" -resize 192x192! img/icon-192.png
convert "$SOURCE" -resize 384x384! img/icon-384.png
convert "$SOURCE" -resize 512x512! img/icon-512.png

echo ""
echo "Done! Icons created:"
ls -lh img/icon-*.png
echo ""
echo "Now restart your Docker container or refresh the website."
