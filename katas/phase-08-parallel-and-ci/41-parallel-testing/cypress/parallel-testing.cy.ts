// =============================================================================
// Kata 41: Parallel Testing — Cypress Tests
// =============================================================================
//
// Cypress handles parallelization differently from Playwright.
//
// KEY DIFFERENCE:
//   Playwright: runs individual TESTS in parallel across workers
//   Cypress:    runs entire SPEC FILES in parallel across machines
//
// Within a single Cypress spec file, tests always run SEQUENTIALLY.
// To achieve parallelism, you run multiple spec files simultaneously
// on different machines or processes.
//
// PARALLELIZATION OPTIONS:
//   1. Cypress Cloud:    npx cypress run --record --parallel
//   2. Manual splitting: npx cypress run --spec "path/to/spec1.cy.ts"
//   3. sorry-cypress:    open-source alternative to Cypress Cloud
// =============================================================================

describe('Kata 41: Parallel Testing Concepts', () => {

  // --------------------------------------------------------------------------
  // Exercise 1: Independent Tests (Parallel-Safe)
  // --------------------------------------------------------------------------
  // These tests are independent — they can run in any order.
  // In Cypress, they run sequentially within this file, but the file
  // itself can run in parallel with OTHER spec files.
  it('exercise 1a: independent test A', () => {
    cy.visit('data:text/html,<h1>Cypress Test A</h1>');
    cy.get('h1').should('have.text', 'Cypress Test A');
  });

  it('exercise 1b: independent test B', () => {
    cy.visit('data:text/html,<h1>Cypress Test B</h1>');
    cy.get('h1').should('have.text', 'Cypress Test B');
  });

  it('exercise 1c: independent test C', () => {
    cy.visit('data:text/html,<h1>Cypress Test C</h1>');
    cy.get('h1').should('have.text', 'Cypress Test C');
  });

  // --------------------------------------------------------------------------
  // Exercise 2: Understanding Sequential Execution in Cypress
  // --------------------------------------------------------------------------
  // Unlike Playwright, Cypress does NOT run tests within a file in parallel.
  // Tests in a describe block run one after another, top to bottom.
  // This means shared state CAN work (but is still discouraged).
  describe('exercise 2: sequential by design', () => {
    let counter = 0;

    it('runs first — increments counter', () => {
      counter += 1;
      // Cypress tests in a file run sequentially, so counter is reliably 1.
      expect(counter).to.equal(1);
    });

    it('runs second — counter is already 1', () => {
      counter += 1;
      // Because the previous test ran first, counter is now 2.
      expect(counter).to.equal(2);
    });

    it('runs third — counter is already 2', () => {
      counter += 1;
      expect(counter).to.equal(3);
    });
  });

  // --------------------------------------------------------------------------
  // Exercise 3: Cypress Cloud Parallelization
  // --------------------------------------------------------------------------
  // This test documents how Cypress Cloud parallelization works.
  it('exercise 3: Cypress Cloud parallel execution (documentation)', () => {
    // Cypress Cloud parallelization is configured via the CLI, not in test code.
    //
    // STEP 1: Set up Cypress Cloud (https://cloud.cypress.io)
    //   - Create a project and get a projectId
    //   - Add projectId to cypress.config.ts
    //
    // STEP 2: Run with --record --parallel
    //   npx cypress run --record --key <your-key> --parallel
    //
    // STEP 3: Cypress Cloud distributes spec files across CI machines
    //   - Machine 1 gets: login.cy.ts, dashboard.cy.ts
    //   - Machine 2 gets: kyc-form.cy.ts, settings.cy.ts
    //   - Machine 3 gets: reports.cy.ts, profile.cy.ts
    //
    // Cypress Cloud uses HISTORICAL RUN TIMES to balance the load.
    // Slow specs are assigned to machines first for optimal distribution.
    //
    // COST: Free for up to 500 test recordings/month, paid plans for more.

    cy.visit('data:text/html,<h1>Cypress Cloud Parallelization</h1>');
    cy.get('h1').should('contain.text', 'Parallelization');
  });

  // --------------------------------------------------------------------------
  // Exercise 4: Manual Spec Splitting for CI
  // --------------------------------------------------------------------------
  // Without Cypress Cloud, you can split specs manually in your CI config.
  it('exercise 4: manual spec splitting (documentation)', () => {
    // In your CI configuration (e.g., GitHub Actions), create multiple jobs:
    //
    // jobs:
    //   test-group-1:
    //     steps:
    //       - run: npx cypress run --spec "cypress/e2e/auth/**"
    //
    //   test-group-2:
    //     steps:
    //       - run: npx cypress run --spec "cypress/e2e/forms/**"
    //
    //   test-group-3:
    //     steps:
    //       - run: npx cypress run --spec "cypress/e2e/api/**"
    //
    // PROS: Free, no external service needed
    // CONS: Manual balancing — you decide which specs go in which group
    //       If one group has slow specs, it becomes the bottleneck

    cy.visit('data:text/html,<h1>Manual Spec Splitting</h1>');
    cy.get('h1').should('contain.text', 'Manual');
  });

  // --------------------------------------------------------------------------
  // Exercise 5: Writing Parallel-Safe Tests
  // --------------------------------------------------------------------------
  // Even though Cypress runs tests sequentially in a file, writing
  // parallel-safe tests is a best practice for when you add parallelism.
  it('exercise 5: parallel-safe test pattern', () => {
    // PARALLEL-SAFE means the test works regardless of execution order.
    //
    // GOOD PRACTICES:
    //   1. Each test sets up its own state (beforeEach or in-test setup)
    //   2. Each test tears down after itself (afterEach or automatic)
    //   3. Use unique identifiers (timestamps) for test data
    //   4. Never depend on another test having run first
    //   5. Never depend on database state from another test
    //
    // BAD PRACTICES:
    //   1. Sharing mutable variables between tests (see exercise 2 — fragile)
    //   2. Assuming a specific execution order
    //   3. Using the same user account across parallel workers
    //   4. Writing to the same file from multiple tests

    const uniqueId = `test-${Date.now()}`;
    cy.visit(`data:text/html,<h1>Safe Test ${uniqueId}</h1>`);
    cy.get('h1').should('contain.text', 'Safe Test');
  });

  // --------------------------------------------------------------------------
  // Exercise 6: Comparing Playwright vs Cypress Parallel
  // --------------------------------------------------------------------------
  it('exercise 6: comparison summary (documentation)', () => {
    // ╔══════════════════╦═══════════════════╦═══════════════════╗
    // ║ Feature          ║ Playwright        ║ Cypress           ║
    // ╠══════════════════╬═══════════════════╬═══════════════════╣
    // ║ Parallel unit    ║ Individual tests  ║ Spec files        ║
    // ║ Workers          ║ Built-in          ║ External (CI)     ║
    // ║ Config           ║ playwright.config  ║ CLI flags         ║
    // ║ Sharding         ║ --shard=1/3       ║ --spec (manual)   ║
    // ║ Serial mode      ║ describe.configure ║ Default behavior  ║
    // ║ Cloud service    ║ Not needed        ║ Cypress Cloud     ║
    // ║ Cost             ║ Free              ║ Free/Paid          ║
    // ╚══════════════════╩═══════════════════╩═══════════════════╝

    cy.visit('data:text/html,<h1>Playwright vs Cypress Parallel</h1>');
    cy.get('h1').should('contain.text', 'Playwright vs Cypress');
  });
});
