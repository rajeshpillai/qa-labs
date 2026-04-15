import { test, expect } from '@playwright/test';

// =============================================================================
// Kata 41: Parallel Testing — Playwright Tests
// =============================================================================
// These tests demonstrate parallel and serial execution modes.
//
// RUN WITH:
//   npx playwright test parallel-testing.spec.ts --workers=4
//   npx playwright test parallel-testing.spec.ts --workers=1
//
// Compare execution times to see the effect of parallelism.
// =============================================================================

// --------------------------------------------------------------------------
// Exercise 1: Independent Tests (Safe for Parallel)
// --------------------------------------------------------------------------
// These tests are completely independent — each creates its own data
// and has no dependency on other tests. They can run in any order.
test.describe('exercise 1: independent tests (parallel-safe)', () => {
  // test.describe.configure({ mode: 'parallel' }) tells Playwright
  // to run ALL tests in this block simultaneously across workers.
  //
  // Each test gets its own browser page — no shared state.
  test.describe.configure({ mode: 'parallel' });

  test('test A: check page title', async ({ page }) => {
    // Each test navigates independently.
    await page.goto('data:text/html,<title>Test A</title><h1>Page A</h1>');
    await expect(page).toHaveTitle('Test A');
    // Simulate some work — in real tests this would be form interactions.
    await expect(page.locator('h1')).toHaveText('Page A');
  });

  test('test B: check page heading', async ({ page }) => {
    await page.goto('data:text/html,<title>Test B</title><h1>Page B</h1>');
    await expect(page).toHaveTitle('Test B');
    await expect(page.locator('h1')).toHaveText('Page B');
  });

  test('test C: check page content', async ({ page }) => {
    await page.goto('data:text/html,<title>Test C</title><p>Content C</p>');
    await expect(page).toHaveTitle('Test C');
    await expect(page.locator('p')).toHaveText('Content C');
  });

  test('test D: check another page', async ({ page }) => {
    await page.goto('data:text/html,<title>Test D</title><span>Item D</span>');
    await expect(page).toHaveTitle('Test D');
    await expect(page.locator('span')).toHaveText('Item D');
  });
});

// --------------------------------------------------------------------------
// Exercise 2: Worker Info
// --------------------------------------------------------------------------
// Playwright provides test.info() to access runtime information
// including the worker index.
test.describe('exercise 2: observe worker distribution', () => {
  test.describe.configure({ mode: 'parallel' });

  // Generate 6 tests to see how they distribute across workers.
  for (let i = 1; i <= 6; i++) {
    test(`task ${i}: runs on a worker`, async ({ page }) => {
      // test.info().workerIndex tells you WHICH worker is running this test.
      // Workers are numbered starting from 0.
      const workerIndex = test.info().workerIndex;

      // eslint-disable-next-line no-console
      console.log(`Task ${i} running on worker ${workerIndex}`);

      // Each task visits a simple page to simulate work.
      await page.goto(`data:text/html,<h1>Task ${i} on worker ${workerIndex}</h1>`);
      await expect(page.locator('h1')).toContainText(`Task ${i}`);
    });
  }
});

// --------------------------------------------------------------------------
// Exercise 3: Serial Mode (Dependent Tests)
// --------------------------------------------------------------------------
// Some tests MUST run in order — e.g., a multi-step workflow where
// step 2 depends on step 1 completing first.
test.describe('exercise 3: serial mode (dependent tests)', () => {
  // test.describe.configure({ mode: 'serial' }) forces sequential execution.
  //
  // If test 1 fails, tests 2 and 3 are SKIPPED because they depend on it.
  // All tests in this block share the same worker (same process).
  test.describe.configure({ mode: 'serial' });

  // In serial mode, you might share state between tests via variables.
  // This is the ONLY time shared variables are safe — because serial
  // guarantees execution order.
  let sharedValue = '';

  test('step 1: create a value', async ({ page }) => {
    // Simulate creating data that later tests need.
    sharedValue = 'created-in-step-1';

    await page.goto('data:text/html,<h1>Step 1 Complete</h1>');
    await expect(page.locator('h1')).toHaveText('Step 1 Complete');

    // eslint-disable-next-line no-console
    console.log('Step 1: value set to', sharedValue);
  });

  test('step 2: read the value', async ({ page }) => {
    // This test runs AFTER step 1 because of serial mode.
    // It can safely read the shared variable.
    expect(sharedValue).toBe('created-in-step-1');

    // Update the value for step 3.
    sharedValue = 'modified-in-step-2';

    await page.goto('data:text/html,<h1>Step 2 Complete</h1>');
    await expect(page.locator('h1')).toHaveText('Step 2 Complete');
  });

  test('step 3: verify final value', async ({ page }) => {
    // This runs after step 2 — the value should be modified.
    expect(sharedValue).toBe('modified-in-step-2');

    await page.goto('data:text/html,<h1>Step 3 Complete</h1>');
    await expect(page.locator('h1')).toHaveText('Step 3 Complete');
  });
});

// --------------------------------------------------------------------------
// Exercise 4: Mixing Parallel and Serial in One File
// --------------------------------------------------------------------------
// You can have both parallel and serial blocks in the same test file.
test.describe('exercise 4: parallel block', () => {
  test.describe.configure({ mode: 'parallel' });

  test('parallel A', async ({ page }) => {
    await page.goto('data:text/html,<h1>Parallel A</h1>');
    await expect(page.locator('h1')).toHaveText('Parallel A');
  });

  test('parallel B', async ({ page }) => {
    await page.goto('data:text/html,<h1>Parallel B</h1>');
    await expect(page.locator('h1')).toHaveText('Parallel B');
  });
});

test.describe('exercise 4: serial block', () => {
  test.describe.configure({ mode: 'serial' });

  test('serial step 1', async ({ page }) => {
    await page.goto('data:text/html,<h1>Serial 1</h1>');
    await expect(page.locator('h1')).toHaveText('Serial 1');
  });

  test('serial step 2', async ({ page }) => {
    await page.goto('data:text/html,<h1>Serial 2</h1>');
    await expect(page.locator('h1')).toHaveText('Serial 2');
  });
});

// --------------------------------------------------------------------------
// Exercise 5: Understanding Sharding
// --------------------------------------------------------------------------
// Sharding splits tests across CI machines. This test documents the concept.
// You run sharding from the CLI, not from test code.
//
// TRY IT:
//   npx playwright test parallel-testing.spec.ts --shard=1/2
//   npx playwright test parallel-testing.spec.ts --shard=2/2
//
// Each command runs approximately HALF the tests from this file.
test('exercise 5: sharding concept (run with --shard flag)', async ({ page }) => {
  // This test exists to demonstrate sharding.
  // Run the full file with --shard=1/2 and --shard=2/2 separately.
  // Each shard gets different tests.

  await page.goto('data:text/html,<h1>Sharding Demo</h1>');

  // test.info().config shows the current configuration.
  // In a sharded run, the shard info appears in the config.
  const config = test.info().config;
  // eslint-disable-next-line no-console
  console.log('Shard info:', config.shard);
  // eslint-disable-next-line no-console
  console.log('Workers:', config.workers);

  await expect(page.locator('h1')).toHaveText('Sharding Demo');
});

// --------------------------------------------------------------------------
// Exercise 6: Best Practices Checklist
// --------------------------------------------------------------------------
// This test serves as a documentation test — it passes and documents
// the rules for writing parallel-safe tests.
test('exercise 6: parallel testing best practices', async ({ page }) => {
  await page.goto('data:text/html,<h1>Best Practices</h1>');

  // RULE 1: Tests must be independent — no shared state.
  // RULE 2: Each test should set up its own data (no reliance on test order).
  // RULE 3: Use unique identifiers (timestamps, UUIDs) to avoid conflicts.
  // RULE 4: Mock external dependencies to avoid contention.
  // RULE 5: Use serial mode ONLY when tests truly depend on each other.
  // RULE 6: Start with 50% of CPU cores, tune based on test stability.

  await expect(page.locator('h1')).toHaveText('Best Practices');
});
