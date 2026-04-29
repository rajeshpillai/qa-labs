// Kata 55 — Stress and Breakpoint Test (k6 solution)
//
// Staircase pattern: 50 → 500 RPS in 50-step increments, holding each
// step for 30s to gather stable percentiles. Aborts early if error
// rate climbs over 50% — no point continuing past breakpoint.
//
// Tag each step so the summary shows per-step latency. After running,
// scan the per-step p(95) values to identify capacity, knee, breakpoint.

import http from 'k6/http';
import { check } from 'k6';

const BASE_URL = __ENV.K6_BASE_URL || 'http://localhost:3000';
const STEPS = [50, 100, 150, 200, 250, 300, 350, 400, 450, 500];
const STEP_DURATION_S = 30;

// Build the stages array dynamically — small ramp between each step,
// then sustained plateau.
function buildStages() {
  const stages = [];
  let prev = 0;
  for (const target of STEPS) {
    stages.push({ duration: '5s', target });           // brief ramp
    stages.push({ duration: `${STEP_DURATION_S}s`, target });  // plateau
    prev = target;
  }
  return stages;
}

export const options = {
  scenarios: {
    staircase: {
      executor: 'ramping-arrival-rate',
      startRate: 0,
      timeUnit: '1s',
      preAllocatedVUs: 100,
      maxVUs: 500,
      stages: buildStages(),
    },
  },
  thresholds: {
    // Abort the test if error rate exceeds 50% — system is broken,
    // no point pushing further. delayAbortEval gives 10s grace at start.
    'http_req_failed': [
      {
        threshold: 'rate<0.50',
        abortOnFail: true,
        delayAbortEval: '10s',
      },
    ],
    // Whole-test threshold — informational, won't fail the test.
    'http_req_duration': ['p(95)<5000'],
  },
};

const TEST_START = Date.now();

// Compute the current step based on elapsed time.
// Each step is (5s ramp + 30s plateau) = 35s.
function currentStep() {
  const elapsedMs = Date.now() - TEST_START;
  const stepIndex = Math.floor(elapsedMs / 35_000);
  return STEPS[Math.min(stepIndex, STEPS.length - 1)];
}

export default function () {
  const step = currentStep();
  const res = http.get(`${BASE_URL}/lab/jitter?p50=50&p95=200`, {
    tags: { step: `rps_${step}` },
  });
  check(res, {
    'status is 200': (r) => r.status === 200,
  });
}
