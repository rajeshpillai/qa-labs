# Kata 61: Batched HTTP and REST Patterns

## What You Will Learn

- The difference between **sequential**, **parallel**, and **batched** request patterns — and what each costs
- k6's `http.batch()` for parallel requests, and **why "parallel" doesn't mean "free"**
- The "fan-out" pattern: kicking off N parallel calls and waiting for all of them
- How to model a typical API user: dashboard load = 5 parallel calls, profile click = 1 sequential call
- When to use `Promise.all`-style parallelism vs sequential vs pipelined

## Prerequisites

- Phases 9–13 (you understand load shapes, percentiles, threshold patterns)
- The QA Labs server running

## Concepts Explained

### Three request patterns

When a single user action triggers multiple API calls, the test should match the *real* pattern, not just "send N requests."

#### Sequential (request-then-request)

```
A ──┐
    ▼
    B ──┐
        ▼
        C
```

Total time = A + B + C. Each call waits for the previous one's response. This is slowest but unavoidable when **C depends on B's response**.

```javascript
// k6
const a = http.get('/api/user');
const b = http.get(`/api/user/${a.json('id')}/orders`);  // depends on A
const c = http.get(`/api/orders/${b.json('orders')[0].id}`);  // depends on B
```

#### Parallel (fan-out)

```
A ──┐
B ──┼──► all return
C ──┘
```

Total time = max(A, B, C). All three fire simultaneously; finishes when the slowest one returns. Use when **none of the calls depend on each other**.

```javascript
// k6 — http.batch sends all in parallel
const responses = http.batch([
  ['GET', '/api/dashboard/widgets'],
  ['GET', '/api/dashboard/notifications'],
  ['GET', '/api/dashboard/feed'],
]);
```

#### Pipelined / staggered

```
A ──────────►
   B ──────────►
      C ──────────►
```

Hybrid: subsequent requests start *before* the previous one finishes, but you wait for all of them. Useful for prefetching. Less common in test code; common in browser code.

### Why "parallel" still costs

Parallel doesn't mean free. Five parallel `http.batch` calls:
- Use 5× the connections (or pipeline through HTTP/2)
- Hit the server with a sudden burst (server CPU spike)
- May saturate the **client's** outbound bandwidth

If your test does 100 batches × 5 parallel = 500 simultaneous connections per VU, and you have 10 VUs, you're at 5000 simultaneous. Most servers don't like that.

### `http.batch` semantics

```javascript
const responses = http.batch([
  { method: 'GET', url: 'https://api.example.com/users' },
  { method: 'GET', url: 'https://api.example.com/posts' },
  { method: 'POST', url: 'https://api.example.com/event', body: JSON.stringify({}) },
]);

// responses is an array, same order as the input
console.log(responses[0].status); // 200
```

Each entry can be:
- A 2-element array `[method, url]`
- A 3-element array `[method, url, body]`
- A 4-element array `[method, url, body, params]`
- An object with `method`, `url`, `body`, `params` keys

All requests in the batch fire **at the same time**. Return is when the last one completes.

### Modeling a "dashboard load"

A dashboard typically:
1. Logs in (sequential, must complete first)
2. Fetches 4-6 widgets in parallel
3. Fetches user notifications in parallel with widgets
4. After all return, may make follow-up calls

```javascript
// 1. Auth (sequential)
const token = login();

// 2-3. Parallel dashboard load
const responses = http.batch([
  ['GET', `${BASE}/dashboard/widget-a`, null, { headers: authHeader(token) }],
  ['GET', `${BASE}/dashboard/widget-b`, null, { headers: authHeader(token) }],
  ['GET', `${BASE}/dashboard/widget-c`, null, { headers: authHeader(token) }],
  ['GET', `${BASE}/notifications`, null, { headers: authHeader(token) }],
]);

// 4. Conditional follow-up
if (responses[3].json('count') > 0) {
  http.get(`${BASE}/notifications/details`, { headers: authHeader(token) });
}
```

This realistically tests the dashboard endpoint — not by hammering it with N independent requests, but by simulating the **request shape** real users produce.

### Sequential and chained — when you must

Some flows are inherently sequential:
- Submit form → get ID → fetch details for that ID
- Create order → confirm payment → get receipt

Sequential calls have a **multiplier** effect on latency: if each is p95 = 200ms, three in series = p95 ≈ 600ms (slightly less due to percentile math, but close). One slow step ruins the whole flow.

### Artillery's `loop` and `parallel`

Artillery can do batches via `loop` (sequential repetition):

```yaml
- loop:
    - get: { url: "/api/widget-a" }
    - get: { url: "/api/widget-b" }
  count: 3
```

For true parallelism within a scenario, Artillery's options are limited — you'd run multiple parallel scenarios at the config level. **k6 wins for parallel-within-a-flow.**

## Exercises

1. **Sequential vs parallel.** Hit `/lab/echo` 3 times sequentially, then 3 times via `http.batch`. Compare iteration durations. With echo's near-zero latency the difference is small; try `/lab/slow?ms=200` for a clearer comparison.
2. **Realistic dashboard.** Log in to `/lab/auth/login`, then `http.batch` four GETs to `/lab/echo` (simulating widget loads) using the auth token. Assert all four are 200.
3. **Conditional follow-up.** If the auth user is "admin" (string match the username), fetch an extra endpoint after the batch. Otherwise skip.
4. **Cost of parallelism.** Run 50 VUs each doing batches of 10 parallel requests against `/lab/echo`. What's the actual concurrent connection count? (Hint: VUs × batch size.) Why might this overload a small dev server?

## Common Mistakes

- **Treating sequential as the default.** If A and B don't depend on each other, doing them sequentially needlessly doubles iteration latency.
- **Over-parallelizing.** Sending 50 parallel requests per iteration is rarely realistic; users don't do that.
- **Ignoring slow responses in a batch.** A `batch` of 5 returns when the slowest finishes — but if 1 request is timing out, all 5 in your test wait for it. Add per-request timeout.
- **Same `params` across batch entries.** Common bug: forget to pass tags per request, can't slice metrics by URL.

## Cheat Sheet

```javascript
// k6 batch
const res = http.batch([
  ['GET', `${BASE}/a`, null, { tags: { name: 'a' } }],
  ['GET', `${BASE}/b`, null, { tags: { name: 'b' } }],
]);

// Per-URL threshold via tags
thresholds: {
  'http_req_duration{name:a}': ['p(95)<200'],
  'http_req_duration{name:b}': ['p(95)<300'],
}
```

| Pattern | When | Total time |
|---------|------|------------|
| Sequential | Step N depends on step N-1 | Sum of all |
| Parallel (`http.batch`) | Steps are independent | Max of all |
| Pipelined | Prefetch / overlap-safe | Between sequential and parallel |
| Conditional follow-up | Some steps optional | Depends on branching |
