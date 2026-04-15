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
