import { test, expect } from '@playwright/test';

// The base URL for our playground page.
const PLAYGROUND = '/phase-05-fintech-domain/29-background-verification/playground/';

// --------------------------------------------------------------------------
// Exercise 1: Verify Initial Pending States
// --------------------------------------------------------------------------
// Before starting checks, verify all five checks show "Pending".
test('exercise 1: verify initial pending states', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Verify all five check status badges show "Pending".
  // toHaveText(text) checks the element's textContent matches exactly.
  const checkIds = ['criminal', 'credit', 'employment', 'education', 'reference'];
  for (const id of checkIds) {
    await expect(page.getByTestId(`check-${id}-status`)).toHaveText('Pending');
  }

  // Verify progress is at 0%.
  await expect(page.getByTestId('progress-percentage')).toHaveText('0%');
  await expect(page.getByTestId('checks-completed')).toHaveText('0 / 5');

  // Verify overall status is "Not Started".
  await expect(page.getByTestId('overall-status')).toHaveText('Not Started');

  // Verify the start button is enabled.
  await expect(page.getByTestId('btn-start-checks')).toBeEnabled();
});

// --------------------------------------------------------------------------
// Exercise 2: Wait for First Check to Complete
// --------------------------------------------------------------------------
// Start checks and wait for Criminal Record to show "Complete".
test('exercise 2: wait for first check to complete', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Start the background checks.
  await page.getByTestId('btn-start-checks').click();

  // The criminal check should first transition to "In Progress".
  // toHaveText() retries automatically until the text matches.
  await expect(page.getByTestId('check-criminal-status')).toHaveText('In Progress', { timeout: 3000 });

  // Then it should complete after ~2 seconds.
  await expect(page.getByTestId('check-criminal-status')).toHaveText('Complete', { timeout: 5000 });

  // Verify the detail text updated to show the result.
  await expect(page.getByTestId('check-criminal-detail')).toHaveText('No records found');
});

// --------------------------------------------------------------------------
// Exercise 3: Verify Progress Bar Updates
// --------------------------------------------------------------------------
// Start checks and verify progress increases as checks complete.
test('exercise 3: verify progress bar updates', async ({ page }) => {
  await page.goto(PLAYGROUND);
  await page.getByTestId('btn-start-checks').click();

  // After the first check (criminal), progress should be 20%.
  // toHaveText('20%') retries until the text matches.
  await expect(page.getByTestId('progress-percentage')).toHaveText('20%', { timeout: 5000 });

  // After two checks (criminal + credit), progress should be 40%.
  await expect(page.getByTestId('progress-percentage')).toHaveText('40%', { timeout: 8000 });

  // Verify the progress bar fill element has a non-zero width.
  // We don't check the exact CSS value since it may be layout-dependent.
  // Instead we verify the inline style contains the expected percentage.
  const fill = page.getByTestId('progress-bar-fill');
  // getAttribute('style') returns the element's inline style string.
  const style = await fill.getAttribute('style');
  expect(style).toContain('40%');
});

// --------------------------------------------------------------------------
// Exercise 4: Verify All Checks Complete
// --------------------------------------------------------------------------
// Wait for all five checks to finish. Verify 100% and "5 / 5".
test('exercise 4: verify all checks complete', async ({ page }) => {
  await page.goto(PLAYGROUND);
  await page.getByTestId('btn-start-checks').click();

  // Wait for all checks to complete. Total time ~11.5s, so use 15s timeout.
  // toHaveText('100%') retries until progress reaches 100%.
  await expect(page.getByTestId('progress-percentage')).toHaveText('100%', { timeout: 15000 });

  // Verify the completed count shows all 5.
  await expect(page.getByTestId('checks-completed')).toHaveText('5 / 5');

  // Verify each check has a final status (Complete or Failed).
  await expect(page.getByTestId('check-criminal-status')).toHaveText('Complete');
  await expect(page.getByTestId('check-credit-status')).toHaveText('Complete');
  await expect(page.getByTestId('check-employment-status')).toHaveText('Complete');
  await expect(page.getByTestId('check-education-status')).toHaveText('Failed');
  await expect(page.getByTestId('check-reference-status')).toHaveText('Complete');
});

// --------------------------------------------------------------------------
// Exercise 5: Handle Failed Check
// --------------------------------------------------------------------------
// Wait for the Education check to complete and verify it shows "Failed".
test('exercise 5: handle failed check', async ({ page }) => {
  await page.goto(PLAYGROUND);
  await page.getByTestId('btn-start-checks').click();

  // Wait for the education check to show "Failed".
  // The education check completes at ~9.5s cumulative delay.
  await expect(page.getByTestId('check-education-status')).toHaveText('Failed', { timeout: 12000 });

  // Verify the check item has the "failed" CSS class.
  // toHaveClass(/regex/) checks that the element's class matches the pattern.
  await expect(page.getByTestId('check-education')).toHaveClass(/failed/);

  // Verify the detail text shows the failure reason.
  await expect(page.getByTestId('check-education-detail')).toHaveText('Could not verify degree');
});

// --------------------------------------------------------------------------
// Exercise 6: Verify Estimated Time Updates
// --------------------------------------------------------------------------
// Verify the estimated time decreases and reaches "0s" when done.
test('exercise 6: verify estimated time updates', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Before starting, estimated time should be "--".
  await expect(page.getByTestId('estimated-time')).toHaveText('--');

  // Start checks.
  await page.getByTestId('btn-start-checks').click();

  // The estimated time should start at a value > 0.
  // We verify it's no longer "--".
  await expect(page.getByTestId('estimated-time')).not.toHaveText('--', { timeout: 2000 });

  // Read the initial estimated time.
  const initialText = await page.getByTestId('estimated-time').textContent();
  const initialSeconds = parseInt(initialText!);
  expect(initialSeconds).toBeGreaterThan(0);

  // Wait for all checks to complete, then verify time is "0s".
  await expect(page.getByTestId('estimated-time')).toHaveText('0s', { timeout: 15000 });
});

// --------------------------------------------------------------------------
// Exercise 7: Verify Overall Status Changes
// --------------------------------------------------------------------------
// Verify the overall status transitions correctly through all phases.
test('exercise 7: verify overall status changes', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Initial: "Not Started".
  await expect(page.getByTestId('overall-status')).toHaveText('Not Started');
  await expect(page.getByTestId('overall-status')).toHaveClass(/overall-pending/);

  // Start checks.
  await page.getByTestId('btn-start-checks').click();

  // Should transition to "In Progress".
  await expect(page.getByTestId('overall-status')).toHaveText('In Progress');
  await expect(page.getByTestId('overall-status')).toHaveClass(/overall-in-progress/);

  // Wait for all checks to complete.
  // Because education fails, the final status should be "Completed with Issues".
  await expect(page.getByTestId('overall-status')).toHaveText('Completed with Issues', { timeout: 15000 });
  await expect(page.getByTestId('overall-status')).toHaveClass(/overall-failed/);
});

// --------------------------------------------------------------------------
// Exercise 8: Complete Full Background Check Flow
// --------------------------------------------------------------------------
// Start checks, wait for all to complete, verify everything.
test('exercise 8: complete full background check flow', async ({ page }) => {
  await page.goto(PLAYGROUND);
  await page.getByTestId('btn-start-checks').click();

  // Wait for all checks to complete.
  await expect(page.getByTestId('progress-percentage')).toHaveText('100%', { timeout: 15000 });

  // Verify individual check results.
  const expectedResults = [
    { id: 'criminal', status: 'Complete', detail: 'No records found' },
    { id: 'credit', status: 'Complete', detail: 'Score: 750 (Good)' },
    { id: 'employment', status: 'Complete', detail: 'Verified: 3 employers' },
    { id: 'education', status: 'Failed', detail: 'Could not verify degree' },
    { id: 'reference', status: 'Complete', detail: '2 of 2 references confirmed' }
  ];

  for (const check of expectedResults) {
    await expect(page.getByTestId(`check-${check.id}-status`)).toHaveText(check.status);
    await expect(page.getByTestId(`check-${check.id}-detail`)).toHaveText(check.detail);
  }

  // Verify progress bar is full.
  await expect(page.getByTestId('checks-completed')).toHaveText('5 / 5');

  // Verify estimated time is 0.
  await expect(page.getByTestId('estimated-time')).toHaveText('0s');

  // Verify overall status reflects the failure.
  await expect(page.getByTestId('overall-status')).toHaveText('Completed with Issues');
});
