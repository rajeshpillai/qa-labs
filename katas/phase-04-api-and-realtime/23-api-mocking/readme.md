# Kata 23: API Mocking

## What You Will Learn

- How to mock API responses with various data to verify UI rendering
- How to simulate error states and verify error handling UI
- How to simulate slow responses and verify loading states
- How to use conditional mocking (different responses for different requests)
- How to track and verify the number of API requests made
- How to mock partial failures (some data succeeds, some fails)

## Prerequisites

- Completed Kata 22 (Network Interception)
- Understanding of page.route() and cy.intercept() fundamentals

## Concepts Explained

### API Mocking vs. Network Interception

```
Network interception (Kata 22) focuses on catching requests and inspecting
what the app sends. API mocking focuses on CONTROLLING what the app receives.

API mocking is about crafting specific response scenarios:
  - Happy path: return valid data, verify the UI renders it correctly
  - Error path: return errors, verify the UI shows appropriate feedback
  - Edge cases: return empty data, slow responses, partial failures
  - Conditional: return different data on different requests

This is the foundation of "contract testing" — verifying your frontend
handles every possible API response shape correctly.
```

### Playwright: Handler Logic in page.route()

```typescript
// PLAYWRIGHT
// The route handler can contain any logic — conditionals, counters,
// delays, etc. This makes it powerful for complex mocking scenarios.

// Example: return different data based on request count
let callCount = 0;
await page.route('/api/risk-scores', async (route) => {
  callCount++;
  if (callCount === 1) {
    // First request: return initial data
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ scores: [{ entity: 'Acme Corp', score: 72, riskLevel: 'Medium' }] })
    });
  } else {
    // Subsequent requests: return updated data
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ scores: [{ entity: 'Acme Corp', score: 45, riskLevel: 'Low' }] })
    });
  }
});
```

### Cypress: Fixtures and Dynamic Handlers

```typescript
// CYPRESS
// cy.intercept can use fixture files or inline response objects.
// A route handler function gives you dynamic control.

// Static response (simplest form):
cy.intercept('GET', '/api/risk-scores', {
  statusCode: 200,
  body: { scores: [{ entity: 'Acme Corp', score: 72, riskLevel: 'Medium' }] }
});

// Dynamic handler with req.reply():
let callCount = 0;
cy.intercept('GET', '/api/risk-scores', (req) => {
  callCount++;
  if (callCount === 1) {
    req.reply({ statusCode: 200, body: { scores: [...] } });
  } else {
    req.reply({ statusCode: 200, body: { scores: [...updated] } });
  }
}).as('getScores');
```

### Simulating Delays

```typescript
// PLAYWRIGHT
// Use a setTimeout or a promise to add delay before fulfilling.
await page.route('/api/risk-scores', async (route) => {
  // Wait 2 seconds before responding, simulating a slow server.
  await new Promise(resolve => setTimeout(resolve, 2000));
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ scores: [] })
  });
});

// CYPRESS
// Use the delay option in req.reply():
cy.intercept('GET', '/api/risk-scores', (req) => {
  req.reply({
    statusCode: 200,
    body: { scores: [] },
    delay: 2000  // 2 second delay
  });
});
```

## Playground

The playground is a "Risk Assessment Dashboard" that displays risk scores fetched from an API:

1. **Score Cards Grid** — displays risk score cards, each showing an entity name, numeric score, and risk level (High, Medium, Low) with color-coded styling.

2. **Refresh Button** — triggers a new GET request to `/api/risk-scores` to reload the dashboard data.

3. **Loading Indicator** — a spinner with "Loading risk scores..." text shown during API calls.

4. **Error Panel** — displays API error messages with a "Retry" button.

5. **Request Counter** — shows how many API requests have been made (useful for verifying request counts in tests).

6. **Status Bar** — shows the current status (Idle, Loading, Loaded, Error) and the last update timestamp.

**Note:** The dashboard auto-fetches scores on page load. Without a mock, this initial request will fail and show the error panel. Your tests should set up mocks BEFORE navigation.

### API Contract

The dashboard expects this response format from `GET /api/risk-scores`:

```json
{
  "scores": [
    { "entity": "Acme Corp", "score": 72, "riskLevel": "Medium" },
    { "entity": "Beta Ltd", "score": 89, "riskLevel": "High" },
    { "entity": "Gamma Inc", "score": 34, "riskLevel": "Low" }
  ]
}
```

## Exercises

### Exercise 1: Mock Successful Scores Response
Mock the `/api/risk-scores` endpoint to return 3 score entries. Verify all 3 score cards are rendered with correct entity names, scores, and risk levels.

### Exercise 2: Mock Error Response and Verify Error UI
Mock the endpoint to return a 500 error with `{ "message": "Database connection timeout" }`. Verify the error panel is visible with the error message.

### Exercise 3: Mock Slow Response and Verify Loading State
Mock the endpoint with a 2-second delay. Verify the loading indicator is visible DURING the request, and hidden AFTER the response arrives.

### Exercise 4: Mock Different Data and Verify UI Updates
Mock the endpoint, load initial data, then change the mock to return different data and click "Refresh Scores". Verify the UI updates to show the new data.

### Exercise 5: Conditional Mocking (Different Response Per Request)
Set up a handler that returns different data on the first call vs. subsequent calls. Load the page (first call), then click Refresh (second call). Verify the data changed.

### Exercise 6: Mock with Delay
Mock the endpoint with a 500ms delay. Verify the loading state appears, then the data renders after the delay.

### Exercise 7: Verify Request Count
Load the page (auto-fetch), then click Refresh twice. Verify the request counter shows 3.

### Exercise 8: Mock Partial Failure
Mock the first request to succeed (scores load), then mock the second request (Refresh) to fail with an error. Verify the error panel appears after the second request while the original scores remain visible.

## Solutions

### Playwright Solution

See `playwright/api-mocking.spec.ts`

### Cypress Solution

See `cypress/api-mocking.cy.ts`

## Common Mistakes

| Mistake | Why it's wrong | Fix |
|---------|---------------|-----|
| Not mocking before page load | The dashboard auto-fetches on load; if the mock isn't ready, the first request fails | Set up `page.route()` or `cy.intercept()` BEFORE `page.goto()` or `cy.visit()` |
| Forgetting the `scores` wrapper | The API returns `{ scores: [...] }`, not a bare array | Always wrap score data in a `{ scores: [...] }` object |
| Not waiting for loading state to appear | The loading indicator shows briefly; asserting too late misses it | Assert loading is visible immediately after triggering the request |
| Changing mocks in Playwright without unroute | Previous routes remain active | Use `page.unroute()` or use handler logic with conditionals |
| Assuming Cypress mocks persist across tests | cy.intercept() is reset between tests | Set up intercepts in each test or in `beforeEach` |
| Not checking both error panel AND score grid | After a refresh failure, old scores might still be visible | Verify both the error state and the data grid state |

## Quick Reference

### Playwright API Mocking

| Scenario | Pattern |
|----------|---------|
| Mock success | `route.fulfill({ status: 200, body: JSON.stringify(data) })` |
| Mock error | `route.fulfill({ status: 500, body: JSON.stringify({ message: '...' }) })` |
| Mock with delay | `await new Promise(r => setTimeout(r, ms)); await route.fulfill(...)` |
| Conditional mock | Use a counter variable in the handler closure |
| Remove mock | `await page.unroute('/api/...')` |
| Count requests | Increment a counter variable in the handler |

### Cypress API Mocking

| Scenario | Pattern |
|----------|---------|
| Mock success | `cy.intercept('GET', url, { statusCode: 200, body: data })` |
| Mock error | `cy.intercept('GET', url, { statusCode: 500, body: { message: '...' } })` |
| Mock with delay | `req.reply({ body: data, delay: 2000 })` |
| Conditional mock | Use a counter in a route handler function |
| Wait for Nth request | `cy.wait('@alias')` can be called multiple times |
| Count requests | Use `cy.get('@alias.all').should('have.length', N)` |
