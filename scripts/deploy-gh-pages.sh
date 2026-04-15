#!/bin/bash
# Deploy qa-labs website to GitHub Pages
# Usage: ./scripts/deploy-gh-pages.sh
#
# Prerequisites:
#   - Node.js 18+ installed
#   - npm dependencies installed in website/
#   - Git remote "origin" configured
#
# What this does:
#   1. Copies all kata playgrounds into website/public/playgrounds/
#   2. Builds the Next.js static site with basePath=/qa-labs
#   3. Pushes the output to the gh-pages branch
#
# After first deploy, go to:
#   https://github.com/rajeshpillai/qa-labs/settings/pages
#   Set Source: Deploy from a branch → gh-pages → / (root)

set -e

REPO_URL=$(git remote get-url origin 2>/dev/null || echo "https://github.com/rajeshpillai/qa-labs.git")
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
WEBSITE_DIR="$ROOT_DIR/website"
OUT_DIR="$WEBSITE_DIR/out"

echo "=== Step 1: Install dependencies ==="
cd "$WEBSITE_DIR"
npm install --silent

echo ""
echo "=== Step 2: Copy playgrounds ==="
bash "$WEBSITE_DIR/scripts/copy-playgrounds.sh"

echo ""
echo "=== Step 3: Build static site (with basePath=/qa-labs) ==="
GITHUB_PAGES=true npm run build

echo ""
echo "=== Step 4: Prepare deployment ==="
cd "$OUT_DIR"

# SPA routing: copy index.html to 404.html so client-side routes work
cp index.html 404.html

# Prevent GitHub from processing with Jekyll
touch .nojekyll

echo ""
echo "=== Step 5: Deploy to gh-pages branch ==="
git init
git checkout -b gh-pages
git add -A
git commit -m "Deploy qa-labs to GitHub Pages"
git push -f "$REPO_URL" gh-pages

# Cleanup
cd "$WEBSITE_DIR"
rm -rf "$OUT_DIR/.git"

echo ""
echo "=== Deployed! ==="
echo ""
echo "Next steps:"
echo "  1. Go to https://github.com/rajeshpillai/qa-labs/settings/pages"
echo "  2. Set Source: Deploy from a branch → gh-pages → / (root)"
echo "  3. Site will be live at: https://rajeshpillai.github.io/qa-labs/"
