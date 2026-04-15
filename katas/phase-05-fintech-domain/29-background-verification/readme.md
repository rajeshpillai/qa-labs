# Kata 29: Background Verification

## What You Will Learn

- How to test auto-updating status dashboards (simulating real-time updates)
- How to wait for specific state changes in a multi-item list
- How to verify progress bars update correctly as tasks complete
- How to handle mixed outcomes (some checks pass, some fail)
- How to verify estimated time countdowns
- How to test the overall status derivation from individual check results
- How to use generous timeouts for tests that depend on timed events

## Prerequisites

- Completed Katas 1-28
- Understanding of `setInterval` and `setTimeout` patterns
- Familiarity with auto-retry assertions in Playwright and Cypress

## Concepts Explained

### Auto-Updating Dashboards

```
Background verification dashboards update automatically as each
check completes. In production, this uses WebSockets or polling.
Our playground simulates this with setInterval/setTimeout.

The key testing challenge: items update at unpredictable times.
You must use auto-retrying assertions with generous timeouts
rather than fixed waits.

Pattern:
  1. Start the checks
  2. Wait for specific check statuses to change
  3. Verify the overall progress and status

Since checks run sequentially with cumulative delays:
  Criminal:   ~2s
  Credit:     ~5s (2s + 3s)
  Employment: ~7s (2s + 3s + 2s)
  Education:  ~9.5s (+ 2.5s)
  Reference:  ~11.5s (+ 2s)

Tests should use timeouts of 15-20 seconds for "all complete" assertions.
```

### Testing Progress Bars

```
Progress bars show a visual percentage. Test by:

1. CHECKING THE TEXT PERCENTAGE
   The percentage text (e.g., "60%") is easier to assert than CSS width.

2. CHECKING THE WIDTH STYLE
   The fill element's style.width property reflects the visual progress.
   Use toHaveCSS() (Playwright) or .should('have.css') (Cypress).

3. CHECKING AT MILESTONES
   Verify progress at 0%, after first check (~20%), and at 100%.
```

### Testing Mixed Outcomes

```
The education check is configured to "fail" in the simulation.
This means:
  - Its status badge shows "Failed" with a red background
  - The overall status shows "Completed with Issues" instead of
    "All Checks Passed"
  - 4 of 5 checks pass, 1 fails

Tests should verify both the individual failure and its effect
on the overall status.
```

## Playground

The playground is a background check status tracker with:

1. **Start Button** — triggers all five background checks to run sequentially
2. **Progress Bar** — fills from 0% to 100% as checks complete, with percentage text
3. **Estimated Time** — counts down from the total estimated time
4. **Checks Completed** — shows "X / 5" completed count
5. **Check List** — five individual checks, each with:
   - Name (Criminal Record, Credit Score, Employment, Education, Reference)
   - Detail text (updates with result info when done)
   - Status badge (Pending -> In Progress -> Complete/Failed)
6. **Overall Status** — "Not Started", "In Progress", "All Checks Passed", or "Completed with Issues"

Check timing (cumulative delays):
- Criminal Record: completes at ~2s
- Credit Score: completes at ~5s
- Employment: completes at ~7s
- Education: completes at ~9.5s (FAILS)
- Reference: completes at ~11.5s

## Exercises

### Exercise 1: Verify Initial Pending States
Before starting checks, verify all five checks show "Pending" status and the progress is at 0%.

### Exercise 2: Wait for First Check to Complete
Start the checks and wait for the Criminal Record check to show "Complete". Verify its detail text updates.

### Exercise 3: Verify Progress Bar Updates
Start the checks. After the first check completes, verify the progress shows "20%". Wait for more checks and verify progress increases.

### Exercise 4: Verify All Checks Complete
Start the checks and wait for all five checks to finish. Verify the progress shows "100%" and the completed count shows "5 / 5".

### Exercise 5: Handle Failed Check
Wait for the Education check to complete. Verify its status shows "Failed" and the check item has the failed styling.

### Exercise 6: Verify Estimated Time Updates
Start the checks and verify the estimated time decreases over time. After all checks complete, verify it shows "0s".

### Exercise 7: Verify Overall Status Changes
Verify the overall status transitions from "Not Started" to "In Progress" to "Completed with Issues" (because Education fails).

### Exercise 8: Complete Full Background Check Flow
Start checks, wait for all to complete, verify each individual status, verify the progress bar is at 100%, and verify the overall outcome.

## Solutions

### Playwright Solution

See `playwright/background-verification.spec.ts`

### Cypress Solution

See `cypress/background-verification.cy.ts`

## Common Mistakes

| Mistake | Why it's wrong | Fix |
|---------|---------------|-----|
| Using short timeouts | Checks take up to ~12s total to complete; default 5s timeout will fail | Use `{ timeout: 15000 }` or higher for "all complete" assertions |
| Checking intermediate progress at exact moments | Progress updates are asynchronous; timing is approximate | Wait for the text to match rather than checking at a specific moment |
| Expecting "All Checks Passed" | The education check is designed to fail | Expect "Completed with Issues" as the overall status |
| Not waiting for "In Progress" state | The brief "In Progress" state may be missed if checked too late | Assert "In Progress" immediately after starting, before any check completes |
| Testing checks in parallel order | Checks run sequentially with cumulative delays | Wait for each check in order: criminal, credit, employment, education, reference |

## Quick Reference

### Playwright Background Check Testing

| Action | Method | Example |
|--------|--------|---------|
| Wait for status | `toHaveText()` | `await expect(el).toHaveText('Complete', { timeout: 5000 })` |
| Check progress % | `toHaveText()` | `await expect(el).toHaveText('100%', { timeout: 15000 })` |
| Check CSS class | `toHaveClass()` | `await expect(item).toHaveClass(/completed/)` |
| Check CSS style | `toHaveCSS()` | `await expect(fill).toHaveCSS('width', ...)` |
| Long timeout | `{ timeout: N }` | `await expect(el).toHaveText('5 / 5', { timeout: 15000 })` |

### Cypress Background Check Testing

| Action | Method | Example |
|--------|--------|---------|
| Wait for status | `.should('have.text')` | `cy.get(el, { timeout: 5000 }).should('have.text', 'Complete')` |
| Check progress % | `.should('have.text')` | `cy.get(el, { timeout: 15000 }).should('have.text', '100%')` |
| Check CSS class | `.should('have.class')` | `cy.get(item).should('have.class', 'completed')` |
| Check CSS style | `.should('have.css')` | `cy.get(fill).should('have.css', 'width', ...)` |
| Long timeout | `{ timeout: N }` | `cy.get(el, { timeout: 15000 }).should(...)` |
