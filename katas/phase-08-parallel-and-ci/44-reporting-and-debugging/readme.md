# Kata 44: Reporting and Debugging

## What You Will Learn

- How to generate and view HTML test reports in Playwright
- How to use Playwright's Trace Viewer to debug failed tests step-by-step
- How to configure video recording for test runs
- How to capture and view screenshots on failure
- How to capture browser console logs in tests
- How to configure Cypress reporters (mochawesome) and debugging tools

## Prerequisites

- Completed Katas 01-43
- Understanding of test execution and assertions
- Basic familiarity with browser DevTools (console tab)

## Concepts Explained

### Why Reporting and Debugging Matter

```
When a test fails in CI, you cannot open a browser and click around.
You need ARTIFACTS — saved evidence of what happened:

  1. HTML REPORT     — shows pass/fail for every test, with error messages
  2. SCREENSHOTS     — captures what the page looked like at the moment of failure
  3. VIDEO           — records the entire test run (like a screen recording)
  4. TRACE           — a detailed timeline of every action, network request, and DOM snapshot
  5. CONSOLE LOGS    — captures browser console.log, console.error messages

These artifacts are the difference between "the test failed" and
"I know exactly WHY the test failed and HOW to fix it."
```

### Playwright Reporting

```
Playwright has several built-in reporters:

REPORTER         WHAT IT DOES
────────────────────────────────────────────────────────
list             Prints test results to the terminal (default)
dot              Minimal dot-based output (one dot per test)
html             Generates an interactive HTML report
json             Outputs results as JSON (for CI tools)
junit            Outputs JUnit XML (for CI tools like Jenkins)
line             Minimal single-line output per test

Configure in playwright.config.ts:
  reporter: 'html'

Or use multiple reporters:
  reporter: [
    ['html', { open: 'never' }],
    ['json', { outputFile: 'results.json' }],
    ['junit', { outputFile: 'results.xml' }]
  ]
```

### Playwright Trace Viewer

```
The Trace Viewer is Playwright's most powerful debugging tool.
It records a TRACE of every action during a test:

  - DOM snapshots before and after each action
  - Network requests and responses
  - Console logs
  - Screenshots at every step
  - Action timing and duration

CONFIGURATION (playwright.config.ts):
  use: {
    trace: 'on-first-retry'  // record trace only on retries (recommended)
    // trace: 'on'           // record trace for every test (slow, large files)
    // trace: 'retain-on-failure' // keep trace only for failed tests
  }

VIEWING A TRACE:
  npx playwright show-trace trace.zip

Or open the HTML report — traces are linked from failed tests.
```

### Playwright Video Recording

```
Video records the entire browser viewport during a test.

CONFIGURATION (playwright.config.ts):
  use: {
    video: 'on-first-retry'  // record video only on retries
    // video: 'on'           // record every test (lots of disk space)
    // video: 'retain-on-failure' // keep video only for failed tests
  }

Videos are saved to the test results directory.
Open the HTML report to view videos inline.
```

### Playwright Screenshots

```
Playwright can capture screenshots automatically on failure:

CONFIGURATION (playwright.config.ts):
  use: {
    screenshot: 'only-on-failure'  // capture on failure (recommended)
    // screenshot: 'on'           // capture for every test
    // screenshot: 'off'          // no automatic screenshots
  }

You can also capture screenshots manually in tests:
  await page.screenshot({ path: 'debug.png' });
  await page.screenshot({ path: 'full.png', fullPage: true });
```

### Cypress Reporting

```
Cypress uses Mocha reporters. The default is 'spec' (terminal output).

MOCHAWESOME — popular HTML reporter for Cypress:
  npm install --save-dev mochawesome mochawesome-merge mochawesome-report-generator

  // cypress.config.ts
  reporter: 'mochawesome',
  reporterOptions: {
    reportDir: 'cypress/results',
    overwrite: false,
    html: false,       // generate JSON, merge later
    json: true
  }

  // After tests, generate the HTML report:
  npx mochawesome-merge cypress/results/*.json > merged.json
  npx mochawesome-report-generator merged.json

CYPRESS VIDEO:
  // cypress.config.ts
  video: true    // record video of each spec file

CYPRESS SCREENSHOTS:
  Cypress automatically captures screenshots on failure.
  Saved to cypress/screenshots/.
  Disable with: screenshotOnRunFailure: false
```

## Exercises

### Exercise 1: Generate and View an HTML Report (Playwright)
Run tests with the HTML reporter and explore the report.

### Exercise 2: Capture Console Logs
Capture browser console.log messages during tests for debugging.

### Exercise 3: Screenshot on Failure
Configure and trigger automatic screenshots when tests fail.

### Exercise 4: Trace Viewer (Playwright)
Configure trace recording and explore a trace file.

### Exercise 5: Cypress Screenshot and Video
Use cy.screenshot() and configure video recording in Cypress.

### Exercise 6: Debugging Cheatsheet
Use the debugging cheatsheet to quickly diagnose common test failures.

## Key Takeaways

```
- Always configure reporting BEFORE you need it — not after a failure
- Playwright: HTML report + trace viewer = best debugging experience
- Cypress: mochawesome + screenshots + video = good debugging setup
- Use 'on-first-retry' for trace and video — balances detail and performance
- Console log capture helps debug JavaScript errors in the app
- Upload artifacts in CI (see Kata 43) so the team can access them
- The debugging cheatsheet saves time when diagnosing common failures
```
