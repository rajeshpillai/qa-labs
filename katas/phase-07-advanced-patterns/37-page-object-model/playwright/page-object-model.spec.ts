import { test, expect } from '@playwright/test';
import { KycFormPage } from './pages/kyc-form.page';
import { ReviewPage } from './pages/review.page';

// =============================================================================
// Kata 37: Page Object Model — Playwright Tests
// =============================================================================
// These tests demonstrate the POM pattern by showing tests BEFORE refactoring
// (raw selectors) and AFTER refactoring (using Page Objects).
//
// The tests target the Kata 26 KYC Onboarding Form playground.
// All API calls are intercepted — no real backend is needed.
// =============================================================================

const PLAYGROUND = '/phase-05-fintech-domain/26-kyc-onboarding-flow/playground/';

// --------------------------------------------------------------------------
// Exercise 1: Test WITHOUT POM (The Problem)
// --------------------------------------------------------------------------
// This test uses raw selectors everywhere. Notice how the same selectors
// appear repeatedly. If 'full-name-input' changes to 'name-field', you
// would need to update EVERY test that uses it.
test('exercise 1: submit KYC form WITHOUT POM (raw selectors)', async ({ page }) => {
  // Intercept the POST request so the test doesn't need a real backend.
  // page.route() catches outgoing requests and returns a fake response.
  await page.route('/api/kyc/submit', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ referenceId: 'KYC-RAW-001' })
    });
  });

  // Navigate to the playground page.
  await page.goto(PLAYGROUND);

  // Fill form fields using raw selectors — these appear in EVERY test.
  // getByTestId('full-name-input') finds the element with data-testid="full-name-input".
  await page.getByTestId('full-name-input').fill('Aisha Patel');
  await page.getByTestId('email-input').fill('aisha@example.com');
  await page.getByTestId('country-select').selectOption('IN');
  await page.getByTestId('doc-type-select').selectOption('passport');

  // Click submit using a raw selector.
  await page.getByTestId('submit-btn').click();

  // Assert using raw selectors.
  await expect(page.getByTestId('submit-status')).toContainText('KYC-RAW-001');
  await expect(page.getByTestId('submit-status')).toHaveClass(/status-success/);
});

// --------------------------------------------------------------------------
// Exercise 2: Same Test WITH POM (The Solution)
// --------------------------------------------------------------------------
// This test does the EXACT same thing as Exercise 1, but uses the KycFormPage
// Page Object. Notice how much cleaner and more readable it is.
test('exercise 2: submit KYC form WITH POM (page object)', async ({ page }) => {
  // Intercept the POST request.
  await page.route('/api/kyc/submit', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ referenceId: 'KYC-POM-001' })
    });
  });

  // Create the Page Object. The constructor receives the Playwright `page`.
  // All selectors are now hidden inside the KycFormPage class.
  const kycForm = new KycFormPage(page);

  // Navigate using the Page Object's method.
  await kycForm.goto();

  // Fill the form using high-level methods.
  // Each method name describes the user action, not the DOM element.
  await kycForm.fillName('Aisha Patel');
  await kycForm.fillEmail('aisha@example.com');
  await kycForm.selectCountry('IN');
  await kycForm.selectDocType('passport');

  // Submit using the Page Object.
  await kycForm.submit();

  // Assert using the Page Object's assertion method.
  await kycForm.expectSuccess('KYC-POM-001');
});

// --------------------------------------------------------------------------
// Exercise 3: Use the fillForm() Convenience Method
// --------------------------------------------------------------------------
// The Page Object also offers a fillForm() method that fills all fields
// in a single call. This makes data-driven tests very concise.
test('exercise 3: fill entire form with one method call', async ({ page }) => {
  await page.route('/api/kyc/submit', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ referenceId: 'KYC-FILL-001' })
    });
  });

  const kycForm = new KycFormPage(page);
  await kycForm.goto();

  // fillForm() accepts an object with all field values.
  // This pattern is excellent for parameterized/data-driven tests.
  await kycForm.fillForm({
    name: 'Carlos Rivera',
    email: 'carlos@example.com',
    country: 'US',
    docType: 'drivers-license'
  });

  await kycForm.submit();
  await kycForm.expectSuccess('KYC-FILL-001');
});

// --------------------------------------------------------------------------
// Exercise 4: Use the ReviewPage POM for Applicant Lookup
// --------------------------------------------------------------------------
// This exercise uses a second Page Object — ReviewPage — to test the
// applicant lookup section. Using multiple POMs in one test is common
// when the page has distinct sections.
test('exercise 4: load applicant data using ReviewPage POM', async ({ page }) => {
  // Intercept the GET request for applicant data.
  await page.route('/api/applicant*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        name: 'Aisha Patel',
        email: 'aisha@example.com',
        country: 'India',
        riskLevel: 'High'
      })
    });
  });

  // Create the ReviewPage POM.
  const reviewPage = new ReviewPage(page);
  await reviewPage.goto();

  // Use the convenience method to enter ID and click Load.
  await reviewPage.lookupApplicant('APP-1001');

  // Assert the displayed data using the POM's assertion method.
  await reviewPage.expectApplicantData({
    name: 'Aisha Patel',
    email: 'aisha@example.com',
    country: 'India',
    risk: 'High'
  });
});

// --------------------------------------------------------------------------
// Exercise 5: Multiple POMs in One Test
// --------------------------------------------------------------------------
// In real apps, you often interact with multiple sections of a page.
// This test uses BOTH KycFormPage and ReviewPage in the same test.
test('exercise 5: use multiple POMs in one test', async ({ page }) => {
  // Intercept both API endpoints.
  await page.route('/api/applicant*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        name: 'Priya Sharma',
        email: 'priya@example.com',
        country: 'India',
        riskLevel: 'Low'
      })
    });
  });

  await page.route('/api/kyc/submit', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ referenceId: 'KYC-MULTI-001' })
    });
  });

  // Create both Page Objects from the same `page`.
  const reviewPage = new ReviewPage(page);
  const kycForm = new KycFormPage(page);

  // Navigate once — both POMs share the same page.
  await reviewPage.goto();

  // Step 1: Look up an existing applicant.
  await reviewPage.lookupApplicant('APP-1002');
  await reviewPage.expectApplicantData({
    name: 'Priya Sharma',
    email: 'priya@example.com',
    country: 'India',
    risk: 'Low'
  });

  // Step 2: Submit a new KYC application.
  await kycForm.fillForm({
    name: 'Priya Sharma',
    email: 'priya@example.com',
    country: 'IN'
  });
  await kycForm.submit();
  await kycForm.expectSuccess('KYC-MULTI-001');
});

// --------------------------------------------------------------------------
// Exercise 6: POM Makes Error Testing Clean
// --------------------------------------------------------------------------
// Testing error scenarios is common. The POM's expectError() method
// makes these tests just as readable as success tests.
test('exercise 6: test error handling with POM', async ({ page }) => {
  // Intercept and return a 500 error.
  await page.route('/api/kyc/submit', async (route) => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Internal server error' })
    });
  });

  const kycForm = new KycFormPage(page);
  await kycForm.goto();

  await kycForm.fillForm({
    name: 'Test User',
    email: 'test@example.com'
  });

  await kycForm.submit();

  // The POM's expectError() method checks for the error class and message.
  await kycForm.expectError('error');
});
