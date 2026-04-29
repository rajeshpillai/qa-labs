# Kata 62: WebSocket Testing

## What You Will Learn

- Why WebSocket load testing is fundamentally different from HTTP
- The k6 `ws` module: connecting, sending, receiving, closing
- Measuring **roundtrip latency** for echo-style protocols
- Testing **connection capacity**: how many concurrent sockets can the server hold?
- Handling **server-pushed messages** (the WS-specific part of the test)
- Why open-model load makes no sense for WebSocket — closed model is correct

## Prerequisites

- Phases 9–13
- The QA Labs server running (exposes a WebSocket at `ws://localhost:3000/lab/ws`)
- Familiarity with the WebSocket protocol basics (handshake, frames, close codes)

## Concepts Explained

### Why WebSocket is different

HTTP is **request-response**: every metric is per-request. WebSocket is a **persistent connection** with bidirectional messaging. Different metrics matter:

| HTTP cares about | WebSocket cares about |
|------------------|----------------------|
| RPS, p95 latency | Connections held, message rate |
| Time to first byte | Time to first frame after open |
| HTTP status codes | Close codes, ping/pong cadence |
| Per-request errors | Per-connection drops |

Most importantly: **a WebSocket test holds connections open**. You can't ramp up "RPS" because requests don't really exist; you ramp up **connection count**.

### The k6 `ws` module

```javascript
import ws from 'k6/ws';

export default function () {
  const url = 'ws://localhost:3000/lab/ws';
  const params = { tags: { kind: 'echo' } };

  // Connect; the callback runs once per VU iteration
  const res = ws.connect(url, params, function (socket) {
    socket.on('open', () => {
      socket.send('hello');
    });

    socket.on('message', (msg) => {
      console.log('received:', msg);
    });

    socket.on('close', () => {
      console.log('connection closed');
    });

    socket.setTimeout(() => socket.close(), 5000);
  });
}
```

`ws.connect` is **synchronous from the test's perspective** — the iteration doesn't return until the socket closes.

### The lab server's `/lab/ws` endpoint

Hits `ws://localhost:3000/lab/ws`. Behavior:
- On connect, server sends `{ "type": "hello", "ts": <ts> }` immediately
- Plain text messages are echoed back as `{ "type": "echo", "msg": "<your text>", "ts": <ts> }`
- Send `{ "op": "slow", "ms": 500 }` → server waits 500ms before echoing
- Send `{ "op": "broadcast", "msg": "hi" }` → server forwards to ALL connected clients

This lets you test echo latency, latency injection, and broadcast fan-out in one endpoint.

### Measuring roundtrip latency

Track time from `send` to `message` for each frame:

```javascript
import { Trend } from 'k6/metrics';
const wsLatency = new Trend('ws_roundtrip_ms', true);

ws.connect(url, params, function (socket) {
  socket.on('open', () => {
    for (let i = 0; i < 10; i++) {
      const start = Date.now();
      socket.setTimeout(() => {
        socket.send(JSON.stringify({ seq: i, sentAt: start }));
      }, i * 100);  // send every 100ms
    }
  });

  socket.on('message', (raw) => {
    const msg = JSON.parse(raw);
    if (msg.type === 'echo') {
      const original = JSON.parse(msg.msg);
      wsLatency.add(Date.now() - original.sentAt);
    }
  });

  socket.setTimeout(() => socket.close(), 3000);
});
```

`ws_roundtrip_ms` becomes a custom Trend metric you can threshold on.

### Closed-model is the only option for WS

You can't say "100 RPS" for WebSocket — there are no requests. You say "100 concurrent connections" or "100 messages/second across N connections."

```javascript
// k6 closed-model: N connections held simultaneously
export const options = {
  scenarios: {
    sustained_connections: {
      executor: 'constant-vus',
      vus: 100,           // 100 concurrent socket connections
      duration: '60s',
    },
  },
};
```

Each VU holds one socket. To find connection capacity, ramp VUs:

```javascript
{ executor: 'ramping-vus', stages: [
  { duration: '30s', target: 100 },
  { duration: '30s', target: 500 },
  { duration: '30s', target: 1000 },
]}
```

### Common WebSocket failure modes

| Symptom | Cause |
|---------|-------|
| Connections fail at N | OS file descriptor limit (`ulimit -n`) on client or server |
| Latency climbs with connection count | Server thread/event-loop bottleneck |
| Messages dropped | Server backpressure, no flow control |
| `1006 Abnormal Closure` | Connection forcibly closed (timeout, server crash) |
| Slow ping/pong | Idle keepalive interval too aggressive |

### Artillery WebSocket support

Artillery can do WebSocket via the `engine: 'ws'`:

```yaml
config:
  target: "ws://localhost:3000/lab/ws"
  engine: ws
  phases:
    - duration: 30
      arrivalRate: 10
scenarios:
  - flow:
      - send: "hello"
      - think: 1
      - send: "hello again"
```

Less ergonomic than k6 for complex flows (no Trend metrics, limited message validation). For real WS work, **k6 is significantly better.**

## Exercises

1. **Echo latency baseline.** Connect, send 5 messages 100ms apart, measure roundtrip latency. p95 should be < 50ms locally.
2. **Latency injection.** Use the `{ "op": "slow", "ms": 500 }` message to see what happens when the server takes time. Does your roundtrip metric reflect the 500ms?
3. **Connection capacity.** Ramp from 10 → 200 connections over 60s. At what count does the server start dropping or slowing?
4. **Broadcast fan-out.** With 50 VUs each connected, have ONE VU send a `{ "op": "broadcast", "msg": "hi" }`. Each of the 50 VUs should receive the broadcast frame. Measure the fan-out latency (broadcast send → all-clients-received).
5. **Cleanup.** What happens to your test if you forget `socket.close()`? Does k6 hang? (Yes — set a timeout.)

## Common Mistakes

- **Treating WS tests like HTTP load.** `arrivalRate` and `RPS` don't translate. Use `vus` + `duration`.
- **Not setting a timeout.** A socket that never receives the expected message will hang the iteration forever — set `socket.setTimeout()` to force-close.
- **Forgetting `await` semantics.** `ws.connect` blocks the iteration until close, even though it looks like it returns immediately. Don't try to make HTTP calls "after" `ws.connect`.
- **Hardcoding `localhost`.** Use `__ENV.K6_BASE_URL` and derive the WS URL from it (replace `http://` with `ws://`).
- **Mixing protocols in one connection.** A k6 VU can either do HTTP or WebSocket per iteration easily; try not to do both in the same iteration.

## Cheat Sheet

```javascript
import ws from 'k6/ws';
import { Trend, Counter } from 'k6/metrics';

const latency = new Trend('ws_roundtrip_ms', true);
const errors = new Counter('ws_errors');

ws.connect(url, params, function (socket) {
  socket.on('open', () => { /* start sending */ });
  socket.on('message', (m) => { /* record metrics */ });
  socket.on('close', () => { /* expected end */ });
  socket.on('error', () => errors.add(1));

  // Always set a timeout — otherwise iteration hangs
  socket.setTimeout(() => socket.close(), 5000);
});
```

| Goal | Approach |
|------|----------|
| Measure echo latency | Connect, send, time `open` → `message` event |
| Find connection capacity | Ramp VUs, watch `ws_session_duration` and connect failures |
| Test pub/sub fan-out | Many subscribers, one publisher, count receives |
| Test reconnection logic | Force-close from server, measure reconnect time |
