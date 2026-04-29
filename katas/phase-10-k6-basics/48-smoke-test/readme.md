# Kata 48: Smoke Test

## What You Will Learn

- What a **smoke test** is in load-testing terms (and how it differs from a smoke test in functional QA)
- Why every perf project should start with one — and run it on every commit
- The minimal k6 / Artillery script that constitutes a smoke test
- How to gate a CI pipeline on a smoke test before running heavier loads

## Prerequisites

- Completed phase 9 (HTTP basics, percentiles, Little's Law)
- k6 installed (`k6 version`)
- The QA Labs server running (`cd server && npm start`)

## Concepts Explained

### What is a smoke test in load testing?

In **functional** QA, a smoke test is a quick "does the build even start" check.

In **load** testing, a smoke test is the same idea but for your perf scripts: the smallest possible run that proves:

1. The script compiles and runs without errors.
2. The target system responds.
3. Your assertions pass under trivial load (1 VU, ~1 minute).

It is **not** a load test. It does not measure capacity. It just answers "is the perf testing pipeline alive?"

### Why bother?

Two reasons:

**1. Catch broken scripts before paying for a 30-minute load test.** If your `BASE_URL` is wrong, your auth token expired, or the API contract changed, you want to know in 60 seconds, not 30 minutes.

**2. Make perf tests part of CI.** A full load test is too slow for every PR. But a smoke test takes ~1 minute and can run on every commit — catching regressions where the *script* breaks (separate from regressions in *performance*, which need bigger runs).

### Anatomy of a good smoke test

```
1 VU          ← exactly one user, no concurrency
30-60 seconds ← long enough to make ~30 requests
Tight thresholds:
  - http_req_failed: rate<0.01      (fewer than 1% errors)
  - http_req_duration: p(95)<500    (clearly fast)
checks on response shape
```

The thresholds are **tighter** than what your real load test would assert. Why? Because under a single VU there's nothing competing for resources — if even *this* is slow, something is fundamentally wrong.

### Smoke test vs load test

| | Smoke | Load |
|---|---|---|
| **VUs** | 1 | 100s |
| **Duration** | 30-60s | 5-30 min |
| **What you assert** | "It works" | "It works at scale" |
| **Where it runs** | Every CI commit | Nightly / pre-release |
| **What a failure means** | Pipeline broken or system unreachable | Capacity regression |

### Don't skip the checks

A smoke test that does nothing but `http.get()` and never asserts on the response is worse than nothing — it'll pass even when the server returns 500 every time. Use `check()` for at least:

- `status === 200`
- One field of the JSON body has the expected shape

## Exercises

1. **Write a smoke test for `/lab/auth/me` (the protected endpoint).** It needs an auth token first — make a smoke test that logs in via `/lab/auth/login`, then hits `/me`, and asserts both calls succeed.
2. **Make it fail.** Stop the QA Labs server and run the smoke test. The `http_req_failed` threshold should fire. Read the failure output.
3. **Tighten until it breaks.** Set `p(95)<5` and run against `/lab/echo`. Why does it fail? What's the right tightness?
4. **Wire it to fail-fast in CI.** What's the exit code on a threshold breach? How would you wire that into a GitHub Actions job that aborts the rest of the pipeline?

## Common Mistakes

- **Treating smoke as load.** Cranking VUs to "see what happens" turns a smoke test into a load test that's too short to be useful.
- **No assertions.** A test that doesn't assert anything is theatre. Always include at least one `check()` and one threshold.
- **Skipping smoke and going straight to load.** Then you spend 25 minutes waiting for a load test that fails because of a typo in the URL.

## Cheat Sheet

```javascript
// Skeleton smoke test
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 1,
  duration: '30s',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500'],
  },
};

export default function () {
  const res = http.get('http://localhost:3000/lab/echo');
  check(res, { 'status is 200': (r) => r.status === 200 });
}
```

If this passes consistently in CI, you've earned the right to run heavier scenarios. If it doesn't, fix the script before doing anything else.
