#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
KATAS_DIR="$ROOT_DIR/../katas"
DEST="$ROOT_DIR/public/playgrounds"

rm -rf "$DEST"
mkdir -p "$DEST"

for kata_dir in "$KATAS_DIR"/phase-*/*/; do
  kata_name=$(basename "$kata_dir")
  if [ -d "$kata_dir/playground" ]; then
    cp -r "$kata_dir/playground/." "$DEST/$kata_name/"
    echo "  copied: $kata_name"
  fi
done
echo "Done. Playgrounds copied to public/playgrounds/"
