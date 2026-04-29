// Kata 62 — WebSocket Testing (k6 solution)
//
// Connects to ws://localhost:3000/lab/ws, sends 10 ping messages spaced
// 100ms apart, measures roundtrip latency. Each VU holds one socket
// for 3 seconds.
//
// To find connection capacity, switch to the `ramping_connections`
// scenario by uncommenting it below.

import ws from 'k6/ws';
import { check } from 'k6';
import { Trend, Counter } from 'k6/metrics';

const BASE_HTTP = __ENV.K6_BASE_URL || 'http://localhost:3000';
const WS_URL = BASE_HTTP.replace(/^http/, 'ws') + '/lab/ws';

const wsRoundtrip = new Trend('ws_roundtrip_ms', true);
const wsConnectErrors = new Counter('ws_connect_errors');
const wsMessages = new Counter('ws_messages_received');

export const options = {
  scenarios: {
    echo_latency: {
      executor: 'constant-vus',
      vus: 10,
      duration: '15s',
    },
    // Uncomment to find connection capacity:
    // ramping_connections: {
    //   executor: 'ramping-vus',
    //   startVUs: 0,
    //   stages: [
    //     { duration: '15s', target: 50 },
    //     { duration: '15s', target: 200 },
    //     { duration: '15s', target: 500 },
    //   ],
    // },
  },
  thresholds: {
    'ws_roundtrip_ms': ['p(95)<100'],
    'ws_connect_errors': ['count<5'],
    // Each VU connects ~5 times in 15s; we expect at least the hello frames
    // back. Real-world tests would assert on roundtrip metrics, not raw count.
    'ws_messages_received': ['count>=10'],
  },
};

export default function () {
  // Map of seq → sentAt so we can compute roundtrip when the echo arrives.
  const pendingSends = new Map();

  const res = ws.connect(WS_URL, {}, function (socket) {
    socket.on('open', () => {
      // Send 10 messages, 100ms apart. k6 v2 requires setTimeout > 0,
      // so send the first one immediately and schedule the rest.
      const sendOne = (seq) => {
        if (socket.readyState !== 1) return;  // not OPEN
        const sentAt = Date.now();
        pendingSends.set(seq, sentAt);
        socket.send(JSON.stringify({ seq, sentAt }));
      };
      sendOne(0);
      for (let i = 1; i < 10; i++) {
        socket.setTimeout(() => sendOne(i), i * 100);
      }
    });

    socket.on('message', (raw) => {
      wsMessages.add(1);
      try {
        const msg = JSON.parse(raw);
        if (msg.type === 'hello') return;  // server greeting on connect
        if (msg.type === 'echo') {
          // Server wraps our text inside { type: 'echo', msg: <our text> }
          const original = JSON.parse(msg.msg);
          if (typeof original?.seq === 'number') {
            const sentAt = pendingSends.get(original.seq);
            if (sentAt) {
              wsRoundtrip.add(Date.now() - sentAt);
              pendingSends.delete(original.seq);
            }
          }
        }
      } catch {
        // Ignore non-JSON frames
      }
    });

    socket.on('error', (e) => {
      console.log('WS error:', e?.error || e);
      wsConnectErrors.add(1);
    });

    // Force-close after 3s — caps iteration duration.
    socket.setTimeout(() => socket.close(), 3000);
  });

  check(res, {
    'ws connect ok (status 101)': (r) => r && r.status === 101,
  });
}
