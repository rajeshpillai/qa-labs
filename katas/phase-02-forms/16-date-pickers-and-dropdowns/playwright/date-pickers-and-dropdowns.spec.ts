import { test, expect } from '@playwright/test';

const PLAYGROUND = '/phase-02-forms/16-date-pickers-and-dropdowns/playground/';

// --------------------------------------------------------------------------
// Exercise 1: Set a Date via the Native Date Input
// --------------------------------------------------------------------------
// Use fill() to set a date value on an <input type="date">.
test('exercise 1: set date via native date input', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Verify the display initially shows "None".
  await expect(page.getByTestId('value-native-date')).toHaveText('None');

  // fill(value) on a date input accepts an ISO date string "YYYY-MM-DD".
  // This sets the input's value and triggers the "change" event.
  await page.getByTestId('input-native-date').fill('1990-05-15');

  // Verify the display text updates to the formatted date.
  // The playground formats the date as "Month Day, Year" using toLocaleDateString.
  await expect(page.getByTestId('value-native-date')).toHaveText('May 15, 1990');
});

// --------------------------------------------------------------------------
// Exercise 2: Interact with the Custom Calendar
// --------------------------------------------------------------------------
// Open the calendar, navigate months, and click a specific day.
test('exercise 2: interact with custom calendar picker', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Click the trigger button to open the calendar popup.
  await page.getByTestId('calendar-trigger').click();

  // Verify the calendar popup is visible (it should have the "open" class).
  await expect(page.getByTestId('calendar-popup')).toBeVisible();

  // Verify the initial month/year display.
  await expect(page.getByTestId('calendar-month-year')).toContainText('April');
  await expect(page.getByTestId('calendar-month-year')).toContainText('2026');

  // Click "Next" to go to May 2026.
  await page.getByTestId('btn-next-month').click();
  await expect(page.getByTestId('calendar-month-year')).toContainText('May');

  // Click day 20.
  // Each day has a data-testid like "cal-day-20".
  await page.getByTestId('cal-day-20').click();

  // Verify the trigger button now shows the selected date.
  await expect(page.getByTestId('calendar-trigger')).toContainText('May');
  await expect(page.getByTestId('calendar-trigger')).toContainText('20');
  await expect(page.getByTestId('calendar-trigger')).toContainText('2026');

  // Verify the display text also updated.
  await expect(page.getByTestId('value-calendar-date')).toContainText('May 20, 2026');
});

// --------------------------------------------------------------------------
// Exercise 3: Select from the Searchable Country Dropdown
// --------------------------------------------------------------------------
// Type a search term to filter, then click an option.
test('exercise 3: select from searchable country dropdown', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Verify initial display.
  await expect(page.getByTestId('value-country')).toHaveText('None');

  // Type "India" in the search input to filter the country list.
  // fill() replaces the input content and triggers the "input" event,
  // which causes the dropdown to filter and open.
  await page.getByTestId('input-country-search').fill('India');

  // Verify the dropdown list is open and shows filtered results.
  await expect(page.getByTestId('country-list')).toHaveClass(/open/);

  // Click the "India" option.
  // The option's testid is derived from the country name in lowercase with
  // spaces replaced by hyphens.
  await page.getByTestId('country-option-india').click();

  // Verify the display text shows "India".
  await expect(page.getByTestId('value-country')).toHaveText('India');
  // Verify the search input now contains "India".
  await expect(page.getByTestId('input-country-search')).toHaveValue('India');
});

// --------------------------------------------------------------------------
// Exercise 4: Verify Cascading Dropdown Behavior
// --------------------------------------------------------------------------
// Select an industry, verify occupation options populate.
test('exercise 4: cascading dropdown populates options', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Verify the occupation dropdown is initially disabled.
  // toBeDisabled() checks the "disabled" attribute on the element.
  await expect(page.getByTestId('select-occupation')).toBeDisabled();

  // Select "Technology" industry.
  // selectOption(value) picks the <option> with the matching value attribute.
  await page.getByTestId('select-industry').selectOption('technology');

  // Verify the occupation dropdown is now enabled.
  await expect(page.getByTestId('select-occupation')).toBeEnabled();

  // Select "Software Engineer" from the occupation dropdown.
  await page.getByTestId('select-occupation').selectOption('software-engineer');

  // Verify the display text shows the selected occupation.
  await expect(page.getByTestId('value-occupation')).toHaveText('Software Engineer');

  // Now change the industry to "Healthcare" and verify occupations update.
  await page.getByTestId('select-industry').selectOption('healthcare');

  // The occupation dropdown should reset (no occupation selected yet).
  await expect(page.getByTestId('value-occupation')).toHaveText('None');

  // Verify a healthcare-specific option is available.
  await page.getByTestId('select-occupation').selectOption('doctor');
  await expect(page.getByTestId('value-occupation')).toHaveText('Doctor');
});

// --------------------------------------------------------------------------
// Exercise 5: Validate Date Range on Native Input
// --------------------------------------------------------------------------
// Enter a date outside the valid range and verify the error.
test('exercise 5: date outside valid range shows error', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Enter a date in 2020 — outside the max of 2010.
  await page.getByTestId('input-native-date').fill('2020-06-15');

  // Verify the error message is visible.
  await expect(page.getByTestId('error-native-date')).toBeVisible();
  await expect(page.getByTestId('error-native-date')).toContainText('1920');
  await expect(page.getByTestId('error-native-date')).toContainText('2010');

  // The display should still show "None" since the date is invalid.
  await expect(page.getByTestId('value-native-date')).toHaveText('None');
});

// --------------------------------------------------------------------------
// Exercise 6: Change Calendar Selection
// --------------------------------------------------------------------------
// Select one date, then select a different date.
test('exercise 6: change calendar selection updates display', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Select April 10.
  await page.getByTestId('calendar-trigger').click();
  await page.getByTestId('cal-day-10').click();

  await expect(page.getByTestId('value-calendar-date')).toContainText('April 10, 2026');

  // Now select a different date — April 25.
  await page.getByTestId('calendar-trigger').click();
  await page.getByTestId('cal-day-25').click();

  // Verify the display updated to the new date.
  await expect(page.getByTestId('value-calendar-date')).toContainText('April 25, 2026');
});

// --------------------------------------------------------------------------
// Exercise 7: Verify Selected Display Text
// --------------------------------------------------------------------------
// Set multiple values and verify each display element.
test('exercise 7: verify display text for multiple inputs', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Set native date.
  await page.getByTestId('input-native-date').fill('1985-12-25');
  await expect(page.getByTestId('value-native-date')).toHaveText('December 25, 1985');

  // Set time.
  // fill() on a time input accepts "HH:MM" format.
  await page.getByTestId('input-time').fill('14:30');
  await expect(page.getByTestId('value-time')).toHaveText('14:30');

  // Set country.
  await page.getByTestId('input-country-search').fill('Singapore');
  await page.getByTestId('country-option-singapore').click();
  await expect(page.getByTestId('value-country')).toHaveText('Singapore');
});

// --------------------------------------------------------------------------
// Exercise 8: Multi-Select Tags
// --------------------------------------------------------------------------
// Select multiple document types, verify tags appear, remove one.
test('exercise 8: multi-select tags selection and removal', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Click the document type search input to open the dropdown.
  await page.getByTestId('input-doc-search').click();

  // Click "Passport" to select it.
  await page.getByTestId('doc-option-passport').click();

  // Verify the tag appeared.
  await expect(page.getByTestId('tag-passport')).toBeVisible();

  // Select another: "Driver License".
  await page.getByTestId('input-doc-search').click();
  await page.getByTestId('doc-option-driver-license').click();

  // Verify both tags are visible.
  await expect(page.getByTestId('tag-passport')).toBeVisible();
  await expect(page.getByTestId('tag-driver-license')).toBeVisible();

  // Verify the display text shows both selections.
  await expect(page.getByTestId('value-doc-types')).toContainText('Passport');
  await expect(page.getByTestId('value-doc-types')).toContainText('Driver License');

  // Remove the "Passport" tag by clicking its X button.
  await page.getByTestId('remove-tag-passport').click();

  // Verify the Passport tag is gone but Driver License remains.
  await expect(page.getByTestId('tag-passport')).toBeHidden();
  await expect(page.getByTestId('tag-driver-license')).toBeVisible();

  // Verify the display text updated.
  await expect(page.getByTestId('value-doc-types')).toHaveText('Driver License');
});
