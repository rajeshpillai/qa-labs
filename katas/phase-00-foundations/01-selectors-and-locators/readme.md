# Kata 01: Selectors and Locators

## What You Will Learn

- How to find elements on a web page using different selector strategies
- CSS selectors: by ID, class, attribute, and tag
- `data-testid` attributes: why they exist and when to use them
- Playwright locators: `getByRole`, `getByText`, `getByTestId`, `getByLabel`, `getByPlaceholder`
- Cypress selectors: `cy.get`, `cy.contains`, `cy.find`
- Which selector strategy to choose and why it matters for test stability

## Prerequisites

- Node.js 18+ installed
- Basic HTML knowledge (tags, attributes, ids, classes)
- A code editor (VS Code recommended)

## Concepts Explained

### What is a selector?

A **selector** is a pattern that tells your test framework which element on the page you want to interact with. Think of it like giving directions to find something — the more precise and stable your directions, the less likely they are to break when the page changes.

### Selector Strategies (Best to Worst)

| Priority | Strategy | Example | Stability |
|----------|----------|---------|-----------|
| 1 | `data-testid` | `[data-testid="btn-submit"]` | Best — dedicated test attribute, never changes accidentally |
| 2 | Role-based | `getByRole('button', { name: 'Submit' })` | Great — based on accessibility, rarely changes |
| 3 | Label/Placeholder | `getByLabel('Email')` | Good — tied to user-visible text |
| 4 | Text content | `getByText('Submit Application')` | OK — can break if copy changes |
| 5 | CSS selector | `.btn-primary` | Fragile — styling classes change often |
| 6 | XPath | `//div[@class="card"]/button` | Worst — breaks on any DOM restructure |

### Playwright Locators (Latest API)

Playwright provides **built-in locator methods** that auto-wait for elements. Here's each one:

```typescript
// getByTestId — finds element by data-testid attribute
// Use: when you've added data-testid to your HTML specifically for testing
// Signature: page.getByTestId(testId: string)
page.getByTestId('btn-submit')  // finds <button data-testid="btn-submit">

// getByRole — finds element by ARIA role
// Use: best for buttons, links, headings, textboxes — mirrors how screen readers see the page
// Signature: page.getByRole(role, options?)
// Common roles: 'button', 'link', 'heading', 'textbox', 'checkbox', 'radio', 'combobox', 'table', 'row', 'cell'
page.getByRole('button', { name: 'Submit Application' })
page.getByRole('heading', { level: 1 })
page.getByRole('link', { name: 'Dashboard' })

// getByLabel — finds form element by its <label> text
// Use: for form inputs that have associated labels
// Signature: page.getByLabel(text: string | RegExp, options?)
page.getByLabel('Full Name')
page.getByLabel('Email Address')

// getByPlaceholder — finds input by placeholder text
// Use: when inputs don't have labels but have placeholders
// Signature: page.getByPlaceholder(text: string | RegExp, options?)
page.getByPlaceholder('Enter your full name')

// getByText — finds element by its visible text content
// Use: for any element that contains specific text
// Signature: page.getByText(text: string | RegExp, options?)
page.getByText('Identity Verification')
page.getByText(/risk score/i)  // case-insensitive with regex

// locator — finds element by CSS selector (escape hatch)
// Use: when none of the above work, or for complex selectors
// Signature: page.locator(selector: string)
page.locator('[data-testid="btn-submit"]')
page.locator('#full-name')
page.locator('.btn-primary')

// Chaining — narrow down within a parent element
page.getByTestId('applicant-card-1').getByText('John Doe')
page.locator('.card').first()
page.locator('.card').nth(2)  // 0-indexed, so this is the third card
```

### Cypress Selectors (Latest API)

Cypress uses **jQuery-style chaining** with built-in retry-ability:

```typescript
// cy.get — finds element(s) by CSS selector
// Use: the primary way to find elements in Cypress
// Signature: cy.get(selector: string, options?)
cy.get('[data-testid="btn-submit"]')
cy.get('#full-name')
cy.get('.btn-primary')
cy.get('input[type="email"]')

// cy.contains — finds element containing text
// Use: to find elements by their visible text
// Signature: cy.contains(text: string | RegExp)
// Signature: cy.contains(selector: string, text: string | RegExp)
cy.contains('Submit Application')           // any element with this text
cy.contains('button', 'Submit Application') // specifically a button
cy.contains(/risk score/i)                  // regex for case-insensitive

// cy.find — finds descendant elements within a parent (must be chained)
// Use: to narrow down search within a parent element
// Signature: .find(selector: string)
cy.get('[data-testid="applicant-card-1"]').find('strong')

// .first(), .last(), .eq(index) — select from multiple matches
cy.get('.card').first()
cy.get('.card').last()
cy.get('.card').eq(1)   // 0-indexed, so second card

// .within — scope all commands inside a parent
cy.get('[data-testid="applicant-card-1"]').within(() => {
  cy.contains('John Doe')
  cy.contains('Approved')
})
```

### Best Practices

1. **Always prefer `data-testid`** — they're stable, explicit, and won't break when styling changes
2. **Use role-based locators** (Playwright) or `cy.contains` with a selector (Cypress) for semantically meaningful elements
3. **Never use auto-generated classes** like `.css-1a2b3c` — they change on every build
4. **Avoid index-based selectors** like `.nth(3)` when possible — they break when items are reordered
5. **Be as specific as needed, but no more** — `getByTestId('btn-submit')` is better than `locator('form > div:last-child > button.btn-primary:first-of-type')`

### Anti-Patterns to Avoid

```typescript
// BAD: Brittle CSS path
page.locator('body > div:nth-child(2) > div > form > button')

// BAD: Styling class that could change
page.locator('.btn-primary')

// BAD: XPath that breaks on DOM restructure
page.locator('//form/div[3]/button')

// GOOD: Stable test ID
page.getByTestId('btn-submit')

// GOOD: Semantic role
page.getByRole('button', { name: 'Submit Application' })
```

## Playground

Open the playground in your browser. It contains a **KYC Portal** page with:

1. **Personal Details Form** — text inputs, email, select dropdowns, checkboxes, radio buttons, textarea
2. **Applicant Cards** — nested elements with names, emails, status badges, risk scores
3. **Applications Table** — rows with IDs, names, statuses, action buttons
4. **Quick Actions** — buttons (some enabled, some disabled), a checklist
5. **Search** — a search input that filters results dynamically
6. **Element States** — a toggle panel (hidden/visible), a click counter

```bash
# start the playground server
npx serve katas -l 8080

# open in browser
# http://localhost:8080/phase-00-foundations/01-selectors-and-locators/playground/
```

## Exercises

### Exercise 1: Find by Test ID

Locate the submit button using `data-testid` and verify its text says "Submit Application".

**Playwright hint**: `page.getByTestId('btn-submit')`
**Cypress hint**: `cy.get('[data-testid="btn-submit"]')`

### Exercise 2: Find by Role

Find the "Dashboard" navigation link using role-based locators.

**Playwright hint**: `page.getByRole('link', { name: 'Dashboard' })`
**Cypress hint**: `cy.contains('a', 'Dashboard')`

### Exercise 3: Find by Label and Placeholder

Locate the "Full Name" input using its label, then locate the phone input by its placeholder text.

### Exercise 4: Find Within a Parent

Inside the first applicant card (`applicant-card-1`), find the name, email, and status badge.

### Exercise 5: Work With a Table

Find the second row of the applications table and verify it contains "Jane Smith" and "Pending".

### Exercise 6: Select From Multiple Elements

Find all applicant cards (there are 3), and verify the last one belongs to "Raj Kumar".

### Exercise 7: Text Matching

Find all elements that contain the word "Verification" (there are multiple in the checklist).

### Exercise 8: Toggle Visibility

Click the "Show Details Panel" button, then verify the hidden panel becomes visible and contains the expected text.

### Exercise 9: Interact With Search

Type "John" into the search box and verify a search result appears with "KYC-001".

### Exercise 10: Disabled Button

Verify the "Reject Selected" button exists but is disabled.

## Solutions

### Playwright Solution

See `playwright/selectors.spec.ts` — every line is commented to explain what it does.

### Cypress Solution

See `cypress/selectors.cy.ts` — every line is commented to explain what it does.

## Common Mistakes

| Mistake | Why it's wrong | Fix |
|---------|---------------|-----|
| Using `.btn-primary` to find the submit button | Multiple buttons have this class | Use `data-testid` or role with name |
| Forgetting `await` in Playwright | Playwright locators return Promises | Always `await` assertions and actions |
| Using `cy.get()` with text content | `cy.get` only accepts CSS selectors | Use `cy.contains()` for text matching |
| Hardcoding element indices | Breaks when list order changes | Use `data-testid` or text content to find specific items |
| Not waiting for dynamic content | Search results appear after typing | Cypress auto-retries; Playwright auto-waits with locators |

## Quick Reference

### Playwright Locator Methods

| Method | Finds by | Example |
|--------|----------|---------|
| `getByTestId(id)` | `data-testid` attribute | `getByTestId('btn-submit')` |
| `getByRole(role, opts)` | ARIA role + accessible name | `getByRole('button', { name: 'Submit' })` |
| `getByLabel(text)` | Associated `<label>` | `getByLabel('Email Address')` |
| `getByPlaceholder(text)` | `placeholder` attribute | `getByPlaceholder('Enter your full name')` |
| `getByText(text)` | Visible text content | `getByText('Approved')` |
| `locator(css)` | CSS selector | `locator('[data-testid="x"]')` |

### Cypress Selector Methods

| Method | Finds by | Example |
|--------|----------|---------|
| `cy.get(selector)` | CSS selector | `cy.get('[data-testid="btn-submit"]')` |
| `cy.contains(text)` | Text content | `cy.contains('Submit Application')` |
| `cy.contains(sel, text)` | Selector + text | `cy.contains('button', 'Submit')` |
| `.find(selector)` | Descendant (chained) | `.find('[data-testid="name"]')` |
| `.within(() => {})` | Scope commands | `.within(() => { cy.contains('...') })` |
| `.first()` / `.last()` | Position | `cy.get('.card').first()` |
| `.eq(index)` | Index (0-based) | `cy.get('.card').eq(1)` |
