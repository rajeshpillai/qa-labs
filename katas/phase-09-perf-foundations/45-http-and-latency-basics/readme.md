# Kata 45: HTTP and Latency Basics

## What You Will Learn

- What an HTTP request actually does, end-to-end
- The difference between **latency** and **throughput** — why both matter
- How to measure response time with k6 and Artillery
- Reading a perf test summary: what the numbers mean
- Setting your first **threshold** so a test fails when latency regresses

## Prerequisites

- A working terminal
- [k6 installed](https://k6.io/docs/get-started/installation/) (`brew install k6` or download)
- [Artillery installed](https://www.artillery.io/docs/get-started/get-artillery) (`npm install -g artillery`)
- The QA Labs server running locally (`cd server && npm start`) — exposes `/lab/echo` at `http://localhost:3000`

## Concepts Explained

### What is an HTTP request?

When you type a URL or your test script makes a call, here's roughly what happens:

```
client                                     server
  |                                          |
  |-- DNS lookup (resolve hostname) -------->|
  |-- TCP handshake (3 round trips) -------->|
  |-- TLS handshake (1-2 round trips) ------>|
  |-- HTTP request (method + headers) ------>|
  |                                          | (server processes)
  |<------------------------------ response -|
```

Each of those steps has its own time. The total time, from the moment your client started until it received the last byte, is the **response time** (sometimes called **latency** in load testing — though strictly latency means the network round-trip, response time is the user-visible total).

### Latency vs throughput

These are different things and people confuse them constantly.

| Term | What it measures | Example |
|------|------------------|---------|
| **Latency** | How long a single request takes | "p95 was 250ms" |
| **Throughput** | How many requests per second the system handles | "We pushed 800 RPS" |
| **Concurrency** | How many requests are in flight at the same time | "100 virtual users" |

Higher throughput is good. Lower latency is good. **They are not the same thing** — a system can serve many requests slowly (high throughput, high latency) or one request quickly (low throughput, low latency). A good system is high throughput AND low latency.

### Reading a k6 summary

After running a test, k6 prints something like:

```
http_req_duration..........: avg=12.3ms  min=4ms  med=10ms  max=120ms  p(90)=22ms  p(95)=35ms
http_reqs..................: 4523    150.7/s
iterations.................: 4523    150.7/s
```

What each row means:
- `http_req_duration` — response time for each HTTP request. The **avg, min, max, med, p(90), p(95)** are different summary statistics. Don't trust avg alone — see kata 46.
- `http_reqs` — total number of requests made AND throughput in requests per second.
- `iterations` — how many times your test function ran. Often equals `http_reqs` if your script makes one request per iteration.

### Thresholds — making the test pass or fail

A perf test that just *measures* without judging is useless in CI. You need **thresholds** that say "this test fails if p95 latency exceeds 200ms":

```javascript
export const options = {
  thresholds: {
    http_req_duration: ['p(95)<200'],
  },
};
```

If p95 of `http_req_duration` is below 200ms, the threshold passes. Otherwise the test exits with a non-zero status code — and your CI pipeline fails, just like a unit test.

## Exercises

1. **Smoke run** — Run the k6 test against `/lab/echo`. Note the avg, p95, and throughput.
2. **Compare endpoints** — Modify the URL to hit `/lab/slow?ms=200` instead. How do the numbers change? Which metric changed the most?
3. **Tighten the threshold** — Set `p(95)<150` and run against `/lab/slow?ms=200`. The test should fail. Read the failure message.
4. **Throughput question** — With 5 VUs (virtual users) running for 10 seconds against `/lab/echo`, what throughput do you observe? Does doubling the VUs double the throughput? (It usually does, until something saturates.)

## Common Mistakes

- **Reading the average without the percentiles.** The average smooths over outliers — your p99 user might be having a terrible time.
- **Not setting any threshold.** A test that always "passes" because it never asserts anything is theatre.
- **Confusing concurrency with throughput.** 100 VUs running once each takes time = throughput depends on per-request latency, not just VU count.
