export const MENU_KEY = 'dark-purple-menu';
export const SETTINGS_KEY = 'dark-purple-settings';
export const REQUESTS_KEY = 'dark-purple-requests';
export const CART_KEY = 'dark-purple-cart';
export const ORDERS_KEY = 'dark-purple-orders';

export function readStoredJson(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function writeStoredJson(key, value) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatTime(isoValue) {
  return new Intl.DateTimeFormat('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(isoValue));
}

export function formatDateTime(isoValue) {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(isoValue));
}

export function buildWhatsappLink(number, table, message) {
  const text = `Dark Purple | Table ${table}: ${message}`;
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

export function buildTableUrl(baseUrl, table) {
  const url = new URL(baseUrl || window.location.origin);
  url.searchParams.set('table', table);
  return url.toString();
}

export function buildQrImageUrl(value) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(value)}`;
}

export function createTableLinks(settings) {
  const tableCount = Number(settings.tableCount) || 0;
  return Array.from({ length: tableCount }, (_, i) => {
    const table = String(i + 1);
    const url = buildTableUrl(settings.baseUrl || window.location.origin, table);
    return { table, url };
  });
}

/* Category emoji icons for visual flair */
export const CATEGORY_ICONS = {
  'signature-desserts': '🧁',
  'brownie-edition': '🍫',
  'waffle-world': '🧇',
  'frozen-thick-shakes': '🥤',
  'icecream-sundae': '🍨',
  'chocolate-hotdrinks': '☕',
  'cakes': '🎂',
  'creative-cakes': '�',
  'mini-dbc': '🍰',
  'chocolate-fountain': '🫕',
  'quick-bites-veg': '🥗',
  'quick-bites-nonveg': '🍗',
  'chaats': '🥘',
};

/* Per-category colour scheme for item thumbnails */
export const CATEGORY_COLORS = {
  'signature-desserts': { bg: 'linear-gradient(135deg, #fce4ec, #f8bbd0)', accent: '#c2185b' },
  'brownie-edition':    { bg: 'linear-gradient(135deg, #efebe9, #d7ccc8)', accent: '#5d4037' },
  'waffle-world':       { bg: 'linear-gradient(135deg, #fff8e1, #ffecb3)', accent: '#f9a825' },
  'frozen-thick-shakes':{ bg: 'linear-gradient(135deg, #e8eaf6, #c5cae9)', accent: '#3949ab' },
  'icecream-sundae':    { bg: 'linear-gradient(135deg, #fce4ec, #f3e5f5)', accent: '#8e24aa' },
  'chocolate-hotdrinks':{ bg: 'linear-gradient(135deg, #efebe9, #bcaaa4)', accent: '#4e342e' },
  'cakes':              { bg: 'linear-gradient(135deg, #fff3e0, #ffe0b2)', accent: '#e65100' },
  'creative-cakes':     { bg: 'linear-gradient(135deg, #f3e5f5, #e1bee7)', accent: '#7b1fa2' },
  'mini-dbc':           { bg: 'linear-gradient(135deg, #fbe9e7, #ffccbc)', accent: '#bf360c' },
  'chocolate-fountain': { bg: 'linear-gradient(135deg, #e8f5e9, #c8e6c9)', accent: '#2e7d32' },
  'quick-bites-veg':    { bg: 'linear-gradient(135deg, #f1f8e9, #dcedc8)', accent: '#558b2f' },
  'quick-bites-nonveg': { bg: 'linear-gradient(135deg, #fff3e0, #ffcc80)', accent: '#ef6c00' },
  'chaats':             { bg: 'linear-gradient(135deg, #fffde7, #fff9c4)', accent: '#f57f17' },
};

/* Smart per-item emoji picker based on keywords in the name */
const ITEM_EMOJI_RULES = [
  /* Shape / type keywords (highest priority) */
  [/cupcake/i,      '🧁'],
  [/waffle/i,       '🧇'],
  [/brownie/i,      '🟫'],
  [/donut/i,        '🍩'],
  [/sundae|scoop/i, '🍨'],
  [/cone/i,         '🍦'],
  [/shake|frozen/i, '🥤'],
  [/lava|molten/i,  '🌋'],
  [/fondant/i,      '🍬'],
  [/jar/i,          '🫙'],
  [/pinata/i,       '🪅'],
  [/bento/i,        '🍱'],
  [/heart/i,        '💜'],
  [/bomb/i,         '💣'],
  [/rainbow/i,      '🌈'],
  [/dome/i,         '🔮'],
  [/mud/i,          '🪣'],
  [/cup\b/i,        '🍵'],
  [/shot/i,         '🥃'],
  [/slice/i,        '🍰'],
  [/pot\b/i,        '🍯'],
  /* Savoury / snack */
  [/fries/i,        '🍟'],
  [/burger|slider/i,'🍔'],
  [/pizza/i,        '🍕'],
  [/sandwich/i,     '🥪'],
  [/spring.?roll/i, '🌯'],
  [/roll/i,         '🌮'],
  [/nugget/i,       '🍗'],
  [/wing/i,         '🍗'],
  [/chicken/i,      '🍗'],
  [/egg/i,          '🥚'],
  [/puff|samosa/i,  '🥟'],
  [/mushroom/i,     '🍄'],
  [/paneer/i,       '🧀'],
  [/puri/i,         '🫓'],
  [/bhel|sev|papdi|chaat/i, '🥘'],
  [/vada/i,         '🧆'],
  [/tikki/i,        '🫓'],
  [/kachori/i,      '🥟'],
  /* Cake & bake */
  [/cake/i,         '🎂'],
  /* Flavour / ingredient accents (lower priority) */
  [/strawberry/i,   '🍓'],
  [/mango/i,        '🥭'],
  [/blueberry/i,    '🫐'],
  [/raspberry|cranberry/i, '🍇'],
  [/kiwi/i,         '🥝'],
  [/pineapple/i,    '🍍'],
  [/orange/i,       '🍊'],
  [/oreo/i,         '🖤'],
  [/nutella|hazelnut|almond/i, '🌰'],
  [/butterscotch/i, '🍯'],
  [/coffee/i,       '☕'],
  [/vanilla/i,      '🍦'],
  [/redvelvet|red.?velvet/i, '❤️'],
  [/marshmallow/i,  '☁️'],
  [/caramel/i,      '🍮'],
  [/pista/i,        '💚'],
  [/cheese/i,       '🧀'],
  /* Broad fallbacks */
  [/chocolate|choco|truffle/i, '🍫'],
  [/dip|fountain/i, '🫕'],
  [/cream/i,        '🍨'],
];

export function getItemEmoji(name, categoryId) {
  for (const [pattern, emoji] of ITEM_EMOJI_RULES) {
    if (pattern.test(name)) return emoji;
  }
  return CATEGORY_ICONS[categoryId] || '🍽️';
}
