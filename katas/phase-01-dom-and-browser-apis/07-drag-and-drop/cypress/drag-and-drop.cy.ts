const PLAYGROUND = '/phase-01-dom-and-browser-apis/07-drag-and-drop/playground/';

describe('Kata 07: Drag and Drop', () => {

  // beforeEach runs before every test in this describe block.
  // We navigate to the playground page so each test starts fresh.
  beforeEach(() => {
    cy.visit(PLAYGROUND);
  });

  // --------------------------------------------------------------------------
  // Helper: Perform an HTML5 drag-and-drop from source to target.
  // --------------------------------------------------------------------------
  // Cypress does NOT have a built-in drag-and-drop command. We must manually
  // trigger the HTML5 Drag and Drop events in sequence. This helper function
  // encapsulates that pattern so each test can use it simply.
  //
  // The sequence is:
  //   1. dragstart on source — tells the browser "this element is being dragged"
  //   2. dragover on target  — required to allow dropping (calls preventDefault)
  //   3. drop on target      — performs the drop action
  //   4. dragend on source   — cleans up the drag state
  //
  // We create a DataTransfer object and share it between all events so that
  // data set in dragstart (via setData) is available in drop (via getData).
  function dragAndDrop(sourceSelector: string, targetSelector: string) {
    // Create a new DataTransfer object. This is the browser's built-in API
    // for carrying data between drag events. We pass it to each trigger()
    // call so all events share the same data.
    const dataTransfer = new DataTransfer();

    // Step 1: Fire dragstart on the source element.
    // trigger(eventName, options) dispatches a DOM event on the element.
    // { dataTransfer } passes our DataTransfer as part of the event.
    cy.get(sourceSelector).trigger('dragstart', { dataTransfer });

    // Step 2: Fire dragover on the target to allow dropping.
    // Without this, the browser won't allow the drop event to fire.
    cy.get(targetSelector).trigger('dragover', { dataTransfer });

    // Step 3: Fire drop on the target to perform the drop action.
    // The drop handler in our playground moves the card into this column.
    cy.get(targetSelector).trigger('drop', { dataTransfer });

    // Step 4: Fire dragend on the source to clean up.
    // This removes the 'dragging' CSS class and resets drag state.
    cy.get(sourceSelector).trigger('dragend', { dataTransfer });
  }

  // --------------------------------------------------------------------------
  // Exercise 1: Drag a Card from "New" to "In Review"
  // --------------------------------------------------------------------------
  // This exercise demonstrates the trigger-based drag-and-drop pattern in
  // Cypress by moving a KYC card between kanban columns.
  it('exercise 1: drag a card from New to In Review', () => {
    // Verify no action has been taken yet.
    cy.get('[data-testid="last-action"]').should('have.text', 'None');

    // Perform the drag-and-drop using our helper.
    dragAndDrop('[data-testid="card-aisha"]', '[data-testid="column-review"]');

    // Verify the status bar reports the drag action.
    // .should('contain.text', str) checks if textContent contains the string.
    cy.get('[data-testid="last-action"]').should('contain.text', 'aisha');
    cy.get('[data-testid="last-action"]').should('contain.text', 'review');
  });

  // --------------------------------------------------------------------------
  // Exercise 2: Verify Card Moved to Target Column
  // --------------------------------------------------------------------------
  // After dragging, we verify the card is a DOM child of the target column.
  it('exercise 2: verify card is inside the target column after drag', () => {
    // Verify the card is initially in the New column.
    // find(selector) searches within the subject element's descendants.
    cy.get('[data-testid="column-new"]')
      .find('[data-testid="card-aisha"]')
      .should('exist');

    // Drag the card to In Review.
    dragAndDrop('[data-testid="card-aisha"]', '[data-testid="column-review"]');

    // Verify the card is now inside the In Review column.
    // find() scopes the search to descendants of the Review column only.
    cy.get('[data-testid="column-review"]')
      .find('[data-testid="card-aisha"]')
      .should('exist')
      .and('be.visible');

    // Verify the card is no longer in the New column.
    // .should('not.exist') asserts the element is not in the DOM subtree.
    cy.get('[data-testid="column-new"]')
      .find('[data-testid="card-aisha"]')
      .should('not.exist');
  });

  // --------------------------------------------------------------------------
  // Exercise 3: Drag a Card to "Approved" Column
  // --------------------------------------------------------------------------
  it('exercise 3: drag a card to the Approved column', () => {
    // Verify the Approved column starts empty (count = 0).
    cy.get('[data-testid="count-approved"]').should('have.text', '0');

    // Drag "Clara Jansen" to the Approved column.
    dragAndDrop('[data-testid="card-clara"]', '[data-testid="column-approved"]');

    // Verify the card is now in the Approved column.
    cy.get('[data-testid="column-approved"]')
      .find('[data-testid="card-clara"]')
      .should('exist');

    // Verify the Approved column count updated to 1.
    cy.get('[data-testid="count-approved"]').should('have.text', '1');
  });

  // --------------------------------------------------------------------------
  // Exercise 4: Drag a Card to "Rejected" Column
  // --------------------------------------------------------------------------
  it('exercise 4: drag a card to the Rejected column', () => {
    // Verify the Rejected column starts empty.
    cy.get('[data-testid="count-rejected"]').should('have.text', '0');

    // Drag "Ben Okafor" to the Rejected column.
    dragAndDrop('[data-testid="card-ben"]', '[data-testid="column-rejected"]');

    // Verify the card is in the Rejected column.
    cy.get('[data-testid="column-rejected"]')
      .find('[data-testid="card-ben"]')
      .should('exist');

    // Verify the Rejected column count updated.
    cy.get('[data-testid="count-rejected"]').should('have.text', '1');
  });

  // --------------------------------------------------------------------------
  // Exercise 5: Verify Source Column Card Count Decreases
  // --------------------------------------------------------------------------
  // This exercise moves multiple cards and checks all column counts.
  it('exercise 5: verify column counts update after moving cards', () => {
    // Verify initial counts.
    cy.get('[data-testid="count-new"]').should('have.text', '3');
    cy.get('[data-testid="count-review"]').should('have.text', '1');

    // Move all three cards out of New.
    dragAndDrop('[data-testid="card-aisha"]', '[data-testid="column-review"]');
    dragAndDrop('[data-testid="card-ben"]', '[data-testid="column-rejected"]');
    dragAndDrop('[data-testid="card-clara"]', '[data-testid="column-approved"]');

    // Verify New column now has 0 cards.
    cy.get('[data-testid="count-new"]').should('have.text', '0');

    // Verify target columns have correct counts.
    // Review: 1 (Derek) + 1 (Aisha) = 2
    cy.get('[data-testid="count-review"]').should('have.text', '2');
    // Rejected: 0 + 1 (Ben) = 1
    cy.get('[data-testid="count-rejected"]').should('have.text', '1');
    // Approved: 0 + 1 (Clara) = 1
    cy.get('[data-testid="count-approved"]').should('have.text', '1');
  });

  // --------------------------------------------------------------------------
  // Exercise 6: Reorder Items Within the Sortable List
  // --------------------------------------------------------------------------
  // This exercise demonstrates reordering items within a single list
  // using the same trigger-based drag pattern.
  it('exercise 6: reorder items within the sortable priority list', () => {
    // Verify the initial order.
    cy.get('[data-testid="priority-order"]').should(
      'have.text',
      'sanctions, identity, address, income'
    );

    // Drag "Income Verification" (last item) onto "Sanctions Screening" (first item).
    // This reorders the list, placing income before sanctions.
    dragAndDrop('[data-testid="priority-income"]', '[data-testid="priority-sanctions"]');

    // Verify that "income" now appears before "sanctions" in the order string.
    cy.get('[data-testid="priority-order"]').invoke('text').then((text) => {
      // indexOf(str) returns the position of the first occurrence of str.
      // We verify income's position is earlier than sanctions' position.
      expect(text.indexOf('income')).to.be.lessThan(text.indexOf('sanctions'));
    });
  });

  // --------------------------------------------------------------------------
  // Exercise 7: Verify Drop Zone Highlights During Drag
  // --------------------------------------------------------------------------
  // This exercise checks that the CSS class 'drag-over' is applied to a
  // column when a dragged card hovers over it.
  it('exercise 7: verify drop zone highlight during drag', () => {
    // Verify the column does NOT have the drag-over class initially.
    // .should('not.have.class', name) checks the element's classList.
    cy.get('[data-testid="column-approved"]').should('not.have.class', 'drag-over');

    // Create a shared DataTransfer for the drag events.
    const dataTransfer = new DataTransfer();

    // Start the drag on the card.
    cy.get('[data-testid="card-aisha"]').trigger('dragstart', { dataTransfer });

    // Trigger dragover on the Approved column — this adds the highlight class.
    cy.get('[data-testid="column-approved"]').trigger('dragover', { dataTransfer });

    // Verify the column now has the 'drag-over' class.
    // .should('have.class', name) asserts the element's classList contains name.
    cy.get('[data-testid="column-approved"]').should('have.class', 'drag-over');

    // Complete the drag by dropping (which removes the highlight).
    cy.get('[data-testid="column-approved"]').trigger('drop', { dataTransfer });
    cy.get('[data-testid="card-aisha"]').trigger('dragend', { dataTransfer });

    // Verify the highlight class is removed after drop.
    cy.get('[data-testid="column-approved"]').should('not.have.class', 'drag-over');
  });

  // --------------------------------------------------------------------------
  // Exercise 8: Drag Back from Rejected to New
  // --------------------------------------------------------------------------
  // This exercise verifies cards can be moved back to their original column.
  it('exercise 8: drag a card from Rejected back to New', () => {
    // First, move "Ben Okafor" to the Rejected column.
    dragAndDrop('[data-testid="card-ben"]', '[data-testid="column-rejected"]');

    // Verify it's in Rejected.
    cy.get('[data-testid="column-rejected"]')
      .find('[data-testid="card-ben"]')
      .should('exist');
    cy.get('[data-testid="count-new"]').should('have.text', '2');
    cy.get('[data-testid="count-rejected"]').should('have.text', '1');

    // Now drag it back to New.
    dragAndDrop('[data-testid="card-ben"]', '[data-testid="column-new"]');

    // Verify it's back in New.
    cy.get('[data-testid="column-new"]')
      .find('[data-testid="card-ben"]')
      .should('exist');

    // Verify counts restored.
    cy.get('[data-testid="count-new"]').should('have.text', '3');
    cy.get('[data-testid="count-rejected"]').should('have.text', '0');

    // Verify the status bar shows the return move.
    cy.get('[data-testid="last-action"]').should('contain.text', 'ben');
    cy.get('[data-testid="last-action"]').should('contain.text', 'new');
  });

});
