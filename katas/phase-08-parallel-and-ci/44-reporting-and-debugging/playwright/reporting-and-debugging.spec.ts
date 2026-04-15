import { test, expect } from '@playwright/test';

// =============================================================================
// Kata 44: Reporting and Debugging — Playwright Tests
// =============================================================================
//
// These tests demonstrate Playwright's debugging and reporting features.
//
// RUN WITH HTML REPORT:
//   npx playwright test reporting-and-debugging.spec.ts --reporter=html
//
// VIEW THE REPORT:
//   npx playwright show-report
//
// RUN WITH TRACE:
//   npx playwright test reporting-and-debugging.spec.ts --trace=on
//
// VIEW A TRACE:
//   npx playwright show-trace test-results/.../trace.zip
// =============================================================================

// --------------------------------------------------------------------------
// Exercise 1: Generate an HTML Report
// --------------------------------------------------------------------------
// This test passes cleanly. Run it with --reporter=html and view the report.
// The report shows test names, durations, and pass/fail status.
test('exercise 1: generate HTML report (run with --reporter=html)', async ({ page }) => {
  // Navigate to a simple page.
  await page.goto('data:text/html,<h1>Report Demo</h1><p>This test generates a report.</p>');

  // Simple assertions that will appear in the report.
  await expect(page).toHaveTitle('');  // data: URLs have empty titles
  await expect(page.locator('h1')).toHaveText('Report Demo');
  await expect(page.locator('p')).toContainText('report');

  // AFTER RUNNING:
  //   npx playwright test reporting-and-debugging.spec.ts --reporter=html
  //   npx playwright show-report
  //
  // The HTML report opens in your browser showing:
  //   - Test name and duration
  //   - Steps (goto, expect, etc.)
  //   - Screenshots (if configured)
  //   - Traces (if configured)
});

// --------------------------------------------------------------------------
// Exercise 2: Capture Browser Console Logs
// --------------------------------------------------------------------------
// This test captures console.log messages from the browser.
// Useful for debugging JavaScript errors in the application.
test('exercise 2: capture browser console logs', async ({ page }) => {
  // Collect console messages from the browser.
  // page.on('console', callback) registers a listener that fires
  // whenever the page's JavaScript calls console.log, console.error, etc.
  const consoleMessages: string[] = [];

  page.on('console', (msg) => {
    // msg.type() returns: 'log', 'error', 'warning', 'info', etc.
    // msg.text() returns the message text.
    consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
  });

  // Navigate to a page that logs messages.
  await page.goto('data:text/html,<h1>Console Demo</h1><script>console.log("Hello from page"); console.warn("Warning message"); console.error("Error message");</script>');

  // Wait a moment for console messages to be captured.
  await page.waitForTimeout(100);

  // Verify we captured the messages.
  // eslint-disable-next-line no-console
  console.log('Captured console messages:');
  for (const msg of consoleMessages) {
    // eslint-disable-next-line no-console
    console.log('  ', msg);
  }

  // Assert that we captured at least the log message.
  expect(consoleMessages.some(m => m.includes('Hello from page'))).toBe(true);

  // Check for error messages — useful for catching runtime errors.
  const errors = consoleMessages.filter(m => m.startsWith('[error]'));
  // eslint-disable-next-line no-console
  console.log(`Found ${errors.length} error(s) in browser console`);
  expect(errors.length).toBeGreaterThan(0);
});

// --------------------------------------------------------------------------
// Exercise 3: Manual Screenshot Capture
// --------------------------------------------------------------------------
// Capture screenshots at specific points during the test.
// These are saved as test attachments and appear in the HTML report.
test('exercise 3: capture screenshots for debugging', async ({ page }) => {
  await page.goto('data:text/html,<h1>Screenshot Demo</h1><p>Before interaction</p><button onclick="this.textContent=\'Clicked!\'">Click me</button>');

  // page.screenshot(options) captures the current viewport.
  //
  // Options:
  //   path     — file path to save the screenshot (e.g., 'debug.png')
  //   fullPage — true to capture the full scrollable page (default: false)
  //   type     — 'png' or 'jpeg' (default: 'png')
  //   quality  — JPEG quality 0-100 (only for 'jpeg' type)

  // Capture BEFORE interaction.
  const beforeScreenshot = await page.screenshot();

  // test.info().attach(name, options) attaches a file to the test report.
  // When you view the HTML report, these attachments are visible.
  await test.info().attach('before-click', {
    body: beforeScreenshot,
    contentType: 'image/png'
  });

  // Perform an interaction.
  await page.locator('button').click();

  // Capture AFTER interaction.
  const afterScreenshot = await page.screenshot();
  await test.info().attach('after-click', {
    body: afterScreenshot,
    contentType: 'image/png'
  });

  // Verify the button text changed.
  await expect(page.locator('button')).toHaveText('Clicked!');
});

// --------------------------------------------------------------------------
// Exercise 4: Trace Viewer Demo
// --------------------------------------------------------------------------
// When you run with --trace=on, Playwright records a trace file.
// The trace contains DOM snapshots, network logs, and action timelines.
test('exercise 4: trace viewer demo (run with --trace=on)', async ({ page }) => {
  // Each action in this test will be recorded in the trace.
  // The trace shows the DOM state BEFORE and AFTER each action.

  // Step 1: Navigate (recorded in trace).
  await page.goto('data:text/html,<h1>Trace Demo</h1><input data-testid="name" placeholder="Your name"><button data-testid="greet" onclick="document.getElementById(\'result\').textContent=\'Hello, \'+document.querySelector(\'[data-testid=name]\').value">Greet</button><p id="result" data-testid="result"></p>');

  // Step 2: Fill an input (recorded — trace shows the value typed).
  await page.getByTestId('name').fill('QA Learner');

  // Step 3: Click a button (recorded — trace shows before/after DOM).
  await page.getByTestId('greet').click();

  // Step 4: Assert (recorded — trace shows the expected vs actual).
  await expect(page.getByTestId('result')).toHaveText('Hello, QA Learner');

  // AFTER RUNNING WITH --trace=on:
  //   The trace is saved to test-results/.../trace.zip
  //   View it with: npx playwright show-trace test-results/.../trace.zip
  //
  // Or open the HTML report — failed tests have traces linked automatically.
});

// --------------------------------------------------------------------------
// Exercise 5: Test Info and Annotations
// --------------------------------------------------------------------------
// Playwright allows you to add annotations and custom info to tests.
// These appear in the HTML report.
test('exercise 5: add annotations to the report', async ({ page }) => {
  // test.info().annotations is an array of { type, description } objects.
  // These appear in the HTML report next to the test.
  test.info().annotations.push({
    type: 'note',
    description: 'This test demonstrates report annotations.'
  });

  test.info().annotations.push({
    type: 'documentation',
    description: 'See https://playwright.dev/docs/test-annotations for more.'
  });

  await page.goto('data:text/html,<h1>Annotations Demo</h1>');
  await expect(page.locator('h1')).toHaveText('Annotations Demo');

  // You can also use test.skip(), test.fixme(), test.slow() for special annotations:
  //   test.skip(condition, 'reason')    — skip the test
  //   test.fixme()                      — mark as known broken
  //   test.slow()                       — triple the timeout
});

// --------------------------------------------------------------------------
// Exercise 6: Debugging a Failure
// --------------------------------------------------------------------------
// This test is designed to help you practice debugging.
// Uncomment the failing assertion to see how reports, screenshots,
// and traces help you diagnose the issue.
test('exercise 6: practice debugging a failure', async ({ page }) => {
  // Capture console errors — a common debugging technique.
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  await page.goto('data:text/html,<h1>Debug Practice</h1><p id="status">Loading...</p><script>setTimeout(() => { document.getElementById("status").textContent = "Ready"; }, 100);</script>');

  // Wait for the dynamic content to load.
  await expect(page.locator('#status')).toHaveText('Ready');

  // Attach a debug screenshot to the report.
  await test.info().attach('final-state', {
    body: await page.screenshot(),
    contentType: 'image/png'
  });

  // DEBUGGING TIPS:
  // 1. Run with --reporter=html to see the HTML report
  // 2. Run with --trace=on to see step-by-step DOM changes
  // 3. Run with --debug to open the Playwright Inspector (interactive)
  // 4. Run with --headed to see the browser during the test
  // 5. Add await page.pause() to pause the test at a specific point
  //
  // COMMON CLI FLAGS:
  //   npx playwright test --headed            ← see the browser
  //   npx playwright test --debug             ← step through with Inspector
  //   npx playwright test --trace=on          ← record a trace
  //   npx playwright test --reporter=html     ← generate HTML report
  //   npx playwright test --update-snapshots  ← update visual baselines

  await expect(page.locator('h1')).toHaveText('Debug Practice');
});
