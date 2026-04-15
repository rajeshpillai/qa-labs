#!/usr/bin/env bash
# build-pages.sh
# Copies all kata playgrounds into the playground/ directory for GitHub Pages deployment.
# Each kata's playground becomes: playground/<kata-number-and-name>/
#
# Usage: bash scripts/build-pages.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
PLAYGROUND_DIR="$ROOT_DIR/playground"
KATAS_DIR="$ROOT_DIR/katas"

echo "Building GitHub Pages site..."

# clean previous build (keep index.html)
find "$PLAYGROUND_DIR" -mindepth 1 -maxdepth 1 -type d -exec rm -rf {} + 2>/dev/null || true

# copy each kata's playground folder
for kata_dir in "$KATAS_DIR"/phase-*/*/; do
  kata_name=$(basename "$kata_dir")
  playground_src="$kata_dir/playground"

  if [ -d "$playground_src" ]; then
    dest="$PLAYGROUND_DIR/$kata_name"
    cp -r "$playground_src" "$dest"
    echo "  copied: $kata_name"
  fi
done

echo ""
echo "Done. Open playground/index.html to browse all katas."
