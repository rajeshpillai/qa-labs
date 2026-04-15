# Kata 06: Iframes and Shadow DOM

## What You Will Learn

- How to access and interact with elements inside `<iframe>` elements
- How to handle nested iframes (iframe within iframe)
- How to work with Shadow DOM and custom web components
- Playwright `frameLocator()` API (no frame switching needed)
- Cypress iframe pattern using `contentDocument.body`
- Shadow DOM piercing: automatic in Playwright, `includeShadowDom` option in Cypress
- Cross-boundary assertions: reading iframe content, acting on the parent page

## Prerequisites

- Completed Kata 01-05
- Understanding of CSS selectors and `data-testid` attributes

## Concepts Explained

### What Are Iframes?

An `<iframe>` (inline frame) embeds a separate HTML document inside the current page. The iframe has its own DOM, separate from the parent page. This means normal selectors **cannot** reach inside an iframe -- you need special APIs.

Common real-world uses: embedded payment forms (Stripe, PayPal), third-party widgets, terms-and-conditions documents, ads.

### What Is Shadow DOM?

Shadow DOM is a web standard that encapsulates a component's internal structure. Elements inside a shadow root are hidden from the main page's DOM. Custom elements (like `<compliance-widget>`) use shadow DOM to prevent style leakage and maintain encapsulation.

### Playwright: frameLocator() API

```typescript
// frameLocator() returns a FrameLocator scoped to the iframe's document.
// You pass a CSS selector that matches the <iframe> element on the parent page.
const frame = page.frameLocator('[data-testid="payment-iframe"]');

// Inside the frame, use normal locator methods.
await frame.getByTestId('input-cardholder').fill('Jane Doe');
await expect(frame.getByTestId('payment-title')).toHaveText('Payment');

// No "switching" needed -- you can use multiple frameLocators independently.
const termsFrame = page.frameLocator('[data-testid="terms-iframe"]');
await expect(termsFrame.getByTestId('terms-title')).toHaveText('Terms');

// You can still access the main page with `page` at any time.
await expect(page.getByTestId('page-header')).toBeVisible();
```

**Key points:**
- `frameLocator()` does NOT switch context (unlike Selenium's `switchTo().frame()`)
- Each `FrameLocator` is an independent scoped view into one iframe
- You can use multiple frame locators in the same test without switching back
- All locator methods (`.getByTestId()`, `.getByRole()`, `.locator()`) work inside frames

### Playwright: Nested Iframes

```typescript
// Chain frameLocator() calls to access iframes within iframes.
const outer = page.frameLocator('[data-testid="outer-iframe"]');
const inner = outer.frameLocator('[data-testid="inner-iframe"]');

// Now interact with elements inside the nested iframe.
await expect(inner.getByTestId('inner-text')).toContainText('passed');
```

### Playwright: Shadow DOM (Automatic Piercing)

```typescript
// Playwright automatically pierces open shadow roots.
// No special configuration needed -- getByTestId, getByRole, locator() all work.
await page.getByTestId('widget-title');                    // finds inside shadow DOM
await page.getByTestId('input-entity-name').fill('Acme');  // fills inside shadow DOM
```

### Cypress: Iframe Pattern

Cypress does **not** have a built-in `frameLocator()`. You must manually access the iframe's `contentDocument.body`:

```typescript
// Helper function to get an iframe's body as a Cypress-wrapped element.
function getIframeBody(selector: string) {
  return cy
    .get(selector)                          // find the <iframe> element
    .its('0.contentDocument.body')          // get the DOM node of the iframe body
    .should('not.be.empty')                 // wait until the iframe has loaded
    .then(cy.wrap);                         // wrap it for chaining Cypress commands
}

// Usage:
getIframeBody('[data-testid="payment-iframe"]')
  .find('[data-testid="input-cardholder"]')
  .type('Jane Doe');
```

**Key points:**
- `.its('0.contentDocument.body')` accesses the first matched element's content document
- `.should('not.be.empty')` acts as a retry/wait until the iframe loads
- `cy.wrap()` converts the raw DOM node into a Cypress chainable
- Use `.find()` (not `.get()`) to scope searches within the iframe body

### Cypress: Nested Iframes

```typescript
// Get the outer iframe body, then find the inner iframe within it.
getIframeBody('[data-testid="outer-iframe"]').then(($outerBody) => {
  cy.wrap($outerBody)
    .find('[data-testid="inner-iframe"]')
    .its('0.contentDocument.body')
    .should('not.be.empty')
    .then(cy.wrap)
    .then(($innerBody) => {
      cy.wrap($innerBody).find('[data-testid="inner-text"]')
        .should('contain.text', 'passed');
    });
});
```

### Cypress: Shadow DOM

```typescript
// Option 1: Per-command -- pass { includeShadowDom: true } to cy.get() or .find()
cy.get('[data-testid="widget-title"]', { includeShadowDom: true })
  .should('have.text', 'Compliance Check');

// Option 2: Global -- set in cypress.config.ts (affects ALL commands)
// export default defineConfig({ includeShadowDom: true });
```

## Function Signatures

### Playwright

| Method | Signature | Purpose |
|--------|-----------|---------|
| `page.frameLocator()` | `frameLocator(selector: string): FrameLocator` | Returns a scoped view into an iframe |
| `frameLocator.getByTestId()` | `getByTestId(testId: string): Locator` | Find element by data-testid inside the frame |
| `frameLocator.locator()` | `locator(selector: string): Locator` | Find element by CSS/text inside the frame |
| `frameLocator.frameLocator()` | `frameLocator(selector: string): FrameLocator` | Access nested iframe within a frame |

### Cypress

| Method | Signature | Purpose |
|--------|-----------|---------|
| `.its()` | `.its(propertyPath: string)` | Access a property on the subject (used for `contentDocument.body`) |
| `cy.wrap()` | `cy.wrap(subject: any)` | Wrap a DOM node so Cypress commands can chain on it |
| `.find()` | `.find(selector: string, options?)` | Find descendants within the current subject |
| `{ includeShadowDom: true }` | option on `cy.get()` / `.find()` | Pierce shadow DOM boundaries |

## Exercises

| # | Exercise | What You Practice |
|---|----------|-------------------|
| 1 | Read text inside an iframe | `frameLocator()` / `getIframeBody()` basics |
| 2 | Fill payment form inside iframe | `fill()` / `type()` within iframe scope |
| 3 | Submit form in iframe, verify result | Click + assertion inside iframe |
| 4 | Read text inside Shadow DOM | Shadow DOM piercing |
| 5 | Fill and submit Shadow DOM form | Full interaction with shadow root elements |
| 6 | Access nested iframe (iframe in iframe) | Chained `frameLocator()` / nested `contentDocument` |
| 7 | Switch between multiple iframes | Multiple frame locators, no switching overhead |
| 8 | Assert across iframe boundary | Read iframe, act on parent page |

## Solutions

- Playwright: `playwright/iframes-and-shadow-dom.spec.ts`
- Cypress: `cypress/iframes-and-shadow-dom.cy.ts`

## Common Mistakes

### 1. Using `page.locator()` to find elements inside an iframe
```typescript
// WRONG -- this searches the parent page DOM only
await page.getByTestId('input-cardholder').fill('Jane');

// RIGHT -- use frameLocator() first
const frame = page.frameLocator('[data-testid="payment-iframe"]');
await frame.getByTestId('input-cardholder').fill('Jane');
```

### 2. Using `cy.get()` instead of `.find()` inside an iframe body
```typescript
// WRONG -- cy.get() searches from the root document, not the iframe
getIframeBody('[data-testid="payment-iframe"]');
cy.get('[data-testid="input-cardholder"]').type('Jane');  // searches main page!

// RIGHT -- chain .find() on the wrapped iframe body
getIframeBody('[data-testid="payment-iframe"]')
  .find('[data-testid="input-cardholder"]')
  .type('Jane');
```

### 3. Forgetting `{ includeShadowDom: true }` in Cypress
```typescript
// WRONG -- Cypress cannot see inside shadow roots by default
cy.get('[data-testid="widget-title"]').should('have.text', 'Check');
// Error: element not found

// RIGHT -- pass the option
cy.get('[data-testid="widget-title"]', { includeShadowDom: true })
  .should('have.text', 'Check');
```

### 4. Trying to "switch back" to the main page in Playwright
```typescript
// UNNECESSARY -- Playwright does not have an active frame concept
// There is no need to "switch back" like in Selenium
const frame = page.frameLocator('[data-testid="payment-iframe"]');
await frame.getByTestId('input-cardholder').fill('Jane');
// You can immediately use `page` for the main page -- no switching needed
await page.getByTestId('page-header').click();
```

### 5. Not waiting for iframe to load in Cypress
```typescript
// WRONG -- iframe body may not be ready yet
cy.get('[data-testid="payment-iframe"]')
  .its('0.contentDocument.body')
  .then(cy.wrap)  // might wrap an empty body!

// RIGHT -- add .should('not.be.empty') to retry until loaded
cy.get('[data-testid="payment-iframe"]')
  .its('0.contentDocument.body')
  .should('not.be.empty')   // retries until the iframe body has content
  .then(cy.wrap);
```

## Quick Reference

```
Playwright                                   Cypress
----------------------------------------------  ------------------------------------------------
page.frameLocator(sel)                        cy.get(sel).its('0.contentDocument.body')
                                                .should('not.be.empty').then(cy.wrap)
frame.getByTestId('x')                        iframeBody.find('[data-testid="x"]')
outer.frameLocator(sel)  // nested            iframeBody.find(sel).its('0.contentDocument.body')
page.getByTestId('x')    // auto-pierce       cy.get(sel, { includeShadowDom: true })
No switching needed                           No switching needed (but more boilerplate)
```
