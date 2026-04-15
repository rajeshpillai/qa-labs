# qa-labs: QA Automation Testing Katas

## Context

Create a cookbook-style QA automation training lab (testing katas) that takes a fresher from zero to expert in Playwright and Cypress. Domain: fintech (KYC onboarding, video-based onboarding, background verification, risk assessment). Each kata is self-contained with its own built-in HTML playground. Publishable to GitHub Pages.

**Goal**: After completing all katas, the learner can automate e2e for ANY website or app — including complex DOM interactions, animations, CSS effects, Web APIs, drag-drop, multi-window, multi-tab, session-based, and websocket-based applications.

Key principles:
- **Fresher-friendly**: Every function, command, timer, assertion, and best practice explained inline — no assumed knowledge
- **Kata-per-folder**: Each kata is a folder containing everything — markdown, playground HTML, tests, references, sidecars
- **Self-contained**: Each playground is a working mini web app with zero external dependencies
- **Dual-framework**: Every kata has both Playwright and Cypress test files
- **All names lowercase-hyphenated**

---

## Directory Structure

```
qa-labs/
├── .gitignore
├── readme.md
├── plan.md                                # detailed project plan (this plan, placed in repo)
│
├── katas/
│   ├── phase-00-foundations/
│   │   ├── 01-selectors-and-locators/
│   │   │   ├── readme.md                  # kata explanation, exercises, solutions
│   │   │   ├── playground/
│   │   │   │   └── index.html             # self-contained mini web app
│   │   │   ├── playwright/
│   │   │   │   └── selectors.spec.ts      # playwright test
│   │   │   ├── cypress/
│   │   │   │   └── selectors.cy.ts        # cypress test
│   │   │   └── references/                # optional: cheatsheets, diagrams, extra notes
│   │   │       └── selector-cheatsheet.md
│   │   ├── 02-assertions/
│   │   │   └── ...
│   │   └── ...
│   │
│   ├── phase-01-dom-and-browser-apis/
│   │   ├── 07-drag-and-drop/
│   │   │   ├── readme.md
│   │   │   ├── playground/
│   │   │   │   ├── index.html
│   │   │   │   ├── style.css              # optional when inline gets unwieldy
│   │   │   │   └── app.js
│   │   │   ├── playwright/
│   │   │   │   └── drag-and-drop.spec.ts
│   │   │   ├── cypress/
│   │   │   │   └── drag-and-drop.cy.ts
│   │   │   └── references/
│   │   └── ...
│   │
│   ├── phase-02-forms/
│   ├── phase-03-navigation-and-state/
│   ├── phase-04-api-and-realtime/
│   ├── phase-05-fintech-domain/
│   ├── phase-06-complex-scenarios/
│   ├── phase-07-advanced-patterns/
│   └── phase-08-parallel-and-ci/
│
├── playground/                            # all playgrounds aggregated for gh pages
│   ├── index.html                         # landing page linking to all kata playgrounds
│   └── (build script copies kata playgrounds here)
│
├── playwright/                            # project-level playwright config
│   ├── package.json
│   └── playwright.config.ts
│
├── cypress/                               # project-level cypress config
│   ├── package.json
│   └── cypress.config.ts
│
├── scripts/
│   └── build-pages.sh                     # copies all kata playgrounds into playground/ for gh pages
│
└── .github/
    └── workflows/
        └── deploy-pages.yml
```

**Key decisions:**
- Each kata is a self-contained folder with readme, playground, tests, and references
- Kata test files live inside the kata folder but are discovered by the top-level playwright/cypress configs
- `playground/` at root is the aggregated GitHub Pages deploy target, built by `scripts/build-pages.sh`
- The build script copies each kata's `playground/` into `playground/01-selectors-and-locators/` etc.
- `plan.md` lives in the repo root so the project vision is always accessible

---

## Curriculum (44 Katas, 9 Phases)

### Phase 0 — Foundations (01-06)

| # | Kata | Playground | What the fresher learns |
|---|------|-----------|------------------------|
| 01 | selectors-and-locators | form with various element types | CSS selectors, data-testid, role-based locators, getByRole, getByText, cy.get, when to use which |
| 02 | assertions | dashboard with counters, text, toggles | toBe, toHaveText, toBeVisible, should/expect, soft vs hard assertions |
| 03 | waits-and-timing | page with delayed rendering (setTimeout) | auto-wait vs explicit wait, why sleep is bad, timeout config, flaky test prevention |
| 04 | clicks-and-inputs | interactive calculator | click, fill, type, clear, check, select — what each does and when to use it |
| 05 | keyboard-and-mouse | risk tier sorter with keyboard shortcuts | keyboard events, hover, drag, focus, modifier keys |
| 06 | iframes-and-shadow-dom | embedded compliance widget | frame locators, shadow DOM piercing, contentFrame vs frameLocator |

### Phase 1 — DOM, Interactions & Browser APIs (07-12)

| # | Kata | Playground | What the fresher learns |
|---|------|-----------|------------------------|
| 07 | drag-and-drop | kanban board (move tasks between columns) | HTML5 drag API, dataTransfer, drag events, testing drag sequences |
| 08 | css-animations-and-transitions | card flip, slide-in panels, loading spinners | testing animated elements, waiting for transitions, computed styles, getComputedStyle |
| 09 | scroll-and-intersection | infinite scroll feed + lazy-loaded images | scrollIntoView, IntersectionObserver, scroll position assertions, viewport checks |
| 10 | canvas-and-svg | signature pad + risk heat map (SVG) | canvas pixel testing, SVG element interaction, drawing actions |
| 11 | dom-mutations | live-updating notification panel | MutationObserver patterns, dynamic DOM changes, waitFor with DOM state |
| 12 | web-apis | clipboard copy, geolocation mock, permissions dialog | navigator APIs, clipboard, geolocation override, permission mocking, dialog handling |

### Phase 2 — Forms & Validation (13-17)

| # | Kata | Playground | What the fresher learns |
|---|------|-----------|------------------------|
| 13 | form-validation | KYC personal details form | required fields, regex patterns, error messages, form submit |
| 14 | multi-step-forms | 4-step KYC wizard | step navigation, state persistence, back/next, progress indicators |
| 15 | file-upload | document upload (ID, address proof) | file input, drag-drop upload, preview, file type validation |
| 16 | date-pickers-and-dropdowns | DOB, country, occupation selectors | custom widgets, calendar, select vs custom dropdown |
| 17 | dynamic-forms | fields that appear/disappear by selection | conditional rendering, dynamic validation rules |

### Phase 3 — Navigation & State (18-21)

| # | Kata | Playground | What the fresher learns |
|---|------|-----------|------------------------|
| 18 | multi-page-navigation | KYC flow across pages (hash routing) | navigation, URL assertions, history, waitForURL |
| 19 | local-storage-and-session | remember-me, draft saving | storage inspection, state between reloads, evaluate |
| 20 | cookies-and-auth-state | login with session cookies, "stay logged in" | cookie inspection, storageState, auth reuse across tests |
| 21 | tabs-and-windows | "open terms in new tab" + popup consent window | multi-tab handling, multi-window, window handles, popup events, cross-window communication |

### Phase 4 — API & Real-Time (22-25)

| # | Kata | Playground | What the fresher learns |
|---|------|-----------|------------------------|
| 22 | network-interception | KYC form that POSTs to mock API | route interception, request/response assertions, waitForResponse |
| 23 | api-mocking | risk assessment fetching scores | mock responses, error simulation, latency injection |
| 24 | api-first-testing | no playground — pure API tests | playwright request context, cy.request, API-only patterns |
| 25 | websockets | live KYC status feed + chat support widget | WebSocket interception, message assertions, connection lifecycle, real-time UI updates |

### Phase 5 — Fintech Domain (26-31)

| # | Kata | Playground | What the fresher learns |
|---|------|-----------|------------------------|
| 26 | kyc-onboarding-flow | full KYC app (multi-page, upload, review) | end-to-end flow, page object model intro |
| 27 | video-onboarding | video call simulation (canvas + timer) | media elements, canvas testing, timer-based assertions |
| 28 | document-verification | upload + OCR simulation | async processing, polling, status transitions |
| 29 | background-verification | status tracker with websocket updates | polling, retries, timeout strategies, websocket status push |
| 30 | risk-assessment | scorecard with conditional actions | data-driven assertions, table parsing |
| 31 | approval-rejection-flows | admin review panel (multi-window: applicant + admin) | role-based flows, decision trees, coordinating actions across windows |

### Phase 6 — Complex Scenarios (32-36)

| # | Kata | Playground | What the fresher learns |
|---|------|-----------|------------------------|
| 32 | multi-window-workflows | applicant in window A, admin in window B | orchestrating tests across multiple browser windows, syncing state |
| 33 | session-management | app with login, session timeout, refresh tokens | session expiry handling, re-authentication, storageState persistence |
| 34 | complex-multi-step-e2e | full onboarding: register → KYC → video → doc verify → approval | chaining long flows, checkpoints, test resilience, teardown |
| 35 | error-recovery-and-retries | app with intermittent failures, network drops | retry strategies, error boundaries, graceful degradation testing |
| 36 | notifications-and-toasts | app with toast messages, banners, modals | transient UI elements, timing, waitFor patterns for ephemeral content |

### Phase 7 — Advanced Patterns (37-40)

| # | Kata | Playground | What the fresher learns |
|---|------|-----------|------------------------|
| 37 | page-object-model | reuse kata 26 playground | POM pattern, abstraction, maintainability |
| 38 | visual-regression | KYC dashboard | screenshot comparison, toHaveScreenshot |
| 39 | accessibility-testing | KYC form with a11y issues | axe-core, ARIA, WCAG |
| 40 | test-data-and-fixtures | data-driven KYC tests | JSON fixtures, parameterized tests, test.each |

### Phase 8 — Parallel & CI/CD (41-44)

| # | Kata | Playground | What the fresher learns |
|---|------|-----------|------------------------|
| 41 | parallel-testing | reuse prior playgrounds | workers, sharding, fullyParallel |
| 42 | loop-parallel-testing | reuse kata 26 playground | same URL + N different applicants in parallel |
| 43 | ci-cd-integration | N/A — GitHub Actions config | workflow files, matrix, artifacts |
| 44 | reporting-and-debugging | N/A — uses prior test runs | HTML reports, trace viewer, video, screenshots |

---

## Kata Format (Fresher-Friendly)

Each kata's `readme.md` explains everything inline. No assumed knowledge:

```markdown
# Kata NN: Title

## What You Will Learn
- bullet list of objectives

## Prerequisites
- which prior katas to complete first

## Concepts Explained
- every concept broken down: what, why, when to use
- code snippets for BOTH playwright and cypress side by side
- every function/method: what it does, parameters, return value
- timers, waits, retries — when and why
- best practices and anti-patterns called out

## Playground
- what the mini app does, how to open it

## Exercises (Step by Step)
1. clear instructions a fresher can follow
2. expected outcome described
3. hints if stuck

## Solutions
- complete playwright test with comments explaining every line
- complete cypress test with comments explaining every line

## Common Mistakes
- what freshers get wrong and how to fix it

## Quick Reference
- cheatsheet of commands/functions used in this kata
```

---

## Config Approach

### playwright/playwright.config.ts
- `testDir` pattern: `'../katas/**/playwright/*.spec.ts'`
- `webServer`: `npx serve ../katas -l 8080` (serves all playgrounds)
- `baseURL`: `'http://localhost:8080'`
- Each test navigates to its kata's playground path

### cypress/cypress.config.ts
- `specPattern`: `'../katas/**/cypress/*.cy.ts'`
- `baseUrl`: `'http://localhost:8080'`
- `start-server-and-test` in package.json scripts

---

## GitHub Pages

- `scripts/build-pages.sh`: copies each kata's `playground/` folder into `playground/` at root with flat naming
- `playground/index.html`: landing page with links to all playgrounds, organized by phase
- `.github/workflows/deploy-pages.yml`: runs build script, deploys `playground/` to GitHub Pages
- Zero build dependencies — just file copying

---

## Git Setup

- `git init` in qa-labs
- `.gitignore` includes: node_modules, playwright-report, test-results, cypress/screenshots, cypress/videos, .DS_Store, dist

---

## Implementation Sequence

1. **Scaffold**: git init, .gitignore, plan.md, readme.md, directory structure, package.json for both projects, configs, build script
2. **Phase 0** (01-06): foundation playgrounds + detailed readmes + tests
3. **Phase 1** (07-12): DOM, interactions, browser APIs
4. **Phase 2-3** (13-21): forms, navigation, state
5. **Phase 4** (22-25): API testing, websockets
6. **Phase 5** (26-31): fintech domain playgrounds (most complex HTML apps)
7. **Phase 6** (32-36): complex scenarios
8. **Phase 7-8** (37-44): advanced patterns, parallel testing, CI/CD
9. **GitHub Pages**: landing page, deploy workflow, polish

Each phase is independently useful — a learner gains real skills after completing any phase.

---

## Verification

- `cd playwright && npm install && npx playwright test` — all tests pass
- `cd cypress && npm install && npx cypress run` — all tests pass
- Open any kata's `playground/index.html` directly in browser — works standalone
- `bash scripts/build-pages.sh` → `playground/index.html` links work
- Push to GitHub → Pages deploys → playgrounds accessible via URL

---

## Critical Files to Create First

1. `qa-labs/.gitignore`
2. `qa-labs/plan.md` — detailed project plan
3. `qa-labs/readme.md` — project overview, how to use, prerequisites (node, npm)
4. `qa-labs/playwright/package.json` + `playwright.config.ts`
5. `qa-labs/cypress/package.json` + `cypress.config.ts`
6. `qa-labs/katas/phase-00-foundations/01-selectors-and-locators/` — first kata (template for all others)
7. `qa-labs/scripts/build-pages.sh`
8. `qa-labs/playground/index.html` — landing page
