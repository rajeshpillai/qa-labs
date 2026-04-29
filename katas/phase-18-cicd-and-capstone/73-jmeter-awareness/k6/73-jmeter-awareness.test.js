// Kata 73 — JMeter Awareness (k6 equivalent)
//
// This is the same test as the kata's 73-smoke-test.jmx, translated to
// k6. Use it as a Rosetta Stone: read the JMX in the kata's `jmeter/`
// folder, then read this file, and the JMX → k6 mapping should click.

import http from 'k6/http';
import { check } from 'k6';

const BASE_URL = __ENV.K6_BASE_URL || 'http://localhost:3000';

export const options = {
  // Equivalent of <ThreadGroup>: 5 threads, 30s duration, 5s ramp.
  // (k6's `ramp-up` is a separate scenario primitive; for a simple 1:1
  // map we use stages.)
  scenarios: {
    smoke: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '5s', target: 5 },    // ramp_time
        { duration: '30s', target: 5 },   // duration
      ],
    },
  },
  thresholds: {
    // Equivalent of the JMX <ResponseAssertion>: status code matches 200
    'http_req_failed': ['rate<0.01'],
    'http_req_duration': ['p(95)<500'],
  },
};

export default function () {
  // Equivalent of <HTTPSamplerProxy>: GET /lab/echo
  const res = http.get(`${BASE_URL}/lab/echo`);
  check(res, {
    'status is 200': (r) => r.status === 200,
  });
}
