import { test, expect } from '@playwright/test';

// The base URL for our playground page. All tests navigate here first.
const PLAYGROUND = '/phase-01-dom-and-browser-apis/07-drag-and-drop/playground/';

// --------------------------------------------------------------------------
// Exercise 1: Drag a Card from "New" to "In Review"
// --------------------------------------------------------------------------
// This exercise demonstrates Playwright's dragTo() method, which performs
// a complete HTML5 drag-and-drop sequence (hover source, mousedown, move
// to target, mouseup) in a single awaitable call.
test('exercise 1: drag a card from New to In Review', async ({ page }) => {
  // Navigate to the playground page.
  // page.goto(url) loads the URL and waits for the 'load' event by default.
  await page.goto(PLAYGROUND);

  // Verify the card starts in the New column by checking the status bar
  // shows no action yet.
  await expect(page.getByTestId('last-action')).toHaveText('None');

  // Drag the "Aisha Patel" card to the "In Review" column.
  // dragTo(target) performs the full drag-and-drop operation:
  //   1. Hovers the source element to find its center
  //   2. Presses the left mouse button (mousedown)
  //   3. Moves the mouse to the center of the target element
  //   4. Releases the mouse button (mouseup)
  // This triggers the HTML5 dragstart, dragover, drop, and dragend events.
  await page.getByTestId('card-aisha').dragTo(page.getByTestId('column-review'));

  // Verify the status bar reports the drag action.
  // toContainText(substring) checks if textContent contains the substring.
  await expect(page.getByTestId('last-action')).toContainText('aisha');
  await expect(page.getByTestId('last-action')).toContainText('review');
});

// --------------------------------------------------------------------------
// Exercise 2: Verify Card Moved to Target Column
// --------------------------------------------------------------------------
// After dragging, we verify the card DOM element is now a child of the
// target column, not the source column.
test('exercise 2: verify card is inside the target column after drag', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Verify the card is initially in the New column.
  // We scope the search to the New column using a parent locator.
  const newColumn = page.getByTestId('column-new');
  await expect(newColumn.getByTestId('card-aisha')).toBeVisible();

  // Drag the card to In Review.
  await page.getByTestId('card-aisha').dragTo(page.getByTestId('column-review'));

  // Verify the card is now inside the In Review column.
  // getByTestId() on a parent locator scopes the search to that parent's
  // descendants only. If the card were still in New, this would fail.
  const reviewColumn = page.getByTestId('column-review');
  await expect(reviewColumn.getByTestId('card-aisha')).toBeVisible();

  // Verify the card is no longer in the New column.
  // toBeHidden() asserts the element is not visible (or not in the DOM
  // subtree of the parent locator).
  await expect(newColumn.getByTestId('card-aisha')).toBeHidden();
});

// --------------------------------------------------------------------------
// Exercise 3: Drag a Card to "Approved" Column
// --------------------------------------------------------------------------
// This exercise drags a different card to the Approved column to practice
// targeting various drop zones.
test('exercise 3: drag a card to the Approved column', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Verify the Approved column starts empty (count = 0).
  await expect(page.getByTestId('count-approved')).toHaveText('0');

  // Drag "Clara Jansen" to the Approved column.
  await page.getByTestId('card-clara').dragTo(page.getByTestId('column-approved'));

  // Verify the card is now in the Approved column.
  const approvedColumn = page.getByTestId('column-approved');
  await expect(approvedColumn.getByTestId('card-clara')).toBeVisible();

  // Verify the Approved column count updated to 1.
  await expect(page.getByTestId('count-approved')).toHaveText('1');
});

// --------------------------------------------------------------------------
// Exercise 4: Drag a Card to "Rejected" Column
// --------------------------------------------------------------------------
// This exercise drags a card to the Rejected column.
test('exercise 4: drag a card to the Rejected column', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Verify the Rejected column starts empty.
  await expect(page.getByTestId('count-rejected')).toHaveText('0');

  // Drag "Ben Okafor" to the Rejected column.
  await page.getByTestId('card-ben').dragTo(page.getByTestId('column-rejected'));

  // Verify the card is in the Rejected column.
  const rejectedColumn = page.getByTestId('column-rejected');
  await expect(rejectedColumn.getByTestId('card-ben')).toBeVisible();

  // Verify the Rejected column count updated.
  await expect(page.getByTestId('count-rejected')).toHaveText('1');
});

// --------------------------------------------------------------------------
// Exercise 5: Verify Source Column Card Count Decreases
// --------------------------------------------------------------------------
// This exercise moves multiple cards and checks that both source and target
// counts are correct.
test('exercise 5: verify column counts update after moving cards', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Verify initial counts: New has 3 cards, Review has 1.
  await expect(page.getByTestId('count-new')).toHaveText('3');
  await expect(page.getByTestId('count-review')).toHaveText('1');

  // Move all three cards out of New.
  await page.getByTestId('card-aisha').dragTo(page.getByTestId('column-review'));
  await page.getByTestId('card-ben').dragTo(page.getByTestId('column-rejected'));
  await page.getByTestId('card-clara').dragTo(page.getByTestId('column-approved'));

  // Verify New column now has 0 cards.
  await expect(page.getByTestId('count-new')).toHaveText('0');

  // Verify target columns have correct counts.
  // Review: had 1 (Derek) + 1 (Aisha) = 2
  await expect(page.getByTestId('count-review')).toHaveText('2');
  // Rejected: had 0 + 1 (Ben) = 1
  await expect(page.getByTestId('count-rejected')).toHaveText('1');
  // Approved: had 0 + 1 (Clara) = 1
  await expect(page.getByTestId('count-approved')).toHaveText('1');
});

// --------------------------------------------------------------------------
// Exercise 6: Reorder Items Within the Sortable List
// --------------------------------------------------------------------------
// This exercise demonstrates dragging an item within a list to reorder it.
// We use dragTo() with the target being another list item.
test('exercise 6: reorder items within the sortable priority list', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Verify the initial order.
  await expect(page.getByTestId('priority-order')).toHaveText(
    'sanctions, identity, address, income'
  );

  // Drag "Income Verification" (last item) above "Sanctions Screening" (first item).
  // dragTo() works for reordering within a list too — we just target another
  // list item instead of a column container.
  await page.getByTestId('priority-income').dragTo(
    page.getByTestId('priority-sanctions')
  );

  // Verify the order changed — "income" should now be first.
  // Note: The exact result depends on drop position calculation in the
  // playground's drop handler (above/below midpoint). We verify income
  // moved above sanctions.
  const order = await page.getByTestId('priority-order').textContent();
  // income should appear before sanctions in the new order.
  expect(order!.indexOf('income')).toBeLessThan(order!.indexOf('sanctions'));
});

// --------------------------------------------------------------------------
// Exercise 7: Verify Drop Zone Highlights During Drag
// --------------------------------------------------------------------------
// This exercise uses a manual drag sequence (hover + mouse.down + hover
// over target) to verify the CSS class applied during drag hover.
test('exercise 7: verify drop zone highlight during drag', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Verify the column does NOT have the drag-over class initially.
  // toHaveClass() with a regex checks if the element's class attribute
  // matches the pattern. We negate it here.
  await expect(page.getByTestId('column-approved')).not.toHaveClass(/drag-over/);

  // Start a manual drag sequence:
  // Step 1: Hover over the card to position the mouse on it.
  await page.getByTestId('card-aisha').hover();

  // Step 2: Press the mouse button to begin dragging.
  // page.mouse.down() dispatches a mousedown event at the current position.
  await page.mouse.down();

  // Step 3: Move the mouse over the target column.
  // This triggers dragenter and dragover events on the column, which
  // cause the playground to add the 'drag-over' CSS class.
  await page.getByTestId('column-approved').hover();

  // Verify the column now has the 'drag-over' class.
  // toHaveClass(regex) checks that the element's className matches.
  await expect(page.getByTestId('column-approved')).toHaveClass(/drag-over/);

  // Step 4: Release the mouse to complete the drop.
  await page.mouse.up();

  // After drop, the 'drag-over' class should be removed.
  await expect(page.getByTestId('column-approved')).not.toHaveClass(/drag-over/);
});

// --------------------------------------------------------------------------
// Exercise 8: Drag Back from Rejected to New
// --------------------------------------------------------------------------
// This exercise verifies cards can be dragged back to their original column,
// confirming the drop targets work in all directions.
test('exercise 8: drag a card from Rejected back to New', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // First, move "Ben Okafor" to the Rejected column.
  await page.getByTestId('card-ben').dragTo(page.getByTestId('column-rejected'));

  // Verify it's in Rejected.
  await expect(page.getByTestId('column-rejected').getByTestId('card-ben')).toBeVisible();
  await expect(page.getByTestId('count-new')).toHaveText('2');
  await expect(page.getByTestId('count-rejected')).toHaveText('1');

  // Now drag it back to New.
  await page.getByTestId('card-ben').dragTo(page.getByTestId('column-new'));

  // Verify it's back in New.
  await expect(page.getByTestId('column-new').getByTestId('card-ben')).toBeVisible();

  // Verify counts restored.
  await expect(page.getByTestId('count-new')).toHaveText('3');
  await expect(page.getByTestId('count-rejected')).toHaveText('0');

  // Verify the status bar shows the return move.
  await expect(page.getByTestId('last-action')).toContainText('ben');
  await expect(page.getByTestId('last-action')).toContainText('new');
});
