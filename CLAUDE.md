# qa-labs

QA automation testing katas — 44 hands-on katas teaching Playwright and Cypress from beginner to expert.

## Project Structure

```
qa-labs/
├── katas/                    # 44 katas across 9 phases
│   └── phase-NN-name/
│       └── NN-kata-name/
│           ├── readme.md     # lesson content
│           ├── playground/   # self-contained HTML app
│           ├── playwright/   # Playwright test files
│           ├── cypress/      # Cypress test files
│           └── references/   # optional cheatsheets
├── playwright/               # Playwright project config
├── cypress/                  # Cypress project config
├── website/                  # Next.js interactive learning site
├── scripts/                  # build and deploy scripts
└── playground/               # GitHub Pages landing (aggregated)
```

## Conventions

- All file/folder names: **lowercase-hyphenated**
- Every kata is self-contained: readme + playground + tests for both frameworks
- Playgrounds are vanilla HTML/CSS/JS — no external dependencies, no CDN
- All interactive elements have `data-testid` attributes
- Test files are heavily commented — every function, command, and best practice explained for freshers
- Katas are numbered sequentially across phases (01-44)

## Running Tests

```bash
# Playwright
cd playwright && npm install && npx playwright install && npx playwright test

# Cypress
cd cypress && npm install && npx cypress run
```

Both test projects serve the katas directory via `npx serve ../katas -l 8080`.

## Website

```bash
cd website
npm install
npm run dev       # local dev server
npm run deploy    # build and deploy to GitHub Pages
```

The website reads kata content at build time from `../katas/`. Playgrounds are copied to `public/playgrounds/` via `scripts/copy-playgrounds.sh`.

## Domain

Fintech focus: KYC onboarding, video-based verification, document verification, background checks, risk assessment, approval flows.

## Tech Stack

- **Katas**: Vanilla HTML/CSS/JS playgrounds, Playwright + Cypress tests (TypeScript)
- **Website**: Next.js 15, Tailwind CSS v4, shiki, react-markdown, next-themes
- **Deploy**: GitHub Pages via `scripts/deploy-gh-pages.sh`
