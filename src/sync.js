/**
 * WebSocket sync client – connects to the relay server and keeps
 * orders & requests in sync across all devices in real-time.
 * Falls back to localStorage-only if the server is unreachable.
 */

const RECONNECT_DELAY = 2000;
const MAX_RECONNECT_DELAY = 15000;

export function createSync(wsUrl, callbacks) {
  let ws = null;
  let reconnectTimer = null;
  let delay = RECONNECT_DELAY;
  let alive = true;

  function connect() {
    if (!alive) return;
    try {
      ws = new WebSocket(wsUrl);
    } catch {
      scheduleReconnect();
      return;
    }

    ws.onopen = () => {
      delay = RECONNECT_DELAY;
      callbacks.onStatus?.('connected');
    };

    ws.onclose = () => {
      callbacks.onStatus?.('disconnected');
      scheduleReconnect();
    };

    ws.onerror = () => {
      ws?.close();
    };

    ws.onmessage = (event) => {
      let msg;
      try { msg = JSON.parse(event.data); } catch { return; }

      switch (msg.type) {
        case 'init':
          callbacks.onInit?.(msg.orders, msg.requests);
          break;
        case 'order:new':
          callbacks.onOrderNew?.(msg.order);
          break;
        case 'order:updated':
          callbacks.onOrderUpdated?.(msg.orderId, msg.status);
          break;
        case 'request:new':
          callbacks.onRequestNew?.(msg.request);
          break;
        case 'request:resolved':
          callbacks.onRequestResolved?.(msg.requestId);
          break;
        case 'request:cleared':
          callbacks.onRequestCleared?.();
          break;
      }
    };
  }

  function scheduleReconnect() {
    if (!alive) return;
    reconnectTimer = setTimeout(() => {
      delay = Math.min(delay * 1.5, MAX_RECONNECT_DELAY);
      connect();
    }, delay);
  }

  function send(msg) {
    if (ws?.readyState === 1) {
      ws.send(JSON.stringify(msg));
      return true;
    }
    return false;
  }

  function destroy() {
    alive = false;
    clearTimeout(reconnectTimer);
    ws?.close();
  }

  /* Public API */
  return {
    connect,
    destroy,
    placeOrder: (order) => send({ type: 'order:place', order }),
    updateOrderStatus: (orderId, status) => send({ type: 'order:status', orderId, status }),
    newRequest: (request) => send({ type: 'request:new', request }),
    resolveRequest: (requestId) => send({ type: 'request:resolve', requestId }),
    clearResolved: () => send({ type: 'request:clearResolved' }),
  };
}
