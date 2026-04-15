import { test, expect } from '@playwright/test';

// The base URL for our playground page.
const PLAYGROUND = '/phase-05-fintech-domain/30-risk-assessment/playground/';

// ─── Helper: setScore ────────────────────────────────────────────────
// Changes a risk factor's score input and triggers recalculation.
// locator.fill(value) clears the input, types the new value, and
// dispatches a 'change' event which triggers recalculate().
async function setScore(page: any, factorId: string, score: string) {
  const input = page.getByTestId(`score-${factorId}`);
  await input.fill(score);
  // Dispatch a change event explicitly to ensure recalculation triggers.
  // dispatchEvent(new Event('change')) fires the onchange handler.
  await input.dispatchEvent('change');
}

// --------------------------------------------------------------------------
// Exercise 1: Verify Risk Table Data
// --------------------------------------------------------------------------
// Verify all five risk factors with default scores, weights, and weighted scores.
test('exercise 1: verify risk table data', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Verify the table is visible.
  await expect(page.getByTestId('risk-table')).toBeVisible();

  // Verify default score values.
  // toHaveValue(value) checks the input element's current value.
  await expect(page.getByTestId('score-identity')).toHaveValue('15');
  await expect(page.getByTestId('score-credit')).toHaveValue('20');
  await expect(page.getByTestId('score-employment')).toHaveValue('10');
  await expect(page.getByTestId('score-address')).toHaveValue('5');
  await expect(page.getByTestId('score-sanctions')).toHaveValue('0');

  // Verify weights.
  await expect(page.getByTestId('weight-identity')).toHaveText('0.25');
  await expect(page.getByTestId('weight-credit')).toHaveText('0.20');
  await expect(page.getByTestId('weight-employment')).toHaveText('0.20');
  await expect(page.getByTestId('weight-address')).toHaveText('0.15');
  await expect(page.getByTestId('weight-sanctions')).toHaveText('0.20');

  // Verify weighted scores (score * weight).
  await expect(page.getByTestId('weighted-identity')).toHaveText('3.75');
  await expect(page.getByTestId('weighted-credit')).toHaveText('4.00');
  await expect(page.getByTestId('weighted-employment')).toHaveText('2.00');
  await expect(page.getByTestId('weighted-address')).toHaveText('0.75');
  await expect(page.getByTestId('weighted-sanctions')).toHaveText('0.00');
});

// --------------------------------------------------------------------------
// Exercise 2: Verify Computed Total
// --------------------------------------------------------------------------
// Verify the total weighted score and overall risk level.
test('exercise 2: verify computed total', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Total = 3.75 + 4.00 + 2.00 + 0.75 + 0.00 = 10.50.
  await expect(page.getByTestId('total-score')).toHaveText('10.50');

  // Total 10.50 is below 30, so risk level is "Low".
  await expect(page.getByTestId('total-level')).toHaveText('Low');

  // Verify the total level has the low-risk CSS class.
  await expect(page.getByTestId('total-level')).toHaveClass(/risk-low/);
});

// --------------------------------------------------------------------------
// Exercise 3: Change a Score and Verify Recalculation
// --------------------------------------------------------------------------
// Change Identity from 15 to 80, verify weighted and total update.
test('exercise 3: change a score and verify recalculation', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Change Identity score to 80.
  await setScore(page, 'identity', '80');

  // Weighted should be 80 * 0.25 = 20.00.
  await expect(page.getByTestId('weighted-identity')).toHaveText('20.00');

  // New total = 20.00 + 4.00 + 2.00 + 0.75 + 0.00 = 26.75.
  await expect(page.getByTestId('total-score')).toHaveText('26.75');

  // Identity score 80 is "High" risk.
  await expect(page.getByTestId('level-identity')).toHaveText('High');
  await expect(page.getByTestId('level-identity')).toHaveClass(/risk-high/);
});

// --------------------------------------------------------------------------
// Exercise 4: Verify Auto-Approve Threshold
// --------------------------------------------------------------------------
// Default scores give total < 30, so action should be "Auto-Approve".
test('exercise 4: verify auto-approve threshold', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Default total is 10.50 (< 30), so action is Auto-Approve.
  await expect(page.getByTestId('action-title')).toHaveText('Auto-Approve');
  await expect(page.getByTestId('action-description')).toContainText('automatically approved');

  // Verify the action card has the green styling.
  await expect(page.getByTestId('action-card')).toHaveClass(/result-auto-approve/);
});

// --------------------------------------------------------------------------
// Exercise 5: Verify Manual Review Threshold
// --------------------------------------------------------------------------
// Set scores to push total between 30 and 70.
test('exercise 5: verify manual review threshold', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Set Identity to 80 and Credit to 80.
  // Total = (80*0.25) + (80*0.20) + (10*0.20) + (5*0.15) + (0*0.20)
  //       = 20 + 16 + 2 + 0.75 + 0 = 38.75 (between 30 and 70).
  await setScore(page, 'identity', '80');
  await setScore(page, 'credit', '80');

  await expect(page.getByTestId('total-score')).toHaveText('38.75');

  // Action should be "Manual Review".
  await expect(page.getByTestId('action-title')).toHaveText('Manual Review');
  await expect(page.getByTestId('action-description')).toContainText('manual review');

  // Verify amber styling.
  await expect(page.getByTestId('action-card')).toHaveClass(/result-manual-review/);
});

// --------------------------------------------------------------------------
// Exercise 6: Verify Auto-Reject Threshold
// --------------------------------------------------------------------------
// Set scores to push total above 70.
test('exercise 6: verify auto-reject threshold', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Set all scores to 90.
  // Total = (90*0.25) + (90*0.20) + (90*0.20) + (90*0.15) + (90*0.20)
  //       = 22.5 + 18 + 18 + 13.5 + 18 = 90.00 (> 70).
  for (const id of ['identity', 'credit', 'employment', 'address', 'sanctions']) {
    await setScore(page, id, '90');
  }

  await expect(page.getByTestId('total-score')).toHaveText('90.00');

  // Action should be "Auto-Reject".
  await expect(page.getByTestId('action-title')).toHaveText('Auto-Reject');
  await expect(page.getByTestId('action-description')).toContainText('automatically rejected');

  // Verify red styling.
  await expect(page.getByTestId('action-card')).toHaveClass(/result-auto-reject/);
});

// --------------------------------------------------------------------------
// Exercise 7: Override Score and Verify Action Changes
// --------------------------------------------------------------------------
// Transition through all three thresholds by changing scores.
test('exercise 7: override score and verify action changes', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Start: Auto-Approve (default total 10.50).
  await expect(page.getByTestId('action-title')).toHaveText('Auto-Approve');

  // Move to Manual Review range.
  await setScore(page, 'identity', '80');
  await setScore(page, 'credit', '80');
  // Total = 20 + 16 + 2 + 0.75 + 0 = 38.75.
  await expect(page.getByTestId('action-title')).toHaveText('Manual Review');

  // Move to Auto-Reject range.
  await setScore(page, 'employment', '100');
  await setScore(page, 'address', '100');
  await setScore(page, 'sanctions', '100');
  // Total = 20 + 16 + 20 + 15 + 20 = 91.
  await expect(page.getByTestId('action-title')).toHaveText('Auto-Reject');

  // Move back to Auto-Approve by resetting.
  await page.getByTestId('btn-reset').click();
  await expect(page.getByTestId('action-title')).toHaveText('Auto-Approve');
  await expect(page.getByTestId('total-score')).toHaveText('10.50');
});

// --------------------------------------------------------------------------
// Exercise 8: Verify Color Coding Matches Risk Level
// --------------------------------------------------------------------------
// Set different scores and verify the color classes match the risk levels.
test('exercise 8: verify color coding matches risk level', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Set Identity to 10 (Low), Credit to 50 (Medium), Sanctions to 80 (High).
  await setScore(page, 'identity', '10');
  await setScore(page, 'credit', '50');
  await setScore(page, 'sanctions', '80');

  // Identity: 10 => Low, should have risk-low class.
  await expect(page.getByTestId('level-identity')).toHaveText('Low');
  await expect(page.getByTestId('level-identity')).toHaveClass(/risk-low/);

  // Credit: 50 => Medium, should have risk-medium class.
  await expect(page.getByTestId('level-credit')).toHaveText('Medium');
  await expect(page.getByTestId('level-credit')).toHaveClass(/risk-medium/);

  // Sanctions: 80 => High, should have risk-high class.
  await expect(page.getByTestId('level-sanctions')).toHaveText('High');
  await expect(page.getByTestId('level-sanctions')).toHaveClass(/risk-high/);

  // Verify the export button works.
  await page.getByTestId('btn-export').click();
  await expect(page.getByTestId('export-section')).toBeVisible();
  // The exported JSON should contain the action.
  await expect(page.getByTestId('export-content')).toContainText('"action"');
});
