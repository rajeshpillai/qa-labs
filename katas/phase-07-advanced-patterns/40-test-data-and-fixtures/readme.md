# Kata 40: Test Data and Fixtures

## What You Will Learn

- How to manage test data using JSON fixture files
- How to use Playwright's `test.each` for parameterized/data-driven tests
- How to use Cypress's `cy.fixture()` to load test data
- How to generate dynamic test data for edge cases
- How to organize fixtures for large test suites
- The difference between static fixtures and dynamic data factories

## Prerequisites

- Completed Katas 01-39
- Understanding of JSON format
- Familiarity with the KYC form from Kata 26

## Concepts Explained

### Why Manage Test Data Separately?

```
Hard-coded test data in tests is a common anti-pattern:

  // BAD — data is scattered across tests
  await page.fill('#name', 'Aisha Patel');
  await page.fill('#email', 'aisha@example.com');

Problems:
  1. Same data repeated in multiple tests
  2. Hard to test with many different data sets
  3. No single source of truth for test data
  4. Difficult to add new test cases

Better approach: store data in FIXTURE FILES and load them in tests.

  // GOOD — data comes from a fixture file
  const applicants = require('./fixtures/applicants.json');
  for (const applicant of applicants) {
    test(`submit ${applicant.name}`, async ({ page }) => {
      await page.fill('#name', applicant.name);
    });
  }
```

### Fixture Files

```
A fixture is a JSON file containing test data. It lives in a fixtures/
directory alongside your test files.

Example: fixtures/applicants.json
[
  {
    "name": "Aisha Patel",
    "email": "aisha@example.com",
    "country": "IN",
    "docType": "passport",
    "expectedRisk": "High"
  },
  {
    "name": "Carlos Rivera",
    "email": "carlos@example.com",
    "country": "US",
    "docType": "drivers-license",
    "expectedRisk": "Low"
  }
]

Tests load this file and iterate over the array. Adding a new test case
means adding a new object to the JSON — no code changes needed.
```

### Playwright: Parameterized Tests

```typescript
// PLAYWRIGHT — use a for...of loop or test array to generate tests.
//
// Playwright does NOT have test.each like Jest. Instead, you use
// a standard JavaScript loop to generate test cases dynamically.

import applicants from './fixtures/applicants.json';

// Generate one test per applicant.
for (const applicant of applicants) {
  test(`submit KYC for ${applicant.name}`, async ({ page }) => {
    // Each iteration creates a separate test with its own data.
    await page.fill('#name', applicant.name);
  });
}
```

### Cypress: cy.fixture()

```typescript
// CYPRESS — cy.fixture(filePath) loads a JSON file from cypress/fixtures/.
//
// Signature:
//   cy.fixture(filePath: string, encoding?: string): Chainable<any>
//
// The file path is relative to the cypress/fixtures/ directory.
// cy.fixture() is asynchronous — use .then() to access the data.

cy.fixture('applicants.json').then((applicants) => {
  // applicants is the parsed JSON array.
  cy.get('#name').type(applicants[0].name);
});

// You can also use fixtures in beforeEach with an alias:
beforeEach(() => {
  cy.fixture('applicants.json').as('applicants');
});

it('test with fixture', function() {
  // Access via this.applicants (note: arrow functions don't work with `this`)
  cy.get('#name').type(this.applicants[0].name);
});
```

### Dynamic Data Factories

```
Sometimes you need data that is unique per test run (e.g., unique emails).
A data factory generates fresh data:

function createApplicant(overrides = {}) {
  return {
    name: `Test User ${Date.now()}`,
    email: `test-${Date.now()}@example.com`,
    country: 'US',
    docType: 'passport',
    ...overrides   // merge any custom fields
  };
}

// Usage:
const applicant = createApplicant({ name: 'Custom Name' });
```

## Playground

This kata references the KYC form from Kata 26 at:
`/phase-05-fintech-domain/26-kyc-onboarding-flow/playground/`

## Exercises

### Exercise 1: Load and Use a Fixture File
Load applicants.json and use the first applicant's data in a test.

### Exercise 2: Parameterized Tests (Loop Over Data)
Generate one test per applicant from the fixture file.

### Exercise 3: Cypress cy.fixture() with Aliases
Use cy.fixture().as() to share data across tests in a describe block.

### Exercise 4: Dynamic Data Factory
Create a factory function that generates unique test data per run.

### Exercise 5: Fixture Organization
Use multiple fixture files for different scenarios (valid, invalid, edge cases).

### Exercise 6: Data-Driven Assertions
Use fixture data to drive not just form input but also expected outcomes.

## Key Takeaways

```
- Store test data in JSON fixture files, not hard-coded in tests
- Playwright: import JSON directly or use fs.readFileSync
- Cypress: use cy.fixture() to load from cypress/fixtures/
- Use loops to generate one test per data set (parameterized tests)
- Data factories generate unique data for tests that need it
- Organize fixtures by scenario: valid, invalid, edge-cases
- Adding a test case = adding a JSON object, not writing new code
```
