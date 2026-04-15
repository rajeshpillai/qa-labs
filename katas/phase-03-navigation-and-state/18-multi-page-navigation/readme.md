# Kata 18: Multi-Page Navigation

## What You Will Learn

- How to test hash-based routing (#/home, #/apply, #/status, #/profile) in a single-page application
- How to verify URL changes after navigation
- How to check active state highlighting on navigation links
- How to use browser back/forward buttons in tests
- How to deep link directly to a specific page via URL
- How to verify page titles and headings change per route

## Prerequisites

- Completed Katas 01-17
- Understanding of DOM selectors, assertions, and click interactions

## Concepts Explained

### Hash-Based Routing

```
Single-page applications (SPAs) use the URL hash to simulate multi-page
navigation without full page reloads. The hash is the part of the URL
after the # symbol.

  https://example.com/app/#/profile
                            ^^^^^^^^
                            This is the hash

When the hash changes, the browser fires a 'hashchange' event but does
NOT reload the page. JavaScript listens for this event and shows/hides
the appropriate content.

Key browser behaviors:
  - Changing the hash adds a new entry to browser history
  - Browser back/forward buttons navigate through hash history
  - The hash is sent to the server but ignored by most static file servers
  - Deep linking works: bookmarking a URL with a hash loads the right page
```

### Playwright: page.goto() with Hash

```typescript
// PLAYWRIGHT
// page.goto(url) loads a URL. You can include a hash fragment to
// deep-link directly to a specific page.
//
// Signature:
//   page.goto(url: string, options?: {
//     timeout?: number,
//     waitUntil?: 'load' | 'domcontentloaded' | 'networkidle' | 'commit'
//   }): Promise<Response | null>
//
// The hash fragment is part of the URL string:
await page.goto('/app/#/profile');

// waitForURL(pattern) waits until the page URL matches the pattern.
// Accepts a string, regex, or predicate function.
//
// Signature:
//   page.waitForURL(url: string | RegExp | ((url: URL) => boolean), options?: {
//     timeout?: number,
//     waitUntil?: 'load' | 'domcontentloaded' | 'networkidle' | 'commit'
//   }): Promise<void>
await page.waitForURL(/#\/apply/);

// toHaveURL(pattern) is an assertion that checks the current URL.
// It auto-retries until the condition is met or times out.
await expect(page).toHaveURL(/#\/status/);
```

### Playwright: goBack() and goForward()

```typescript
// PLAYWRIGHT
// goBack() simulates clicking the browser back button.
// It navigates to the previous page in the session history.
//
// Signature:
//   page.goBack(options?: {
//     timeout?: number,
//     waitUntil?: 'load' | 'domcontentloaded' | 'networkidle' | 'commit'
//   }): Promise<Response | null>
await page.goBack();

// goForward() simulates clicking the browser forward button.
// It navigates to the next page in the session history.
//
// Signature:
//   page.goForward(options?: { ... }): Promise<Response | null>
await page.goForward();
```

### Cypress: cy.visit() with Hash

```typescript
// CYPRESS
// cy.visit(url) navigates to a URL. Include the hash to deep-link.
//
// Signature:
//   cy.visit(url: string, options?: Partial<VisitOptions>): Chainable
cy.visit('/app/#/profile');

// cy.url() yields the current URL string for assertions.
//
// Signature:
//   cy.url(options?: Partial<UrlOptions>): Chainable<string>
cy.url().should('include', '#/apply');
```

### Cypress: cy.go()

```typescript
// CYPRESS
// cy.go(direction) navigates back or forward in the browser history.
//
// Signature:
//   cy.go(direction: 'back' | 'forward' | number): Chainable
//
// direction can be:
//   'back'    — go back one page (same as browser back button)
//   'forward' — go forward one page (same as browser forward button)
//   -1        — numeric alias for 'back'
//   1         — numeric alias for 'forward'
cy.go('back');
cy.go('forward');
```

### Verifying Active State

```typescript
// PLAYWRIGHT
// Check if a nav link has the 'active' CSS class:
await expect(page.getByTestId('nav-apply')).toHaveClass(/active/);
await expect(page.getByTestId('nav-home')).not.toHaveClass(/active/);

// CYPRESS
cy.get('[data-testid="nav-apply"]').should('have.class', 'active');
cy.get('[data-testid="nav-home"]').should('not.have.class', 'active');
```

### Verifying Page Titles

```typescript
// PLAYWRIGHT
// toHaveTitle(expected) checks the document.title.
await expect(page).toHaveTitle('Home | KYC Portal');

// CYPRESS
// cy.title() yields the document.title string.
cy.title().should('eq', 'Home | KYC Portal');
```

## Playground

The playground is a "KYC Portal" with four pages simulated using hash-based routing:

1. **Home Page (#/home)** — Welcome message with quick action links to Apply and Status pages. Shows verification steps.
2. **Apply Page (#/apply)** — KYC application form with Full Name input, Document Type dropdown, and Submit button.
3. **Status Page (#/status)** — Displays two KYC application cards showing application IDs, statuses, and dates.
4. **Profile Page (#/profile)** — Shows user profile details: Name, Email, KYC Level, and Member Since date.

### Navigation Features

- **Nav Bar** — Four links at the top: Home, Apply, Status, Profile. The active page's link is highlighted with a blue bottom border.
- **Route Display** — A monospace bar showing the current hash route (e.g., "#/profile").
- **Deep Linking** — Visiting the page with a hash (e.g., `#/status`) loads that page directly.
- **Browser History** — Each navigation adds to browser history, supporting back/forward buttons.
- **In-Page Links** — The Home page contains links to Apply and Status pages.

## Exercises

### Exercise 1: Navigate to Each Page via Nav Links
Click each nav link (Apply, Status, Profile) and verify the correct page appears while the previous page hides.

### Exercise 2: Verify URL Changes When Navigating
After clicking each nav link, verify the URL hash updated to match the page (e.g., #/apply, #/status, #/profile, #/home).

### Exercise 3: Verify Active Nav State Highlighting
After navigating to each page, verify the matching nav link has the 'active' CSS class and the previous link does not.

### Exercise 4: Use Browser Back Button
Navigate through multiple pages, then use goBack()/cy.go('back') to return to previous pages. Verify the correct page appears.

### Exercise 5: Verify Content Switches Between Pages
Navigate to each page and verify its unique content: welcome text on Home, form inputs on Apply, status cards on Status, profile fields on Profile.

### Exercise 6: Deep Link Directly to a Page
Use page.goto()/cy.visit() with a hash fragment to load a specific page directly. Verify the page is visible, nav is active, and route display is correct.

### Exercise 7: Verify Page Title/Heading Per Route
After navigating to each route, verify both the visible h2 heading and the document.title update correctly.

### Exercise 8: Navigate via In-Page Link Click
Click the inline links on the Home page (e.g., "Start a new KYC application") and verify they navigate to the correct page. Test goForward() / cy.go('forward').

## Solutions

### Playwright Solution

See `playwright/multi-page-navigation.spec.ts`

### Cypress Solution

See `cypress/multi-page-navigation.cy.ts`

## Common Mistakes

| Mistake | Why it's wrong | Fix |
|---------|---------------|-----|
| Forgetting to wait for hash change | The URL updates asynchronously after a click | Use `toHaveURL(regex)` in Playwright or `cy.url().should('include', ...)` in Cypress — both auto-retry |
| Checking `window.location.pathname` for hash routes | Hash routes don't change the pathname — only the hash | Use `page.url()` or `cy.url()` which return the full URL including hash |
| Not testing deep links | Users may bookmark or share URLs with hash fragments | Always test `page.goto(url + '#/page')` to verify the router handles direct loads |
| Using page reload instead of goBack() | A reload resets state; goBack() preserves hash history | Use `page.goBack()` / `cy.go('back')` to test browser history navigation |
| Asserting page content before navigation completes | The page div may not be visible yet when you check content | Assert visibility first: `should('be.visible')` before checking content |

## Quick Reference

### Playwright Navigation

| Action | Method | Example |
|--------|--------|---------|
| Go to URL with hash | `page.goto(url)` | `await page.goto('/app/#/profile')` |
| Check URL | `expect(page).toHaveURL(regex)` | `await expect(page).toHaveURL(/#\/apply/)` |
| Wait for URL | `page.waitForURL(pattern)` | `await page.waitForURL(/#\/status/)` |
| Go back | `page.goBack()` | `await page.goBack()` |
| Go forward | `page.goForward()` | `await page.goForward()` |
| Check title | `expect(page).toHaveTitle(str)` | `await expect(page).toHaveTitle('Home')` |
| Check class | `expect(loc).toHaveClass(regex)` | `await expect(nav).toHaveClass(/active/)` |

### Cypress Navigation

| Action | Method | Example |
|--------|--------|---------|
| Visit URL with hash | `cy.visit(url)` | `cy.visit('/app/#/profile')` |
| Check URL | `cy.url().should(...)` | `cy.url().should('include', '#/apply')` |
| Go back | `cy.go('back')` | `cy.go('back')` |
| Go forward | `cy.go('forward')` | `cy.go('forward')` |
| Check title | `cy.title().should(...)` | `cy.title().should('eq', 'Home')` |
| Check class | `.should('have.class', name)` | `cy.get(sel).should('have.class', 'active')` |
