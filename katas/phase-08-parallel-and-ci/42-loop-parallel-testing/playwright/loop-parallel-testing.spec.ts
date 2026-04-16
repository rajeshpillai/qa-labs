import { test, expect } from '@playwright/test';
import allApplicants from '../fixtures/applicants.json';

// =============================================================================
// Kata 42: Loop Parallel Testing — Playwright Tests
// =============================================================================
//
// This file generates tests DYNAMICALLY from a JSON fixture file.
// Each applicant in the array becomes a separate, independent test.
// Playwright distributes these tests across workers for parallel execution.
//
// RUN:
//   npx playwright test loop-parallel-testing.spec.ts --workers=4
//
// The --workers flag controls how many tests run simultaneously.
// =============================================================================

// Kata 42 ships its own flat KYC form playground, purpose-built for
// loop + parallel testing. Each generated test intercepts /api/kyc/submit
// with its own mock response derived from the fixture row.
const PLAYGROUND = '/phase-08-parallel-and-ci/42-loop-parallel-testing/playground/';

// Define the TypeScript interface for applicant data.
interface Applicant {
  name: string;
  email: string;
  country: string;
  docType: string;
  expectedRef: string;
  expectedStatus: 'success' | 'error';
  scenario: string;
}

// Cast the imported JSON to the typed array.
const applicants: Applicant[] = allApplicants as Applicant[];

// --------------------------------------------------------------------------
// Exercise 1 & 2: Generate One Test Per Applicant — Runs in Parallel
// --------------------------------------------------------------------------
// This for...of loop runs at FILE LOAD TIME (not at test runtime).
// Playwright discovers each test() call and adds it to the test plan.
// With --workers=4, up to 4 tests run simultaneously.

// Filter success scenarios for the main loop.
const successApplicants = applicants.filter(a => a.expectedStatus === 'success');

for (const applicant of successApplicants) {
  test(`exercise 1-2: submit KYC for ${applicant.name} [${applicant.scenario}]`, async ({ page }) => {
    // ----- SETUP: Mock the API response -----
    // Each test intercepts the POST request and returns a mock response
    // tailored to THIS specific applicant.
    //
    // page.route(url, handler) intercepts requests matching the URL pattern.
    // route.fulfill() returns a fake response without hitting a real server.
    await page.route('/api/kyc/submit', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        // The response includes this applicant's expected reference ID.
        body: JSON.stringify({ referenceId: applicant.expectedRef })
      });
    });

    // ----- ACT: Navigate and fill the form -----
    await page.goto(PLAYGROUND);

    // fill(value) clears the input first, then types the value.
    await page.getByTestId('full-name-input').fill(applicant.name);
    await page.getByTestId('email-input').fill(applicant.email);

    // selectOption(value) picks a value from a <select> dropdown.
    await page.getByTestId('country-select').selectOption(applicant.country);
    await page.getByTestId('doc-type-select').selectOption(applicant.docType);

    // Click the submit button.
    await page.getByTestId('submit-btn').click();

    // ----- ASSERT: Verify the result -----
    // The success message should contain the expected reference ID.
    await expect(page.getByTestId('submit-status')).toContainText(applicant.expectedRef);
    await expect(page.getByTestId('submit-status')).toHaveClass(/status-success/);

    // Log which worker ran this test (for observing parallel distribution).
    const workerIndex = test.info().workerIndex;
    // eslint-disable-next-line no-console
    console.log(`[Worker ${workerIndex}] ${applicant.name} (${applicant.scenario}) — PASS`);
  });
}

// --------------------------------------------------------------------------
// Exercise 3: Adding a New Applicant
// --------------------------------------------------------------------------
// To add a new test case, you ONLY edit fixtures/applicants.json.
// Add a new object to the array — no changes to this file needed.
// The for...of loop automatically picks it up on the next run.
//
// TRY IT:
//   1. Open fixtures/applicants.json
//   2. Add: { "name": "New User", "email": "new@example.com", ... }
//   3. Run the tests again — a new test appears automatically

// --------------------------------------------------------------------------
// Exercise 4: Dynamic Mock Responses Per Applicant
// --------------------------------------------------------------------------
// Each test already uses applicant-specific mock data (see Exercise 1-2).
// This exercise highlights that the mock response is DIFFERENT per test.
test('exercise 4: verify mock responses are unique per applicant', async ({ page }) => {
  // Track which reference IDs we see across applicants.
  const allRefs = successApplicants.map(a => a.expectedRef);

  // All reference IDs should be unique.
  const uniqueRefs = new Set(allRefs);

  // expect(set.size).toBe(array.length) verifies all values are unique.
  expect(uniqueRefs.size).toBe(allRefs.length);

  await page.goto('data:text/html,<h1>Unique Refs Verified</h1>');
  await expect(page.locator('h1')).toHaveText('Unique Refs Verified');
});

// --------------------------------------------------------------------------
// Exercise 5: Error Scenario Tests from Data
// --------------------------------------------------------------------------
// The fixture file includes an error scenario (empty name).
// We generate tests for error cases separately.
const errorApplicants = applicants.filter(a => a.expectedStatus === 'error');

for (const applicant of errorApplicants) {
  test(`exercise 5: error scenario — ${applicant.scenario}`, async ({ page }) => {
    // Mock an error response for invalid submissions.
    await page.route('/api/kyc/submit', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Validation failed' })
      });
    });

    await page.goto(PLAYGROUND);

    // Fill with the (possibly invalid) data from the fixture.
    await page.getByTestId('full-name-input').fill(applicant.name || ' ');
    await page.getByTestId('email-input').fill(applicant.email);
    await page.getByTestId('country-select').selectOption(applicant.country);
    await page.getByTestId('doc-type-select').selectOption(applicant.docType);

    await page.getByTestId('submit-btn').click();

    // Verify the error response is shown.
    await expect(page.getByTestId('submit-status')).toHaveClass(/status-error/);
  });
}

// --------------------------------------------------------------------------
// Exercise 6: Summary — The Power of Loop + Parallel
// --------------------------------------------------------------------------
test('exercise 6: loop parallel pattern summary', async ({ page }) => {
  await page.goto('data:text/html,<h1>Loop Parallel Summary</h1>');

  // This file generated the following tests automatically:
  // - 6 success tests (one per applicant with expectedStatus: 'success')
  // - 1 error test (one applicant with expectedStatus: 'error')
  // - 2 standalone tests (exercises 4 and 6)
  //
  // Total: 9 tests from ONE loop + ONE fixture file.
  //
  // To test 100 applicants: add 94 more objects to the JSON file.
  // The code stays THE SAME. Only the data changes.
  //
  // With 4 workers: ~25 tests per worker, running simultaneously.

  const totalGenerated = successApplicants.length + errorApplicants.length;
  // eslint-disable-next-line no-console
  console.log(`Generated ${totalGenerated} tests from fixture data`);

  await expect(page.locator('h1')).toHaveText('Loop Parallel Summary');
});
