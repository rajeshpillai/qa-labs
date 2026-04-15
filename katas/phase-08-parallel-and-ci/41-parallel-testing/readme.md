# Kata 41: Parallel Testing

## What You Will Learn

- How Playwright runs tests in parallel using workers
- How to configure the number of workers and parallel behavior
- How to use `test.describe.configure()` for serial vs parallel execution
- How Playwright sharding splits tests across CI machines
- How Cypress approaches parallelization (Cypress Cloud, manual splitting)
- When to use parallel vs serial execution

## Prerequisites

- Completed Katas 01-40
- Understanding of test structure (describe, test/it blocks)
- Basic understanding of processes and threads

## Concepts Explained

### Why Parallel Testing?

```
If you have 100 tests and each takes 2 seconds:
  - Sequential: 100 x 2s = 200 seconds (3+ minutes)
  - 4 workers:  100 / 4 x 2s = 50 seconds

Parallel testing runs multiple tests SIMULTANEOUSLY using worker processes.
Each worker gets its own browser instance and runs tests independently.

Benefits:
  - Faster feedback — CI pipelines complete sooner
  - Better resource utilization — uses all CPU cores
  - Scales with hardware — more cores = more workers

Risks:
  - Tests must be INDEPENDENT — no shared state between tests
  - Resource contention — too many workers can overload the machine
  - Flakiness — race conditions in shared resources (databases, files)
```

### Playwright Parallel Architecture

```
Playwright uses WORKER PROCESSES to run tests in parallel.

                     ┌─────────┐
                     │ Playwright│
                     │  Runner  │
                     └────┬─────┘
                          │
            ┌─────────────┼─────────────┐
            │             │             │
      ┌─────┴─────┐ ┌─────┴─────┐ ┌─────┴─────┐
      │  Worker 1  │ │  Worker 2  │ │  Worker 3  │
      │  (process) │ │  (process) │ │  (process) │
      └─────┬─────┘ └─────┬─────┘ └─────┬─────┘
            │             │             │
      ┌─────┴─────┐ ┌─────┴─────┐ ┌─────┴─────┐
      │  Browser 1 │ │  Browser 2 │ │  Browser 3 │
      └───────────┘ └───────────┘ └───────────┘

Each worker:
  - Is a separate Node.js process
  - Has its own browser instance
  - Runs tests independently
  - Does NOT share memory with other workers
```

### Playwright Configuration Options

```typescript
// playwright.config.ts

export default defineConfig({
  // WORKERS — how many parallel worker processes to use.
  //
  // workers: 4        — use exactly 4 workers
  // workers: '50%'    — use 50% of available CPU cores
  // workers: undefined — default: 50% of cores (CI) or 100% (local)
  //
  // CLI override: npx playwright test --workers=2
  workers: 4,

  // FULLY PARALLEL — run ALL tests across ALL files in parallel.
  //
  // true  — tests from different files run simultaneously
  // false — each file runs in one worker, files run in parallel
  //
  // Default: false (tests within a file run sequentially)
  fullyParallel: true,

  // RETRIES — retry failed tests automatically.
  // Useful in parallel mode where flaky tests may occur.
  retries: 1,

  // REPORTER — 'html' generates an HTML report showing parallel execution.
  reporter: 'html',
});
```

### Playwright Sharding (CI Machines)

```bash
# SHARDING splits tests across MULTIPLE CI MACHINES.
# Each machine runs a portion (shard) of the total test suite.
#
# Syntax: --shard=<current>/<total>
#
# Example: split tests across 3 CI machines
# Machine 1: npx playwright test --shard=1/3
# Machine 2: npx playwright test --shard=2/3
# Machine 3: npx playwright test --shard=3/3
#
# Each machine gets roughly 1/3 of the test files.
# Sharding + workers = maximum parallelism.
#
# CI example (GitHub Actions matrix):
#   strategy:
#     matrix:
#       shard: [1/3, 2/3, 3/3]
#   steps:
#     - run: npx playwright test --shard=${{ matrix.shard }}
```

### Cypress Parallelization

```
Cypress parallelization works differently from Playwright:

OPTION 1: Cypress Cloud (official, paid for teams)
  - npx cypress run --record --parallel
  - Cypress Cloud distributes spec files across CI machines
  - Requires a Cypress Cloud account and record key
  - Best load balancing — assigns specs based on historical run times

OPTION 2: Manual splitting (free)
  - Split spec files across CI jobs manually
  - Job 1: cypress run --spec "cypress/e2e/auth/**"
  - Job 2: cypress run --spec "cypress/e2e/dashboard/**"
  - Simple but no automatic load balancing

OPTION 3: Third-party tools
  - sorry-cypress — open-source Cypress Cloud alternative
  - currents.dev — paid alternative with better load balancing

KEY DIFFERENCE FROM PLAYWRIGHT:
  Cypress runs ONE spec file at a time per process.
  Parallelism = multiple processes, each running different spec files.
  Within a single spec file, tests run SEQUENTIALLY.
```

### test.describe.configure() — Playwright

```typescript
// PLAYWRIGHT — control parallel behavior per describe block.

test.describe('serial tests', () => {
  // test.describe.configure({ mode: 'serial' }) forces all tests
  // in this block to run in order, one after another.
  // If one fails, the rest are SKIPPED (they depend on the previous).
  test.describe.configure({ mode: 'serial' });

  test('step 1: create account', async ({ page }) => { /* ... */ });
  test('step 2: verify email', async ({ page }) => { /* ... */ });
  test('step 3: complete profile', async ({ page }) => { /* ... */ });
});

test.describe('parallel tests', () => {
  // test.describe.configure({ mode: 'parallel' }) runs all tests
  // in this block simultaneously across workers.
  // Each test is fully independent.
  test.describe.configure({ mode: 'parallel' });

  test('test A', async ({ page }) => { /* ... */ });
  test('test B', async ({ page }) => { /* ... */ });
  test('test C', async ({ page }) => { /* ... */ });
});
```

## Exercises

### Exercise 1: Understand Default Parallel Behavior
Run tests and observe how Playwright distributes them across workers.

### Exercise 2: Configure Worker Count
Experiment with different worker counts and measure execution time.

### Exercise 3: Serial Mode with test.describe.configure
Write tests that MUST run in order (dependent tests).

### Exercise 4: Parallel Mode with test.describe.configure
Write independent tests that can safely run in parallel.

### Exercise 5: Sharding for CI
Understand how to split tests across CI machines with --shard.

### Exercise 6: Cypress Parallelization Strategies
Compare Cypress parallelization options and write notes in tests.

## Key Takeaways

```
- Playwright uses worker processes for parallel execution (default: 50% of cores)
- fullyParallel: true runs ALL tests across ALL files simultaneously
- test.describe.configure({ mode: 'serial' }) forces sequential execution
- Sharding (--shard=1/3) splits tests across CI machines
- Cypress parallelism requires Cypress Cloud or manual spec splitting
- Tests MUST be independent for parallel execution to work correctly
- More workers != always faster — too many can overload the machine
```
