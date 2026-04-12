import { WebSocketServer } from 'ws';
import { createServer } from 'http';

const PORT = process.env.PORT || 4000;

/* ── In-memory store (the "logs") ── */
const store = {
  orders: [],
  requests: [],
};

function log(msg, data) {
  const ts = new Date().toISOString();
  console.log(`[${ts}] ${msg}`, data ? JSON.stringify(data).slice(0, 200) : '');
}

/* ── HTTP server (health check + upgrade) ── */
const httpServer = createServer((req, res) => {
  // CORS preflight
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      orders: store.orders.length,
      requests: store.requests.length,
      uptime: process.uptime(),
    }));
    return;
  }

  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Dark Purple WS Relay');
});

/* ── WebSocket server ── */
const wss = new WebSocketServer({ server: httpServer });

function broadcast(message, excludeWs) {
  const payload = JSON.stringify(message);
  for (const client of wss.clients) {
    if (client.readyState === 1 && client !== excludeWs) {
      client.send(payload);
    }
  }
}

wss.on('connection', (ws) => {
  log('Client connected', { total: wss.clients.size });

  // Send current state on connect
  ws.send(JSON.stringify({ type: 'init', orders: store.orders, requests: store.requests }));

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    switch (msg.type) {
      case 'order:place': {
        const order = msg.order;
        if (!order || !order.id) break;
        store.orders.unshift(order);
        log('ORDER PLACED', { id: order.id, table: order.table, total: order.total, items: order.items.length });
        broadcast({ type: 'order:new', order }, null);
        break;
      }

      case 'order:status': {
        const { orderId, status } = msg;
        const order = store.orders.find((o) => o.id === orderId);
        if (order) {
          order.status = status;
          log('ORDER STATUS', { id: orderId, status });
          broadcast({ type: 'order:updated', orderId, status }, null);
        }
        break;
      }

      case 'request:new': {
        const req = msg.request;
        if (!req || !req.id) break;
        store.requests.unshift(req);
        log('REQUEST', { id: req.id, table: req.table, action: req.action });
        broadcast({ type: 'request:new', request: req }, null);
        break;
      }

      case 'request:resolve': {
        const r = store.requests.find((x) => x.id === msg.requestId);
        if (r) {
          r.status = 'resolved';
          log('REQUEST RESOLVED', { id: msg.requestId });
          broadcast({ type: 'request:resolved', requestId: msg.requestId }, null);
        }
        break;
      }

      case 'request:clearResolved': {
        store.requests = store.requests.filter((r) => r.status !== 'resolved');
        log('REQUESTS CLEARED');
        broadcast({ type: 'request:cleared' }, null);
        break;
      }

      default:
        log('Unknown message type', msg.type);
    }
  });

  ws.on('close', () => {
    log('Client disconnected', { total: wss.clients.size });
  });
});

httpServer.listen(PORT, () => {
  log(`Server listening on port ${PORT}`);
  log(`Health check: http://localhost:${PORT}/health`);
});
