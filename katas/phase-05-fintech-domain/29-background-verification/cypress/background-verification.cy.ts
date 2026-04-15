const PLAYGROUND = '/phase-05-fintech-domain/29-background-verification/playground/';

describe('Kata 29: Background Verification', () => {

  beforeEach(() => {
    cy.visit(PLAYGROUND);
  });

  // --------------------------------------------------------------------------
  // Exercise 1: Verify Initial Pending States
  // --------------------------------------------------------------------------
  // Before starting checks, verify all five checks show "Pending".
  it('exercise 1: verify initial pending states', () => {
    // Verify all five checks show "Pending".
    // .should('have.text', text) checks the element's text content.
    const checkIds = ['criminal', 'credit', 'employment', 'education', 'reference'];
    checkIds.forEach(id => {
      cy.get(`[data-testid="check-${id}-status"]`).should('have.text', 'Pending');
    });

    // Verify progress is at 0%.
    cy.get('[data-testid="progress-percentage"]').should('have.text', '0%');
    cy.get('[data-testid="checks-completed"]').should('have.text', '0 / 5');

    // Verify overall status.
    cy.get('[data-testid="overall-status"]').should('have.text', 'Not Started');

    // Verify start button is enabled.
    cy.get('[data-testid="btn-start-checks"]').should('not.be.disabled');
  });

  // --------------------------------------------------------------------------
  // Exercise 2: Wait for First Check to Complete
  // --------------------------------------------------------------------------
  // Start checks and wait for Criminal Record to complete.
  it('exercise 2: wait for first check to complete', () => {
    cy.get('[data-testid="btn-start-checks"]').click();

    // Should first transition to "In Progress".
    // .should() retries automatically until the assertion passes.
    cy.get('[data-testid="check-criminal-status"]', { timeout: 3000 })
      .should('have.text', 'In Progress');

    // Then complete after ~2 seconds.
    cy.get('[data-testid="check-criminal-status"]', { timeout: 5000 })
      .should('have.text', 'Complete');

    // Verify detail text updated.
    cy.get('[data-testid="check-criminal-detail"]')
      .should('have.text', 'No records found');
  });

  // --------------------------------------------------------------------------
  // Exercise 3: Verify Progress Bar Updates
  // --------------------------------------------------------------------------
  // Verify progress increases as checks complete.
  it('exercise 3: verify progress bar updates', () => {
    cy.get('[data-testid="btn-start-checks"]').click();

    // After first check: 20%.
    cy.get('[data-testid="progress-percentage"]', { timeout: 5000 })
      .should('have.text', '20%');

    // After two checks: 40%.
    cy.get('[data-testid="progress-percentage"]', { timeout: 8000 })
      .should('have.text', '40%');

    // Verify progress bar fill has non-zero width via inline style.
    // .should('have.attr', 'style') checks the element's style attribute.
    cy.get('[data-testid="progress-bar-fill"]')
      .should('have.attr', 'style')
      .and('contain', '40%');
  });

  // --------------------------------------------------------------------------
  // Exercise 4: Verify All Checks Complete
  // --------------------------------------------------------------------------
  // Wait for all five checks to finish.
  it('exercise 4: verify all checks complete', () => {
    cy.get('[data-testid="btn-start-checks"]').click();

    // Wait for 100% progress. Total ~11.5s, so use 15s timeout.
    // { timeout: 15000 } gives Cypress up to 15 seconds to retry.
    cy.get('[data-testid="progress-percentage"]', { timeout: 15000 })
      .should('have.text', '100%');

    // Verify completed count.
    cy.get('[data-testid="checks-completed"]').should('have.text', '5 / 5');

    // Verify each check's final status.
    cy.get('[data-testid="check-criminal-status"]').should('have.text', 'Complete');
    cy.get('[data-testid="check-credit-status"]').should('have.text', 'Complete');
    cy.get('[data-testid="check-employment-status"]').should('have.text', 'Complete');
    cy.get('[data-testid="check-education-status"]').should('have.text', 'Failed');
    cy.get('[data-testid="check-reference-status"]').should('have.text', 'Complete');
  });

  // --------------------------------------------------------------------------
  // Exercise 5: Handle Failed Check
  // --------------------------------------------------------------------------
  // Verify the Education check fails with the correct status and styling.
  it('exercise 5: handle failed check', () => {
    cy.get('[data-testid="btn-start-checks"]').click();

    // Wait for education to fail (~9.5s cumulative).
    cy.get('[data-testid="check-education-status"]', { timeout: 12000 })
      .should('have.text', 'Failed');

    // Verify the check item has the "failed" CSS class.
    // .should('have.class', name) checks for a specific CSS class.
    cy.get('[data-testid="check-education"]').should('have.class', 'failed');

    // Verify failure detail text.
    cy.get('[data-testid="check-education-detail"]')
      .should('have.text', 'Could not verify degree');
  });

  // --------------------------------------------------------------------------
  // Exercise 6: Verify Estimated Time Updates
  // --------------------------------------------------------------------------
  // Verify the estimated time decreases and reaches "0s".
  it('exercise 6: verify estimated time updates', () => {
    // Before starting: "--".
    cy.get('[data-testid="estimated-time"]').should('have.text', '--');

    // Start checks.
    cy.get('[data-testid="btn-start-checks"]').click();

    // Should no longer be "--".
    cy.get('[data-testid="estimated-time"]', { timeout: 2000 })
      .should('not.have.text', '--');

    // Read initial value and verify it's > 0.
    cy.get('[data-testid="estimated-time"]').invoke('text').then((text) => {
      const seconds = parseInt(text);
      expect(seconds).to.be.greaterThan(0);
    });

    // Wait for all checks, then verify "0s".
    cy.get('[data-testid="estimated-time"]', { timeout: 15000 })
      .should('have.text', '0s');
  });

  // --------------------------------------------------------------------------
  // Exercise 7: Verify Overall Status Changes
  // --------------------------------------------------------------------------
  // Verify status transitions through all phases.
  it('exercise 7: verify overall status changes', () => {
    // Initial: "Not Started".
    cy.get('[data-testid="overall-status"]')
      .should('have.text', 'Not Started')
      .and('have.class', 'overall-pending');

    // Start checks.
    cy.get('[data-testid="btn-start-checks"]').click();

    // "In Progress".
    cy.get('[data-testid="overall-status"]')
      .should('have.text', 'In Progress')
      .and('have.class', 'overall-in-progress');

    // Final: "Completed with Issues" (because education fails).
    cy.get('[data-testid="overall-status"]', { timeout: 15000 })
      .should('have.text', 'Completed with Issues')
      .and('have.class', 'overall-failed');
  });

  // --------------------------------------------------------------------------
  // Exercise 8: Complete Full Background Check Flow
  // --------------------------------------------------------------------------
  // Start, wait for all, verify everything.
  it('exercise 8: complete full background check flow', () => {
    cy.get('[data-testid="btn-start-checks"]').click();

    // Wait for 100%.
    cy.get('[data-testid="progress-percentage"]', { timeout: 15000 })
      .should('have.text', '100%');

    // Verify each check result.
    const expected = [
      { id: 'criminal', status: 'Complete', detail: 'No records found' },
      { id: 'credit', status: 'Complete', detail: 'Score: 750 (Good)' },
      { id: 'employment', status: 'Complete', detail: 'Verified: 3 employers' },
      { id: 'education', status: 'Failed', detail: 'Could not verify degree' },
      { id: 'reference', status: 'Complete', detail: '2 of 2 references confirmed' }
    ];

    expected.forEach(check => {
      cy.get(`[data-testid="check-${check.id}-status"]`).should('have.text', check.status);
      cy.get(`[data-testid="check-${check.id}-detail"]`).should('have.text', check.detail);
    });

    // Verify progress.
    cy.get('[data-testid="checks-completed"]').should('have.text', '5 / 5');
    cy.get('[data-testid="estimated-time"]').should('have.text', '0s');

    // Verify overall status.
    cy.get('[data-testid="overall-status"]').should('have.text', 'Completed with Issues');
  });
});
