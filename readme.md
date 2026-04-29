# qa-labs

**Master test automation with 44 hands-on katas covering Playwright and Cypress.**

[**🚀 Try it live**](https://rajeshpillai.github.io/qa-labs/) — interactive learning site with playgrounds, solutions, and progress tracking.

---

## What is this?

A cookbook-style QA automation training lab that takes you from zero to expert in modern test automation. Every kata is a self-contained lesson with:

- 📖 A detailed readme explaining concepts, functions, and best practices
- 🎮 A built-in HTML playground (no external dependencies)
- ✅ Complete Playwright test solution
- ✅ Complete Cypress test solution
- 📝 Common mistakes, quick reference tables, and exercises

**Domain focus**: Fintech — KYC onboarding, video verification, document verification, background checks, risk assessment.

**Who is this for?**
- QA freshers learning automation from scratch
- Developers wanting to add e2e testing skills
- Experienced testers wanting to compare Playwright vs Cypress
- Teams building a structured QA onboarding program

After all 44 katas you'll be able to automate e2e tests for any website or app — including complex DOM interactions, animations, CSS effects, Web APIs, drag-drop, multi-window, multi-tab, session-based, and websocket-based applications.

---

## Curriculum

| Phase | Katas | Focus |
|-------|-------|-------|
| **0 — Foundations** | 01-06 | Selectors, assertions, waits, inputs, keyboard, iframes, shadow DOM |
| **1 — DOM & Browser APIs** | 07-12 | Drag-drop, animations, scroll, canvas, SVG, mutations, web APIs |
| **2 — Forms & Validation** | 13-17 | Validation, multi-step wizards, file upload, date pickers, dynamic forms |
| **3 — Navigation & State** | 18-21 | Routing, localStorage, cookies, auth, tabs, windows |
| **4 — API & Real-Time** | 22-25 | Network interception, mocking, API-first, websockets |
| **5 — Fintech Domain** | 26-31 | KYC onboarding, video, docs, background checks, risk, approval |
| **6 — Complex Scenarios** | 32-36 | Multi-window, session management, long flows, error recovery, notifications |
| **7 — Advanced Patterns** | 37-40 | Page object model, visual regression, accessibility, test data/fixtures |
| **8 — Parallel & CI/CD** | 41-44 | Parallel testing, loop-parallel, CI/CD, reporting & debugging |
| **9 — Perf Foundations** *(new)* | 45-47 | HTTP basics, percentiles, throughput, Little's Law |
| **10 — k6 Basics** *(new)* | 48-50 | Smoke tests, VUs, ramping, thresholds, custom metrics |
| **11 — Realistic Scenarios** *(new)* | 51-53 | Parameterization, auth flows, fintech KYC at scale |
| **12 — Test Types** *(new)* | 54-57 | Load, stress, spike, soak, breakpoint |
| **13 — Frontend Perf** *(new)* | 58-60 | Lighthouse, Web Vitals, perf budgets, Lighthouse CI |
| **14 — APIs + WebSockets at Scale** *(new)* | 61-63 | k6 WS module, REST batching, rate-limit handling |
| **15 — Hybrid (k6 browser)** *(new)* | 64-65 | k6 browser module, Playwright traces for perf |
| **16 — Observability** *(new)* | 66-68 | Grafana dashboards, Prometheus, distributed tracing |
| **17 — Chaos & Resilience** *(new)* | 69-70 | Toxiproxy fault injection, retry storms, circuit breakers |
| **18 — CI/CD + Capstone** *(new)* | 71-74 | CI gates, baselines, JMeter awareness, full perf engagement |

> **New: Performance curriculum (phases 9–18).** Adds ~30 katas using **k6** (primary), **Artillery** (parallel solutions), **JMeter** (awareness), Playwright + Lighthouse CI (browser-side perf). Targets are tunable HTTP endpoints exposed by the local `server/` under `/lab/*`. Functional curriculum (phases 0–8) is unchanged.

---

## Quick Start

### Option 1: Use the live site (no setup)

Open [rajeshpillai.github.io/qa-labs](https://rajeshpillai.github.io/qa-labs/) and start learning. Read, try the playgrounds, see solutions for both frameworks.

### Option 2: Clone and run locally

```bash
git clone https://github.com/rajeshpillai/qa-labs.git
cd qa-labs

# Install Playwright
cd playwright && npm install && npx playwright install && cd ..

# Install Cypress
cd cypress && npm install && cd ..

# Run Playwright tests
cd playwright && npx playwright test

# Run Cypress tests (interactive)
cd cypress && npx cypress open
```

### Performance tools (phases 9+ only)

The performance curriculum requires three additional CLIs. None of these are managed via npm — they're standalone binaries.

```bash
# k6 (primary tool — required for all perf katas)
# macOS:
brew install k6
# Ubuntu/Debian:
sudo gpg -k && sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update && sudo apt-get install k6
# Verify:
k6 version

# Artillery (parallel solutions — required to run the .yml katas)
npm install -g artillery
artillery --version

# JMeter (awareness only — needed for kata 73)
# Download from https://jmeter.apache.org/download_jmeter.cgi and unzip
# Add bin/ to PATH, then:
jmeter --version
```

**Run a perf kata directly (without the website UI):**

```bash
# Start the lab targets (server exposes /lab/* endpoints)
cd server && npm start &

# Then in another terminal:
k6 run katas/phase-09-perf-foundations/45-http-and-latency-basics/k6/45-http-and-latency-basics.test.js

# Or with Artillery:
artillery run katas/phase-09-perf-foundations/45-http-and-latency-basics/artillery/45-http-and-latency-basics.yml
```

### Option 3: Run the interactive site locally

The site can run in two modes. **Pick based on whether you need the "Run Tests" tab.**

| Mode | Command | URL | Run Tests tab? |
|------|---------|-----|----------------|
| **Next dev** (fast reload, no test execution) | `cd website && npm run dev` | http://localhost:3000 | ❌ Shows fallback message |
| **Server mode** (full experience, test execution works) | build website + run server (below) | http://localhost:3000 | ✅ |

> **Heads up:** both modes use port 3000 — don't run them at the same time. The Express server also serves the built website, so in server mode you do **not** need Next dev running.

#### Server mode (full experience)

```bash
# 1. Build the website (static export)
cd website && npm install && npm run build

# 2. Start the server (serves website/out + test execution API on :3000)
cd ../server && npm install && npm start

# Open http://localhost:3000
# Navigate to any kata → "Run Tests" tab → execute tests live
```

If port 3000 is already in use, stop your Next dev server first (`Ctrl+C` in that terminal, or `lsof -ti:3000 | xargs kill`).

---

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
├── playwright/               # Playwright project root
├── cypress/                  # Cypress project root
├── website/                  # Next.js interactive learning site
├── server/                   # Express backend for test execution
└── scripts/                  # build and deploy scripts
```

---

## How a Kata Works

Each kata is self-contained. Open a kata's folder and you'll find:

1. **`readme.md`** — Read the lesson. Every concept, function, and command is explained with code examples for both frameworks side-by-side.
2. **`playground/index.html`** — A self-contained fintech-themed mini-app. Open it in a browser to interact with it manually.
3. **`playwright/<kata>.spec.ts`** — The Playwright solution with detailed inline comments.
4. **`cypress/<kata>.cy.ts`** — The Cypress solution with detailed inline comments.

### Learning flow

1. Read the "Concepts Explained" section of the readme
2. Open the playground and try it manually
3. Look at the exercises
4. Try to write tests yourself
5. Compare with the provided solutions
6. Mark the kata as complete

---

## Tech Stack

- **Katas**: Vanilla HTML/CSS/JS playgrounds (zero dependencies)
- **Functional tests**: Playwright 1.52+ and Cypress 14+ (TypeScript)
- **Performance tests**: k6 (primary), Artillery (parallel), JMeter (awareness), Lighthouse CI (frontend perf), k6 browser (hybrid)
- **Website**: Next.js 15, Tailwind CSS v4, shadcn/ui components, shiki (syntax highlighting), react-markdown
- **Server**: Express 4, SSE for live test result streaming, `/lab/*` endpoints as load-test targets
- **Deploy**: GitHub Pages for static site, `npm run deploy` script

---

## Features of the Interactive Site

- 🌙 **Dark/light theme** with system preference detection
- 📚 **Sidebar navigation** with collapsible phases and completion tracking
- 🔍 **Search** across all katas (⌘+K)
- 📝 **Three tabs per kata**: Learn (readme), Playground (iframe), Solutions (code viewer)
- ⚡ **Run Tests** tab — execute Playwright/Cypress tests live with per-exercise results (requires local server)
- 📊 **Progress tracking** via localStorage
- 📱 **Mobile responsive** with slide-out sidebar
- 🎨 **Table of contents** for long kata readmes (on wide screens)

---

## Roadmap

- [ ] Deploy test execution backend to Railway/Render for online test runs
- [ ] Add more katas: database testing, GraphQL, mobile viewport, Lighthouse, OAuth, i18n, PDF, email
- [ ] CI pipeline to verify all katas pass on every commit
- [ ] Progress dashboard with streaks and estimated completion time

---

## Contributing

Found a bug? Have a kata idea? PRs welcome.

1. Pick an existing kata or propose a new one
2. Follow the kata structure (readme, playground, playwright, cypress)
3. Keep playgrounds self-contained (no CDN, no external deps)
4. Use `data-testid` for all interactive elements
5. Write detailed comments explaining every function for freshers

---

## License

MIT
