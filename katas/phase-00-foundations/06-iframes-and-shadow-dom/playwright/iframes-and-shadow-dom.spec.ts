import { test, expect } from '@playwright/test';

// The playground URL for this kata.
const PLAYGROUND = '/phase-00-foundations/06-iframes-and-shadow-dom/playground/';

// --------------------------------------------------------------------------
// Exercise 1: Access iframe content using frameLocator
// --------------------------------------------------------------------------
test('exercise 1: read text inside an iframe', async ({ page }) => {
  // Navigate to the playground page.
  await page.goto(PLAYGROUND);

  // frameLocator() returns a FrameLocator scoped to the iframe.
  // You pass a CSS selector (or data-testid) that matches the <iframe> element.
  const paymentFrame = page.frameLocator('[data-testid="payment-iframe"]');

  // Inside the frame, use normal locator methods to find elements.
  // The locator is scoped to the iframe's document, not the parent page.
  await expect(paymentFrame.getByTestId('payment-title')).toHaveText('Secure Payment Gateway');
});

// --------------------------------------------------------------------------
// Exercise 2: Fill form inside iframe
// --------------------------------------------------------------------------
test('exercise 2: fill the payment form inside an iframe', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Get a FrameLocator for the payment iframe.
  const paymentFrame = page.frameLocator('[data-testid="payment-iframe"]');

  // fill() works exactly the same inside a frameLocator as on the main page.
  // It clears the field first, then sets the value.
  await paymentFrame.getByTestId('input-cardholder').fill('Alice Johnson');
  await paymentFrame.getByTestId('input-card-number').fill('4242 4242 4242 4242');
  await paymentFrame.getByTestId('input-amount').fill('250.00');

  // selectOption() works for <select> elements inside iframes too.
  await paymentFrame.getByTestId('select-currency').selectOption('EUR');

  // Verify the values were entered correctly.
  await expect(paymentFrame.getByTestId('input-cardholder')).toHaveValue('Alice Johnson');
  await expect(paymentFrame.getByTestId('input-card-number')).toHaveValue('4242 4242 4242 4242');
  await expect(paymentFrame.getByTestId('input-amount')).toHaveValue('250.00');
  await expect(paymentFrame.getByTestId('select-currency')).toHaveValue('EUR');
});

// --------------------------------------------------------------------------
// Exercise 3: Click button inside iframe and verify result
// --------------------------------------------------------------------------
test('exercise 3: submit the payment form and verify confirmation', async ({ page }) => {
  await page.goto(PLAYGROUND);

  const paymentFrame = page.frameLocator('[data-testid="payment-iframe"]');

  // Fill the form fields.
  await paymentFrame.getByTestId('input-cardholder').fill('Bob Smith');
  await paymentFrame.getByTestId('input-amount').fill('99.99');
  await paymentFrame.getByTestId('select-currency').selectOption('GBP');

  // Click the submit button inside the iframe.
  await paymentFrame.getByTestId('btn-submit-payment').click();

  // Verify the result message appeared inside the iframe.
  // The result div is inside the iframe, so we use the same frameLocator.
  await expect(paymentFrame.getByTestId('payment-result')).toBeVisible();
  await expect(paymentFrame.getByTestId('payment-result')).toContainText('99.99 GBP');
  await expect(paymentFrame.getByTestId('payment-result')).toContainText('Bob Smith');
});

// --------------------------------------------------------------------------
// Exercise 4: Access Shadow DOM elements
// --------------------------------------------------------------------------
test('exercise 4: read text inside a shadow DOM component', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Playwright automatically pierces open shadow roots!
  // You can use getByTestId() and it will find elements inside shadow DOM
  // without any special configuration. This is a major advantage over Cypress.
  const widgetTitle = page.getByTestId('widget-title');

  // Verify the title text inside the shadow root.
  await expect(widgetTitle).toHaveText('Compliance Check');
});

// --------------------------------------------------------------------------
// Exercise 5: Interact with Shadow DOM form
// --------------------------------------------------------------------------
test('exercise 5: fill and submit the compliance widget form', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Fill fields inside the shadow DOM component.
  // Playwright pierces shadow DOM automatically for all locator methods.
  await page.getByTestId('input-entity-name').fill('Acme Corp');
  await page.getByTestId('input-entity-id').fill('ENT-007');
  await page.getByTestId('select-check-type').selectOption('aml');

  // Click the button inside the shadow root.
  await page.getByTestId('btn-run-check').click();

  // Verify the status message appeared inside the shadow DOM.
  const status = page.getByTestId('check-status');
  await expect(status).toBeVisible();
  await expect(status).toContainText('AML check passed for Acme Corp (ENT-007)');
});

// --------------------------------------------------------------------------
// Exercise 6: Access nested iframes (iframe inside iframe)
// --------------------------------------------------------------------------
test('exercise 6: read content from a nested iframe', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // First, get the outer iframe using frameLocator().
  const outerFrame = page.frameLocator('[data-testid="outer-iframe"]');

  // Verify content in the outer frame.
  await expect(outerFrame.getByTestId('outer-title')).toHaveText('Outer Audit Frame');
  await expect(outerFrame.getByTestId('outer-text')).toContainText('outer compliance audit layer');

  // To access a nested iframe, chain another frameLocator() on the outer one.
  // This is how Playwright handles iframe-within-iframe scenarios.
  const innerFrame = outerFrame.frameLocator('[data-testid="inner-iframe"]');

  // Now you can interact with elements inside the nested iframe.
  await expect(innerFrame.getByTestId('inner-text')).toContainText('All checks passed');
  await expect(innerFrame.getByTestId('inner-text')).toContainText('AUD-2026-0415');
});

// --------------------------------------------------------------------------
// Exercise 7: Switch between multiple iframes
// --------------------------------------------------------------------------
test('exercise 7: interact with multiple iframes in sequence', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Unlike Selenium, Playwright does NOT require "switching" to a frame.
  // You simply create frameLocators for each iframe and use them independently.
  // There is no "active frame" concept — each frameLocator is a scoped view.

  // Access the payment iframe.
  const paymentFrame = page.frameLocator('[data-testid="payment-iframe"]');
  await paymentFrame.getByTestId('input-cardholder').fill('Multi-Frame Test');

  // Access the terms iframe — no need to "switch back" to the main page first.
  const termsFrame = page.frameLocator('[data-testid="terms-iframe"]');
  await expect(termsFrame.getByTestId('terms-title')).toHaveText('Terms of Service v3.1');

  // Go back and verify the payment iframe still has the value we entered.
  // Since there is no frame switching, the value is still accessible.
  await expect(paymentFrame.getByTestId('input-cardholder')).toHaveValue('Multi-Frame Test');

  // Access something on the main page (outside any iframe) — no switching needed.
  await expect(page.getByTestId('page-header')).toBeVisible();
});

// --------------------------------------------------------------------------
// Exercise 8: Assert content across iframe boundary
// --------------------------------------------------------------------------
test('exercise 8: verify terms iframe content and accept on main page', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Step 1: Read content from inside the terms iframe.
  const termsFrame = page.frameLocator('[data-testid="terms-iframe"]');
  await expect(termsFrame.getByTestId('terms-section-1')).toContainText('compliance regulations');
  await expect(termsFrame.getByTestId('terms-last-updated')).toHaveText('Last updated: 2026-04-01');

  // Step 2: Interact with the checkbox and button on the MAIN page (not in iframe).
  // The terms checkbox and accept button are on the main page, not inside the iframe.
  // This tests the common pattern: read iframe content, then act on the parent page.
  await page.getByTestId('terms-checkbox').check();
  await page.getByTestId('btn-accept-terms').click();

  // Step 3: Verify the result on the main page.
  await expect(page.getByTestId('terms-result')).toHaveText('Terms accepted successfully. You may proceed.');
});
