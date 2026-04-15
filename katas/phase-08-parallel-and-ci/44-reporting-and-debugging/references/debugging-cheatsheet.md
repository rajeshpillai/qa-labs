# Debugging Cheatsheet

Quick reference for diagnosing test failures in Playwright and Cypress.

## Playwright Debugging

### CLI Flags

| Flag | What It Does |
|------|-------------|
| `--headed` | Show the browser window during tests |
| `--debug` | Open the Playwright Inspector (step through) |
| `--trace=on` | Record a trace file for every test |
| `--reporter=html` | Generate an interactive HTML report |
| `--update-snapshots` | Update visual regression baselines |
| `--workers=1` | Run one test at a time (easier to debug) |
| `--repeat-each=3` | Run each test 3 times (find flaky tests) |
| `--grep "test name"` | Run only tests matching the pattern |

### In-Test Debugging

```typescript
// Pause the test and open the Inspector
await page.pause();

// Take a screenshot at a specific point
await page.screenshot({ path: 'debug.png' });

// Capture the full page
await page.screenshot({ path: 'full.png', fullPage: true });

// Log a message to the test output
console.log('Debug info:', someVariable);

// Attach a file to the HTML report
await test.info().attach('debug-screenshot', {
  body: await page.screenshot(),
  contentType: 'image/png'
});

// Capture browser console messages
page.on('console', msg => console.log(`[browser] ${msg.text()}`));

// Capture page errors (uncaught exceptions)
page.on('pageerror', error => console.log(`[page error] ${error.message}`));

// Slow down actions (useful for visual debugging)
// In playwright.config.ts: use: { launchOptions: { slowMo: 500 } }
```

### Viewing Reports and Traces

```bash
# View the HTML report
npx playwright show-report

# View a trace file
npx playwright show-trace test-results/path/to/trace.zip

# Open the trace viewer in browser
npx playwright show-trace --browser test-results/path/to/trace.zip
```

### Configuration (playwright.config.ts)

```typescript
use: {
  // Screenshots
  screenshot: 'only-on-failure',  // 'on', 'off', 'only-on-failure'

  // Trace
  trace: 'on-first-retry',  // 'on', 'off', 'on-first-retry', 'retain-on-failure'

  // Video
  video: 'on-first-retry',  // 'on', 'off', 'on-first-retry', 'retain-on-failure'

  // Slow down for debugging
  // launchOptions: { slowMo: 500 }
}
```

## Cypress Debugging

### CLI Flags

| Flag | What It Does |
|------|-------------|
| `--headed` | Show the browser window |
| `--no-exit` | Keep the browser open after tests finish |
| `--browser chrome` | Use a specific browser |
| `--spec "path"` | Run a specific spec file |
| `--env key=value` | Set environment variables |
| `--config video=true` | Override config values |

### In-Test Debugging

```typescript
// Pause the test runner (interactive mode only)
cy.pause();

// Open DevTools with the current subject
cy.debug();
cy.get('#element').debug();

// Log to the Cypress command log
cy.log('Debug message');

// Log to the terminal
cy.task('log', 'Terminal message');

// Take a screenshot
cy.screenshot('debug-point');

// Print element info to console
cy.get('#element').then(($el) => {
  console.log('Text:', $el.text());
  console.log('Classes:', $el.attr('class'));
  console.log('Visible:', $el.is(':visible'));
});

// Spy on console methods
cy.window().then((win) => {
  cy.spy(win.console, 'error').as('consoleError');
});
```

### Configuration (cypress.config.ts)

```typescript
e2e: {
  // Screenshots
  screenshotOnRunFailure: true,     // auto-capture on failure
  screenshotsFolder: 'cypress/screenshots',

  // Video
  video: true,                      // record video of each spec
  videoCompression: 32,             // 0 (best) to 51 (worst)
  videosFolder: 'cypress/videos',

  // Timeouts (increase for slow tests)
  defaultCommandTimeout: 4000,      // cy.get() timeout
  pageLoadTimeout: 60000,           // cy.visit() timeout
  requestTimeout: 5000,             // cy.request() timeout
}
```

## Common Failure Patterns

### Element Not Found

```
Error: "Timed out retrying: Expected to find element..."

Causes:
  1. Wrong selector — check data-testid spelling
  2. Element not rendered yet — increase timeout or add wait
  3. Element inside iframe — use frameLocator (PW) or cy.iframe()
  4. Element inside shadow DOM — use shadowRoot access

Fix:
  // Playwright: wait explicitly
  await page.getByTestId('element').waitFor({ state: 'visible' });

  // Cypress: increase timeout
  cy.get('[data-testid="element"]', { timeout: 10000 });
```

### Flaky Tests (Pass Sometimes, Fail Sometimes)

```
Causes:
  1. Race condition — test acts before the page is ready
  2. Animation — element is animating when test tries to click
  3. Network timing — API response arrives late
  4. Shared state — tests interfere with each other in parallel

Fix:
  1. Wait for specific conditions, not arbitrary timeouts
  2. Disable animations in test config
  3. Use network interception to control timing
  4. Make tests independent (no shared state)
```

### Timeout Errors

```
Error: "Test exceeded timeout of 30000ms"

Causes:
  1. Page takes too long to load
  2. Element never appears
  3. Network request hangs

Fix:
  // Increase test timeout
  test('slow test', async ({ page }) => {
    test.setTimeout(60000);  // 60 seconds
    // ...
  });

  // Cypress: increase in config or per-test
  it('slow test', { defaultCommandTimeout: 10000 }, () => {
    // ...
  });
```
