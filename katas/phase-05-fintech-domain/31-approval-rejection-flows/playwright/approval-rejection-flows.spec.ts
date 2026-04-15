import { test, expect } from '@playwright/test';

// The base URL for our playground page.
const PLAYGROUND = '/phase-05-fintech-domain/31-approval-rejection-flows/playground/';

// --------------------------------------------------------------------------
// Exercise 1: Approve Application and Verify Status Change
// --------------------------------------------------------------------------
// Click Approve on APP-001, confirm in dialog, verify status changes.
test('exercise 1: approve application and verify status change', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Verify APP-001 is initially pending.
  await expect(page.getByTestId('status-APP-001')).toHaveText('Pending');

  // Click the Approve button for APP-001.
  await page.getByTestId('btn-approve-APP-001').click();

  // Verify the approval confirmation dialog appears.
  // toBeVisible() checks the dialog overlay is displayed.
  await expect(page.getByTestId('approve-dialog')).toBeVisible();

  // Verify the dialog mentions the applicant name.
  await expect(page.getByTestId('approve-dialog-text')).toContainText('Alice Johnson');

  // Click the "Approve" button in the dialog to confirm.
  await page.getByTestId('approve-dialog-confirm').click();

  // Verify the dialog closes.
  await expect(page.getByTestId('approve-dialog')).toBeHidden();

  // Verify the status badge changed to "Approved".
  await expect(page.getByTestId('status-APP-001')).toHaveText('Approved');

  // Verify the app card has the approved border styling.
  await expect(page.getByTestId('app-card-APP-001')).toHaveClass(/status-approved/);

  // Verify the action buttons are gone (only shown for pending apps).
  await expect(page.getByTestId('btn-approve-APP-001')).toHaveCount(0);
});

// --------------------------------------------------------------------------
// Exercise 2: Reject With Reason
// --------------------------------------------------------------------------
// Reject APP-002 with a reason, verify status changes.
test('exercise 2: reject with reason', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Click Reject for APP-002.
  await page.getByTestId('btn-reject-APP-002').click();

  // Verify the rejection dialog appears.
  await expect(page.getByTestId('reject-dialog')).toBeVisible();

  // Type a rejection reason.
  // locator.fill(value) clears the textarea and types the new value.
  await page.getByTestId('reject-reason').fill('Insufficient documentation provided');

  // Click Reject in the dialog.
  await page.getByTestId('reject-dialog-confirm').click();

  // Verify the dialog closes.
  await expect(page.getByTestId('reject-dialog')).toBeHidden();

  // Verify the status changed to "Rejected".
  await expect(page.getByTestId('status-APP-002')).toHaveText('Rejected');
  await expect(page.getByTestId('app-card-APP-002')).toHaveClass(/status-rejected/);
});

// --------------------------------------------------------------------------
// Exercise 3: Escalate Application
// --------------------------------------------------------------------------
// Escalate APP-003 with notes, verify status changes.
test('exercise 3: escalate application', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Click Escalate for APP-003.
  await page.getByTestId('btn-escalate-APP-003').click();

  // Verify the escalation dialog appears.
  await expect(page.getByTestId('escalate-dialog')).toBeVisible();

  // Add escalation notes.
  await page.getByTestId('escalate-notes').fill('High risk score requires senior review');

  // Confirm escalation.
  await page.getByTestId('escalate-dialog-confirm').click();

  // Verify the dialog closes and status changed.
  await expect(page.getByTestId('escalate-dialog')).toBeHidden();
  await expect(page.getByTestId('status-APP-003')).toHaveText('Escalated');
  await expect(page.getByTestId('app-card-APP-003')).toHaveClass(/status-escalated/);
});

// --------------------------------------------------------------------------
// Exercise 4: Verify Action History
// --------------------------------------------------------------------------
// Approve one app, reject another, then verify the history log.
test('exercise 4: verify action history', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Approve APP-001.
  await page.getByTestId('btn-approve-APP-001').click();
  await page.getByTestId('approve-dialog-confirm').click();

  // Reject APP-002.
  await page.getByTestId('btn-reject-APP-002').click();
  await page.getByTestId('reject-reason').fill('Failed identity check');
  await page.getByTestId('reject-dialog-confirm').click();

  // Verify the history list has 2 entries.
  // locator.count() returns the number of matching elements.
  const historyItems = page.locator('[data-testid^="history-item-"]');
  await expect(historyItems).toHaveCount(2);

  // Verify the history contains the approval (newest first).
  // The second entry (index 1) is the first action (approval).
  const historyList = page.getByTestId('history-list');
  await expect(historyList).toContainText('Approved');
  await expect(historyList).toContainText('Alice Johnson');
  await expect(historyList).toContainText('Rejected');
  await expect(historyList).toContainText('Bob Williams');
  await expect(historyList).toContainText('Failed identity check');
});

// --------------------------------------------------------------------------
// Exercise 5: Bulk Select and Approve
// --------------------------------------------------------------------------
// Select all pending apps, bulk approve, verify all change status.
test('exercise 5: bulk select and approve', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Click "Select All" checkbox.
  // locator.check() checks a checkbox element.
  await page.getByTestId('select-all').check();

  // Verify the selected count shows all 5 (all are pending initially).
  await expect(page.getByTestId('selected-count')).toHaveText('5 selected');

  // Verify the bulk approve button is enabled.
  await expect(page.getByTestId('btn-bulk-approve')).toBeEnabled();

  // Click "Approve Selected".
  await page.getByTestId('btn-bulk-approve').click();

  // Verify all applications changed to "Approved".
  for (const id of ['APP-001', 'APP-002', 'APP-003', 'APP-004', 'APP-005']) {
    await expect(page.getByTestId(`status-${id}`)).toHaveText('Approved');
  }

  // Verify the history has 5 bulk approval entries.
  const historyList = page.getByTestId('history-list');
  await expect(historyList).toContainText('Approved (Bulk)');
});

// --------------------------------------------------------------------------
// Exercise 6: Verify Confirmation Dialog
// --------------------------------------------------------------------------
// Open the approve dialog, verify content, then cancel and verify no change.
test('exercise 6: verify confirmation dialog', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Click Approve for APP-001.
  await page.getByTestId('btn-approve-APP-001').click();

  // Verify dialog is visible and mentions the applicant.
  await expect(page.getByTestId('approve-dialog')).toBeVisible();
  await expect(page.getByTestId('approve-dialog-text')).toContainText('Alice Johnson');
  await expect(page.getByTestId('approve-dialog-text')).toContainText('APP-001');

  // Click Cancel.
  await page.getByTestId('approve-dialog-cancel').click();

  // Verify dialog closes.
  await expect(page.getByTestId('approve-dialog')).toBeHidden();

  // Verify the status is still "Pending" (action was canceled).
  await expect(page.getByTestId('status-APP-001')).toHaveText('Pending');

  // Verify the approve button is still available.
  await expect(page.getByTestId('btn-approve-APP-001')).toBeVisible();
});

// --------------------------------------------------------------------------
// Exercise 7: Verify Rejection Requires Reason
// --------------------------------------------------------------------------
// Try to reject without a reason, verify error, then add reason and succeed.
test('exercise 7: verify rejection requires reason', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Open the rejection dialog for APP-002.
  await page.getByTestId('btn-reject-APP-002').click();
  await expect(page.getByTestId('reject-dialog')).toBeVisible();

  // Click Reject without entering a reason.
  await page.getByTestId('reject-dialog-confirm').click();

  // Verify the error message appears.
  await expect(page.getByTestId('reject-error')).toBeVisible();
  await expect(page.getByTestId('reject-error')).toHaveText('Rejection reason is required');

  // Verify the dialog is still open (rejection was blocked).
  await expect(page.getByTestId('reject-dialog')).toBeVisible();

  // Now enter a reason and try again.
  await page.getByTestId('reject-reason').fill('Documents are forged');
  await page.getByTestId('reject-dialog-confirm').click();

  // Verify the dialog closes and status changed.
  await expect(page.getByTestId('reject-dialog')).toBeHidden();
  await expect(page.getByTestId('status-APP-002')).toHaveText('Rejected');
});

// --------------------------------------------------------------------------
// Exercise 8: Filter by Status
// --------------------------------------------------------------------------
// Approve and reject apps, then filter and verify the correct subset shows.
test('exercise 8: filter by status', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Approve APP-001.
  await page.getByTestId('btn-approve-APP-001').click();
  await page.getByTestId('approve-dialog-confirm').click();

  // Reject APP-002.
  await page.getByTestId('btn-reject-APP-002').click();
  await page.getByTestId('reject-reason').fill('Duplicate application');
  await page.getByTestId('reject-dialog-confirm').click();

  // Filter by "Pending" — should show 3 apps.
  // locator.selectOption(value) selects the option with the matching value.
  await page.getByTestId('filter-status').selectOption('pending');
  await expect(page.getByTestId('filter-count')).toHaveText('Showing 3 of 5');
  // Verify APP-001 (approved) is not in the list.
  await expect(page.getByTestId('app-card-APP-001')).toHaveCount(0);
  // Verify APP-003 (pending) is in the list.
  await expect(page.getByTestId('app-card-APP-003')).toBeVisible();

  // Filter by "Approved" — should show 1 app.
  await page.getByTestId('filter-status').selectOption('approved');
  await expect(page.getByTestId('filter-count')).toHaveText('Showing 1 of 5');
  await expect(page.getByTestId('app-card-APP-001')).toBeVisible();

  // Filter by "Rejected" — should show 1 app.
  await page.getByTestId('filter-status').selectOption('rejected');
  await expect(page.getByTestId('filter-count')).toHaveText('Showing 1 of 5');
  await expect(page.getByTestId('app-card-APP-002')).toBeVisible();

  // Filter by "All" — should show all 5.
  await page.getByTestId('filter-status').selectOption('all');
  await expect(page.getByTestId('filter-count')).toHaveText('Showing 5 of 5');
});
