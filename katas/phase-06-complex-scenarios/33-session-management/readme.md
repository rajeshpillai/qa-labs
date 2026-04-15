# Kata 33: Session Management

## What You Will Learn

- How to test login flows that create timed sessions
- How to handle session timeout warnings and expiration overlays
- How to test token refresh flows (simulated JWT)
- How to use clock manipulation (fake timers) to fast-forward session timeouts
- How to verify session state persists across page reloads
- How to test re-login after session expiry

## Prerequisites

- Completed Katas 01-32
- Understanding of authentication flows and session concepts

## Concepts Explained

### Session Lifecycle

```
Login  -->  Active  -->  Warning (10s)  -->  Expired (15s)
                |                               |
                +--- Refresh (resets to 15s)     +--- Re-login
                |                               
                +--- Interact (resets timer)    
                |
                +--- Logout (ends session)
```

### Mock JWT Tokens

```
A JSON Web Token (JWT) has three parts separated by dots:
  header.payload.signature

Our playground generates mock JWTs with:
  header:    { alg: "HS256", typ: "JWT" }
  payload:   { sub: "admin", iat: ..., exp: ..., jti: ... }
  signature: random base64 string

Each token refresh generates a new JWT with an updated expiry.
```

### Playwright: Fake Timers

```typescript
// PLAYWRIGHT
// Playwright can control the browser's clock to fast-forward timers.
// This avoids waiting real seconds for session timeouts.

// Install fake timers before navigation:
await page.clock.install();

// Advance time by 10 seconds (triggers any setTimeout/setInterval
// callbacks that would fire within that period):
await page.clock.fastForward(10000);

// Or set a specific time:
await page.clock.setFixedTime(new Date('2025-01-01T00:00:15Z'));
```

### Cypress: cy.clock() and cy.tick()

```typescript
// CYPRESS
// cy.clock() overrides the browser's Date, setTimeout, setInterval, etc.
// cy.tick(ms) advances the fake clock by the given milliseconds.

cy.clock();                    // install fake timers
cy.tick(10000);                // advance 10 seconds
cy.clock().invoke('restore');  // restore real timers
```

## Playground Overview

A single-page app with login, session management, and timeout:

- **Login form**: Username "admin", password "password123"
- **Dashboard**: Shows session timer, status, token, refresh count
- **Warning banner**: Appears at 10s remaining
- **Session expiry**: Overlay appears at 15s with "Sign In Again" button
- **Refresh button**: Resets timer and generates new token
- **Interact button**: Simulates user activity, resets timer
- **Session storage**: Session survives page reload if not expired

## Exercises

1. **Login and verify session active** — Sign in and verify the dashboard appears with "Active" status
2. **Wait for session warning** — Use fake timers to advance to the warning threshold
3. **Refresh session before expiry** — Refresh the session and verify timer resets
4. **Let session expire, verify overlay** — Wait for full timeout and verify expired overlay
5. **Re-login after expiry** — Click "Sign In Again" on the expired overlay and log in again
6. **Verify token refresh** — Refresh the session and verify a new token is generated
7. **Rapid interactions keep session alive** — Click Interact repeatedly before timeout
8. **Verify session state across page reload** — Reload the page and verify session is restored

## Common Mistakes

| Mistake | Why it's wrong | Fix |
|---------|---------------|-----|
| Installing fake timers after page navigation | Fake timers must be installed before the page loads, otherwise real timers are already running | Call `page.clock.install()` (Playwright) or `cy.clock()` (Cypress) before visiting the page |
| Advancing time without waiting for UI updates | `fastForward()` / `cy.tick()` triggers callbacks but the DOM update is asynchronous | After advancing time, wait for the expected UI element (warning banner, expiry overlay) to appear |
| Forgetting to log in before testing session features | The dashboard is only visible after login; interacting with session controls before login fails | Always complete the login flow first, then test session behavior |
| Comparing exact token strings without accounting for refresh | Each token refresh generates a new JWT; storing the old token and comparing with `toBe()` will pass only if you compare correctly | Store the token before refresh, then assert the new token is different (`not.toBe(oldToken)`) |
| Not restoring real timers before page reload tests | Fake timers can interfere with page reload behavior and navigation timing | Restore real timers (`cy.clock().invoke('restore')`) before testing reload scenarios |

## Quick Reference

### Playwright Fake Timers

| Action | Method | Example |
|--------|--------|---------|
| Install fake timers | `page.clock.install()` | `await page.clock.install()` |
| Fast-forward time | `page.clock.fastForward(ms)` | `await page.clock.fastForward(10000)` |
| Set fixed time | `page.clock.setFixedTime()` | `await page.clock.setFixedTime(new Date('2025-01-01T00:00:15Z'))` |
| Fill login form | `locator.fill()` | `await page.getByTestId('username').fill('admin')` |
| Click button | `locator.click()` | `await page.getByTestId('login-btn').click()` |
| Check text content | `expect().toHaveText()` | `await expect(status).toHaveText('Active')` |
| Verify visibility | `expect().toBeVisible()` | `await expect(overlay).toBeVisible()` |

### Cypress Fake Timers

| Action | Method | Example |
|--------|--------|---------|
| Install fake timers | `cy.clock()` | `cy.clock()` |
| Advance time | `cy.tick(ms)` | `cy.tick(10000)` |
| Restore real timers | `.invoke('restore')` | `cy.clock().invoke('restore')` |
| Fill login form | `.type()` | `cy.get('[data-testid="username"]').type('admin')` |
| Click button | `.click()` | `cy.get('[data-testid="login-btn"]').click()` |
| Check text content | `.should('have.text')` | `cy.get(status).should('have.text', 'Active')` |
| Verify visibility | `.should('be.visible')` | `cy.get(overlay).should('be.visible')` |
