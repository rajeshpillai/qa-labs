# Kata 31: Approval & Rejection Flows

## What You Will Learn

- How to test admin review panels with approve/reject/escalate workflows
- How to interact with confirmation dialogs (modal overlays)
- How to verify required fields in rejection forms
- How to test status changes after admin actions
- How to verify action history logs
- How to test bulk selection and bulk actions
- How to test list filtering by status
- How to verify UI state after multiple sequential actions

## Prerequisites

- Completed Katas 1-30
- Understanding of dialog/modal interaction testing
- Familiarity with checkbox-based selection patterns

## Concepts Explained

### Admin Review Panel Pattern

```
In fintech, admin review panels allow compliance officers or analysts
to review, approve, reject, or escalate pending applications.

Common features:
  - List of applications with status badges
  - Action buttons per application (Approve, Reject, Escalate)
  - Confirmation dialogs before actions take effect
  - Rejection requires a reason (mandatory field)
  - Action history/audit log
  - Bulk actions (select multiple, approve all)
  - Filter by status

Testing must verify:
  - Status changes correctly after each action
  - Confirmation dialogs appear and work correctly
  - Rejection is blocked without a reason
  - History log records every action
  - Bulk actions affect all selected items
  - Filters show the correct subset
```

### Testing Modal Dialogs

```
Modal dialogs overlay the page and require user interaction before
returning to the main content.

Playwright:
  // Click Approve to open the dialog.
  await page.getByTestId('btn-approve-APP-001').click();
  // Verify the dialog is visible.
  await expect(page.getByTestId('approve-dialog')).toBeVisible();
  // Click the confirm button inside the dialog.
  await page.getByTestId('approve-dialog-confirm').click();
  // Verify the dialog closes.
  await expect(page.getByTestId('approve-dialog')).toBeHidden();

Cypress:
  cy.get('[data-testid="btn-approve-APP-001"]').click();
  cy.get('[data-testid="approve-dialog"]').should('be.visible');
  cy.get('[data-testid="approve-dialog-confirm"]').click();
  cy.get('[data-testid="approve-dialog"]').should('not.be.visible');
```

### Testing Bulk Actions

```
Bulk actions require:
  1. Select individual checkboxes (or "Select All")
  2. Verify the selected count updates
  3. Click the bulk action button
  4. Verify all selected items changed status

Playwright:
  await page.getByTestId('select-all').check();
  await expect(page.getByTestId('selected-count')).toContainText('5 selected');
  await page.getByTestId('btn-bulk-approve').click();

Cypress:
  cy.get('[data-testid="select-all"]').check();
  cy.get('[data-testid="selected-count"]').should('contain.text', '5 selected');
  cy.get('[data-testid="btn-bulk-approve"]').click();
```

## Playground

The playground is an admin review panel with:

1. **Filter Bar** — dropdown to filter applications by status (All, Pending, Approved, Rejected, Escalated) with a count of visible/total applications
2. **Bulk Actions Bar** — "Select All" checkbox, selected count, and "Approve Selected" button (disabled until at least one is selected)
3. **Application List** — five applications (APP-001 through APP-005) each with:
   - Checkbox for bulk selection (disabled for non-pending apps)
   - Name, ID, email, risk score
   - Status badge (Pending, Approved, Rejected, Escalated)
   - Action buttons (Approve, Reject, Escalate) — only shown for pending apps
4. **Approval Dialog** — confirmation dialog with Cancel/Approve buttons
5. **Rejection Dialog** — dialog with required reason textarea, validation error, Cancel/Reject buttons
6. **Escalation Dialog** — dialog with optional notes textarea, Cancel/Escalate buttons
7. **Action History** — chronological log of all actions taken, showing action type, applicant name/ID, and reason if applicable

## Exercises

### Exercise 1: Approve Application and Verify Status Change
Click "Approve" on APP-001. Verify the confirmation dialog appears. Click "Approve" in the dialog. Verify the status badge changes to "Approved" and the action buttons disappear.

### Exercise 2: Reject With Reason
Click "Reject" on APP-002. Verify the rejection dialog appears. Type a reason and click "Reject". Verify the status changes to "Rejected".

### Exercise 3: Escalate Application
Click "Escalate" on APP-003. Add notes in the escalation dialog and confirm. Verify the status changes to "Escalated".

### Exercise 4: Verify Action History
Approve one application and reject another. Verify the action history shows both entries with the correct details.

### Exercise 5: Bulk Select and Approve
Select all pending applications using the "Select All" checkbox. Click "Approve Selected". Verify all selected applications change to "Approved".

### Exercise 6: Verify Confirmation Dialog
Click "Approve" on APP-001. Verify the dialog text mentions the applicant name. Click "Cancel". Verify the dialog closes and the status is still "Pending".

### Exercise 7: Verify Rejection Requires Reason
Click "Reject" on APP-002. Click "Reject" without entering a reason. Verify the error message appears. Then enter a reason and verify it succeeds.

### Exercise 8: Filter by Status
Approve one application, reject another. Filter by "Pending" and verify only pending apps show. Filter by "Approved" and verify only approved apps show. Filter by "All" and verify all apps show.

## Solutions

### Playwright Solution

See `playwright/approval-rejection-flows.spec.ts`

### Cypress Solution

See `cypress/approval-rejection-flows.cy.ts`

## Common Mistakes

| Mistake | Why it's wrong | Fix |
|---------|---------------|-----|
| Clicking action buttons on non-pending apps | Action buttons are only rendered for pending applications | Verify the app is pending before trying to click Approve/Reject |
| Forgetting to confirm in the dialog | Clicking "Approve" opens a dialog; the actual approval happens on confirm | Click the dialog's confirm button after opening the dialog |
| Not clearing the reject reason from a previous test | The textarea may retain values from a prior dialog opening | Each `openRejectDialog()` call resets the textarea, but tests should navigate fresh |
| Asserting on checkboxes after status change | Approved/rejected apps have disabled checkboxes | After changing status, the checkbox for that app is disabled |
| Not waiting for re-render after bulk approve | `bulkApprove()` triggers `renderApplications()` which rebuilds the DOM | Wait for the status badges to update before asserting |

## Quick Reference

### Playwright Dialog Testing

| Action | Method | Example |
|--------|--------|---------|
| Open dialog | `locator.click()` | `await page.getByTestId('btn-approve-APP-001').click()` |
| Verify dialog visible | `toBeVisible()` | `await expect(dialog).toBeVisible()` |
| Type in textarea | `locator.fill()` | `await textarea.fill('Reason text')` |
| Confirm action | `locator.click()` | `await page.getByTestId('approve-dialog-confirm').click()` |
| Cancel action | `locator.click()` | `await page.getByTestId('approve-dialog-cancel').click()` |
| Check dialog hidden | `toBeHidden()` | `await expect(dialog).toBeHidden()` |
| Check checkbox | `locator.check()` | `await page.getByTestId('select-all').check()` |

### Cypress Dialog Testing

| Action | Method | Example |
|--------|--------|---------|
| Open dialog | `cy.get().click()` | `cy.get('[data-testid="btn-approve-APP-001"]').click()` |
| Verify dialog visible | `.should('be.visible')` | `cy.get(dialog).should('be.visible')` |
| Type in textarea | `.type()` | `cy.get(textarea).type('Reason text')` |
| Confirm action | `.click()` | `cy.get('[data-testid="approve-dialog-confirm"]').click()` |
| Cancel action | `.click()` | `cy.get('[data-testid="approve-dialog-cancel"]').click()` |
| Check dialog hidden | `.should('not.be.visible')` | `cy.get(dialog).should('not.be.visible')` |
| Check checkbox | `.check()` | `cy.get('[data-testid="select-all"]').check()` |
