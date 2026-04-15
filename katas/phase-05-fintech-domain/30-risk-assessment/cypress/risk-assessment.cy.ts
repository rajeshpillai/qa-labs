const PLAYGROUND = '/phase-05-fintech-domain/30-risk-assessment/playground/';

// ─── Helper: setScore ────────────────────────────────────────────────
// Changes a risk factor's score and triggers recalculation.
// .clear() removes existing text, .type() enters the new value.
// .trigger('change') fires the onchange handler to recalculate.
function setScore(factorId: string, score: string) {
  cy.get(`[data-testid="score-${factorId}"]`).clear().type(score).trigger('change');
}

describe('Kata 30: Risk Assessment', () => {

  beforeEach(() => {
    cy.visit(PLAYGROUND);
  });

  // --------------------------------------------------------------------------
  // Exercise 1: Verify Risk Table Data
  // --------------------------------------------------------------------------
  it('exercise 1: verify risk table data', () => {
    // Verify the table is visible.
    cy.get('[data-testid="risk-table"]').should('be.visible');

    // Verify default score values.
    // .should('have.value', val) checks an input's value.
    cy.get('[data-testid="score-identity"]').should('have.value', '15');
    cy.get('[data-testid="score-credit"]').should('have.value', '20');
    cy.get('[data-testid="score-employment"]').should('have.value', '10');
    cy.get('[data-testid="score-address"]').should('have.value', '5');
    cy.get('[data-testid="score-sanctions"]').should('have.value', '0');

    // Verify weights.
    cy.get('[data-testid="weight-identity"]').should('have.text', '0.25');
    cy.get('[data-testid="weight-credit"]').should('have.text', '0.20');
    cy.get('[data-testid="weight-employment"]').should('have.text', '0.20');
    cy.get('[data-testid="weight-address"]').should('have.text', '0.15');
    cy.get('[data-testid="weight-sanctions"]').should('have.text', '0.20');

    // Verify weighted scores.
    cy.get('[data-testid="weighted-identity"]').should('have.text', '3.75');
    cy.get('[data-testid="weighted-credit"]').should('have.text', '4.00');
    cy.get('[data-testid="weighted-employment"]').should('have.text', '2.00');
    cy.get('[data-testid="weighted-address"]').should('have.text', '0.75');
    cy.get('[data-testid="weighted-sanctions"]').should('have.text', '0.00');
  });

  // --------------------------------------------------------------------------
  // Exercise 2: Verify Computed Total
  // --------------------------------------------------------------------------
  it('exercise 2: verify computed total', () => {
    // Total = 3.75 + 4.00 + 2.00 + 0.75 + 0.00 = 10.50.
    cy.get('[data-testid="total-score"]').should('have.text', '10.50');

    // Risk level should be "Low" (< 30).
    cy.get('[data-testid="total-level"]')
      .should('have.text', 'Low')
      .and('have.class', 'risk-low');
  });

  // --------------------------------------------------------------------------
  // Exercise 3: Change a Score and Verify Recalculation
  // --------------------------------------------------------------------------
  it('exercise 3: change a score and verify recalculation', () => {
    // Change Identity to 80.
    setScore('identity', '80');

    // Weighted = 80 * 0.25 = 20.00.
    cy.get('[data-testid="weighted-identity"]').should('have.text', '20.00');

    // New total = 20.00 + 4.00 + 2.00 + 0.75 + 0.00 = 26.75.
    cy.get('[data-testid="total-score"]').should('have.text', '26.75');

    // Identity level is "High" (80 > 70).
    cy.get('[data-testid="level-identity"]')
      .should('have.text', 'High')
      .and('have.class', 'risk-high');
  });

  // --------------------------------------------------------------------------
  // Exercise 4: Verify Auto-Approve Threshold
  // --------------------------------------------------------------------------
  it('exercise 4: verify auto-approve threshold', () => {
    // Default total 10.50 < 30 => Auto-Approve.
    cy.get('[data-testid="action-title"]').should('have.text', 'Auto-Approve');
    cy.get('[data-testid="action-description"]')
      .should('contain.text', 'automatically approved');
    cy.get('[data-testid="action-card"]').should('have.class', 'result-auto-approve');
  });

  // --------------------------------------------------------------------------
  // Exercise 5: Verify Manual Review Threshold
  // --------------------------------------------------------------------------
  it('exercise 5: verify manual review threshold', () => {
    // Set Identity=80, Credit=80 => total=38.75 (30-70 range).
    setScore('identity', '80');
    setScore('credit', '80');

    cy.get('[data-testid="total-score"]').should('have.text', '38.75');
    cy.get('[data-testid="action-title"]').should('have.text', 'Manual Review');
    cy.get('[data-testid="action-description"]').should('contain.text', 'manual review');
    cy.get('[data-testid="action-card"]').should('have.class', 'result-manual-review');
  });

  // --------------------------------------------------------------------------
  // Exercise 6: Verify Auto-Reject Threshold
  // --------------------------------------------------------------------------
  it('exercise 6: verify auto-reject threshold', () => {
    // Set all scores to 90 => total=90.00 (> 70).
    ['identity', 'credit', 'employment', 'address', 'sanctions'].forEach(id => {
      setScore(id, '90');
    });

    cy.get('[data-testid="total-score"]').should('have.text', '90.00');
    cy.get('[data-testid="action-title"]').should('have.text', 'Auto-Reject');
    cy.get('[data-testid="action-description"]').should('contain.text', 'automatically rejected');
    cy.get('[data-testid="action-card"]').should('have.class', 'result-auto-reject');
  });

  // --------------------------------------------------------------------------
  // Exercise 7: Override Score and Verify Action Changes
  // --------------------------------------------------------------------------
  it('exercise 7: override score and verify action changes', () => {
    // Start: Auto-Approve.
    cy.get('[data-testid="action-title"]').should('have.text', 'Auto-Approve');

    // Move to Manual Review.
    setScore('identity', '80');
    setScore('credit', '80');
    cy.get('[data-testid="action-title"]').should('have.text', 'Manual Review');

    // Move to Auto-Reject.
    setScore('employment', '100');
    setScore('address', '100');
    setScore('sanctions', '100');
    cy.get('[data-testid="action-title"]').should('have.text', 'Auto-Reject');

    // Reset back to Auto-Approve.
    cy.get('[data-testid="btn-reset"]').click();
    cy.get('[data-testid="action-title"]').should('have.text', 'Auto-Approve');
    cy.get('[data-testid="total-score"]').should('have.text', '10.50');
  });

  // --------------------------------------------------------------------------
  // Exercise 8: Verify Color Coding Matches Risk Level
  // --------------------------------------------------------------------------
  it('exercise 8: verify color coding matches risk level', () => {
    // Set Identity=10 (Low), Credit=50 (Medium), Sanctions=80 (High).
    setScore('identity', '10');
    setScore('credit', '50');
    setScore('sanctions', '80');

    // Identity: Low.
    cy.get('[data-testid="level-identity"]')
      .should('have.text', 'Low')
      .and('have.class', 'risk-low');

    // Credit: Medium.
    cy.get('[data-testid="level-credit"]')
      .should('have.text', 'Medium')
      .and('have.class', 'risk-medium');

    // Sanctions: High.
    cy.get('[data-testid="level-sanctions"]')
      .should('have.text', 'High')
      .and('have.class', 'risk-high');

    // Verify export works.
    cy.get('[data-testid="btn-export"]').click();
    cy.get('[data-testid="export-section"]').should('be.visible');
    cy.get('[data-testid="export-content"]').should('contain.text', '"action"');
  });
});
