# Kata 52: Authentication Flows

## What You Will Learn

- The four common auth patterns in load tests: **login per iteration**, **login once per VU**, **shared token pool**, **pre-baked tokens**
- When each pattern matches reality (and when each is wrong)
- Handling token expiry mid-test
- Refresh-token flow under load
- Detecting and handling 401s without polluting your latency metrics

## Prerequisites

- Completed [Kata 51 (Parameterization)](../51-parameterization-and-data-driven-tests/)
- The QA Labs server running

## Concepts Explained

### Why auth deserves its own kata

If your load test logs in 10,000 times in 30 seconds against an endpoint that's not the one you're trying to measure, you've turned the test into a **login** stress test, not the test you wanted.

Worse, login latency drowns out the latency of the endpoint you actually care about. The numbers look bad, you think the system is slow, but the bottleneck is just *how you wrote the test*.

### Four patterns

#### 1. Login per iteration (almost always wrong)

```javascript
export default function () {
  const token = login();          // ← every iteration
  http.get('/api/dashboard', {
    headers: { Authorization: `Bearer ${token}` },
  });
}
```

**When it's right:** specifically testing the login endpoint.
**When it's wrong:** anywhere else. Wastes load on `/login`, distorts ratios, shadows downstream latency.

#### 2. Login once per VU (the usual default)

Each VU logs in once at scenario start, reuses the token for every iteration.

```javascript
import { sleep } from 'k6';

let token = null;

export default function () {
  if (!token) token = login();
  http.get('/api/dashboard', {
    headers: { Authorization: `Bearer ${token}` },
  });
}
```

**When it's right:** each "user" in your simulated load is a long-lived session.
**Issue:** doesn't catch login latency at all — if you care about login under load, run it as a separate scenario.

#### 3. Shared token pool (login bursts pre-test)

For very high RPS where even per-VU logins are too many, pre-warm a pool of tokens before the actual test:

```javascript
import { SharedArray } from 'k6/data';
import http from 'k6/http';

const tokens = new SharedArray('tokens', function () {
  // This runs ONCE in init context — make N login calls upfront
  const arr = [];
  for (let i = 0; i < 50; i++) {
    const res = http.post(/* login */);
    arr.push(res.json('token'));
  }
  return arr;
});

export default function () {
  const token = tokens[__VU % tokens.length];
  http.get('/api/dashboard', { headers: { Authorization: `Bearer ${token}` } });
}
```

**When it's right:** ultra-high RPS, login isn't part of the perf hypothesis.

#### 4. Pre-baked tokens (loaded from CSV / vault)

Login pool is generated outside k6 entirely:

```javascript
const tokens = new SharedArray('tokens', () => JSON.parse(open('./tokens.json')));
```

**When it's right:** can't or shouldn't hit `/login` in a load test (rate limits, audit logs, etc.).

### Handling token expiry

Even per-VU tokens can expire mid-test. Two strategies:

**Reactive:** if a request returns 401, refresh:
```javascript
let res = http.get(url, { headers: { Authorization: `Bearer ${token}` } });
if (res.status === 401) {
  token = login();
  res = http.get(url, { headers: { Authorization: `Bearer ${token}` } });
}
```

**Proactive:** track token age, refresh before it expires.

The reactive approach is simpler but adds 401 → 200 retries to your latency stats, which can confuse percentile reading. Tag the retry to exclude:

```javascript
http.get(url, { tags: { retry: 'true' } });
// Then in thresholds:
'http_req_duration{retry:false}': ['p(95)<300'],
```

### Refresh-token flow

Real auth often uses access + refresh tokens. Mirror this in tests if production does:

```javascript
let access = null;
let refresh = null;

function ensureToken() {
  if (!access) {
    const r = login();
    access = r.access;
    refresh = r.refresh;
  }
}

function refreshAccess() {
  const r = http.post('/auth/refresh', { refresh });
  access = r.json('access');
}
```

The QA Labs server uses simple bearer tokens (no expiry, no refresh) for kata simplicity. In a real test, swap in your real auth API.

### Don't let 401s pollute metrics

If 5% of requests return 401 (because tokens just expired and you're refreshing), they show up in `http_req_failed` and inflate your error rate. Two fixes:

1. **Tag and exclude** failed-auth requests from your error threshold.
2. **Don't measure** the auth-fixup hops in your main latency assertions.

## Exercises

1. **Login per iteration** vs **login once per VU.** Build both and compare RPS to `/lab/auth/me` between them under the same VU count. By how much does the per-iteration version distort the test?
2. **Pre-warm a token pool of 20 tokens.** Run 50 VUs sharing those 20 tokens. Does the test reach the target RPS? What's the bottleneck?
3. **Simulate 5% expiry.** Tag random requests to send a deliberately bad token (`token + 'x'`). Catch the 401, refresh, retry. Verify your latency p95 doesn't include retry hops.

## Common Mistakes

- **Login + 1 request per iteration.** You're testing the login endpoint, not the protected one. RPS to `/dashboard` will be half what it could be.
- **Hardcoded token in the test file.** Tokens expire, breaks the test.
- **Counting 401-then-retry as a successful response.** Inflates throughput, hides the problem.

## Cheat Sheet

| Pattern | When | Cost |
|---------|------|------|
| Login per iteration | Testing login itself | Stresses login, distorts other metrics |
| Login once per VU | Most simulated-user tests | Adds N login calls at start |
| Shared token pool | High RPS, login isn't the focus | Init time grows with pool size |
| Pre-baked tokens | Can't hit login in test | Maintenance overhead |
