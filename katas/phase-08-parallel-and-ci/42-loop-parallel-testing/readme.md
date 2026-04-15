# Kata 42: Loop Parallel Testing

## What You Will Learn

- How to generate tests dynamically from a data array using loops
- How to run the same test scenario against N different data sets in parallel
- How to combine fixture files with parallel test generation
- How this pattern enables testing the same form with many applicant profiles simultaneously
- How to debug and identify failures in loop-generated tests
- The difference between Playwright and Cypress loop patterns

## Prerequisites

- Completed Katas 01-41 (especially Kata 40: fixtures and Kata 41: parallel)
- Understanding of for...of loops and array iteration
- Understanding of parallel workers

## Why This Pattern Matters

```
This is the KEY DIFFERENTIATOR pattern for QA automation at scale.

Imagine you need to test a KYC form with 100 different applicant profiles:
  - Different countries, document types, names, risk levels
  - Each must be submitted and verified independently
  - Doing this manually takes hours — automated takes minutes

The pattern:
  1. Define applicant profiles in a JSON fixture file
  2. Loop over the array to generate one test per profile
  3. Playwright runs all generated tests in parallel across workers

  for (const applicant of applicants) {
    test(`submit KYC for ${applicant.name}`, async ({ page }) => {
      // Each iteration becomes a SEPARATE, INDEPENDENT test
      // Playwright distributes them across workers automatically
    });
  }

Result: 100 tests, 4 workers, each test takes 2 seconds
  = ~50 seconds total instead of ~200 seconds sequential
```

## Concepts Explained

### The Loop Pattern in Playwright

```typescript
// PLAYWRIGHT — generate tests at parse time with a for...of loop.
//
// When Playwright loads this file, it executes the loop and discovers
// N tests (one per array element). These tests are then distributed
// across workers for parallel execution.

import applicants from './fixtures/applicants.json';

for (const applicant of applicants) {
  // Each iteration calls test() — registering a new test case.
  // The test title includes the applicant name for easy identification.
  test(`KYC: ${applicant.name}`, async ({ page }) => {
    // This test body runs independently in its own worker.
    // It has its own browser, page, and isolated state.
  });
}
```

### The Loop Pattern in Cypress

```typescript
// CYPRESS — use forEach (or for...of) to generate it() blocks.
//
// Cypress discovers tests synchronously when loading the spec file.
// The forEach loop runs at file load time and registers all tests.

const applicants = require('./fixtures/applicants.json');

describe('KYC Submissions', () => {
  applicants.forEach((applicant) => {
    it(`submit KYC for ${applicant.name}`, () => {
      // Each iteration creates a separate test case.
      // Within this spec file, tests run sequentially.
      // Across spec files, Cypress can run in parallel.
    });
  });
});
```

### Data File Design

```json
// fixtures/applicants.json
//
// Each object represents one applicant profile.
// Fields include both INPUT data and EXPECTED outcomes.
//
// Adding a new test case = adding a new object. No code changes needed.
[
  {
    "name": "Aisha Patel",
    "email": "aisha@example.com",
    "country": "IN",
    "docType": "passport",
    "expectedRef": "KYC-001",
    "expectedStatus": "success"
  }
]
```

### Parallel Execution Flow

```
 fixtures/applicants.json (5 applicants)
          │
          ▼
 ┌──────────────────────────────┐
 │  for (const a of applicants) │  ← parse time: generates 5 tests
 │    test(`KYC: ${a.name}`)    │
 └──────────────────────────────┘
          │
          ▼
 ┌─────────────────────────────────────────────┐
 │  Playwright distributes across workers:     │
 │                                             │
 │  Worker 1: Aisha Patel      ──► PASS        │
 │  Worker 2: Carlos Rivera    ──► PASS        │
 │  Worker 1: Yuki Tanaka      ──► PASS        │
 │  Worker 2: Fatima Al-Hassan ──► PASS        │
 │  Worker 1: Olga Petrov      ──► PASS        │
 │                                             │
 │  Total time: ~6 seconds (3 tests per worker)│
 │  vs sequential: ~10 seconds                 │
 └─────────────────────────────────────────────┘
```

## Exercises

### Exercise 1: Generate Tests from a Fixture Array
Loop over applicants.json and generate one test per applicant.

### Exercise 2: Run Tests in Parallel
Run the generated tests with multiple workers and observe distribution.

### Exercise 3: Add a New Applicant (Data-Only Change)
Add a new applicant to the JSON file — no code changes — and run again.

### Exercise 4: Dynamic Mock Responses per Applicant
Each test returns a unique mock response based on the applicant data.

### Exercise 5: Error Scenario Tests from Data
Include error scenarios in the fixture data and test them in the loop.

### Exercise 6: Cypress Loop Pattern
Implement the same pattern in Cypress using forEach.

## Key Takeaways

```
- Loop + parallel = test N data sets simultaneously
- Adding test cases = adding JSON objects (no code changes)
- Playwright: for...of at module level generates independent tests
- Cypress: forEach inside describe generates sequential tests per file
- Each test must be fully independent — no shared browser state
- This pattern scales: 5 applicants today, 500 tomorrow, same code
```
