# Kata 51: Parameterization and Data-Driven Tests

## What You Will Learn

- Why hammering the **same** request repeatedly is misleading — and what realistic tests do instead
- **k6's `SharedArray`**: load test data once, share across VUs, no copy per VU
- Loading users / payloads from JSON or CSV
- Generating data on the fly: per-iteration unique IDs, random selections, sequential cycling
- Picking the right strategy: **fixed dataset** vs **synthetic generation** vs **production sample**
- Artillery's `payload` config for the same job

## Prerequisites

- Completed phase 10 (k6 basics)
- The QA Labs server running

## Concepts Explained

### Why parameterize?

A test that does this:

```javascript
http.get('/api/users/42');
```

… on every iteration is probably hitting one warm cache entry forever. Real traffic queries hundreds of different users. If your cache hit rate in the test is 100% and in production is 60%, you've measured the wrong thing.

Three sources of variety you should care about:

1. **Different inputs per iteration** — different users, products, cart contents.
2. **Different inputs per VU** — each "user" should look like a separate session.
3. **Realistic distributions** — long tail, not uniform random. Most queries hit popular items; a few hit obscure ones.

### `SharedArray` — k6's data-loading primitive

Naive approach (broken):

```javascript
const users = JSON.parse(open('./users.json')); // ← runs in EVERY VU init
```

With 200 VUs, this loads `users.json` 200 times into 200 separate memory regions. Memory blows up; loading is slow.

Correct approach:

```javascript
import { SharedArray } from 'k6/data';

const users = new SharedArray('users', function () {
  return JSON.parse(open('./users.json'));
});
```

`SharedArray` loads once, shares the underlying memory across all VUs, and exposes a read-only array. Suitable for thousands of records.

### Selection patterns

```javascript
// 1. Random pick — every iteration grabs a random row
const user = users[Math.floor(Math.random() * users.length)];

// 2. Per-VU pick — each VU sticks to its own subset
const user = users[__VU % users.length];

// 3. Sequential cycle — every iteration moves forward
const user = users[__ITER % users.length];

// 4. Stratified — 70% common users, 30% long-tail
const isHot = Math.random() < 0.7;
const user = isHot ? hotUsers[__ITER % hotUsers.length] : longTail[Math.floor(Math.random() * longTail.length)];
```

`__VU` is the virtual-user ID, `__ITER` is the iteration counter (per VU). Both are k6-provided globals.

### Generating data on the fly

If you don't have fixed data:

```javascript
const username = `user-${__VU}-${__ITER}-${Date.now()}`; // unique per request
const email = `qa-${__VU}@example.com`;
const cartTotal = Math.floor(Math.random() * 1000);
```

Avoid `Date.now()` alone for uniqueness — it'll collide at high RPS. Combine with `__VU` and `__ITER`.

### Artillery: `payload` config

Artillery loads CSV via the `payload` block:

```yaml
config:
  target: "http://localhost:3000"
  payload:
    path: "./users.csv"
    fields: ["username", "password"]
    order: random  # or "sequence"
  phases:
    - duration: 30
      arrivalRate: 10
```

In scenarios, refer to fields with `{{ username }}` / `{{ password }}`.

CSV format expected:
```csv
username,password
alice,pw1
bob,pw2
```

### When to use which

| Source | When | Trade-off |
|--------|------|-----------|
| **Static JSON / CSV** | Have a fixed set of test accounts | Repeats — caches stay warm |
| **Synthetic generation** | Need unique data per request | No realistic distribution |
| **Production sample (anonymized)** | Highest fidelity | Privacy + maintenance cost |

For the QA Labs server's `/lab/auth/login`, any non-empty username/password works, so we'll generate users on the fly.

## Exercises

1. **Load 100 users from JSON.** Create `users.json` with 100 fake accounts, load via `SharedArray`, hit `/lab/auth/login` per iteration with random selection. What's the test duration if each iteration takes ~50ms and you need every user to be hit at least once?
2. **Per-VU stickiness.** Modify exercise 1 so each VU always uses the same user across iterations. Why might this matter for cache-based perf? (Hint: session state in the server.)
3. **Stratified load.** 80% of iterations hit one of 10 "hot" users; 20% hit a long tail of 1000. Implement and observe how it changes the auth-flow latency distribution.
4. **CSV vs JSON.** Replicate exercise 1 in Artillery using `payload` + CSV. Compare ergonomics.

## Common Mistakes

- **`open()` outside `SharedArray`.** Calling `open('./data.json')` directly in module scope works but copies into every VU. With large datasets, this blows up memory.
- **Loading data inside `default()`.** The init code runs once per VU; the default function runs every iteration. Loading data inside the iteration is *very* slow.
- **`Math.random()` without seeding.** Useful for variation; not for deterministic reproduction. If you need the test to be repeatable, seed with `__VU`/`__ITER`.
- **CSVs with too many columns.** Artillery's `payload.fields` has to list every column you want to use.

## Cheat Sheet

```javascript
// k6 — fixed data, shared across VUs
import { SharedArray } from 'k6/data';
const users = new SharedArray('users', () => JSON.parse(open('./users.json')));

// k6 — synthetic per-iteration uniqueness
const username = `u-${__VU}-${__ITER}-${Date.now()}`;

// k6 — selection patterns
users[Math.floor(Math.random() * users.length)];  // random
users[__VU % users.length];                       // per-VU
users[__ITER % users.length];                     // sequential
```

```yaml
# Artillery — CSV payload
config:
  payload:
    path: "./users.csv"
    fields: ["username", "password"]
    order: random
```
