// Kata 70 — Retry Storms and Circuit Breakers
//
// Three side-by-side strategies against /lab/flaky:
// - naive_retries: retry up to 3× immediately on failure (anti-pattern)
// - backoff:       retry up to 3× with jittered exponential backoff
// - breaker:       circuit breaker — fast-fail once enough failures accumulate

import http from 'k6/http';
import { sleep } from 'k6';
import { Counter, Rate } from 'k6/metrics';

const BASE_URL = __ENV.K6_BASE_URL || 'http://localhost:3000';
const URL = `${BASE_URL}/lab/flaky?errorRate=0.4`;

const totalAttempts = new Counter('total_attempts');
const breakerRejects = new Counter('breaker_rejects');
const successRate = new Rate('successful_requests');

export const options = {
  scenarios: {
    naive_retries: {
      executor: 'constant-vus',
      vus: 5,
      duration: '15s',
      exec: 'naiveRetries',
      tags: { strategy: 'naive' },
    },
    backoff: {
      executor: 'constant-vus',
      vus: 5,
      duration: '15s',
      exec: 'withBackoff',
      tags: { strategy: 'backoff' },
    },
    breaker: {
      executor: 'constant-vus',
      vus: 5,
      duration: '15s',
      exec: 'withBreaker',
      tags: { strategy: 'breaker' },
    },
  },
  thresholds: {
    // Same per-strategy success rate target — apples-to-apples comparison
    'successful_requests{strategy:naive}': ['rate>0.50'],
    'successful_requests{strategy:backoff}': ['rate>0.50'],
    'successful_requests{strategy:breaker}': ['rate>0.50'],
    // Breaker should aggressively reject when it's open — count must be visible
    'breaker_rejects': ['count>5'],
  },
};

// Strategy 1: hammer + retry. Amplifies load.
export function naiveRetries() {
  for (let i = 0; i < 4; i++) {
    totalAttempts.add(1);
    const res = http.get(URL);
    if (res.status === 200) {
      successRate.add(true);
      return;
    }
    // No backoff — retry immediately. THIS IS THE ANTI-PATTERN.
  }
  successRate.add(false);
}

// Strategy 2: jittered exponential backoff. Spreads retries over time.
export function withBackoff() {
  for (let i = 0; i < 4; i++) {
    totalAttempts.add(1);
    const res = http.get(URL);
    if (res.status === 200) {
      successRate.add(true);
      return;
    }
    if (i < 3) {
      const base = 0.1 * Math.pow(2, i);   // 100ms, 200ms, 400ms
      const jitter = Math.random() * base;
      sleep(base + jitter);
    }
  }
  successRate.add(false);
}

// Strategy 3: per-VU circuit breaker. After N failures, fast-fail.
// State is per-VU because each k6 VU has its own JS runtime.
const THRESHOLD = 5;
const COOLDOWN_MS = 3000;
let breakerState = 'closed';
let consecutiveFails = 0;
let openedAt = 0;

export function withBreaker() {
  totalAttempts.add(1);

  // Check if we should fast-fail
  if (breakerState === 'open') {
    if (Date.now() - openedAt < COOLDOWN_MS) {
      breakerRejects.add(1);
      successRate.add(false);
      return;
    }
    breakerState = 'half-open';
  }

  const res = http.get(URL);

  if (res.status === 200) {
    consecutiveFails = 0;
    breakerState = 'closed';
    successRate.add(true);
  } else {
    consecutiveFails++;
    if (consecutiveFails >= THRESHOLD) {
      breakerState = 'open';
      openedAt = Date.now();
    }
    successRate.add(false);
  }
}
