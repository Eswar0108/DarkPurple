import { useEffect, useRef, useState } from 'react';
import { formatCurrency, formatDateTime, buildWhatsappLink, CATEGORY_ICONS, CATEGORY_COLORS, getItemEmoji } from '../utils.js';

/* ─── Category navigation bar (sticky) ─── */
function CategoryNav({ categories, activeId, onSelect }) {
  const navRef = useRef(null);

  useEffect(() => {
    if (!navRef.current) return;
    const active = navRef.current.querySelector('.cat-nav__chip--active');
    if (active) active.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  }, [activeId]);

  return (
    <nav className="cat-nav" ref={navRef}>
      {categories.map((cat) => (
        <button
          key={cat.id}
          type="button"
          className={`cat-nav__chip${activeId === cat.id ? ' cat-nav__chip--active' : ''}`}
          onClick={() => onSelect(cat.id)}
        >
          <span className="cat-nav__icon">{CATEGORY_ICONS[cat.id] || '🍽️'}</span>
          <span>{cat.name}</span>
        </button>
      ))}
    </nav>
  );
}

/* ─── Single menu item card ─── */
function MenuItemCard({ item, categoryId, quantity, onAdd, onRemove }) {
  const icon = getItemEmoji(item.name, categoryId);
  const colors = CATEGORY_COLORS[categoryId];
  const thumbStyle = colors ? { background: colors.bg } : undefined;
  return (
    <article className={`item-card${item.available ? '' : ' item-card--soldout'}`}>
      <div className="item-card__img" style={thumbStyle}>
        <span className="item-card__emoji">{icon}</span>
      </div>
      <div className="item-card__body">
        <div className="item-card__head">
          <h4>{item.name}</h4>
          <strong className="item-card__price">{formatCurrency(item.price)}</strong>
        </div>
        <p className="item-card__desc">{item.description}</p>
        {item.available ? (
          <div className="item-card__actions">
            {quantity > 0 ? (
              <div className="qty-control">
                <button type="button" onClick={onRemove}>−</button>
                <span>{quantity}</span>
                <button type="button" onClick={onAdd}>+</button>
              </div>
            ) : (
              <button type="button" className="add-btn" onClick={onAdd}>
                ADD
              </button>
            )}
          </div>
        ) : (
          <span className="sold-out-badge">Sold out</span>
        )}
      </div>
    </article>
  );
}

/* ─── Cart drawer ─── */
function CartDrawer({ cart, menu, table, settings, onUpdateQty, onClear, onClose, onPlaceOrder }) {
  const [confirmedOrder, setConfirmedOrder] = useState(null);
  const allItems = menu.flatMap((c) => c.items);
  const lines = cart
    .map((entry) => {
      const item = allItems.find((i) => i.id === entry.id);
      return item ? { ...item, qty: entry.qty } : null;
    })
    .filter(Boolean);

  const total = lines.reduce((sum, l) => sum + l.price * l.qty, 0);
  const itemCount = lines.reduce((sum, l) => sum + l.qty, 0);

  function handlePlaceOrder() {
    const orderItems = lines.map((l) => ({ id: l.id, name: l.name, price: l.price, qty: l.qty }));
    const order = onPlaceOrder(orderItems, total);
    setConfirmedOrder(order);
  }

  function buildShareMessage(order) {
    const header = `*Order ${order.id} – Table ${order.table}*\n`;
    const body = order.items.map((l) => `• ${l.name} × ${l.qty} = ${formatCurrency(l.price * l.qty)}`).join('\n');
    const footer = `\n*Total: ${formatCurrency(order.total)}*`;
    return header + body + footer;
  }

  /* Order confirmed screen */
  if (confirmedOrder) {
    return (
      <div className="cart-drawer">
        <div className="cart-drawer__header">
          <h3>Order Placed!</h3>
          <button type="button" className="cart-drawer__close" onClick={onClose}>✕</button>
        </div>
        <div className="order-confirmed">
          <span className="order-confirmed__icon">✅</span>
          <h3 className="order-confirmed__title">Thank you!</h3>
          <p className="order-confirmed__sub">Your order has been sent to the kitchen</p>
          <div className="order-confirmed__details">
            <div className="order-confirmed__row">
              <span>Order ID</span>
              <strong>{confirmedOrder.id}</strong>
            </div>
            <div className="order-confirmed__row">
              <span>Table</span>
              <strong>{confirmedOrder.table}</strong>
            </div>
            <div className="order-confirmed__row">
              <span>Items</span>
              <strong>{confirmedOrder.items.reduce((s, i) => s + i.qty, 0)}</strong>
            </div>
            <div className="order-confirmed__row order-confirmed__row--total">
              <span>Total</span>
              <strong>{formatCurrency(confirmedOrder.total)}</strong>
            </div>
          </div>
          <a
            className="share-whatsapp-btn"
            href={buildWhatsappLink(settings.whatsappNumber, table, buildShareMessage(confirmedOrder))}
            target="_blank"
            rel="noreferrer"
          >
            📲 Share on WhatsApp
          </a>
          <button type="button" className="order-confirmed__done" onClick={onClose}>
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="cart-drawer">
        <div className="cart-drawer__header">
          <h3>Your Cart</h3>
          <button type="button" className="cart-drawer__close" onClick={onClose}>✕</button>
        </div>
        <div className="cart-drawer__empty">
          <span className="cart-drawer__empty-icon">🛒</span>
          <p>Your cart is empty</p>
          <p className="cart-drawer__hint">Browse the menu and tap ADD to get started.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-drawer">
      <div className="cart-drawer__header">
        <h3>Your Cart ({itemCount})</h3>
        <button type="button" className="cart-drawer__close" onClick={onClose}>✕</button>
      </div>
      <div className="cart-drawer__items">
        {lines.map((l) => (
          <div key={l.id} className="cart-line">
            <div className="cart-line__info">
              <strong>{l.name}</strong>
              <span className="cart-line__price">{formatCurrency(l.price)} × {l.qty} = {formatCurrency(l.price * l.qty)}</span>
            </div>
            <div className="qty-control">
              <button type="button" onClick={() => onUpdateQty(l.id, l.qty - 1)}>−</button>
              <span>{l.qty}</span>
              <button type="button" onClick={() => onUpdateQty(l.id, l.qty + 1)}>+</button>
            </div>
          </div>
        ))}
      </div>
      <div className="cart-drawer__footer">
        <div className="cart-drawer__total">
          <span>Total</span>
          <strong>{formatCurrency(total)}</strong>
        </div>
        <button type="button" className="place-order-btn" onClick={handlePlaceOrder}>
          Place Order • {formatCurrency(total)}
        </button>
        <button type="button" className="clear-cart-btn" onClick={onClear}>
          Clear Cart
        </button>
      </div>
    </div>
  );
}

/* ─── Floating cart button ─── */
function CartFab({ count, total, onClick }) {
  if (count === 0) return null;
  return (
    <button type="button" className="cart-fab" onClick={onClick}>
      <span className="cart-fab__icon">🛒</span>
      <span className="cart-fab__info">
        <strong>{count} item{count > 1 ? 's' : ''}</strong>
        <span>{formatCurrency(total)}</span>
      </span>
      <span className="cart-fab__arrow">→</span>
    </button>
  );
}

/* ─── Customer Orders Page ─── */
function MyOrdersPage({ orders, table, settings }) {
  const myOrders = (orders || []).filter((o) => o.table === table);

  const STATUS_STEPS = ['pending', 'preparing', 'served'];
  const STATUS_LABELS = { pending: '🕐 Received', preparing: '👨‍🍳 Preparing', served: '✅ Served' };

  if (myOrders.length === 0) {
    return (
      <div className="orders-page">
        <div className="orders-page__empty">
          <span className="orders-page__empty-icon">📋</span>
          <h3>No orders yet</h3>
          <p>Your placed orders will appear here with live status updates.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <h2 className="orders-page__title">Your Orders</h2>
      <p className="orders-page__sub">Table {table} • {myOrders.length} order{myOrders.length !== 1 ? 's' : ''}</p>
      <div className="orders-page__list">
        {myOrders.map((o) => {
          const stepIdx = STATUS_STEPS.indexOf(o.status);
          return (
            <div key={o.id} className="user-order-card">
              <div className="user-order-card__header">
                <div>
                  <span className="user-order-card__id">#{o.id}</span>
                  <span className="user-order-card__time">{formatDateTime(o.createdAt)}</span>
                </div>
                <span className={`order-badge order-badge--${o.status}`}>{o.status}</span>
              </div>

              {/* Status timeline */}
              <div className="order-timeline">
                {STATUS_STEPS.map((step, i) => (
                  <div key={step} className={`order-timeline__step${i <= stepIdx ? ' order-timeline__step--done' : ''}`}>
                    <span className="order-timeline__dot" />
                    <span className="order-timeline__label">{STATUS_LABELS[step]}</span>
                  </div>
                ))}
              </div>

              {/* Items */}
              <div className="user-order-card__items">
                {o.items.map((item, idx) => (
                  <div key={idx} className="user-order-card__line">
                    <span>{item.name} <span className="user-order-card__qty">×{item.qty}</span></span>
                    <span>{formatCurrency(item.price * item.qty)}</span>
                  </div>
                ))}
              </div>

              <div className="user-order-card__footer">
                <span>Total</span>
                <strong>{formatCurrency(o.total)}</strong>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── MAIN CUSTOMER VIEW ─── */
export default function CustomerView({ menu, settings, table, cart, orders, onCartChange, onPlaceOrder }) {
  const [activeCat, setActiveCat] = useState(menu[0]?.id || '');
  const [cartOpen, setCartOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState('menu'); // 'menu' | 'orders'
  const searchRef = useRef(null);
  const sectionRefs = useRef({});

  const query = search.trim().toLowerCase();

  /* Build filtered menu based on search */
  const filteredMenu = query
    ? menu
        .map((cat) => ({
          ...cat,
          items: cat.items.filter(
            (i) =>
              i.name.toLowerCase().includes(query) ||
              (i.description && i.description.toLowerCase().includes(query)) ||
              cat.name.toLowerCase().includes(query),
          ),
        }))
        .filter((cat) => cat.items.length > 0)
    : menu;

  const totalResults = query
    ? filteredMenu.reduce((s, c) => s + c.items.length, 0)
    : 0;

  /* Intersection observer for sticky nav highlight */
  useEffect(() => {
    if (query) return; // skip observer when searching
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveCat(entry.target.dataset.catId);
          }
        }
      },
      { rootMargin: '-120px 0px -60% 0px', threshold: 0 },
    );

    Object.values(sectionRefs.current).forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [menu, query]);

  function scrollToCategory(catId) {
    setActiveCat(catId);
    const el = sectionRefs.current[catId];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* Cart helpers */
  function getQty(itemId) {
    return cart.find((e) => e.id === itemId)?.qty || 0;
  }

  function addItem(itemId) {
    const existing = cart.find((e) => e.id === itemId);
    if (existing) {
      onCartChange(cart.map((e) => (e.id === itemId ? { ...e, qty: e.qty + 1 } : e)));
    } else {
      onCartChange([...cart, { id: itemId, qty: 1 }]);
    }
  }

  function removeItem(itemId) {
    const existing = cart.find((e) => e.id === itemId);
    if (!existing) return;
    if (existing.qty <= 1) {
      onCartChange(cart.filter((e) => e.id !== itemId));
    } else {
      onCartChange(cart.map((e) => (e.id === itemId ? { ...e, qty: e.qty - 1 } : e)));
    }
  }

  function updateQty(itemId, newQty) {
    if (newQty <= 0) {
      onCartChange(cart.filter((e) => e.id !== itemId));
    } else {
      onCartChange(cart.map((e) => (e.id === itemId ? { ...e, qty: newQty } : e)));
    }
  }

  const allItems = menu.flatMap((c) => c.items);
  const cartCount = cart.reduce((s, e) => s + e.qty, 0);
  const cartTotal = cart.reduce((s, e) => {
    const item = allItems.find((i) => i.id === e.id);
    return s + (item ? item.price * e.qty : 0);
  }, 0);

  /* Quick service actions */
  const quickActions = [
    { label: '🔔 Call Waiter', action: 'Please send a waiter' },
    { label: '💧 Need Water', action: 'Please send water' },
    { label: '🧾 Request Bill', action: 'Please prepare the bill' },
  ];

  /* Orders for this table (most recent first), only active ones */
  const myOrders = (orders || []).filter(
    (o) => o.table === table && o.status !== 'served',
  );

  return (
    <div className="customer-shell">
      {/* Hero header */}
      <header className="customer-hero">
        <div className="customer-hero__content">
          <h1>{settings.venueName}</h1>
          <p className="customer-hero__tagline">{settings.tagline}</p>
          <div className="customer-hero__meta">
            <span>📍 {settings.location}</span>
            <span>🕘 {settings.hours}</span>
          </div>
          <div className="customer-hero__table-badge">
            Table {table}
          </div>
        </div>
      </header>

      {page === 'orders' ? (
        <MyOrdersPage orders={orders} table={table} settings={settings} />
      ) : (
        <>
          {/* Search bar */}
          <div className="search-bar">
            <span className="search-bar__icon">🔍</span>
            <input
              ref={searchRef}
              type="text"
              className="search-bar__input"
              placeholder="Search menu… e.g. brownie, waffle, chicken"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                className="search-bar__clear"
                onClick={() => { setSearch(''); searchRef.current?.focus(); }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Search results summary */}
          {query && (
            <div className="search-results-info">
              {totalResults > 0
                ? <span>Found <strong>{totalResults}</strong> item{totalResults !== 1 ? 's' : ''} in <strong>{filteredMenu.length}</strong> categor{filteredMenu.length !== 1 ? 'ies' : 'y'}</span>
                : <span>No items match "<strong>{search}</strong>"</span>
              }
            </div>
          )}

          {/* Quick service — hide when searching */}
          {!query && (
            <div className="quick-actions">
              {quickActions.map((qa) => (
                <a
                  key={qa.label}
                  className="quick-action-chip"
                  href={buildWhatsappLink(settings.whatsappNumber, table, qa.action)}
                  target="_blank"
                  rel="noreferrer"
                >
                  {qa.label}
                </a>
              ))}
            </div>
          )}

          {/* Sticky category nav — hide when searching */}
          {!query && (
            <CategoryNav categories={menu} activeId={activeCat} onSelect={scrollToCategory} />
          )}

          {/* Menu sections */}
          <main className="menu-body">
            {filteredMenu.map((category) => (
              <section
                key={category.id}
                data-cat-id={category.id}
                ref={(el) => { sectionRefs.current[category.id] = el; }}
                className="menu-category"
              >
                <div className="menu-category__header">
                  <span className="menu-category__icon">{CATEGORY_ICONS[category.id] || '🍽️'}</span>
                  <div>
                    <h2>{category.name}</h2>
                    <span className="menu-category__count">
                      {category.items.filter((i) => i.available).length} item{category.items.filter((i) => i.available).length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                <div className="menu-items-grid">
                  {category.items.map((item) => (
                    <MenuItemCard
                      key={item.id}
                      item={item}
                      categoryId={category.id}
                      quantity={getQty(item.id)}
                      onAdd={() => addItem(item.id)}
                      onRemove={() => removeItem(item.id)}
                    />
                  ))}
                </div>
              </section>
            ))}

            {/* No results state */}
            {query && filteredMenu.length === 0 && (
              <div className="search-empty">
                <span className="search-empty__icon">🔍</span>
                <p>No items found for "<strong>{search}</strong>"</p>
                <p className="search-empty__hint">Try a different spelling or browse categories above</p>
                <button type="button" className="search-empty__btn" onClick={() => setSearch('')}>
                  Clear Search
                </button>
              </div>
            )}
          </main>
        </>
      )}

      {/* Cart FAB — only on menu page */}
      {page === 'menu' && <CartFab count={cartCount} total={cartTotal} onClick={() => setCartOpen(true)} />}

      {/* Cart drawer overlay */}
      {cartOpen && (
        <>
          <div className="cart-overlay" onClick={() => setCartOpen(false)} />
          <CartDrawer
            cart={cart}
            menu={menu}
            table={table}
            settings={settings}
            onUpdateQty={updateQty}
            onClear={() => { onCartChange([]); setCartOpen(false); }}
            onClose={() => setCartOpen(false)}
            onPlaceOrder={onPlaceOrder}
          />
        </>
      )}

      {/* Bottom navigation */}
      <nav className="bottom-nav">
        <button
          type="button"
          className={`bottom-nav__tab${page === 'menu' ? ' bottom-nav__tab--active' : ''}`}
          onClick={() => setPage('menu')}
        >
          <span className="bottom-nav__icon">🍽️</span>
          <span>Menu</span>
        </button>
        <button
          type="button"
          className={`bottom-nav__tab${page === 'orders' ? ' bottom-nav__tab--active' : ''}`}
          onClick={() => setPage('orders')}
        >
          <span className="bottom-nav__icon">📋</span>
          <span>Orders</span>
          {myOrders.length > 0 && (
            <span className="bottom-nav__badge">{myOrders.length}</span>
          )}
        </button>
      </nav>
    </div>
  );
}
