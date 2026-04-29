# Kata 63: Rate Limit Handling

## What You Will Learn

- The three common rate-limit response shapes: **`429 Too Many Requests`**, **`Retry-After` header**, and **silent slowdown**
- How to write a load test that **respects** rate limits (so you measure the rate-limited endpoint, not just hammer it)
- The "retry storm" anti-pattern and why naive retries make things worse
- **Token bucket** vs **fixed window** vs **leaky bucket** — what each looks like under load
- Backoff strategies: linear, exponential, jittered exponential
- How to test that your **client code** handles rate limits gracefully (separate from "does the server enforce them")

## Prerequisites

- Phases 9–13
- The QA Labs server running — exposes `/lab/limit` (token bucket: 5 req/sec per IP)

## Concepts Explained

### Rate limiting: server side

Most public APIs limit requests per client. Common implementations:

| Algorithm | How | Behavior under burst |
|-----------|-----|---------------------|
| **Token bucket** | Refill N tokens/sec; each request consumes one | Allows short bursts up to bucket capacity |
| **Fixed window** | Count requests per minute; reset at minute boundary | Hard cliff at boundary; "thundering herd" risk |
| **Sliding window** | Rolling count over the last N seconds | Smoother, more accurate, more expensive to compute |
| **Leaky bucket** | Requests queue, drained at fixed rate | Adds latency before rejection |

The lab server's `/lab/limit` is **token bucket**: 5 requests/sec per IP, capacity 5 tokens. Send a burst of 10 → first 5 accepted, rest get 429.

### Rate limiting: response shape

Three patterns the client must recognize:

#### 1. `429 Too Many Requests`

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 1
Content-Type: application/json

{"error": "rate limit exceeded", "retryAfterMs": 1000}
```

The standard. `Retry-After` is the spec-compliant way to say "wait this long."

#### 2. Silent slowdown / queueing

The server queues your request internally and responds slowly (200 but takes 5s). No 429. Hard to detect from the client side; looks like server is "just slow." Common with leaky-bucket implementations.

#### 3. Connection drop

Server closes the TCP connection without responding. Manifests as `ECONNRESET` or `ETIMEDOUT` in your client.

### How to test rate-limited endpoints

Two distinct things you might want to measure:

#### A. Does the rate limiter work as specified?

Hammer the endpoint with bursts, count how many 429s you get. Should match your config:
- Limit: 5 RPS
- Duration: 10s
- Total requests: 50
- Expected accepted: 50 (5 × 10)
- Expected 429s: 0 (we never exceeded)

Then bump to 20 RPS for 10s → expected accepted: 50, expected 429s: 150.

#### B. Does the system perform under rate-limited load?

If you're load-testing an endpoint that has a rate limit, you have two options:

1. **Stay under the limit.** Your test sends 5 RPS. You're testing the endpoint, not the rate limiter.
2. **Probe up to the limit.** Send 6 RPS, accept that 17% will be 429s. Assert that latency for the **accepted** requests is fine.

### Backoff strategies

When you get a 429, you must wait before retrying. Three strategies:

```javascript
// 1. Fixed delay — usually wrong, can cause synchronization
sleep(1.0);

// 2. Linear backoff — wait i seconds on the i-th retry
sleep(retryCount * 1.0);

// 3. Exponential backoff — doubles each retry
sleep(2 ** retryCount);

// 4. Exponential with jitter — adds randomness to break sync
const base = 2 ** retryCount;
sleep(base + Math.random() * base);
```

**Always use jittered exponential** unless you have a specific reason not to. Without jitter, all rate-limited clients retry at the same instant, slamming the server again.

### The retry storm

Anti-pattern: client gets 429, retries immediately, gets 429, retries again. Now the server gets **3× requests for 0× successful work.**

```javascript
// DO NOT DO THIS
for (let i = 0; i < 100; i++) {
  let res = http.get(url);
  while (res.status === 429) {
    res = http.get(url);  // ← retry storm
  }
}
```

Always cap retries (5 max) and add backoff. Better: respect `Retry-After` if the server provides it.

### Testing client-side handling

You can configure k6 to follow `Retry-After` automatically — but in real use you usually want to **validate** your client code handles 429s correctly. So write the test such that the rate-limited responses surface and you assert recovery behavior:

```javascript
const res = http.get(url);
if (res.status === 429) {
  rateLimitHits.add(1);  // counter
  const retryAfter = parseInt(res.headers['Retry-After'] ?? '1') * 1000;
  sleep(retryAfter / 1000);
  // Retry once
  const retryRes = http.get(url);
  check(retryRes, { 'retry succeeded': (r) => r.status === 200 });
}
```

### Tagging rate-limited responses

Crucial for clean metrics: **don't include 429s in your latency p95 for the endpoint.** A 429 is fast (the rate limiter rejects without doing real work), so it'll artificially improve your latency stats while hiding the actual problem.

```javascript
const res = http.get(url, { tags: { kind: res.status === 429 ? 'limited' : 'served' } });
// Then in thresholds:
'http_req_duration{kind:served}': ['p(95)<300'],
'http_req_failed{kind:served}': ['rate<0.01'],
```

(Note: tags can be set after the request via response handling — but the practical pattern is to tag based on the request, then segment metrics in your analysis.)

## Exercises

1. **Verify the rate limit.** Send 20 requests as fast as possible to `/lab/limit`. How many 200s? How many 429s? Should be ~5 of the first batch + slowly accumulating thereafter.
2. **Sustain at the limit.** Send exactly 5 RPS for 10 seconds. Should produce 50 successes, 0 failures. (Boundary effects mean it may not be exactly that — within ±2 is acceptable.)
3. **Implement exponential backoff.** When you hit 429, sleep `2 ** retryCount` seconds (cap at 8s) and retry. Measure how many requests eventually succeeded.
4. **Add jitter.** Compare your exercise 3 results vs adding `+ Math.random() * 2` to the backoff. Does jitter improve total throughput?
5. **Detect silent slowdown.** Hit `/lab/jitter?p50=50&p95=2000` instead of `/lab/limit`. The server doesn't return 429 but is slow under load. How would you detect "we're rate-limited via slowdown" vs "the server is just slow"?

## Common Mistakes

- **Treating 429 as success.** `http_req_failed` may not include 429 by default in some configs — verify your tagging.
- **Retrying without backoff.** Retry storm — see above.
- **Ignoring `Retry-After`.** The server told you when to retry. Listen.
- **Mixing rate-limit retries into your latency metric.** Tag and segment.
- **Testing rate limiter at exactly the limit.** Boundary effects — test slightly under and slightly over to see clear behavior.

## Cheat Sheet

```javascript
// k6 — rate-limited endpoint with backoff
import http from 'k6/http';
import { sleep } from 'k6';
import { Counter } from 'k6/metrics';

const limited = new Counter('rate_limit_hits');

function getWithRetry(url, maxRetries = 3) {
  for (let i = 0; i <= maxRetries; i++) {
    const res = http.get(url);
    if (res.status !== 429) return res;
    limited.add(1);
    const retryAfter = parseFloat(res.headers['Retry-After'] ?? '1');
    const jittered = retryAfter * (1 + Math.random());  // jitter
    sleep(jittered);
  }
  return http.get(url); // give up — return whatever we get
}
```

| Algorithm | Best for | Watch out for |
|-----------|----------|---------------|
| Token bucket | Bursty traffic | Burst size matters as much as rate |
| Fixed window | Simple, fast | Boundary spike |
| Sliding window | Accuracy | More expensive |
| Leaky bucket | Smooth output | Adds latency |

| Backoff | When |
|---------|------|
| Fixed | Almost never — causes sync |
| Linear | Light retries (1-3 attempts) |
| Exponential | More aggressive retries |
| Exponential + jitter | **Default choice** |
