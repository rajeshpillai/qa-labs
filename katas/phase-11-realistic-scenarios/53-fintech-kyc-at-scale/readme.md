# Kata 53: Fintech KYC at Scale

## What You Will Learn

- How to model a **multi-step user journey** as a single perf scenario
- **Capturing IDs** between requests (the response of step 1 feeds the URL of step 2)
- **Think time** — `sleep()` between steps to mimic real users
- **Per-step assertions and timings** — measure each leg of the funnel separately
- Building a **scenario weighting** profile that mirrors production: 80% complete, 10% bail at docs, 10% bail at video
- Reading **funnel completion rates** from custom metrics — your business cares about this number, not p95

## Prerequisites

- Completed [Kata 51](../51-parameterization-and-data-driven-tests/) and [Kata 52](../52-authentication-flows/)
- The QA Labs server running — exposes `/lab/kyc/*` (apply → documents → video → decision)

## Concepts Explained

### The KYC funnel

Most fintech onboarding flows look like this:

```
Apply  →  Upload docs  →  Video verify  →  Decision
 90%        85%             80%             75%
```

Each arrow is a drop-off. A perf test that goes **all the way through** every iteration ignores reality. You'd test the decision endpoint at 100% of traffic when production sees only 75%.

### Modeling the funnel in k6

Three approaches:

#### 1. Single scenario, capture IDs along the way

```javascript
export default function () {
  const apply = http.post(`${BASE_URL}/lab/kyc/apply`, JSON.stringify({ user: `u-${__VU}` }), opts);
  const id = apply.json('id');

  http.post(`${BASE_URL}/lab/kyc/${id}/documents`);
  http.post(`${BASE_URL}/lab/kyc/${id}/video`);
  http.post(`${BASE_URL}/lab/kyc/${id}/decision`);
}
```

Simple, but every iteration goes through 100% of the funnel. Doesn't match reality.

#### 2. Multiple scenarios with weighted volume

```javascript
export const options = {
  scenarios: {
    completes:        { executor: 'constant-arrival-rate', rate: 75, ... exec: 'fullFlow' },
    bails_at_docs:    { executor: 'constant-arrival-rate', rate: 15, ... exec: 'bailDocs' },
    bails_at_video:   { executor: 'constant-arrival-rate', rate: 5,  ... exec: 'bailVideo' },
    bails_at_apply:   { executor: 'constant-arrival-rate', rate: 5,  ... exec: 'bailApply' },
  },
};
```

Each scenario does a different prefix of the funnel. The `rate` per scenario adds up to 100 RPS, mimicking production drop-off. **This is the right way.**

#### 3. Single scenario with branching probability

```javascript
export default function () {
  const id = doApply();
  if (Math.random() > 0.10) doDocuments(id);
  else return;
  if (Math.random() > 0.05) doVideo(id);
  else return;
  doDecision(id);
}
```

Cheap to write, gives you the same drop-off pattern. Loses the per-stage-scenario metrics k6 produces automatically.

### Think time — `sleep()` between steps

Real users don't paste their ID, upload a doc, and complete a video selfie in 200ms. They take seconds-to-minutes between steps. Without `sleep()`, every VU hammers the system as fast as possible — producing spikes the system never sees in production.

```javascript
import { sleep } from 'k6';

http.post(`/lab/kyc/${id}/documents`);
sleep(2 + Math.random() * 5);  // 2–7s of "user thinking"
http.post(`/lab/kyc/${id}/video`);
```

**Don't go overboard with sleep.** If sleep dominates the iteration time, you need vastly more VUs to maintain RPS — and you're then spending memory just to wait around. Use the **open-model executors** (`constant-arrival-rate`) which don't care about per-iteration time.

### Per-step timings via `Trend`

You want to know p95 of each leg of the funnel separately. Use a `Trend` metric per step:

```javascript
import { Trend } from 'k6/metrics';
const tApply = new Trend('kyc_apply_ms', true);
const tDocs = new Trend('kyc_documents_ms', true);
const tVideo = new Trend('kyc_video_ms', true);
const tDecision = new Trend('kyc_decision_ms', true);

const res = http.post(/* apply */);
tApply.add(res.timings.duration);
```

Then thresholds per step:

```javascript
thresholds: {
  'kyc_apply_ms': ['p(95)<150'],
  'kyc_documents_ms': ['p(95)<300'],
  'kyc_video_ms': ['p(95)<1000'],
  'kyc_decision_ms': ['p(95)<500'],
}
```

If `kyc_video_ms` is the only one breaching, you know exactly which step regressed.

### Funnel completion rate

Track it as a `Rate`:

```javascript
import { Rate } from 'k6/metrics';
const completion = new Rate('kyc_completion');

// at the end of fullFlow:
completion.add(true);

// in any bail-out scenario:
completion.add(false);
```

Threshold: `'kyc_completion': ['rate>0.70']`. This is the *business* assertion — fail the perf test if the funnel completion rate drops below acceptable, regardless of latency.

## Exercises

1. **Build the weighted funnel.** Replicate the 75/15/5/5 split using four `constant-arrival-rate` scenarios. Total 100 RPS for 30 seconds.
2. **Add per-step think time.** 1–3s after apply, 3–8s after documents (uploads are slow), 5–15s after video.
3. **Measure funnel time end-to-end.** Custom Trend `kyc_total_funnel_ms` for VUs that complete. Compare to sum of per-step times — gap is total think time.
4. **Asymmetric latency.** What if `/lab/kyc/:id/decision` becomes 2× slower? Which threshold catches it first? Which catches it most clearly?

## Common Mistakes

- **Treating the whole flow as one HTTP request.** The flow is a sequence of HTTP requests; each has its own latency story.
- **Going 100% through every iteration.** Doesn't match production traffic shape; over-tests downstream steps.
- **No think time.** Hammers the system at iteration speed — every VU slams documents+video back-to-back.
- **One Trend for the whole flow.** Hides which step regressed.

## Cheat Sheet

| Concept | k6 mechanism |
|---------|--------------|
| Capture ID from response 1, use in URL of response 2 | `const id = res.json('id'); http.post(\`.../${id}/...\`)` |
| Think time | `sleep(seconds)` |
| Per-step latency | One `Trend` per step, threshold per metric |
| Funnel weight | Multiple scenarios with different `rate` |
| Drop-off rate | `Rate` metric, threshold `rate>0.X` |
