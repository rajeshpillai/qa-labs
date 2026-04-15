import { test, expect } from '@playwright/test';

// The base path to this kata's playground.
// The web server serves the katas/ directory, so the path starts from there.
const PLAYGROUND = '/phase-00-foundations/01-selectors-and-locators/playground/';

// --------------------------------------------------------------------------
// Exercise 1: Find by Test ID
// --------------------------------------------------------------------------
test('exercise 1: find submit button by data-testid', async ({ page }) => {
  // Navigate to the playground page
  await page.goto(PLAYGROUND);

  // getByTestId finds an element by its data-testid attribute.
  // This is the most stable selector strategy because data-testid is
  // specifically added for testing and won't change due to styling updates.
  const submitBtn = page.getByTestId('btn-submit');

  // toHaveText checks that the element's text content matches.
  // Playwright auto-waits for the element to appear before checking.
  await expect(submitBtn).toHaveText('Submit Application');
});

// --------------------------------------------------------------------------
// Exercise 2: Find by Role
// --------------------------------------------------------------------------
test('exercise 2: find navigation link by role', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // getByRole finds elements by their ARIA role.
  // 'link' matches <a> elements. The { name } option matches the
  // accessible name (the text content of the link).
  const dashboardLink = page.getByRole('link', { name: 'Dashboard' });

  // toBeVisible checks that the element is rendered and not hidden.
  await expect(dashboardLink).toBeVisible();

  // We can also find headings by their level.
  // This finds <h1> elements (role 'heading' with level 1).
  const mainHeading = page.getByRole('heading', { level: 1 });
  await expect(mainHeading).toHaveText('KYC Portal - Selectors Practice');
});

// --------------------------------------------------------------------------
// Exercise 3: Find by Label and Placeholder
// --------------------------------------------------------------------------
test('exercise 3: find inputs by label and placeholder', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // getByLabel finds a form control by its associated <label> text.
  // The label must be linked to the input via the "for" attribute
  // matching the input's "id", or by wrapping the input.
  const nameInput = page.getByLabel('Full Name');
  await expect(nameInput).toBeVisible();

  // getByPlaceholder finds an element by its placeholder attribute.
  // Useful when an input has no label but does have a placeholder.
  const phoneInput = page.getByPlaceholder('+1 (555) 000-0000');
  await expect(phoneInput).toBeVisible();

  // We can also fill the input to verify it's interactive.
  // fill() clears the field first, then types the text.
  await nameInput.fill('Test User');
  await expect(nameInput).toHaveValue('Test User');
});

// --------------------------------------------------------------------------
// Exercise 4: Find Within a Parent
// --------------------------------------------------------------------------
test('exercise 4: find elements within a parent card', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // First, locate the parent card by its data-testid.
  const card = page.getByTestId('applicant-card-1');

  // Then chain locators to find elements within that card.
  // This is like saying: "inside applicant-card-1, find the element
  // with data-testid applicant-name-1".
  const name = card.getByTestId('applicant-name-1');
  await expect(name).toHaveText('John Doe');

  const email = card.getByTestId('applicant-email-1');
  await expect(email).toHaveText('john.doe@example.com');

  const status = card.getByTestId('applicant-status-1');
  await expect(status).toHaveText('Approved');
});

// --------------------------------------------------------------------------
// Exercise 5: Work With a Table
// --------------------------------------------------------------------------
test('exercise 5: find table row and verify contents', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Locate the second table row by its data-testid.
  const row2 = page.getByTestId('table-row-2');

  // Inside the row, verify specific cell contents.
  await expect(row2.getByTestId('cell-name-2')).toHaveText('Jane Smith');

  // getByText finds any element within the row that contains "Pending".
  await expect(row2.getByText('Pending')).toBeVisible();
});

// --------------------------------------------------------------------------
// Exercise 6: Select From Multiple Elements
// --------------------------------------------------------------------------
test('exercise 6: find last applicant card', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // locator with a CSS attribute selector finds all matching elements.
  // The selector [data-testid^="applicant-card-"] uses the "starts with"
  // operator (^=) to match all elements whose data-testid starts with
  // "applicant-card-".
  const cards = page.locator('[data-testid^="applicant-card-"]');

  // count() returns the number of matching elements.
  await expect(cards).toHaveCount(3);

  // last() returns the last matching element.
  const lastCard = cards.last();
  await expect(lastCard.getByTestId('applicant-name-3')).toHaveText('Raj Kumar');

  // nth(index) selects by 0-based index. nth(0) is the first element.
  const firstCard = cards.nth(0);
  await expect(firstCard.getByTestId('applicant-name-1')).toHaveText('John Doe');
});

// --------------------------------------------------------------------------
// Exercise 7: Text Matching
// --------------------------------------------------------------------------
test('exercise 7: find elements by text content', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // getByText with a string finds elements containing that exact text.
  await expect(page.getByText('Identity Verification')).toBeVisible();

  // getByText with a regex allows partial or case-insensitive matching.
  // The /i flag makes it case-insensitive.
  const verificationItems = page.getByTestId('checklist').locator('li');
  await expect(verificationItems).toHaveCount(5);

  // Verify specific list items exist by their text.
  await expect(page.getByText('Sanctions Screening')).toBeVisible();
});

// --------------------------------------------------------------------------
// Exercise 8: Toggle Visibility
// --------------------------------------------------------------------------
test('exercise 8: toggle panel visibility', async ({ page }) => {
  await page.goto(PLAYGROUND);

  const panel = page.getByTestId('details-panel');
  const toggleBtn = page.getByTestId('btn-toggle-panel');

  // toBeHidden checks that the element is not visible.
  // The panel starts hidden (has class "hidden" with display: none).
  await expect(panel).toBeHidden();

  // Click the toggle button to show the panel.
  // click() auto-waits for the button to be visible and enabled.
  await toggleBtn.click();

  // Now the panel should be visible.
  await expect(panel).toBeVisible();

  // Verify the panel content.
  await expect(page.getByTestId('panel-content')).toContainText('KYC-001');

  // Click again to hide.
  await toggleBtn.click();
  await expect(panel).toBeHidden();
});

// --------------------------------------------------------------------------
// Exercise 9: Interact With Search
// --------------------------------------------------------------------------
test('exercise 9: search and verify results', async ({ page }) => {
  await page.goto(PLAYGROUND);

  const searchInput = page.getByTestId('input-search');

  // fill() replaces any existing text with the new value.
  await searchInput.fill('John');

  // After typing, search results appear dynamically.
  // Playwright auto-waits for the element to appear.
  const results = page.getByTestId('search-result-item');
  await expect(results).toHaveCount(1);

  // Verify the result contains the expected text.
  await expect(results.first()).toContainText('KYC-001');
  await expect(results.first()).toContainText('John Doe');
});

// --------------------------------------------------------------------------
// Exercise 10: Disabled Button
// --------------------------------------------------------------------------
test('exercise 10: verify button is disabled', async ({ page }) => {
  await page.goto(PLAYGROUND);

  const rejectBtn = page.getByTestId('btn-reject-selected');

  // toBeVisible checks the element is rendered (even if disabled).
  await expect(rejectBtn).toBeVisible();

  // toBeDisabled checks the HTML disabled attribute.
  await expect(rejectBtn).toBeDisabled();

  // Compare with an enabled button.
  const newAppBtn = page.getByTestId('btn-new-application');
  await expect(newAppBtn).toBeEnabled();
});
