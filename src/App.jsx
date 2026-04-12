import { useEffect, useRef, useState } from 'react';
import { defaultMenu, defaultSettings } from './menuData.js';
import {
  MENU_KEY, SETTINGS_KEY, REQUESTS_KEY, CART_KEY, ORDERS_KEY,
  readStoredJson, writeStoredJson,
} from './utils.js';
import { createSync } from './sync.js';
import CustomerView from './components/CustomerView.jsx';
import AdminView from './components/AdminView.jsx';

/* WebSocket URL – configure via env var or fall back to same host */
const WS_URL = import.meta.env.VITE_WS_URL
  || (window.location.protocol === 'https:' ? 'wss://' : 'ws://')
    + window.location.hostname + ':4000';

function getUrlState() {
  const url = new URL(window.location.href);
  return {
    table: url.searchParams.get('table') || 'Walk-in',
    view: url.searchParams.get('view') || 'customer', // customer | admin
  };
}

export default function App() {
  const initial = getUrlState();
  const [menu, setMenu] = useState(() => readStoredJson(MENU_KEY, defaultMenu));
  const [settings, setSettings] = useState(() => readStoredJson(SETTINGS_KEY, defaultSettings));
  const [requests, setRequests] = useState(() => readStoredJson(REQUESTS_KEY, []));
  const [orders, setOrders] = useState(() => readStoredJson(ORDERS_KEY, []));
  const [cart, setCart] = useState(() => readStoredJson(CART_KEY, []));
  const [table, setTable] = useState(initial.table);
  const [view, setView] = useState(initial.view);
  const [requestFilter, setRequestFilter] = useState('open');
  const [syncStatus, setSyncStatus] = useState('connecting');
  const syncRef = useRef(null);

  /* ── WebSocket sync ── */
  useEffect(() => {
    const sync = createSync(WS_URL, {
      onStatus: (status) => setSyncStatus(status),
      onInit: (serverOrders, serverRequests) => {
        setOrders(serverOrders);
        setRequests(serverRequests);
        writeStoredJson(ORDERS_KEY, serverOrders);
        writeStoredJson(REQUESTS_KEY, serverRequests);
      },
      onOrderNew: (order) => {
        setOrders((cur) => {
          if (cur.some((o) => o.id === order.id)) return cur;
          const next = [order, ...cur];
          writeStoredJson(ORDERS_KEY, next);
          return next;
        });
      },
      onOrderUpdated: (orderId, status) => {
        setOrders((cur) => {
          const next = cur.map((o) => o.id === orderId ? { ...o, status } : o);
          writeStoredJson(ORDERS_KEY, next);
          return next;
        });
      },
      onRequestNew: (req) => {
        setRequests((cur) => {
          if (cur.some((r) => r.id === req.id)) return cur;
          const next = [req, ...cur];
          writeStoredJson(REQUESTS_KEY, next);
          return next;
        });
      },
      onRequestResolved: (requestId) => {
        setRequests((cur) => {
          const next = cur.map((r) => r.id === requestId ? { ...r, status: 'resolved' } : r);
          writeStoredJson(REQUESTS_KEY, next);
          return next;
        });
      },
      onRequestCleared: () => {
        setRequests((cur) => {
          const next = cur.filter((r) => r.status !== 'resolved');
          writeStoredJson(REQUESTS_KEY, next);
          return next;
        });
      },
    });

    sync.connect();
    syncRef.current = sync;
    return () => sync.destroy();
  }, []);

  /* Persist cart to localStorage */
  useEffect(() => { writeStoredJson(CART_KEY, cart); }, [cart]);

  /* URL sync */
  useEffect(() => {
    const syncUrl = () => {
      const s = getUrlState();
      setTable(s.table);
      setView(s.view);
    };
    window.addEventListener('popstate', syncUrl);
    return () => window.removeEventListener('popstate', syncUrl);
  }, []);

  function navigateTo(nextView) {
    const url = new URL(window.location.href);
    if (nextView === 'customer') url.searchParams.delete('view');
    else url.searchParams.set('view', nextView);
    window.history.pushState({}, '', url);
    setView(nextView);
  }

  function saveMenu(nextMenu) {
    setMenu(nextMenu);
    writeStoredJson(MENU_KEY, nextMenu);
  }

  function saveSettings(nextSettings) {
    setSettings(nextSettings);
    writeStoredJson(SETTINGS_KEY, nextSettings);
  }

  function resolveRequest(id) {
    if (syncRef.current) syncRef.current.resolveRequest(id);
    setRequests((cur) => {
      const next = cur.map((r) => r.id === id ? { ...r, status: 'resolved' } : r);
      writeStoredJson(REQUESTS_KEY, next);
      return next;
    });
  }

  function clearResolved() {
    if (syncRef.current) syncRef.current.clearResolved();
    setRequests((cur) => {
      const next = cur.filter((r) => r.status !== 'resolved');
      writeStoredJson(REQUESTS_KEY, next);
      return next;
    });
  }

  function placeOrder(lineItems, total) {
    const order = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      table,
      items: lineItems,
      total,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    if (syncRef.current) syncRef.current.placeOrder(order);
    setOrders((cur) => {
      const next = [order, ...cur];
      writeStoredJson(ORDERS_KEY, next);
      return next;
    });
    setCart([]);
    return order;
  }

  function updateOrderStatus(orderId, status) {
    if (syncRef.current) syncRef.current.updateOrderStatus(orderId, status);
    setOrders((cur) => {
      const next = cur.map((o) => o.id === orderId ? { ...o, status } : o);
      writeStoredJson(ORDERS_KEY, next);
      return next;
    });
  }

  if (view === 'admin') {
    return (
      <AdminView
        menu={menu}
        settings={settings}
        requests={requests}
        orders={orders}
        onSaveMenu={saveMenu}
        onSaveSettings={saveSettings}
        requestFilter={requestFilter}
        onRequestFilterChange={setRequestFilter}
        onResolveRequest={resolveRequest}
        onClearResolved={clearResolved}
        onUpdateOrderStatus={updateOrderStatus}
      />
    );
  }

  return (
    <CustomerView
      menu={menu}
      settings={settings}
      table={table}
      cart={cart}
      orders={orders}
      onCartChange={setCart}
      onPlaceOrder={placeOrder}
    />
  );
}