# Kata 69: Fault Injection with Toxiproxy

## What You Will Learn

- Why **chaos testing** belongs alongside load testing — not as a separate discipline
- **Toxiproxy** as a small, scriptable network-fault proxy you can put in front of any TCP service
- The seven Toxiproxy "toxics" that simulate real-world failures: latency, slow_close, timeout, slicer, bandwidth, etc.
- The **inject → measure → recover** test pattern
- Why "chaos in dev" is cheap and "chaos in prod" needs a bigger stack (Gremlin, AWS FIS, chaos-mesh)
- Using QA Labs's `/lab/flaky` and `/lab/slow` as a simpler simulation when you don't want to spin up Toxiproxy

## Prerequisites

- Phase 16 (you have a sense of how to observe perf during a test)
- Optional: [Toxiproxy installed](https://github.com/Shopify/toxiproxy) — `brew install toxiproxy` or download from releases
- The QA Labs server running (we'll use `/lab/flaky` + `/lab/slow` as the kata's primary fault source — Toxiproxy patterns covered in the readme as the production-grade upgrade)

## Concepts Explained

### Why fault inject during load tests?

Most perf tests assume a happy path: the network is fine, the database is up, downstream services respond. **Production isn't like that.** Real perf properties only show up under faults:

- "p95 is 200ms when everything works" — meaningless
- "p95 is 250ms when 5% of requests fail" — useful
- "p95 stays under 500ms when the DB has 500ms added latency" — what you actually want to know

Combining load + faults is **chaos load testing**: how does your system behave when stressed AND broken simultaneously?

### Toxiproxy: the smallest chaos tool

Toxiproxy is a TCP proxy with toggleable "toxics." Sit it between client and server, then add toxics via a CLI or HTTP API:

```bash
toxiproxy-cli create -l :26379 -u :6379 my-redis
toxiproxy-cli toxic add -t latency -a latency=500 my-redis  # +500ms on every response
toxiproxy-cli toxic add -t timeout -a timeout=1000 my-redis # close after 1s
```

Tests connect to `localhost:26379` instead of `localhost:6379`. Toxiproxy adds the chaos.

### The seven toxics

| Toxic | What it does |
|-------|--------------|
| `latency` | Adds fixed delay (with optional jitter) |
| `bandwidth` | Limits throughput |
| `slow_close` | Delays connection close (forces clients to wait) |
| `timeout` | Closes the connection after N ms |
| `slicer` | Splits TCP packets to simulate slow networks |
| `down` | Drops all packets — service appears down |
| `limit_data` | Sets a maximum bytes-per-connection budget |

Each can be added/removed via API at runtime — perfect for "inject, measure, remove" patterns inside a test.

### Inject → measure → recover

```javascript
// Pseudo-pattern; real code calls Toxiproxy's HTTP API
beforeAll(() => addToxic('redis', 'latency', { latency: 500 }));
afterAll(() => removeToxic('redis', 'latency'));

// During the test, your service is talking to Redis with +500ms.
// Measure how the service degrades.
```

In k6, you'd add an `setup()` function that calls Toxiproxy's HTTP API before VUs start, and `teardown()` that cleans up. This way the chaos is part of the test definition.

### When you don't want to run Toxiproxy

For a workshop or quick experiments, the QA Labs server bakes some of the same chaos into endpoints:

- `/lab/slow?ms=500` — fixed latency injection (toxic: latency)
- `/lab/jitter?p50=&p95=` — distribution-based latency
- `/lab/flaky?errorRate=0.1` — random errors (toxic: down, partial)
- `/lab/limit` — rate-limit responses

The kata's solution uses these for runnable katas. The **readme exercises** include real Toxiproxy setup for when you want to do this against your own infra.

### What chaos load tests find

Bugs invisible without faults:

| Bug | How chaos testing exposes it |
|-----|------------------------------|
| **No connection timeout** | When the dependency is slow, your service threads pile up forever |
| **No retry budget** | A flaky dep triggers infinite retries, amplifying the load 10× |
| **Cascading failure** | One slow dep makes another time out, cascade to system-wide outage |
| **Bad fallback** | Fallback path is slower than primary; worse than a timely failure |
| **Bad health checks** | Service marks itself healthy while dependency is down |
| **Memory growth on errors** | Each failed request leaks memory; minutes-long fault → OOM |

### From Toxiproxy to production chaos

Toxiproxy is great for dev/CI. For production-grade chaos:

| Tool | Scope |
|------|-------|
| **Toxiproxy** | TCP-level, single host, scripted |
| **chaos-mesh** | Kubernetes-native, pod/network/IO faults |
| **Gremlin** | Hosted, multi-cloud, scheduled |
| **AWS Fault Injection Simulator** | AWS-native, aware of AZs/regions |
| **Litmus** | OSS K8s chaos with predefined experiments |

Concepts transfer; depth and integration differ.

## Exercises

1. **Latency injection.** Run the kata's k6 spec. It hits `/lab/slow?ms=500`. Measure p95 — should be ~500ms+ (server-side delay + network). Now hit `/lab/echo` and compare.
2. **Random errors.** Modify the spec to hit `/lab/flaky?errorRate=0.1` for 30 seconds. What's `http_req_failed`? Does it match the configured 10%? (Within a few percent due to small samples.)
3. **Compounding faults.** Hit `/lab/slow?ms=200` *and* `/lab/flaky?errorRate=0.05` in a 50/50 split. Now you have BOTH high latency and errors. p95 and error rate should both reflect.
4. **Real Toxiproxy.** Install Toxiproxy and put it in front of `/lab/echo`. Add `+200ms` latency via the CLI. Hit it from k6. Does latency match?
5. **Recovery test.** Inject a fault for 15s, remove it for 15s. Compare p95 in each phase via tags `phase:injected` vs `phase:clean`.

## Common Mistakes

- **Forgetting to remove toxics.** A toxic added in `setup()` and not removed in `teardown()` will haunt the next test run.
- **Injecting too much fault at once.** "Everything's broken" tests rarely reflect reality. Inject one fault at a time, see how the system reacts, layer up.
- **Asserting same SLO under chaos.** Of course p95 is worse with +500ms latency injected. Tag the chaos period and assert *recovery* SLO, not in-chaos SLO.
- **Testing chaos in prod without coordination.** Different blast radius — needs careful scoping, not "let's break some pods."

## Cheat Sheet

```bash
# Toxiproxy CLI quick start
toxiproxy-server &                                  # daemon on :8474
toxiproxy-cli create -l :26379 -u :6379 my-cache    # proxy redis on :26379
toxiproxy-cli toxic add -t latency -a latency=500 my-cache
toxiproxy-cli toxic add -t down my-cache            # take it offline
toxiproxy-cli toxic remove -n latency_downstream my-cache
toxiproxy-cli list
```

```javascript
// k6 with HTTP-API-driven Toxiproxy (real version)
import http from 'k6/http';

export function setup() {
  http.post('http://localhost:8474/proxies/my-cache/toxics', JSON.stringify({
    name: 'latency_downstream',
    type: 'latency',
    attributes: { latency: 500 },
  }), { headers: { 'Content-Type': 'application/json' } });
}

export function teardown() {
  http.del('http://localhost:8474/proxies/my-cache/toxics/latency_downstream');
}
```

| Toxic | Real-world equivalent |
|-------|------------------------|
| `latency` | DB slow-down, network congestion |
| `down` | Service crash |
| `slicer` | Slow client / phone on 3G |
| `timeout` | Half-open connections, NAT drops |
| `slow_close` | Server backend stuck closing |
