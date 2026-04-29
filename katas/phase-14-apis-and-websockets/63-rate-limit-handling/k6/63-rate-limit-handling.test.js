// Kata 63 — Rate Limit Handling (k6 solution)
//
// Three scenarios in one test, each demonstrating a different posture
// against the lab server's token-bucket rate limiter (5 RPS, capacity 5):
// - hammer:    naive — send as fast as possible, count 429s
// - respect:   send AT the rate limit, no 429s expected
// - backoff:   send over the limit but back off on 429 with jittered exponential

import http from 'k6/http';
import { sleep } from 'k6';
import { Counter } from 'k6/metrics';

const BASE_URL = __ENV.K6_BASE_URL || 'http://localhost:3000';
const URL = `${BASE_URL}/lab/limit`;

const rateLimitHits = new Counter('rate_limit_hits');
const successes = new Counter('successful_requests');
const giveUps = new Counter('gave_up_after_retries');

export const options = {
  // Scenarios run SEQUENTIALLY (via startTime) so each gets a fresh
  // rate-limit bucket. Running them in parallel would have them all
  // share one bucket and blur the per-strategy comparison.
  scenarios: {
    respect: {
      executor: 'constant-arrival-rate',
      rate: 4,             // just under the 5/sec limit
      timeUnit: '1s',
      duration: '10s',
      preAllocatedVUs: 5,
      exec: 'respectLimit',
      tags: { strategy: 'respect' },
      startTime: '0s',
    },
    hammer: {
      executor: 'constant-arrival-rate',
      rate: 20,            // 4× the limit — expect lots of 429s
      timeUnit: '1s',
      duration: '10s',
      preAllocatedVUs: 10,
      exec: 'hammerNaive',
      tags: { strategy: 'hammer' },
      startTime: '12s',    // 2s gap lets bucket refill before hammer
    },
    backoff: {
      executor: 'constant-vus',
      vus: 5,
      duration: '15s',
      exec: 'withBackoff',
      tags: { strategy: 'backoff' },
      startTime: '25s',    // gap lets bucket refill again
    },
  },
  thresholds: {
    // The 'respect' scenario should never hit a rate limit.
    'rate_limit_hits{strategy:respect}': ['count<5'],
    // The 'hammer' scenario will hit lots of 429s — that's the point.
    'rate_limit_hits{strategy:hammer}': ['count>50'],
    // The 'backoff' scenario should mostly succeed despite hitting limits.
    'successful_requests{strategy:backoff}': ['count>30'],
    // Don't include 429-fast-rejections in the latency story for served requests
    'http_req_duration{kind:served}': ['p(95)<300'],
  },
};

// Strategy 1: send naively, count what happens.
export function hammerNaive() {
  const res = http.get(URL, { tags: { kind: tagFor(URL) } });
  if (res.status === 429) rateLimitHits.add(1);
  else if (res.status === 200) successes.add(1);
}

// Strategy 2: stay under the limit. Should never see a 429.
export function respectLimit() {
  const res = http.get(URL, { tags: { kind: tagFor(URL) } });
  if (res.status === 429) rateLimitHits.add(1);
  else if (res.status === 200) successes.add(1);
}

// Strategy 3: send eagerly, but back off on 429 with jittered exponential.
export function withBackoff() {
  const MAX_RETRIES = 5;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const res = http.get(URL, { tags: { kind: tagFor(URL) } });

    if (res.status === 200) {
      successes.add(1);
      return;
    }

    if (res.status === 429) {
      rateLimitHits.add(1);
      // Exponential backoff with jitter: 0.2s, 0.4s, 0.8s, 1.6s, 3.2s … plus jitter
      const base = 0.2 * Math.pow(2, attempt);
      const jitter = Math.random() * base;
      sleep(base + jitter);
      continue;
    }

    // Any other status — give up
    return;
  }
  giveUps.add(1);
}

// Helper: in real code we'd tag based on response; for simplicity we
// just tag everything to /lab/limit as 'served' upfront. Server-side
// the request still hits the rate limiter; for accurate per-status
// segmentation, see kata 63's exercise 5 in the readme.
function tagFor(_url) {
  return 'served';
}
