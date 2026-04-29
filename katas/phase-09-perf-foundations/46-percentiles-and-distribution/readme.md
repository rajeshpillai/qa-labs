# Kata 46: Percentiles and Distribution

## What You Will Learn

- Why **the average is the wrong metric** for response times
- What p50, p95, p99 actually measure — and which one matters for your users
- How to read a long-tail distribution and spot outliers
- Setting **per-percentile thresholds** in k6 and Artillery
- Why "two nines" of fast response is not the same as "p99 of fast response"

## Prerequisites

- Completed [Kata 45 (HTTP and Latency Basics)](../45-http-and-latency-basics/)
- The QA Labs server running locally — you'll hit `/lab/jitter` which simulates real-world latency variability

## Concepts Explained

### Why averages lie

Imagine 10 requests with these response times (ms):

```
50, 50, 50, 50, 50, 50, 50, 50, 50, 5000
```

- **Average:** 545ms
- **p50 (median):** 50ms
- **p95:** 5000ms (the 9th-and-up values are at or above the 95th percentile in a small sample)
- **p99:** 5000ms

If you only watched the average, you'd think "545ms — meh, not great but not terrible." But 1 in 10 of your users got a 5-second response. That's the user who closes the tab and never comes back.

> **Rule of thumb:** averages are for marketing slides. Engineers track percentiles.

### What each percentile means

| Percentile | Meaning | When to use |
|------------|---------|-------------|
| **p50 (median)** | Half your users got this fast or faster | "Typical" experience |
| **p95** | 95% of users got this fast or faster (5% had it worse) | Most common SLO target |
| **p99** | Only 1% of users had it worse | High-traffic systems where 1% = thousands of users |
| **p99.9** | "Three nines" tail | Critical-path systems (payments, auth) |

If your system handles 1 million requests/day:
- p99 = 200ms means **10,000 requests/day were slower than 200ms**
- p99.9 = 200ms means **1,000 requests/day were slower than 200ms**

That difference matters a lot.

### Reading a distribution

A response time distribution often looks like this (frequency on Y, response time on X):

```
freq │
     │ ▓▓▓
     │ ▓▓▓▓
     │ ▓▓▓▓▓
     │ ▓▓▓▓▓▓
     │ ▓▓▓▓▓▓▓ ▓
     │ ▓▓▓▓▓▓▓▓▓▓        ▓                ▓
     └────────────────────────────────────────────►
       fast                                slow
       └── p50 ──┘
                    └── p95 ──┘
                                            └ p99
```

The **long tail** on the right is where bad user experiences hide. A test that looks fine at p50 can have a terrible tail. The whole point of percentile-based thresholds is to catch tail regressions.

### k6 threshold syntax

```javascript
export const options = {
  thresholds: {
    http_req_duration: [
      'p(50)<100',  // median under 100ms
      'p(95)<300',  // 95% under 300ms
      'p(99)<800',  // 99% under 800ms
    ],
  },
};
```

Each entry is a separate threshold — k6 evaluates them independently. If any fails, the test fails.

### Artillery threshold syntax

```yaml
config:
  ensure:
    p50: 100
    p95: 300
    p99: 800
```

## Exercises

1. **Hit `/lab/jitter?p50=50&p95=400`.** What does k6 report for p50, p95, p99? Does it match what the server is told to do?
2. **Crank `p95` to 2000 in the URL.** Now p99 in the result will be way out — it's the tail of the tail.
3. **Tighten thresholds** so the test passes for `p50=50&p95=400` but fails for `p50=50&p95=600`. This is what catching a regression looks like.
4. **Why does p99 sometimes look unstable across runs?** (Hint: how many samples land in the top 1% of a 5-second test at low VU count?)

## Common Mistakes

- **Reporting only p50.** Half of users had it worse — that's not "typical", that's "the lucky half".
- **Setting thresholds on average instead of percentiles.** Average smooths the tail; you'll miss regressions that only affect 5% of traffic.
- **Treating p99 from short tests as accurate.** With few samples, p99 has high variance. Run longer tests for tail metrics.

## Cheat Sheet

| Want to know... | Look at... |
|-----------------|-----------|
| Typical user experience | p50 |
| Almost-everyone's experience | p95 |
| Worst-case for high-volume systems | p99, p99.9 |
| Whether the test had outliers | max vs p99 |
| Whether avg is hiding something | (avg − p50) — large gap = skew |
