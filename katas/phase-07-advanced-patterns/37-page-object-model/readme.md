# Kata 37: Page Object Model (POM)

## What You Will Learn

- What the Page Object Model pattern is and why it matters for test maintainability
- How to create POM classes in Playwright using TypeScript classes
- How to create POM-style objects in Cypress using plain objects and functions
- How to refactor raw tests into POM-based tests
- How tests become shorter, more readable, and easier to maintain with POM
- How to share POM classes across multiple test files

## Prerequisites

- Completed Katas 01-36
- Understanding of TypeScript classes and objects
- Familiarity with the KYC onboarding form from Kata 26

## Playground

This kata reuses the KYC onboarding form from Kata 26.
Open `playground/index.html` for a quick reference page that links to Kata 26.
The tests in this kata target the Kata 26 playground at:
`/phase-05-fintech-domain/26-kyc-onboarding-flow/playground/`

## Concepts Explained

### What Is the Page Object Model?

```
The Page Object Model (POM) is a design pattern used in test automation.
It creates an abstraction layer between your tests and the page under test.

Instead of writing selectors and actions directly in your test:

  // WITHOUT POM — selectors are scattered in every test
  await page.getByTestId('full-name-input').fill('Aisha Patel');
  await page.getByTestId('email-input').fill('aisha@example.com');
  await page.getByTestId('country-select').selectOption('IN');
  await page.getByTestId('submit-btn').click();

You create a Page Object that wraps all interactions:

  // WITH POM — tests read like English
  await kycForm.fillName('Aisha Patel');
  await kycForm.fillEmail('aisha@example.com');
  await kycForm.selectCountry('IN');
  await kycForm.submit();
```

### Why Use POM?

```
1. MAINTAINABILITY
   If a selector changes (e.g., data-testid="full-name-input" becomes
   data-testid="name-field"), you update ONE place — the Page Object.
   Without POM, you update every test that uses that selector.

2. READABILITY
   Tests read like user stories instead of DOM manipulation code.
   "kycForm.fillName('Aisha')" is clearer than
   "page.getByTestId('full-name-input').fill('Aisha')".

3. REUSABILITY
   Multiple test files can import the same Page Object.
   The KYC form appears in Kata 26, 37, 38, 39 — one POM serves all.

4. SEPARATION OF CONCERNS
   Tests describe WHAT to verify. Page Objects describe HOW to interact.
   This separation makes both easier to understand and modify.
```

### POM in Playwright vs Cypress

```
PLAYWRIGHT — uses TypeScript classes.
Each Page Object class receives a `page` fixture in its constructor.
Methods are async because Playwright actions return Promises.

  class KycFormPage {
    constructor(private page: Page) {}
    async fillName(name: string) {
      await this.page.getByTestId('full-name-input').fill(name);
    }
  }

CYPRESS — does NOT use classes (Cypress discourages it).
Instead, use plain objects or factory functions that return helper methods.
Methods use Cypress chains (cy.get().type()) and are NOT async.

  const kycFormPage = {
    fillName(name: string) {
      cy.get('[data-testid="full-name-input"]').type(name);
    }
  };
```

### Anatomy of a Good Page Object

```
A well-designed Page Object follows these rules:

1. One Page Object per page or major component
2. Expose actions (fill, click, navigate) — NOT selectors
3. Expose assertions where it makes sense (verifySuccess, isVisible)
4. Never expose internal page details (selectors, DOM structure)
5. Methods should be named from the user's perspective
6. Constructor takes the page/browser instance

Directory structure:
  playwright/
    pages/
      kyc-form.page.ts      ← Page Object for the KYC form
      review.page.ts         ← Page Object for the review section
    page-object-model.spec.ts ← Tests using the Page Objects
  cypress/
    pages/
      kyc-form.page.ts      ← POM object for Cypress
    page-object-model.cy.ts  ← Tests using the POM object
```

## Exercises

### Exercise 1: Read Tests Without POM (Understanding the Problem)
Look at tests that use raw selectors. Count how many times the same
selector appears. This is the problem POM solves.

### Exercise 2: Create a Playwright POM Class
Build `playwright/pages/kyc-form.page.ts` with methods for every form
field and action.

### Exercise 3: Create a Playwright Review Page POM
Build `playwright/pages/review.page.ts` for the review/status section.

### Exercise 4: Write Tests Using POM Classes
Use the POM classes in `playwright/page-object-model.spec.ts` to write
clean, readable tests.

### Exercise 5: Create a Cypress POM Object
Build `cypress/pages/kyc-form.page.ts` using the Cypress object pattern
(no classes).

### Exercise 6: Refactor Cypress Tests to Use POM
Use the POM object in `cypress/page-object-model.cy.ts` and compare
the before/after readability.

## Key Takeaways

```
- POM is the most widely-used pattern in professional test automation
- Playwright POM uses classes; Cypress POM uses objects/functions
- POM reduces duplication and makes selector changes a one-line fix
- Name methods from the user's perspective, not the DOM's perspective
- Start simple — you don't need POM for 3 tests, but you will for 30
```
