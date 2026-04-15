# Kata 30: Risk Assessment

## What You Will Learn

- How to test data tables with computed values
- How to verify recalculation when input values change
- How to test threshold-based conditional logic (auto-approve, manual review, auto-reject)
- How to verify color-coded risk indicators match their values
- How to test override/edit workflows on computed data
- How to verify export functionality
- How to assert on precise numeric computations (weighted scores)

## Prerequisites

- Completed Katas 1-29
- Understanding of form inputs and value assertions
- Familiarity with table element testing

## Concepts Explained

### Risk Scorecard Pattern

```
A risk scorecard assigns scores to multiple risk factors, each with
a weight. The total risk score determines the recommended action:

  Factor           Score (0-100)   Weight   Weighted
  Identity             15          0.25      3.75
  Credit               20          0.20      4.00
  Employment           10          0.20      2.00
  Address               5          0.15      0.75
  Sanctions             0          0.20      0.00
                                   ----     -----
  Total                            1.00     10.50

Thresholds:
  < 30  => Auto-Approve (low risk)
  30-70 => Manual Review (medium risk)
  > 70  => Auto-Reject (high risk)

Testing must verify:
  - Weighted scores are calculated correctly
  - Total is the sum of all weighted scores
  - Action changes when the total crosses a threshold
  - Color coding matches the risk level
```

### Testing Computed Values

```
When a user changes a score input, the weighted score, total, risk
level, and action all recalculate. Tests should:

1. Read the initial computed values and verify them
2. Change an input value
3. Verify the weighted score recalculates
4. Verify the total recalculates
5. If the total crossed a threshold, verify the action changed

Playwright:
  await page.getByTestId('score-identity').fill('80');
  // Trigger recalculation (the 'change' event fires on fill).
  await expect(page.getByTestId('weighted-identity')).toHaveText('20.00');

Cypress:
  cy.get('[data-testid="score-identity"]').clear().type('80');
  // Trigger change event to recalculate.
  cy.get('[data-testid="score-identity"]').blur();
  cy.get('[data-testid="weighted-identity"]').should('have.text', '20.00');
```

## Playground

The playground is a risk scorecard dashboard with:

1. **Risk Table** — five risk factors (Identity, Credit, Employment, Address, Sanctions) each with an editable score (0-100), weight, computed weighted score, and color-coded risk level
2. **Total Row** — sum of all weighted scores with overall risk level
3. **Risk Thresholds** — reference section showing the three threshold ranges
4. **Action Card** — shows the recommended action (Auto-Approve, Manual Review, Auto-Reject) based on the total score, with color-coded background
5. **Reset Button** — resets all scores to their default values
6. **Export Button** — generates a JSON report of the current assessment

Default scores: Identity=15, Credit=20, Employment=10, Address=5, Sanctions=0 (total=10.50, Auto-Approve).

## Exercises

### Exercise 1: Verify Risk Table Data
Verify all five risk factors are displayed with correct default scores, weights, and weighted scores.

### Exercise 2: Verify Computed Total
Verify the total weighted score matches the sum of individual weighted scores. Verify the total risk level is "Low".

### Exercise 3: Change a Score and Verify Recalculation
Change the Identity score from 15 to 80. Verify the weighted score updates to 20.00 and the total recalculates.

### Exercise 4: Verify Auto-Approve Threshold
With default scores (total < 30), verify the action card shows "Auto-Approve" with the green styling.

### Exercise 5: Verify Manual Review Threshold
Set scores so the total falls between 30 and 70. Verify the action card changes to "Manual Review" with amber styling.

### Exercise 6: Verify Auto-Reject Threshold
Set scores so the total exceeds 70. Verify the action card changes to "Auto-Reject" with red styling.

### Exercise 7: Override Score and Verify Action Changes
Start with auto-approve, change scores to trigger manual review, then change again to trigger auto-reject. Verify the action updates each time.

### Exercise 8: Verify Color Coding Matches Risk Level
Set different scores for each factor and verify the risk level text ("Low", "Medium", "High") and CSS class match the score value.

## Solutions

### Playwright Solution

See `playwright/risk-assessment.spec.ts`

### Cypress Solution

See `cypress/risk-assessment.cy.ts`

## Common Mistakes

| Mistake | Why it's wrong | Fix |
|---------|---------------|-----|
| Not triggering recalculation after changing a score | The `onchange` event fires when the input loses focus or on Playwright's `fill()` | Use `fill()` (Playwright) or `clear().type().blur()` (Cypress) |
| Checking floating point values with exact equality | Floating point arithmetic can produce tiny rounding differences | Use `toFixed(2)` in assertions or check the displayed text |
| Forgetting the threshold boundaries | 30 is manual review (not auto-approve), 70 is manual review (not auto-reject) | Thresholds: < 30 approve, 30-70 review, > 70 reject |
| Not resetting between tests | Score changes from one test persist if not navigating fresh | Use `page.goto()` or `cy.visit()` in each test |

## Quick Reference

### Playwright Risk Table Testing

| Action | Method | Example |
|--------|--------|---------|
| Change score | `fill()` | `await page.getByTestId('score-identity').fill('50')` |
| Verify weighted | `toHaveText()` | `await expect(el).toHaveText('12.50')` |
| Verify total | `toHaveText()` | `await expect(total).toHaveText('35.00')` |
| Verify CSS class | `toHaveClass()` | `await expect(el).toHaveClass(/risk-medium/)` |
| Verify action | `toHaveText()` | `await expect(title).toHaveText('Manual Review')` |
| Check input value | `toHaveValue()` | `await expect(input).toHaveValue('50')` |

### Cypress Risk Table Testing

| Action | Method | Example |
|--------|--------|---------|
| Change score | `.clear().type().blur()` | `cy.get(input).clear().type('50').blur()` |
| Verify weighted | `.should('have.text')` | `cy.get(el).should('have.text', '12.50')` |
| Verify total | `.should('have.text')` | `cy.get(total).should('have.text', '35.00')` |
| Verify CSS class | `.should('have.class')` | `cy.get(el).should('have.class', 'risk-medium')` |
| Verify action | `.should('have.text')` | `cy.get(title).should('have.text', 'Manual Review')` |
| Check input value | `.should('have.value')` | `cy.get(input).should('have.value', '50')` |
