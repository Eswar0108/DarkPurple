import { useEffect, useRef, useState } from 'react';
import {
  formatCurrency, formatDateTime, buildWhatsappLink,
  buildTableUrl, buildQrImageUrl, createTableLinks, CATEGORY_ICONS,
} from '../utils.js';

/* ─── Dashboard stats ─── */
function DashboardStats({ menu, orders, requests }) {
  const totalItems = menu.reduce((s, c) => s + c.items.length, 0);
  const liveItems = menu.reduce((s, c) => s + c.items.filter((i) => i.available).length, 0);
  const openReqs = requests.filter((r) => r.status === 'open').length;

  return (
    <div className="dash-stats">
      <div className="dash-stat">
        <span className="dash-stat__value">{menu.length}</span>
        <span className="dash-stat__label">Categories</span>
      </div>
      <div className="dash-stat">
        <span className="dash-stat__value">{liveItems}/{totalItems}</span>
        <span className="dash-stat__label">Items Live</span>
      </div>
      <div className="dash-stat">
        <span className="dash-stat__value">{openReqs}</span>
        <span className="dash-stat__label">Open Requests</span>
      </div>
      <div className="dash-stat">
        <span className="dash-stat__value">{orders.length}</span>
        <span className="dash-stat__label">Orders Today</span>
      </div>
    </div>
  );
}

/* ─── Request Board ─── */
function RequestBoard({ requests, filter, onFilterChange, onResolve, onClear }) {
  const filtered = requests.filter((r) => filter === 'all' || r.status === filter);
  const openCount = requests.filter((r) => r.status === 'open').length;

  return (
    <div className="admin-section">
      <div className="admin-section__header">
        <div>
          <h3>📋 Live Requests</h3>
          <span className="admin-section__caption">{openCount} open / {requests.length} total</span>
        </div>
        <div className="filter-row">
          {['open', 'resolved', 'all'].map((v) => (
            <button
              key={v}
              type="button"
              className={`filter-chip${filter === v ? ' filter-chip--active' : ''}`}
              onClick={() => onFilterChange(v)}
            >
              {v}
            </button>
          ))}
          <button type="button" className="filter-chip" onClick={onClear}>Clear resolved</button>
        </div>
      </div>
      {filtered.length === 0 ? (
        <p className="empty-msg">No requests matching "{filter}".</p>
      ) : (
        <div className="request-list">
          {filtered.map((r) => (
            <div key={r.id} className="req-card">
              <div>
                <span className="req-card__table">Table {r.table}</span>
                <strong>{r.action}</strong>
                <span className="req-card__time">{formatDateTime(r.createdAt)}</span>
              </div>
              <div className="req-card__right">
                <span className={`status-dot${r.status === 'open' ? ' status-dot--open' : ''}`}>{r.status}</span>
                {r.status === 'open' && (
                  <button type="button" className="resolve-btn" onClick={() => onResolve(r.id)}>
                    Resolve
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── QR Generator ─── */
function QrGenerator({ settings }) {
  const tableLinks = createTableLinks(settings);

  async function copyLink(url) {
    try { await navigator.clipboard.writeText(url); }
    catch { window.prompt('Copy this table URL', url); }
  }

  return (
    <div className="admin-section">
      <div className="admin-section__header">
        <h3>📱 QR Table Cards</h3>
        <button type="button" className="filter-chip" onClick={() => window.print()}>Print All</button>
      </div>
      <div className="qr-grid">
        {tableLinks.map(({ table, url }) => (
          <div key={table} className="qr-card">
            <img src={buildQrImageUrl(url)} alt={`Table ${table}`} loading="lazy" />
            <strong>Table {table}</strong>
            <button type="button" className="filter-chip" onClick={() => copyLink(url)}>Copy link</button>
          </div>
        ))}
      </div>

      {/* Print-only sheet */}
      <div className="print-sheet">
        {tableLinks.map(({ table, url }) => (
          <div key={`p-${table}`} className="print-card">
            <div className="print-card__header">
              <div>
                <p className="eyebrow">{settings.venueName}</p>
                <h3>Table {table}</h3>
              </div>
              <img src={buildQrImageUrl(url)} alt={`QR Table ${table}`} />
            </div>
            <div className="print-card__meta">
              <span>{settings.hours}</span>
              <span>{settings.location}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Menu Editor ─── */
function MenuEditor({ menu, onSave }) {
  const [draft, setDraft] = useState(menu);

  useEffect(() => { setDraft(menu); }, [menu]);

  function updateItem(catId, itemId, field, value) {
    setDraft((cur) =>
      cur.map((c) =>
        c.id !== catId ? c : {
          ...c,
          items: c.items.map((i) => i.id === itemId ? { ...i, [field]: value } : i),
        },
      ),
    );
  }

  return (
    <div className="admin-section">
      <div className="admin-section__header">
        <h3>✏️ Menu Editor</h3>
        <button type="button" className="save-btn" onClick={() => onSave(draft)}>Save Menu</button>
      </div>
      <div className="editor-categories">
        {draft.map((cat) => (
          <details key={cat.id} className="editor-cat">
            <summary>
              <span>{CATEGORY_ICONS[cat.id] || '🍽️'}</span> {cat.name}
              <span className="editor-cat__count">{cat.items.length}</span>
            </summary>
            <div className="editor-items">
              {cat.items.map((item) => (
                <div key={item.id} className="editor-item">
                  <input
                    value={item.name}
                    onChange={(e) => updateItem(cat.id, item.id, 'name', e.target.value)}
                  />
                  <input
                    type="number"
                    className="editor-item__price"
                    value={item.price}
                    onChange={(e) => updateItem(cat.id, item.id, 'price', Number(e.target.value) || 0)}
                  />
                  <label className="editor-item__toggle">
                    <input
                      type="checkbox"
                      checked={item.available}
                      onChange={(e) => updateItem(cat.id, item.id, 'available', e.target.checked)}
                    />
                    <span>{item.available ? 'Live' : 'Off'}</span>
                  </label>
                </div>
              ))}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}

/* ─── Settings Panel ─── */
function SettingsPanel({ settings, onSave }) {
  const [draft, setDraft] = useState(settings);
  const fileInputRef = useRef(null);

  useEffect(() => { setDraft(settings); }, [settings]);

  function set(key, value) {
    setDraft((cur) => ({ ...cur, [key]: value }));
  }

  function exportConfig() {
    const blob = new Blob([JSON.stringify({ settings: draft }, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'dark-purple-config.json';
    link.click();
    URL.revokeObjectURL(link.href);
  }

  async function importConfig(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const payload = JSON.parse(await file.text());
      if (typeof payload.settings === 'object') {
        setDraft(payload.settings);
        onSave(payload.settings);
      }
    } catch { window.alert('Invalid config file.'); }
    finally { e.target.value = ''; }
  }

  const fields = [
    ['venueName', 'Venue Name'],
    ['tagline', 'Tagline'],
    ['location', 'Location'],
    ['hours', 'Opening Hours'],
    ['whatsappNumber', 'WhatsApp Number'],
    ['instagramHandle', 'Instagram Handle'],
    ['baseUrl', 'Base Menu URL'],
    ['tableCount', 'Number of Tables', 'number'],
    ['adminPasscode', 'Admin Passcode'],
  ];

  return (
    <div className="admin-section">
      <div className="admin-section__header">
        <h3>⚙️ Settings</h3>
        <button type="button" className="save-btn" onClick={() => onSave(draft)}>Save Settings</button>
      </div>
      <div className="settings-grid">
        {fields.map(([key, label, type]) => (
          <label key={key} className="settings-field">
            <span>{label}</span>
            <input
              type={type || 'text'}
              value={draft[key] ?? ''}
              onChange={(e) => set(key, type === 'number' ? Number(e.target.value) || 0 : e.target.value)}
            />
          </label>
        ))}
      </div>
      <div className="settings-actions">
        <button type="button" className="filter-chip" onClick={exportConfig}>Export Config</button>
        <input ref={fileInputRef} type="file" accept="application/json" onChange={importConfig} hidden />
        <button type="button" className="filter-chip" onClick={() => fileInputRef.current?.click()}>Import Config</button>
      </div>
    </div>
  );
}

/* ─── Admin Navigation Tabs ─── */
/* ─── Orders Board (admin) ─── */
function OrdersBoard({ orders, onUpdateStatus }) {
  const [filter, setFilter] = useState('pending');
  const filtered = orders.filter((o) => filter === 'all' || o.status === filter);
  const pendingCount = orders.filter((o) => o.status === 'pending').length;

  return (
    <div className="admin-section">
      <div className="admin-section__header">
        <div>
          <h3>🧾 Orders</h3>
          <span className="admin-section__caption">{pendingCount} pending / {orders.length} total</span>
        </div>
        <div className="filter-row">
          {['pending', 'preparing', 'served', 'all'].map((v) => (
            <button
              key={v}
              type="button"
              className={`filter-chip${filter === v ? ' filter-chip--active' : ''}`}
              onClick={() => setFilter(v)}
            >
              {v}
            </button>
          ))}
        </div>
      </div>
      {filtered.length === 0 ? (
        <p className="empty-msg">No {filter === 'all' ? '' : filter + ' '}orders.</p>
      ) : (
        <div className="order-list">
          {filtered.map((o) => (
            <div key={o.id} className="order-card">
              <div className="order-card__top">
                <div>
                  <span className="order-card__table">Table {o.table}</span>
                  <span className="order-card__time">{formatDateTime(o.createdAt)}</span>
                </div>
                <span className={`order-badge order-badge--${o.status}`}>{o.status}</span>
              </div>
              <div className="order-card__items">
                {o.items.map((item, idx) => (
                  <div key={idx} className="order-card__line">
                    <span>{item.name} × {item.qty}</span>
                    <span>{formatCurrency(item.price * item.qty)}</span>
                  </div>
                ))}
              </div>
              <div className="order-card__bottom">
                <strong className="order-card__total">{formatCurrency(o.total)}</strong>
                <div className="order-card__actions">
                  {o.status === 'pending' && (
                    <button type="button" className="save-btn" onClick={() => onUpdateStatus(o.id, 'preparing')}>
                      Start Preparing
                    </button>
                  )}
                  {o.status === 'preparing' && (
                    <button type="button" className="save-btn" onClick={() => onUpdateStatus(o.id, 'served')}>
                      Mark Served
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const ADMIN_TABS = [
  { id: 'dashboard', label: '📊 Dashboard' },
  { id: 'orders', label: '🧾 Orders' },
  { id: 'requests', label: '📋 Requests' },
  { id: 'menu', label: '✏️ Menu' },
  { id: 'qr', label: '📱 QR Codes' },
  { id: 'settings', label: '⚙️ Settings' },
];

/* ─── MAIN ADMIN VIEW ─── */
export default function AdminView({
  menu, settings, requests, orders,
  onSaveMenu, onSaveSettings,
  requestFilter, onRequestFilterChange, onResolveRequest, onClearResolved,
  onUpdateOrderStatus,
}) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passcode, setPasscode] = useState('');

  function unlock() {
    if (passcode === settings.adminPasscode) setIsUnlocked(true);
  }

  if (!isUnlocked) {
    return (
      <div className="admin-shell">
        <div className="admin-lock">
          <h2>🔒 Admin Access</h2>
          <p>Enter the admin passcode to continue.</p>
          <div className="admin-lock__form">
            <input
              type="password"
              placeholder="Passcode"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && unlock()}
            />
            <button type="button" onClick={unlock}>Unlock</button>
          </div>
        </div>
      </div>
    );
  }

  const customerUrl = buildTableUrl(settings.baseUrl || window.location.origin, '1');

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div>
          <h1>{settings.venueName}</h1>
          <span className="admin-header__sub">Admin Dashboard</span>
        </div>
        <a className="filter-chip" href={customerUrl} target="_blank" rel="noreferrer">
          Open Customer Menu →
        </a>
      </header>

      <nav className="admin-tabs">
        {ADMIN_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`admin-tab${activeTab === tab.id ? ' admin-tab--active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === 'dashboard' && (
        <DashboardStats menu={menu} orders={orders} requests={requests} />
      )}
      {activeTab === 'orders' && (
        <OrdersBoard orders={orders} onUpdateStatus={onUpdateOrderStatus} />
      )}
      {activeTab === 'requests' && (
        <RequestBoard
          requests={requests}
          filter={requestFilter}
          onFilterChange={onRequestFilterChange}
          onResolve={onResolveRequest}
          onClear={onClearResolved}
        />
      )}
      {activeTab === 'menu' && (
        <MenuEditor menu={menu} onSave={onSaveMenu} />
      )}
      {activeTab === 'qr' && (
        <QrGenerator settings={settings} />
      )}
      {activeTab === 'settings' && (
        <SettingsPanel settings={settings} onSave={onSaveSettings} />
      )}
    </div>
  );
}
