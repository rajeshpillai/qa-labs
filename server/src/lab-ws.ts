import { WebSocketServer } from 'ws';
import type { Server as HttpServer } from 'http';

// Attach a WebSocket endpoint at /lab/ws on the existing HTTP server.
// Behaviour:
//  - Echoes any text message back to the sender (useful for latency tests)
//  - On message {"op":"broadcast","msg":"..."}, broadcasts to all connected clients
//  - On message {"op":"slow","ms":N}, waits N ms before echoing (latency injection)
//  - Sends a "hello" frame on connect so clients can confirm liveness

interface InboundMessage {
  op?: 'broadcast' | 'slow';
  msg?: string;
  ms?: number;
}

export function attachLabWebSocket(server: HttpServer): void {
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (req, socket, head) => {
    if (req.url !== '/lab/ws') {
      socket.destroy();
      return;
    }
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req);
    });
  });

  wss.on('connection', (ws) => {
    ws.send(JSON.stringify({ type: 'hello', ts: Date.now() }));

    ws.on('message', async (data) => {
      const text = typeof data === 'string' ? data : data.toString('utf-8');

      // Try parsing as JSON; if it fails, just echo the raw text.
      let msg: InboundMessage | null = null;
      try {
        msg = JSON.parse(text) as InboundMessage;
      } catch {
        msg = null;
      }

      if (msg?.op === 'broadcast' && typeof msg.msg === 'string') {
        const payload = JSON.stringify({ type: 'broadcast', msg: msg.msg, ts: Date.now() });
        for (const client of wss.clients) {
          if (client.readyState === client.OPEN) client.send(payload);
        }
        return;
      }

      if (msg?.op === 'slow' && typeof msg.ms === 'number') {
        const ms = Math.min(Math.max(msg.ms, 0), 10000);
        await new Promise((r) => setTimeout(r, ms));
        ws.send(JSON.stringify({ type: 'slow-echo', ms, ts: Date.now() }));
        return;
      }

      // Default: echo the raw text back.
      ws.send(JSON.stringify({ type: 'echo', msg: text, ts: Date.now() }));
    });
  });
}
