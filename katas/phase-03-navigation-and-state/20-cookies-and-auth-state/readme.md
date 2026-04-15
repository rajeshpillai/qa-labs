# Kata 20: Cookies and Auth State

## What You Will Learn

- How to verify cookies are set and cleared after login/logout
- How to test "Remember Me" functionality (session vs persistent cookies)
- How to read cookie attributes (name, value, path, sameSite, expiry)
- How to set cookies directly from tests to skip login flows
- How to reuse auth state across tests using cookie manipulation
- Differences between Playwright's context.addCookies() and Cypress's cy.setCookie()

## Prerequisites

- Completed Katas 01-19
- Understanding of form interactions, assertions, and browser storage concepts

## Concepts Explained

### How Cookies Work

```
Cookies are small pieces of data (max ~4KB) stored by the browser and
automatically sent with every HTTP request to the same domain.

Types of cookies:
  Session cookie — deleted when the browser is closed (no expiry set)
  Persistent cookie — has an explicit expiry date or max-age

Key attributes:
  name      — the cookie identifier (e.g., 'session-id')
  value     — the stored data (e.g., 'abc123')
  path      — URL path the cookie applies to ('/' = entire site)
  domain    — which domain can read the cookie
  expires   — expiry date (absolute timestamp)
  max-age   — lifetime in seconds (relative)
  httpOnly  — if true, JavaScript cannot read/write the cookie
  secure    — if true, cookie is only sent over HTTPS
  sameSite  — CSRF protection: 'Strict', 'Lax', or 'None'

In JavaScript:
  document.cookie = 'name=value; path=/; max-age=3600';  // set
  document.cookie                                         // read all
  document.cookie = 'name=; max-age=0; path=/';          // delete
```

### Playwright: Cookie Management

```typescript
// PLAYWRIGHT
// Reading cookies from the browser context:
//
// page.context().cookies(urls?) returns an array of cookie objects.
//
// Signature:
//   context.cookies(urls?: string | string[]): Promise<Cookie[]>
//
// Each cookie object has: name, value, domain, path, expires,
// httpOnly, secure, sameSite.
const cookies = await page.context().cookies();
const session = cookies.find(c => c.name === 'kyc-session');

// Setting cookies programmatically (before or after navigation):
//
// context.addCookies(cookies) adds cookies to the browser context.
//
// Signature:
//   context.addCookies(cookies: Array<{
//     name: string, value: string,
//     url?: string,  // OR domain + path
//     domain?: string, path?: string,
//     expires?: number,  // Unix timestamp in seconds
//     httpOnly?: boolean, secure?: boolean,
//     sameSite?: 'Strict' | 'Lax' | 'None'
//   }>): Promise<void>
await context.addCookies([{
  name: 'kyc-session',
  value: 'admin',
  url: 'http://localhost:3000'
}]);

// Clearing cookies:
// context.clearCookies() removes all cookies from the browser context.
await context.clearCookies();
```

### Cypress: Cookie Management

```typescript
// CYPRESS
// Reading a single cookie by name:
//
// cy.getCookie(name) yields a cookie object or null.
//
// Signature:
//   cy.getCookie(name: string): Chainable<Cookie | null>
//
// Cookie object has: name, value, path, domain, httpOnly, secure,
// expiry, sameSite.
cy.getCookie('kyc-session').should('exist');
cy.getCookie('kyc-session').should('have.property', 'value', 'admin');

// Reading all cookies:
//
// cy.getCookies() yields an array of all cookies.
//
// Signature:
//   cy.getCookies(): Chainable<Cookie[]>
cy.getCookies().should('have.length.greaterThan', 0);

// Setting a cookie programmatically:
//
// cy.setCookie(name, value, options?) creates a cookie.
//
// Signature:
//   cy.setCookie(name: string, value: string, options?: {
//     path?: string, domain?: string, secure?: boolean,
//     httpOnly?: boolean, expiry?: number, sameSite?: string
//   }): Chainable<Cookie>
cy.setCookie('kyc-session', 'admin');

// Clearing a single cookie:
//
// cy.clearCookie(name) removes a specific cookie.
cy.clearCookie('kyc-session');

// Clearing all cookies:
//
// cy.clearCookies() removes all cookies for the current domain.
cy.clearCookies();
```

### Session vs Persistent Cookies

```typescript
// PLAYWRIGHT
// Session cookie: expires === -1
const sessionCookie = cookies.find(c => c.name === 'session');
expect(sessionCookie.expires).toBe(-1);

// Persistent cookie: expires is a Unix timestamp in the future
const persistentCookie = cookies.find(c => c.name === 'remember');
expect(persistentCookie.expires).toBeGreaterThan(Date.now() / 1000);

// CYPRESS
// Session cookie: expiry is undefined
cy.getCookie('session').then(cookie => {
  expect(cookie.expiry).to.be.undefined;
});

// Persistent cookie: expiry is a number (Unix timestamp)
cy.getCookie('remember').then(cookie => {
  expect(cookie.expiry).to.be.a('number');
});
```

## Playground

The playground is a "KYC Portal" login page with cookie-based authentication:

1. **Login Form** — Username and password fields with a "Remember Me" checkbox. Valid credentials: `admin` / `password123`. Shows an error message for invalid credentials.
2. **Session Cookie** — On successful login (without Remember Me), sets a session cookie `kyc-session=admin` that expires when the browser closes.
3. **Persistent Cookie** — With "Remember Me" checked, sets a persistent cookie with `max-age=604800` (7 days).
4. **Dashboard** — After login, shows a dashboard with welcome message, pending applications count, approved count, and risk alerts.
5. **Logout** — Deletes the `kyc-session` cookie and returns to the login form.
6. **Auth State Banner** — Displays "Not Authenticated" (red) or "Authenticated as admin" (green) at the top.
7. **Cookie Inspector** — Shows all cookies for the current page. Updated via "Refresh" button.
8. **Auto-Login** — On page load, if a `kyc-session` cookie exists, the dashboard is shown automatically (simulating session persistence).

## Exercises

### Exercise 1: Login and Verify Cookie Set
Perform a login and verify that a cookie named `kyc-session` exists with the value `admin`. Check it's a session cookie (no expiry).

### Exercise 2: Verify Dashboard Shown
After login, verify the dashboard is visible, the login form is hidden, and the welcome message displays the correct username.

### Exercise 3: Logout and Verify Cookie Cleared
Login, then logout. Verify the cookie is deleted, the login form reappears, and the auth state shows "Not Authenticated".

### Exercise 4: Remember Me Sets Persistent Cookie
Login with "Remember Me" checked. Verify the cookie has an expiry timestamp approximately 7 days in the future.

### Exercise 5: Verify Auth State Display
Verify the auth state banner text and CSS classes change correctly on login (logged-in) and logout (logged-out).

### Exercise 6: Reuse Auth State (Set Cookie Directly)
Set the `kyc-session` cookie programmatically (without using the login form) and reload. Verify the dashboard appears automatically.

### Exercise 7: Set Custom Cookie Manually
Set a custom cookie from the test, reload, and verify it appears in the cookie inspector UI.

### Exercise 8: Verify Cookie Attributes
After login, read the cookie and verify its attributes: name, value, path (/), sameSite (Lax), httpOnly (false).

## Solutions

### Playwright Solution

See `playwright/cookies-and-auth-state.spec.ts`

### Cypress Solution

See `cypress/cookies-and-auth-state.cy.ts`

## Common Mistakes

| Mistake | Why it's wrong | Fix |
|---------|---------------|-----|
| Checking cookies before login completes | The cookie hasn't been set yet | Wait for a visible change (dashboard visible) before checking cookies |
| Forgetting to clear cookies between tests | Previous test's cookies leak into the next test | Use `cy.clearCookies()` in beforeEach or Playwright's test isolation |
| Confusing `expires` and `expiry` | Playwright uses `expires` (seconds), Cypress uses `expiry` (seconds) | Check the framework docs for the correct property name |
| Setting `httpOnly: true` in test cookies for JavaScript-based pages | httpOnly cookies can't be read by `document.cookie` | Only set httpOnly when testing server-set cookies |
| Not encoding cookie values | Special characters break the cookie string format | Use `encodeURIComponent()` for names and values |
| Testing cookie persistence by closing the browser | Session cookies are deleted on browser close, but test frameworks don't simulate this | Check the expires/expiry field instead — session cookies have -1/undefined |

## Quick Reference

### Playwright Cookies

| Action | Method | Example |
|--------|--------|---------|
| Get all cookies | `context.cookies()` | `const cookies = await page.context().cookies()` |
| Find cookie | `cookies.find(c => c.name === name)` | `const s = cookies.find(c => c.name === 'session')` |
| Set cookie | `context.addCookies([{...}])` | `await context.addCookies([{ name, value, url }])` |
| Clear all | `context.clearCookies()` | `await context.clearCookies()` |
| Check expires | `cookie.expires` | `-1` = session, `> 0` = persistent |

### Cypress Cookies

| Action | Method | Example |
|--------|--------|---------|
| Get one cookie | `cy.getCookie(name)` | `cy.getCookie('session').should('exist')` |
| Get all cookies | `cy.getCookies()` | `cy.getCookies().should('have.length', 2)` |
| Set cookie | `cy.setCookie(name, value)` | `cy.setCookie('session', 'admin')` |
| Clear one | `cy.clearCookie(name)` | `cy.clearCookie('session')` |
| Clear all | `cy.clearCookies()` | `cy.clearCookies()` |
| Check expiry | `cookie.expiry` | `undefined` = session, number = persistent |
