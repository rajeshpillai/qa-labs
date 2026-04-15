# Kata 43: CI/CD Integration

## What You Will Learn

- How to run Playwright and Cypress tests in GitHub Actions
- How to configure a CI workflow YAML file step by step
- How to use matrix strategy for cross-browser testing
- How to upload test artifacts (reports, screenshots, videos)
- How to cache dependencies for faster CI runs
- How to set up test reporting and failure notifications

## Prerequisites

- Completed Katas 01-42
- Basic understanding of YAML syntax
- A GitHub account (for GitHub Actions)
- Understanding of what CI/CD means (Continuous Integration / Continuous Deployment)

## Concepts Explained

### What Is CI/CD?

```
CI (Continuous Integration):
  Every time you push code to GitHub, automated checks run:
  - Lint your code
  - Run unit tests
  - Run end-to-end tests (Playwright, Cypress)
  - Build the application
  If any check fails, the pull request is blocked.

CD (Continuous Deployment):
  If all checks pass, the code is automatically deployed to production
  (or a staging environment for manual review).

Why CI for QA?
  - Tests run automatically on every push — no manual test runs
  - Tests run in a clean environment — no "works on my machine" issues
  - Parallel execution on CI machines — faster feedback
  - Test results are visible to the whole team
  - Broken tests block merges — prevents regressions
```

### GitHub Actions Workflow Structure

```yaml
# .github/workflows/test.yml
#
# A workflow is a YAML file that defines automated steps.
# It lives in the .github/workflows/ directory of your repository.

name: Tests                    # Display name in the GitHub UI

on:                            # TRIGGER — when does this workflow run?
  push:
    branches: [main]           # Run on pushes to main
  pull_request:
    branches: [main]           # Run on PRs targeting main

jobs:                          # JOBS — what to run
  test:                        # Job name (you choose this)
    runs-on: ubuntu-latest     # Machine type (Linux)
    steps:                     # STEPS — sequential commands
      - uses: actions/checkout@v4        # Clone the repo
      - uses: actions/setup-node@v4      # Install Node.js
      - run: npm ci                       # Install dependencies
      - run: npx playwright test          # Run tests
```

### Key Concepts

```
RUNNER:
  The machine that runs your workflow. GitHub provides:
  - ubuntu-latest (Linux — most common, fastest)
  - windows-latest (Windows)
  - macos-latest (macOS — needed for Safari/WebKit)

STEPS:
  Sequential commands within a job. Each step either:
  - uses: — runs a pre-built action (e.g., actions/checkout@v4)
  - run: — executes a shell command (e.g., npm ci)

MATRIX:
  Run the same job multiple times with different parameters.
  Use this for cross-browser testing (Chrome, Firefox, WebKit).

ARTIFACTS:
  Files saved from the CI run for later download.
  Upload test reports, screenshots, and videos as artifacts.
  Team members can download them from the GitHub UI.

CACHING:
  Save node_modules between runs to speed up npm install.
  actions/cache@v4 handles this automatically.
```

## Reference Files

This kata includes example workflow files in the `references/` directory.
These are NOT active workflows (they are not in .github/workflows/).
They are templates you can copy to your own repository.

```
references/
  playwright-ci.yml    — GitHub Actions workflow for Playwright
  cypress-ci.yml       — GitHub Actions workflow for Cypress
  matrix-ci.yml        — Matrix strategy for cross-browser testing
```

## Exercises

### Exercise 1: Read and Understand the Playwright CI Workflow
Open `references/playwright-ci.yml` and understand each line.

### Exercise 2: Read and Understand the Cypress CI Workflow
Open `references/cypress-ci.yml` and understand each line.

### Exercise 3: Matrix Strategy for Cross-Browser Testing
Open `references/matrix-ci.yml` and understand matrix configuration.

### Exercise 4: Artifact Upload
Understand how to upload test reports and screenshots as CI artifacts.

### Exercise 5: Caching for Faster Builds
Understand how dependency caching reduces CI build times.

### Exercise 6: Create Your Own Workflow
Design a workflow that runs both Playwright and Cypress in the same CI pipeline.

## Key Takeaways

```
- CI runs your tests automatically on every push/PR
- GitHub Actions uses YAML files in .github/workflows/
- Use matrix strategy for cross-browser testing
- Upload artifacts (reports, screenshots) for debugging failed tests
- Cache node_modules and Playwright browsers for faster CI runs
- Start simple (one browser, one OS) and add complexity later
- CI failures should block merges — that is the whole point
```
