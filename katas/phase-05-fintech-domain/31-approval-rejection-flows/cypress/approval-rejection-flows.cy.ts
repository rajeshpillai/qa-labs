const PLAYGROUND = '/phase-05-fintech-domain/31-approval-rejection-flows/playground/';

describe('Kata 31: Approval & Rejection Flows', () => {

  beforeEach(() => {
    cy.visit(PLAYGROUND);
  });

  // --------------------------------------------------------------------------
  // Exercise 1: Approve Application and Verify Status Change
  // --------------------------------------------------------------------------
  it('exercise 1: approve application and verify status change', () => {
    // Verify initial pending status.
    cy.get('[data-testid="status-APP-001"]').should('have.text', 'Pending');

    // Click Approve for APP-001.
    cy.get('[data-testid="btn-approve-APP-001"]').click();

    // Verify the approval dialog is visible.
    // .should('be.visible') checks the element is displayed.
    cy.get('[data-testid="approve-dialog"]').should('be.visible');

    // Verify dialog text mentions the applicant.
    cy.get('[data-testid="approve-dialog-text"]').should('contain.text', 'Alice Johnson');

    // Confirm approval.
    cy.get('[data-testid="approve-dialog-confirm"]').click();

    // Verify dialog closes.
    cy.get('[data-testid="approve-dialog"]').should('not.be.visible');

    // Verify status changed to "Approved".
    cy.get('[data-testid="status-APP-001"]').should('have.text', 'Approved');
    cy.get('[data-testid="app-card-APP-001"]').should('have.class', 'status-approved');

    // Verify action buttons are gone.
    cy.get('[data-testid="btn-approve-APP-001"]').should('not.exist');
  });

  // --------------------------------------------------------------------------
  // Exercise 2: Reject With Reason
  // --------------------------------------------------------------------------
  it('exercise 2: reject with reason', () => {
    // Click Reject for APP-002.
    cy.get('[data-testid="btn-reject-APP-002"]').click();

    // Verify the dialog appears.
    cy.get('[data-testid="reject-dialog"]').should('be.visible');

    // Type a rejection reason.
    // cy.get().type() types text into the textarea.
    cy.get('[data-testid="reject-reason"]').type('Insufficient documentation provided');

    // Confirm rejection.
    cy.get('[data-testid="reject-dialog-confirm"]').click();

    // Verify dialog closes and status changed.
    cy.get('[data-testid="reject-dialog"]').should('not.be.visible');
    cy.get('[data-testid="status-APP-002"]').should('have.text', 'Rejected');
    cy.get('[data-testid="app-card-APP-002"]').should('have.class', 'status-rejected');
  });

  // --------------------------------------------------------------------------
  // Exercise 3: Escalate Application
  // --------------------------------------------------------------------------
  it('exercise 3: escalate application', () => {
    // Click Escalate for APP-003.
    cy.get('[data-testid="btn-escalate-APP-003"]').click();

    // Verify dialog appears.
    cy.get('[data-testid="escalate-dialog"]').should('be.visible');

    // Add notes.
    cy.get('[data-testid="escalate-notes"]').type('High risk score requires senior review');

    // Confirm.
    cy.get('[data-testid="escalate-dialog-confirm"]').click();

    // Verify dialog closes and status changed.
    cy.get('[data-testid="escalate-dialog"]').should('not.be.visible');
    cy.get('[data-testid="status-APP-003"]').should('have.text', 'Escalated');
    cy.get('[data-testid="app-card-APP-003"]').should('have.class', 'status-escalated');
  });

  // --------------------------------------------------------------------------
  // Exercise 4: Verify Action History
  // --------------------------------------------------------------------------
  it('exercise 4: verify action history', () => {
    // Approve APP-001.
    cy.get('[data-testid="btn-approve-APP-001"]').click();
    cy.get('[data-testid="approve-dialog-confirm"]').click();

    // Reject APP-002.
    cy.get('[data-testid="btn-reject-APP-002"]').click();
    cy.get('[data-testid="reject-reason"]').type('Failed identity check');
    cy.get('[data-testid="reject-dialog-confirm"]').click();

    // Verify the history list has 2 entries.
    // .should('have.length', n) checks the number of matched elements.
    cy.get('[data-testid^="history-item-"]').should('have.length', 2);

    // Verify history content.
    cy.get('[data-testid="history-list"]').should('contain.text', 'Approved');
    cy.get('[data-testid="history-list"]').should('contain.text', 'Alice Johnson');
    cy.get('[data-testid="history-list"]').should('contain.text', 'Rejected');
    cy.get('[data-testid="history-list"]').should('contain.text', 'Bob Williams');
    cy.get('[data-testid="history-list"]').should('contain.text', 'Failed identity check');
  });

  // --------------------------------------------------------------------------
  // Exercise 5: Bulk Select and Approve
  // --------------------------------------------------------------------------
  it('exercise 5: bulk select and approve', () => {
    // Click "Select All".
    // .check() checks a checkbox element.
    cy.get('[data-testid="select-all"]').check();

    // Verify selected count.
    cy.get('[data-testid="selected-count"]').should('have.text', '5 selected');

    // Verify bulk approve is enabled.
    cy.get('[data-testid="btn-bulk-approve"]').should('not.be.disabled');

    // Bulk approve.
    cy.get('[data-testid="btn-bulk-approve"]').click();

    // Verify all apps are approved.
    ['APP-001', 'APP-002', 'APP-003', 'APP-004', 'APP-005'].forEach(id => {
      cy.get(`[data-testid="status-${id}"]`).should('have.text', 'Approved');
    });

    // Verify history has bulk entries.
    cy.get('[data-testid="history-list"]').should('contain.text', 'Approved (Bulk)');
  });

  // --------------------------------------------------------------------------
  // Exercise 6: Verify Confirmation Dialog
  // --------------------------------------------------------------------------
  it('exercise 6: verify confirmation dialog', () => {
    // Open dialog.
    cy.get('[data-testid="btn-approve-APP-001"]').click();

    // Verify dialog content.
    cy.get('[data-testid="approve-dialog"]').should('be.visible');
    cy.get('[data-testid="approve-dialog-text"]')
      .should('contain.text', 'Alice Johnson')
      .and('contain.text', 'APP-001');

    // Cancel.
    cy.get('[data-testid="approve-dialog-cancel"]').click();

    // Verify dialog closes and status unchanged.
    cy.get('[data-testid="approve-dialog"]').should('not.be.visible');
    cy.get('[data-testid="status-APP-001"]').should('have.text', 'Pending');
    cy.get('[data-testid="btn-approve-APP-001"]').should('be.visible');
  });

  // --------------------------------------------------------------------------
  // Exercise 7: Verify Rejection Requires Reason
  // --------------------------------------------------------------------------
  it('exercise 7: verify rejection requires reason', () => {
    // Open rejection dialog.
    cy.get('[data-testid="btn-reject-APP-002"]').click();
    cy.get('[data-testid="reject-dialog"]').should('be.visible');

    // Try to reject without a reason.
    cy.get('[data-testid="reject-dialog-confirm"]').click();

    // Verify error message appears.
    cy.get('[data-testid="reject-error"]')
      .should('be.visible')
      .and('have.text', 'Rejection reason is required');

    // Verify dialog is still open.
    cy.get('[data-testid="reject-dialog"]').should('be.visible');

    // Now enter a reason and submit.
    cy.get('[data-testid="reject-reason"]').type('Documents are forged');
    cy.get('[data-testid="reject-dialog-confirm"]').click();

    // Verify success.
    cy.get('[data-testid="reject-dialog"]').should('not.be.visible');
    cy.get('[data-testid="status-APP-002"]').should('have.text', 'Rejected');
  });

  // --------------------------------------------------------------------------
  // Exercise 8: Filter by Status
  // --------------------------------------------------------------------------
  it('exercise 8: filter by status', () => {
    // Approve APP-001.
    cy.get('[data-testid="btn-approve-APP-001"]').click();
    cy.get('[data-testid="approve-dialog-confirm"]').click();

    // Reject APP-002.
    cy.get('[data-testid="btn-reject-APP-002"]').click();
    cy.get('[data-testid="reject-reason"]').type('Duplicate application');
    cy.get('[data-testid="reject-dialog-confirm"]').click();

    // Filter by "Pending" — should show 3 apps.
    // .select(value) selects the option with the matching value attribute.
    cy.get('[data-testid="filter-status"]').select('pending');
    cy.get('[data-testid="filter-count"]').should('have.text', 'Showing 3 of 5');
    cy.get('[data-testid="app-card-APP-001"]').should('not.exist');
    cy.get('[data-testid="app-card-APP-003"]').should('be.visible');

    // Filter by "Approved" — should show 1.
    cy.get('[data-testid="filter-status"]').select('approved');
    cy.get('[data-testid="filter-count"]').should('have.text', 'Showing 1 of 5');
    cy.get('[data-testid="app-card-APP-001"]').should('be.visible');

    // Filter by "Rejected" — should show 1.
    cy.get('[data-testid="filter-status"]').select('rejected');
    cy.get('[data-testid="filter-count"]').should('have.text', 'Showing 1 of 5');
    cy.get('[data-testid="app-card-APP-002"]').should('be.visible');

    // Filter by "All" — should show 5.
    cy.get('[data-testid="filter-status"]').select('all');
    cy.get('[data-testid="filter-count"]').should('have.text', 'Showing 5 of 5');
  });
});
