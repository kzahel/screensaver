#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
DIST_DIR="$PROJECT_DIR/dist"
PACKAGE_NAME="oled-screensaver"

echo "Building OLED Screensaver extension package..."

# Clean previous build
rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR"

# Files to include in the extension package
EXTENSION_FILES=(
  "manifest.json"
  "background.js"
  "background-logic.js"
  "storage.js"
  "quotes.js"
  "options.html"
  "options.js"
  "options.css"
  "screensaver.html"
  "screensaver.js"
  "icon16.png"
  "icon32.png"
  "icon48.png"
  "icon128.png"
)

# Copy extension files
echo "Copying extension files..."
for file in "${EXTENSION_FILES[@]}"; do
  if [ -f "$PROJECT_DIR/$file" ]; then
    cp "$PROJECT_DIR/$file" "$DIST_DIR/"
    echo "  + $file"
  else
    echo "  ! Warning: $file not found"
  fi
done

# Copy screensavers directory
echo "Copying screensavers..."
mkdir -p "$DIST_DIR/screensavers"
cp "$PROJECT_DIR/screensavers/"*.js "$DIST_DIR/screensavers/"
echo "  + screensavers/*.js"

# Create zip package
echo "Creating zip package..."
cd "$DIST_DIR"
zip -r "../$PACKAGE_NAME.zip" ./*
cd "$PROJECT_DIR"

# Calculate sizes
UNCOMPRESSED_SIZE=$(du -sh "$DIST_DIR" | cut -f1)
COMPRESSED_SIZE=$(du -sh "$PROJECT_DIR/$PACKAGE_NAME.zip" | cut -f1)

echo ""
echo "Package created successfully!"
echo "  Location: $PROJECT_DIR/$PACKAGE_NAME.zip"
echo "  Uncompressed: $UNCOMPRESSED_SIZE"
echo "  Compressed: $COMPRESSED_SIZE"
echo ""
echo "Contents:"
unzip -l "$PROJECT_DIR/$PACKAGE_NAME.zip"
