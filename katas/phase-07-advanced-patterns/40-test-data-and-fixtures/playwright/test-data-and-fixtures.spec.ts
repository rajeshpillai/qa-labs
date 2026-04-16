import { test, expect } from '@playwright/test';
import applicants from './fixtures/applicants.json';

// =============================================================================
// Kata 40: Test Data and Fixtures — Playwright Tests
// =============================================================================
// These tests demonstrate how to use JSON fixture files for data-driven testing.
//
// The applicants.json file contains an array of applicant objects.
// Each object has: name, email, country, docType, expectedRef, scenario.
//
// By loading data from a file, you can add new test cases by editing JSON
// instead of writing new test code.
// =============================================================================

// Kata 40 ships its own flat KYC form playground, purpose-built for
// data-driven / fixture-driven testing. The form posts to /api/kyc/submit
// which every test intercepts with page.route().
const PLAYGROUND = '/phase-07-advanced-patterns/40-test-data-and-fixtures/playground/';

// Define the TypeScript type for an applicant object.
// This gives us autocomplete and type checking when using the fixture data.
interface Applicant {
  name: string;
  email: string;
  country: string;
  docType: string;
  expectedRef: string;
  scenario: string;
}

// Cast the imported JSON to our typed array.
const typedApplicants: Applicant[] = applicants;

// --------------------------------------------------------------------------
// Exercise 1: Load and Use a Single Fixture Record
// --------------------------------------------------------------------------
// Load the first applicant from the fixture and use it in a test.
test('exercise 1: use fixture data for a single applicant', async ({ page }) => {
  // Access the first applicant from the fixture array.
  // applicants[0] is the first object in the JSON array.
  const applicant = typedApplicants[0];

  // Intercept the POST request and return a mock response.
  // We use the fixture's expectedRef field to make the mock dynamic.
  await page.route('/api/kyc/submit', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ referenceId: applicant.expectedRef })
    });
  });

  await page.goto(PLAYGROUND);

  // Fill the form using data from the fixture.
  // The data is NOT hard-coded — it comes from applicants.json.
  await page.getByTestId('full-name-input').fill(applicant.name);
  await page.getByTestId('email-input').fill(applicant.email);
  await page.getByTestId('country-select').selectOption(applicant.country);
  await page.getByTestId('doc-type-select').selectOption(applicant.docType);

  await page.getByTestId('submit-btn').click();

  // Assert using the expected reference from the fixture.
  await expect(page.getByTestId('submit-status')).toContainText(applicant.expectedRef);
});

// --------------------------------------------------------------------------
// Exercise 2: Parameterized Tests — Loop Over All Applicants
// --------------------------------------------------------------------------
// Generate one test per applicant by looping over the fixture array.
// Each applicant gets its own independent test.
//
// Playwright does not have test.each like Jest. Instead, use a for...of loop
// at the module level. Playwright discovers these tests at parse time.
for (const applicant of typedApplicants) {
  test(`exercise 2: submit KYC for ${applicant.name} (${applicant.scenario})`, async ({ page }) => {
    // Each iteration creates a SEPARATE test with its own browser context.
    // If one fails, the others still run.
    await page.route('/api/kyc/submit', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ referenceId: applicant.expectedRef })
      });
    });

    await page.goto(PLAYGROUND);

    await page.getByTestId('full-name-input').fill(applicant.name);
    await page.getByTestId('email-input').fill(applicant.email);
    await page.getByTestId('country-select').selectOption(applicant.country);
    await page.getByTestId('doc-type-select').selectOption(applicant.docType);

    await page.getByTestId('submit-btn').click();

    await expect(page.getByTestId('submit-status')).toContainText(applicant.expectedRef);
    await expect(page.getByTestId('submit-status')).toHaveClass(/status-success/);
  });
}

// --------------------------------------------------------------------------
// Exercise 3: Dynamic Data Factory
// --------------------------------------------------------------------------
// Sometimes you need UNIQUE data per test run — e.g., unique emails
// to avoid conflicts. A factory function generates fresh data.

/**
 * createApplicant — a factory function that generates test data.
 *
 * @param overrides — fields to customize (merged with defaults)
 * @returns a complete applicant object with unique email
 *
 * The spread operator (...overrides) merges custom fields with defaults.
 * If overrides.name is provided, it replaces the default name.
 */
function createApplicant(overrides: Partial<Applicant> = {}): Applicant {
  // Date.now() returns milliseconds since epoch — unique per call.
  const timestamp = Date.now();
  return {
    name: `Test User ${timestamp}`,
    email: `test-${timestamp}@example.com`,
    country: 'US',
    docType: 'passport',
    expectedRef: `KYC-DYN-${timestamp}`,
    scenario: 'dynamic',
    ...overrides   // any provided fields override the defaults
  };
}

test('exercise 3: use dynamic data factory', async ({ page }) => {
  // Create a unique applicant for this test run.
  const applicant = createApplicant({ name: 'Dynamic Test User', country: 'IN' });

  await page.route('/api/kyc/submit', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ referenceId: applicant.expectedRef })
    });
  });

  await page.goto(PLAYGROUND);

  await page.getByTestId('full-name-input').fill(applicant.name);
  await page.getByTestId('email-input').fill(applicant.email);
  await page.getByTestId('country-select').selectOption(applicant.country);
  await page.getByTestId('doc-type-select').selectOption(applicant.docType);

  await page.getByTestId('submit-btn').click();

  await expect(page.getByTestId('submit-status')).toContainText(applicant.expectedRef);
});

// --------------------------------------------------------------------------
// Exercise 4: Fixture-Driven Assertions
// --------------------------------------------------------------------------
// The fixture file can include EXPECTED OUTCOMES, not just inputs.
// This makes the test fully data-driven — both input AND expected output
// come from the fixture.
test('exercise 4: data-driven assertions from fixture', async ({ page }) => {
  // Use the third applicant from the fixture.
  const applicant = typedApplicants[2];

  await page.route('/api/kyc/submit', async (route) => {
    // The mock response uses the fixture's expectedRef field.
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ referenceId: applicant.expectedRef })
    });
  });

  await page.goto(PLAYGROUND);

  await page.getByTestId('full-name-input').fill(applicant.name);
  await page.getByTestId('email-input').fill(applicant.email);
  await page.getByTestId('country-select').selectOption(applicant.country);
  await page.getByTestId('doc-type-select').selectOption(applicant.docType);

  await page.getByTestId('submit-btn').click();

  // Both the INPUT and the EXPECTED OUTPUT come from the fixture.
  // If you want a new test case, add a new object to applicants.json.
  await expect(page.getByTestId('submit-status')).toContainText(applicant.expectedRef);
  await expect(page.getByTestId('submit-status')).toHaveClass(/status-success/);
});

// --------------------------------------------------------------------------
// Exercise 5: Subset Filtering
// --------------------------------------------------------------------------
// Filter the fixture data to test only specific scenarios.
const usApplicants = typedApplicants.filter(a => a.country === 'US');

for (const applicant of usApplicants) {
  test(`exercise 5: US-only test for ${applicant.name}`, async ({ page }) => {
    await page.route('/api/kyc/submit', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ referenceId: applicant.expectedRef })
      });
    });

    await page.goto(PLAYGROUND);

    await page.getByTestId('full-name-input').fill(applicant.name);
    await page.getByTestId('email-input').fill(applicant.email);
    await page.getByTestId('country-select').selectOption(applicant.country);
    await page.getByTestId('doc-type-select').selectOption(applicant.docType);

    await page.getByTestId('submit-btn').click();

    // Verify the country is US in the fixture (sanity check).
    expect(applicant.country).toBe('US');
    await expect(page.getByTestId('submit-status')).toContainText(applicant.expectedRef);
  });
}

// --------------------------------------------------------------------------
// Exercise 6: Multiple Fixture Files
// --------------------------------------------------------------------------
// In real projects, you might have separate fixtures for different scenarios:
//   fixtures/valid-applicants.json
//   fixtures/invalid-applicants.json
//   fixtures/edge-case-applicants.json
//
// This test demonstrates using fixture data for error scenarios.
test('exercise 6: test with error scenario data', async ({ page }) => {
  // Simulate an invalid applicant by creating one with a factory.
  const invalidApplicant = createApplicant({
    name: '',           // empty name — should cause a validation error
    email: 'invalid',   // invalid email format
    scenario: 'invalid-data'
  });

  // In a real app, the server would reject invalid data.
  await page.route('/api/kyc/submit', async (route) => {
    await route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Validation failed: name is required' })
    });
  });

  await page.goto(PLAYGROUND);

  await page.getByTestId('full-name-input').fill(invalidApplicant.name || ' ');
  await page.getByTestId('email-input').fill(invalidApplicant.email);

  await page.getByTestId('submit-btn').click();

  // Verify the error response is displayed.
  await expect(page.getByTestId('submit-status')).toHaveClass(/status-error/);
});
