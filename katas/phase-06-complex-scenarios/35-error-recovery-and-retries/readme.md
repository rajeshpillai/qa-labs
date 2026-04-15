# Kata 35: Error Recovery and Retries

## What You Will Learn

- How to test error states and verify error messages
- How to test retry mechanisms and verify recovery
- How to control randomness in tests using window-level overrides
- How to test graceful degradation (cached data fallback)
- How to verify circuit breaker patterns (stop retrying after N failures)
- How to verify error boundaries catch and display errors
- How to test that form data is preserved after errors

## Prerequisites

- Completed Katas 01-34
- Understanding of page evaluation (page.evaluate / cy.window)

## Concepts Explained

### Controlling Randomness in Tests

```
Real apps often have random or unpredictable behavior (network failures,
race conditions). To test these reliably, the playground exposes global
flags that tests can set:

  window.__forceResult = 'success'   — random action always succeeds
  window.__forceResult = 'error'     — random action always fails
  window.__forceTimeout = true       — timeout always triggers
  window.__circuitForceFailure = true — circuit breaker always fails
```

### Playwright: page.evaluate()

```typescript
// PLAYWRIGHT
// page.evaluate(fn) runs JavaScript in the browser context.
// Use this to set global flags or read internal state.

await page.evaluate(() => {
  (window as any).__forceResult = 'error';
});
```

### Cypress: cy.window()

```typescript
// CYPRESS
// cy.window() yields the browser's window object.
// .then(win => ...) lets you set properties on it.

cy.window().then(win => {
  (win as any).__forceResult = 'error';
});
```

### Circuit Breaker Pattern

```
A circuit breaker protects against cascading failures:

  CLOSED (normal)  -->  failure  -->  failure  -->  failure  -->  OPEN (blocked)
                                                                     |
                                                                   Reset
                                                                     |
                                                                  CLOSED

When OPEN, all calls are immediately rejected without attempting the
real operation. The circuit must be manually (or automatically) reset.
```

## Playground Overview

Six cards demonstrating different error scenarios:

1. **Random Failure** — 50% success rate, retry button on failure
2. **Error Boundary** — Component crash with "Try Again" recovery
3. **Network Request** — Graceful degradation with cached data fallback
4. **Timeout Simulation** — Request that times out after 3 seconds
5. **Circuit Breaker** — Blocks calls after 3 consecutive failures
6. **Form Error Recovery** — First submit fails, data preserved for retry

## Exercises

1. **Trigger error, verify error message** — Force a failure and check the error text
2. **Click retry, verify recovery** — Force failure, then force success, click retry
3. **Test with mocked consistent failure** — Force all attempts to fail
4. **Test graceful degradation** — Go offline and verify cached data appears
5. **Verify circuit breaker after N failures** — Trigger 3 failures and verify circuit opens
6. **Verify error boundary UI** — Crash the component and verify the error boundary
7. **Test timeout handling** — Force a timeout and verify the error message
8. **Verify error does not lose form data** — Submit form, fail, verify inputs preserved
