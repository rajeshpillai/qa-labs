# Kata 07: Drag and Drop

## What You Will Learn

- How to drag elements from one container to another using HTML5 Drag and Drop
- How to verify that a dragged card moved to the correct target column
- How to check that column card counts update after a move
- How to reorder items within a list by dragging
- How to detect visual feedback during drag operations (ghost image, drop zone highlight)
- Differences between Playwright's built-in `dragTo()` and Cypress's trigger-based approach

## Prerequisites

- Completed Kata 01-06
- Understanding of DOM selectors and assertions

## Concepts Explained

### HTML5 Drag and Drop API

```
The browser's native drag-and-drop system uses these events:

  dragstart  — fires on the element being dragged when drag begins
  drag       — fires continuously on the dragged element while moving
  dragenter  — fires on a drop target when a dragged item enters it
  dragover   — fires continuously on a drop target while item is over it
  dragleave  — fires on a drop target when a dragged item leaves it
  drop       — fires on a drop target when the dragged item is released
  dragend    — fires on the dragged element when drag operation ends

For an element to be draggable, it needs: draggable="true"
For a container to accept drops, its dragover handler must call e.preventDefault()
```

### Playwright: dragTo()

```typescript
// PLAYWRIGHT
// dragTo(target) performs a full drag-and-drop sequence:
//   1. Hover the source element
//   2. Press the mouse button
//   3. Move the mouse to the target element
//   4. Release the mouse button
//
// Signature:
//   locator.dragTo(target: Locator, options?: {
//     force?: boolean,
//     sourcePosition?: { x: number, y: number },
//     targetPosition?: { x: number, y: number },
//     timeout?: number
//   }): Promise<void>
//
// Parameters:
//   target          — the Locator of the drop target element
//   sourcePosition  — offset within the source element to start the drag
//   targetPosition  — offset within the target element to drop onto
//   force           — bypass actionability checks (default: false)

// Drag a card from the "New" column to the "In Review" column:
await page.getByTestId('card-aisha').dragTo(page.getByTestId('column-review'));
```

### Cypress: trigger-based Drag and Drop

```typescript
// CYPRESS
// Cypress does NOT have a built-in drag-and-drop command. Instead, we
// simulate the HTML5 Drag and Drop events manually using trigger().
//
// trigger(eventName, options) dispatches a DOM event on the element.
//
// The drag-and-drop sequence requires three triggers:
//   1. trigger('dragstart') on the source element — begins the drag
//   2. trigger('drop')      on the target element — performs the drop
//   3. trigger('dragend')   on the source element — cleans up
//
// We pass a dataTransfer object to carry data between events.

// Create a DataTransfer object to pass between events:
const dataTransfer = new DataTransfer();

// Step 1: Start the drag on the card
cy.get('[data-testid="card-aisha"]').trigger('dragstart', { dataTransfer });

// Step 2: Trigger dragover on the target (required to allow drop)
cy.get('[data-testid="column-review"]').trigger('dragover', { dataTransfer });

// Step 3: Drop the card on the target column
cy.get('[data-testid="column-review"]').trigger('drop', { dataTransfer });

// Step 4: End the drag on the source card
cy.get('[data-testid="card-aisha"]').trigger('dragend', { dataTransfer });
```

### Verifying Card Movement

```typescript
// PLAYWRIGHT
// After dragging, verify the card is inside the target column by checking
// that the target column contains the card element.
const reviewColumn = page.getByTestId('column-review');
await expect(reviewColumn.getByTestId('card-aisha')).toBeVisible();

// Verify column count badge updated:
await expect(page.getByTestId('count-review')).toHaveText('2');

// CYPRESS
// Use find() to search within a parent element:
cy.get('[data-testid="column-review"]')
  .find('[data-testid="card-aisha"]')
  .should('exist');

// Verify column count:
cy.get('[data-testid="count-review"]').should('have.text', '2');
```

### Verifying Drop Zone Highlight

```typescript
// PLAYWRIGHT
// During drag, the target column gets a 'drag-over' CSS class.
// We can check for it during a manual drag sequence:
await page.getByTestId('card-aisha').hover();
await page.mouse.down();
await page.getByTestId('column-review').hover();
// Now check the class:
await expect(page.getByTestId('column-review')).toHaveClass(/drag-over/);
await page.mouse.up();

// CYPRESS
// After triggering dragover on a column, check for the class:
cy.get('[data-testid="column-review"]').trigger('dragover', { dataTransfer });
cy.get('[data-testid="column-review"]').should('have.class', 'drag-over');
```

## Playground

The playground is a "KYC Kanban Board" themed as a fintech compliance tool. It contains:

1. **Kanban Board** — four columns: "New", "In Review", "Approved", "Rejected". Each column accepts cards dropped into it via HTML5 Drag and Drop.
2. **KYC Application Cards** — each card represents a KYC application with a name and risk level (High, Medium, Low). Cards have drag handles and are fully draggable.
3. **Column Count Badges** — each column header shows the current number of cards, updating automatically after each drag operation.
4. **Visual Feedback** — cards become semi-transparent while being dragged; target columns get a blue dashed border highlight when a card hovers over them.
5. **Status Bar** — displays the last drag action (e.g., "Moved aisha from new to review").
6. **Sortable Priority List** — a separate list of review priorities that can be reordered by dragging items up or down.

### Initial Card Placement

| Column     | Cards                                   |
|------------|----------------------------------------|
| New        | Aisha Patel (High), Ben Okafor (Medium), Clara Jansen (Low) |
| In Review  | Derek Wong (Medium)                     |
| Approved   | (empty)                                 |
| Rejected   | (empty)                                 |

## Exercises

### Exercise 1: Drag a Card from "New" to "In Review"
Drag the "Aisha Patel" card from the New column to the In Review column. Verify the status bar shows the correct action message.

### Exercise 2: Verify Card Moved to Target Column
After dragging "Aisha Patel" to In Review, verify the card element is now inside the In Review column and is visible.

### Exercise 3: Drag a Card to "Approved" Column
Drag "Clara Jansen" from the New column to the Approved column. Verify the card appears in the Approved column.

### Exercise 4: Drag a Card to "Rejected" Column
Drag "Ben Okafor" from the New column to the Rejected column. Verify the card appears in the Rejected column.

### Exercise 5: Verify Source Column Card Count Decreases
After moving all three cards out of New, verify the New column count shows "0" and the target columns show correct counts.

### Exercise 6: Reorder Items Within the Sortable List
Drag "Income Verification" above "Sanctions Screening" in the priority list. Verify the order text updates.

### Exercise 7: Verify Drop Zone Highlights During Drag
Start a drag on a card and hover over a column. Verify the column gets the "drag-over" CSS class. Release the drag and verify the class is removed.

### Exercise 8: Drag Back from Rejected to New
Drag "Ben Okafor" from the Rejected column back to the New column. Verify it appears in New and the counts update.

## Solutions

### Playwright Solution

See `playwright/drag-and-drop.spec.ts`

### Cypress Solution

See `cypress/drag-and-drop.cy.ts`

## Common Mistakes

| Mistake | Why it's wrong | Fix |
|---------|---------------|-----|
| Forgetting `e.preventDefault()` in dragover handler | The browser's default is to NOT allow dropping. Without preventDefault(), the drop event never fires | Always call `e.preventDefault()` in the dragover handler |
| Using `trigger('drag')` instead of the full sequence | A single drag trigger does nothing useful. HTML5 DnD requires dragstart, dragover, drop, dragend in sequence | Use the full trigger sequence: dragstart -> dragover -> drop -> dragend |
| Not passing `dataTransfer` between Cypress triggers | Without a shared DataTransfer object, the drop handler can't read the data set during dragstart | Create one `new DataTransfer()` and pass it to all triggers |
| Checking card position before the drop completes | The DOM hasn't updated yet if you assert too quickly | In Playwright, dragTo() is awaited. In Cypress, commands are auto-queued |
| Dragging to a non-droppable area | If the target element doesn't have dragover/drop handlers, nothing happens | Drag to the column container, not arbitrary page areas |
| Forgetting to verify column counts after drag | Card counts are a key acceptance criteria in kanban boards | Always check both source and target column counts |

## Quick Reference

### Playwright Drag and Drop

| Action | Method | Example |
|--------|--------|---------|
| Drag to target | `locator.dragTo(target)` | `await card.dragTo(column)` |
| Drag with position | `locator.dragTo(target, { targetPosition })` | `await card.dragTo(col, { targetPosition: { x: 50, y: 50 } })` |
| Manual drag start | `locator.hover() + page.mouse.down()` | `await card.hover(); await page.mouse.down()` |
| Manual drag move | `locator.hover()` (while mouse is down) | `await target.hover()` |
| Manual drag end | `page.mouse.up()` | `await page.mouse.up()` |
| Check class | `expect(locator).toHaveClass(regex)` | `await expect(col).toHaveClass(/drag-over/)` |
| Check child exists | `parent.getByTestId(id)` | `await expect(col.getByTestId('card-x')).toBeVisible()` |

### Cypress Drag and Drop

| Action | Method | Example |
|--------|--------|---------|
| Start drag | `.trigger('dragstart', { dataTransfer })` | `cy.get(card).trigger('dragstart', { dataTransfer })` |
| Hover over target | `.trigger('dragover', { dataTransfer })` | `cy.get(col).trigger('dragover', { dataTransfer })` |
| Drop on target | `.trigger('drop', { dataTransfer })` | `cy.get(col).trigger('drop', { dataTransfer })` |
| End drag | `.trigger('dragend', { dataTransfer })` | `cy.get(card).trigger('dragend', { dataTransfer })` |
| Check class | `.should('have.class', name)` | `cy.get(col).should('have.class', 'drag-over')` |
| Find child | `.find(selector)` | `cy.get(col).find('[data-testid="card-x"]')` |
