# qa-labs

A cookbook-style QA automation training lab — 44 testing katas that take you from zero to expert in **Playwright** and **Cypress**.

Every kata includes a self-contained HTML playground (no external dependencies), detailed explanations for every function, command, and best practice, and complete test solutions for both frameworks.

## Who is this for?

QA engineers — from freshers to experienced testers looking to master modern test automation. The domain focus is **fintech**: KYC onboarding, video-based onboarding, document verification, background checks, and risk assessment.

After completing all katas you will be able to automate e2e tests for any website or app, including complex DOM interactions, animations, CSS effects, Web APIs, drag-drop, multi-window, multi-tab, session-based, and websocket-based applications.

## Prerequisites

- [Node.js](https://nodejs.org/) 18+ installed
- A code editor (VS Code recommended)
- Basic understanding of HTML, CSS, and JavaScript
- Terminal / command line basics

## Getting Started

### 1. Clone the repository

```bash
git clone <repo-url>
cd qa-labs
```

### 2. Set up Playwright

```bash
cd playwright
npm install
npx playwright install
cd ..
```

### 3. Set up Cypress

```bash
cd cypress
npm install
cd ..
```

### 4. Start a kata

Each kata lives in its own folder under `katas/`. Open the kata's `readme.md` to read the lesson, then open the playground in your browser:

```bash
# serve all playgrounds locally
npx serve katas -l 8080

# open a kata's playground
# e.g. http://localhost:8080/phase-00-foundations/01-selectors-and-locators/playground/
```

### 5. Run tests

```bash
# playwright
cd playwright
npx playwright test

# cypress
cd cypress
npx cypress open    # interactive mode
npx cypress run     # headless mode
```

## Curriculum

### Phase 0 — Foundations (katas 01-06)
Selectors, assertions, waits, clicks/inputs, keyboard/mouse, iframes & shadow DOM

### Phase 1 — DOM, Interactions & Browser APIs (katas 07-12)
Drag-and-drop, CSS animations, scroll/intersection, canvas/SVG, DOM mutations, web APIs

### Phase 2 — Forms & Validation (katas 13-17)
Form validation, multi-step forms, file upload, date pickers, dynamic forms

### Phase 3 — Navigation & State (katas 18-21)
Multi-page navigation, localStorage/session, cookies/auth state, tabs & windows

### Phase 4 — API & Real-Time (katas 22-25)
Network interception, API mocking, API-first testing, websockets

### Phase 5 — Fintech Domain (katas 26-31)
KYC onboarding, video onboarding, document verification, background verification, risk assessment, approval/rejection flows

### Phase 6 — Complex Scenarios (katas 32-36)
Multi-window workflows, session management, complex multi-step e2e, error recovery, notifications/toasts

### Phase 7 — Advanced Patterns (katas 37-40)
Page object model, visual regression, accessibility testing, test data & fixtures

### Phase 8 — Parallel & CI/CD (katas 41-44)
Parallel testing, loop-based parallel testing, CI/CD integration, reporting & debugging

## Kata Structure

Each kata folder contains:

```
NN-kata-name/
├── readme.md          # lesson: concepts, exercises, solutions
├── playground/        # self-contained HTML mini-app to test against
│   └── index.html
├── playwright/        # playwright test file
│   └── kata-name.spec.ts
├── cypress/           # cypress test file
│   └── kata-name.cy.ts
└── references/        # optional: cheatsheets, diagrams, extra notes
```

## GitHub Pages

All playgrounds are published to GitHub Pages. You can practice directly in the browser without cloning:

```bash
# build the pages site locally
bash scripts/build-pages.sh
```

## License

MIT
