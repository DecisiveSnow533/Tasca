'use strict';
/* Dati, categorie, gruppi, ricorrenti, backup e statistiche di Tasca (versione web). */

const OTHER = 'Varie';
const INCOME = 'Entrate';

const ICON_PATHS = {
  // categorie
  cart: '<circle cx="9" cy="20" r="1.3"/><circle cx="18" cy="20" r="1.3"/><path d="M2.5 3.5h2.8l2.2 11h10.4l2-8H6.2"/>',
  food: '<path d="M7 3v8M4.5 3v5a2.5 2.5 0 0 0 5 0V3M7 11v10"/><path d="M17 21V3c-2.2 1.2-3.5 4-3.5 7.5 0 1.5.9 2.5 3.5 2.5"/>',
  car: '<path d="M5 17v-5l2-5.5h10L19 12v5M3.5 17h17M5 17v2.5M19 17v2.5M5 12h14"/><circle cx="8.5" cy="14.5" r=".7"/><circle cx="15.5" cy="14.5" r=".7"/>',
  bag: '<path d="M5 8h14l-1 12H6L5 8z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>',
  movie: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 4v16M16 4v16M4 9h4M4 15h4M16 9h4M16 15h4"/>',
  health: '<path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.3 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z"/>',
  home: '<path d="M4 11l8-7 8 7M6 10v10h12V10M10 20v-5h4v5"/>',
  plane: '<path d="M21 3 10.5 13.5M21 3l-6.5 18-4-7.5L3 9.5 21 3z"/>',
  income: '<path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19h14"/>',
  other: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
  bolt: '<path d="M13 3 5 13.5h6L10 21l8-10.5h-6L13 3z"/>',
  beach: '<path d="M3 12a9 9 0 0 1 18 0H3zM12 12v8M12 20h3"/>',
  hike: '<path d="M3 19 9.5 8l4 6 2-3L21 19H3z"/>',
  party: '<path d="M12 4v4M12 16v4M4 12h4M16 12h4M7 7l2 2M15 15l2 2M17 7l-2 2M9 15l-2 2"/>',
  cake: '<path d="M4 20h16v-6H4zM4 14c2 0 2-1.5 4-1.5S10 14 12 14s2-1.5 4-1.5S18 14 20 14M12 12V9"/><path d="M12 9c-1-1 0-2.5 0-3.5 1 1 1 2.5 0 3.5z"/>',
  coffee: '<path d="M5 8h11v6a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5V8zM16 9h2a2.5 2.5 0 0 1 0 5h-2M8 3v2M12 3v2"/>',
  pizza: '<path d="M4 6c5-2.5 11-2.5 16 0L12 21 4 6z"/><circle cx="11" cy="9.5" r="1"/><circle cx="14.5" cy="12" r="1"/>',
  wine: '<path d="M8 3h8v5a4 4 0 0 1-8 0V3zM12 12v8M8.5 21h7"/>',
  fuel: '<path d="M5 20V5a1.5 1.5 0 0 1 1.5-1.5h6A1.5 1.5 0 0 1 14 5v15M4 20h11M14 9h2.5a1.5 1.5 0 0 1 1.5 1.5V16a1.5 1.5 0 0 0 3 0V9l-2.5-2.5M7.5 8h4"/>',
  bus: '<rect x="5" y="4" width="14" height="13" rx="2"/><path d="M5 11h14M8 20v-3M16 20v-3"/><circle cx="8.5" cy="14" r=".7"/><circle cx="15.5" cy="14" r=".7"/>',
  bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
  phone: '<rect x="7" y="3" width="10" height="18" rx="2"/><path d="M11 18h2"/>',
  game: '<path d="M7 8h10a4 4 0 0 1 4 4v1.5a3 3 0 0 1-5.4 1.8L15 14H9l-.6 1.3A3 3 0 0 1 3 13.5V12a4 4 0 0 1 4-4z"/><path d="M8 11v2M7 12h2"/><circle cx="15.5" cy="11.5" r=".7"/>',
  gift: '<rect x="4" y="9" width="16" height="11" rx="1.5"/><path d="M12 9v11M3 9h18M12 9c-1.5-4-5-4-5-1.5C7 9 12 9 12 9zM12 9c1.5-4 5-4 5-1.5C17 9 12 9 12 9z"/>',
  clothes: '<path d="M8 4 3.5 7 6 11l2-1v10h8V10l2 1 2.5-4L16 4c-.5 1.3-2 2-4 2S8.5 5.3 8 4z"/>',
  beauty: '<circle cx="12" cy="12" r="9"/><path d="M8 14c1 1.5 2.5 2.3 4 2.3s3-.8 4-2.3"/><circle cx="9" cy="9.5" r=".7"/><circle cx="15" cy="9.5" r=".7"/>',
  pet: '<circle cx="7" cy="10" r="1.8"/><circle cx="11" cy="6.5" r="1.8"/><circle cx="16" cy="7.5" r="1.8"/><circle cx="18.5" cy="12" r="1.8"/><path d="M8 17c0-3 2.5-5 4-5s5 2 5 5c0 2-1.5 3-3 3-1 0-1.5-.5-2-.5s-1 .5-2 .5c-1.5 0-2-1-2-3z"/>',
  book: '<path d="M5 4h10a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4zM5 17a3 3 0 0 1 3-3h10"/>',
  school: '<path d="M2.5 9 12 4.5 21.5 9 12 13.5 2.5 9zM6.5 11.5V16c0 1.5 2.5 3 5.5 3s5.5-1.5 5.5-3v-4.5"/>',
  fitness: '<path d="M3 10v4M6 8v8M18 8v8M21 10v4M6 12h12"/>',
  work: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M3 13h18"/>',
  receipt: '<path d="M6 3h12v18l-2.5-1.5L13 21l-2.5-1.5L8 21l-2-1.5V3zM9 8h6M9 12h6"/>',
  tools: '<path d="M14.5 6.5a4 4 0 0 0 4.7 5L20 12l-8 8a2.1 2.1 0 0 1-3-3l8-8-.8-.5z"/>',
  plant: '<path d="M12 21v-9M12 12C12 8 9 5.5 5 5.5 5 9.5 8 12 12 12zM12 14c0-3 2.5-5 6-5 0 3.5-2.5 5-6 5z"/>',
  kids: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c0-4 3-6.5 7-6.5s7 2.5 7 6.5"/>',
  music: '<path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/>',
  sport: '<circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18M5.5 5.5c4 3 9 3 13 0M5.5 18.5c4-3 9-3 13 0"/>',
  // interfaccia
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  left: '<path d="m15 5-7 7 7 7"/>',
  right: '<path d="m9 5 7 7-7 7"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/>',
  folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/>',
  chart: '<path d="M5 20V11M12 20V4M19 20v-6"/>',
  settings: '<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  check: '<circle cx="12" cy="12" r="9"/><path d="m8 12.5 3 3 5-6"/>',
  alert: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.5v.1"/>',
  download: '<path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19h14"/>',
  upload: '<path d="M12 15V4M7.5 8.5 12 4l4.5 4.5M5 19h14"/>',
  share: '<path d="M12 15V4M7.5 8.5 12 4l4.5 4.5M6 12v7h12v-7"/>',
  repeat: '<path d="M4 11V9a3 3 0 0 1 3-3h11M15 3l3 3-3 3M20 13v2a3 3 0 0 1-3 3H6M9 21l-3-3 3-3"/>',
  up: '<path d="M12 19V5M6 11l6-6 6 6"/>',
  down: '<path d="M12 5v14M6 13l6 6 6-6"/>',
  backspace: '<path d="M21 6H9l-6 6 6 6h12V6zM13 10l4 4M17 10l-4 4"/>',
  wallet: '<path d="M4 8a2 2 0 0 1 2-2h11v3M4 8v10a2 2 0 0 0 2 2h13V9H6a2 2 0 0 1-2-2"/><circle cx="16" cy="14.5" r="1"/>',
};

function icon(key, size = 24) {
  const p = ICON_PATHS[key] || ICON_PATHS.other;
  return `<svg class="ic" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
}

const BUILTIN = [
  { name: 'Alimentari', icon: 'cart', color: '#34C38F' },
  { name: 'Ristoranti e bar', icon: 'food', color: '#FF8A4C' },
  { name: 'Trasporti', icon: 'car', color: '#3B82F6' },
  { name: 'Shopping', icon: 'bag', color: '#8B5CF6' },
  { name: 'Svago', icon: 'movie', color: '#EC4899' },
  { name: 'Salute', icon: 'health', color: '#14B8A6' },
  { name: 'Casa e bollette', icon: 'home', color: '#64748B' },
  { name: 'Viaggi', icon: 'plane', color: '#F5B73B' },
  { name: INCOME, icon: 'income', color: '#22C55E' },
  { name: OTHER, icon: 'other', color: '#9CA3AF' },
];
const COLORS = ['#34C38F', '#FF8A4C', '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6', '#F5B73B', '#EF4444', '#64748B', '#22C55E'];
const PICKABLE = ['coffee', 'pizza', 'wine', 'fuel', 'bus', 'bulb', 'phone', 'game', 'gift', 'clothes', 'beauty', 'pet',
  'book', 'school', 'fitness', 'work', 'receipt', 'tools', 'plant', 'kids', 'music', 'sport', 'cart', 'home'];
const GROUP_ICONS = ['plane', 'beach', 'hike', 'party', 'gift', 'cake', 'car', 'home', 'food', 'bag',
  'movie', 'sport', 'music', 'book', 'work', 'kids', 'pet'];

const RULES = [
  ['Alimentari', ['coop', 'conad', 'esselunga', 'carrefour', 'lidl', 'eurospin', 'supermerc', 'pam ', 'md ', 'despar', 'aldi', 'iper', 'alimentar']],
  ['Ristoranti e bar', ['bar ', 'ristorant', 'pizzeri', 'mcdonald', 'burger', 'caff', 'trattoria', 'osteria', 'sushi', 'kebab', 'gelat', 'deliveroo', 'glovo', 'just eat']],
  ['Trasporti', ['eni', 'q8', 'benzin', 'carburant', 'trenitalia', 'italo', 'uber', 'taxi', 'atm', 'autostrad', 'telepass', 'parcheggio', 'tamoil', 'ip ']],
  ['Shopping', ['amazon', 'zalando', 'ebay', 'zara', 'h&m', 'decathlon', 'ikea', 'shein', 'mediaworld', 'unieuro']],
  ['Svago', ['netflix', 'spotify', 'cinema', 'steam', 'disney', 'playstation', 'xbox', 'prime video', 'dazn', 'youtube']],
  ['Salute', ['farmaci', 'medic', 'ospedal', 'dentist', 'clinica', 'ottic']],
  ['Casa e bollette', ['enel', 'hera', 'a2a', 'tim ', 'vodafone', 'wind', 'iliad', 'fastweb', 'bolletta', 'affitto', 'condomin']],
  ['Viaggi', ['booking', 'airbnb', 'ryanair', 'easyjet', 'hotel', 'volotea', 'ita airways']],
];

/* ---------- archivio ---------- */

const KEY = 'tasca.v1';
const S = { txs: [], cats: [], groups: [], recs: [], budget: 0, nextId: 1 };

function load() {
  try {
    const j = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (j) Object.assign(S, j);
  } catch (e) { /* archivio rovinato: si riparte vuoto */ }
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(S));
    return true;
  } catch (e) {
    alert('Non riesco a salvare i dati: la memoria del browser è piena o bloccata.');
    return false;
  }
}

const sum = (arr, f) => arr.reduce((a, x) => a + f(x), 0);
const startOfDay = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const pad2 = n => String(n).padStart(2, '0');
const ymKey = d => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
const dayKey = ts => { const d = new Date(ts); return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; };
const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

const eur = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' });
const money = v => eur.format(v);
function moneyShort(v) {
  const a = Math.abs(v);
  if (a >= 1000) return (v / 1000).toLocaleString('it-IT', { maximumFractionDigits: 1 }) + ' k€';
  return Math.round(v).toLocaleString('it-IT') + ' €';
}

function parseAmount(text) {
  let t = String(text).trim();
  if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');
  const n = parseFloat(t);
  return Number.isFinite(n) ? n : NaN;
}

const allCats = () => BUILTIN.concat(S.cats);
function catStyle(name) {
  return S.cats.find(c => c.name === name) || BUILTIN.find(c => c.name === name) || { name, icon: 'other', color: '#9CA3AF' };
}

function guessCategory(title, income) {
  if (income) return INCOME;
  const t = ' ' + title.toLowerCase() + ' ';
  const custom = S.cats.find(c => t.includes(c.name.toLowerCase()));
  if (custom) return custom.name;
  const hit = RULES.find(([, keys]) => keys.some(k => t.includes(k)));
  return hit ? hit[0] : OTHER;
}

const sortedTx = () => S.txs.slice().sort((a, b) => b.ts - a.ts || b.id - a.id);

function addTx(t) {
  t.id = S.nextId++;
  S.txs.push(t);
  persist();
  return t;
}
function updateTx(t) {
  const i = S.txs.findIndex(x => x.id === t.id);
  if (i >= 0) S.txs[i] = t;
  persist();
}
function deleteTx(id) {
  const i = S.txs.findIndex(x => x.id === id);
  if (i < 0) return null;
  const [t] = S.txs.splice(i, 1);
  persist();
  return t;
}

/* ---------- categorie ---------- */

const nameTaken = (name, except) =>
  allCats().some(c => c.name !== except && c.name.toLowerCase() === name.trim().toLowerCase());

function addCategory(c) {
  const name = c.name.trim();
  if (!name || nameTaken(name)) return false;
  S.cats.push({ name, icon: c.icon, color: c.color });
  persist();
  return true;
}
function updateCategory(old, c) {
  const name = c.name.trim();
  if (!name || nameTaken(name, old)) return false;
  const i = S.cats.findIndex(x => x.name === old);
  if (i < 0) return false;
  S.cats[i] = { name, icon: c.icon, color: c.color };
  if (name !== old) {
    S.txs.forEach(t => { if (t.category === old) t.category = name; });
    S.recs.forEach(r => { if (r.category === old) r.category = name; });
  }
  persist();
  return true;
}
function deleteCategory(name) {
  S.txs.forEach(t => { if (t.category === name) t.category = OTHER; });
  S.recs.forEach(r => { if (r.category === name) r.category = OTHER; });
  S.cats = S.cats.filter(c => c.name !== name);
  persist();
}

/* ---------- gruppi ---------- */

const groupById = id => S.groups.find(g => g.id === id) || null;
const activeGroupId = () => (S.groups.find(g => g.active) || { id: 0 }).id;

/** Crea o modifica un gruppo; restituisce l'id, 0 se il nome è vuoto o già usato. */
function saveGroup(g) {
  const name = g.name.trim();
  if (!name) return 0;
  if (S.groups.some(x => x.id !== g.id && x.name.toLowerCase() === name.toLowerCase())) return 0;
  if (g.active) S.groups.forEach(x => { x.active = false; });
  let saved;
  if (g.id) {
    saved = groupById(g.id);
    Object.assign(saved, { name, icon: g.icon, color: g.color, active: !!g.active });
  } else {
    saved = { id: S.nextId++, name, icon: g.icon, color: g.color, active: !!g.active, created: Date.now() };
    S.groups.push(saved);
  }
  persist();
  return saved.id;
}
function setGroupActive(id, on) {
  if (on) S.groups.forEach(x => { x.active = false; });
  const g = groupById(id);
  if (g) g.active = on;
  persist();
}
function deleteGroup(id) {
  S.txs.forEach(t => { if (t.groupId === id) t.groupId = 0; });
  S.groups = S.groups.filter(g => g.id !== id);
  persist();
}

/* ---------- ricorrenti ---------- */

function initialLast(day, today) {
  const cur = new Date(today.getFullYear(), today.getMonth(), 1);
  const ok = Math.min(day, daysInMonth(today.getFullYear(), today.getMonth())) <= today.getDate();
  return ymKey(ok ? cur : new Date(cur.getFullYear(), cur.getMonth() - 1, 1));
}

function dueDates(last, day, today) {
  const out = [];
  const [ly, lm] = last.split('-').map(Number);
  let m = new Date(ly, lm, 1); // mese dopo `last` (lm è 1-based)
  const cur = new Date(today.getFullYear(), today.getMonth(), 1);
  while (m <= cur) {
    const d = new Date(m.getFullYear(), m.getMonth(), Math.min(day, daysInMonth(m.getFullYear(), m.getMonth())));
    if (d > today) break;
    out.push(d);
    m = new Date(m.getFullYear(), m.getMonth() + 1, 1);
  }
  return out;
}

function addRecurring(r) {
  S.recs.push({ id: S.nextId++, title: r.title.trim(), amount: r.amount, category: r.category, day: r.day, last: initialLast(r.day, new Date()) });
  persist();
}
function deleteRecurring(id) {
  S.recs = S.recs.filter(r => r.id !== id);
  persist();
}

/** Registra le ricorrenti scadute. Restituisce true se ha aggiunto qualcosa. */
function processRecurring() {
  const today = new Date();
  let changed = false;
  for (const r of S.recs) {
    const dates = dueDates(r.last, r.day, today);
    if (!dates.length) continue;
    for (const d of dates) {
      const ts = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 9, 0).getTime();
      S.txs.push({ id: S.nextId++, amount: r.amount, title: r.title, category: r.category, ts, source: 'recurring', raw: '', groupId: 0 });
    }
    r.last = ymKey(dates[dates.length - 1]);
    changed = true;
  }
  if (changed) persist();
  return changed;
}

/* ---------- backup (stesso formato dell'app Android) ---------- */

const hexToInt = h => (0xFF000000 | parseInt(h.slice(1), 16)) | 0;
const intToHex = i => '#' + (i & 0xFFFFFF).toString(16).padStart(6, '0').toUpperCase();

function exportBackup() {
  return JSON.stringify({
    app: 'Tasca',
    version: 1,
    budget: S.budget,
    transactions: S.txs.map(t => ({
      amount: t.amount, title: t.title, category: t.category, ts: t.ts,
      source: t.source, raw: t.raw || '', group: t.groupId || 0,
    })),
    groups: S.groups.map(g => ({ id: g.id, name: g.name, icon: g.icon, color: hexToInt(g.color), created: g.created })),
    categories: S.cats.map(c => ({ name: c.name, emoji: c.icon, color: hexToInt(c.color) })),
    recurring: S.recs.map(r => ({ title: r.title, amount: r.amount, category: r.category, day: r.day, last: r.last })),
  }, null, 2);
}

/** Unisce un backup ai dati attuali senza doppioni. Restituisce quante transazioni ha aggiunto. */
function importBackup(text) {
  const o = JSON.parse(text);
  if (o.app !== 'Tasca') throw new Error('Non è un backup di Tasca');
  const groupIds = new Map();
  (o.groups || []).forEach(g => {
    const found = S.groups.find(x => x.name.toLowerCase() === String(g.name).toLowerCase());
    if (found) { groupIds.set(g.id, found.id); return; }
    const id = S.nextId++;
    S.groups.push({ id, name: g.name, icon: g.icon || 'other', color: intToHex(g.color), active: false, created: g.created || Date.now() });
    groupIds.set(g.id, id);
  });
  const known = new Set(S.txs.map(t => `${t.ts}|${t.amount}|${t.title}`));
  let added = 0;
  (o.transactions || []).forEach(t => {
    const k = `${t.ts}|${t.amount}|${t.title}`;
    if (known.has(k)) return;
    known.add(k);
    S.txs.push({
      id: S.nextId++, amount: t.amount, title: t.title, category: t.category, ts: t.ts,
      source: t.source || 'manual', raw: t.raw || '', groupId: groupIds.get(t.group) || 0,
    });
    added++;
  });
  (o.categories || []).forEach(c => {
    if (!nameTaken(c.name)) S.cats.push({ name: c.name, icon: c.emoji || 'other', color: intToHex(c.color) });
  });
  const knownRec = new Set(S.recs.map(r => `${r.title}|${r.amount}|${r.day}`));
  (o.recurring || []).forEach(r => {
    const k = `${r.title}|${r.amount}|${r.day}`;
    if (knownRec.has(k)) return;
    knownRec.add(k);
    S.recs.push({ id: S.nextId++, title: r.title, amount: r.amount, category: r.category, day: r.day, last: r.last });
  });
  if (S.budget <= 0 && o.budget > 0) S.budget = o.budget;
  persist();
  return added;
}

/* ---------- statistiche ---------- */

const SPANS = [
  ['1S', '1S', 'Ultimi 7 giorni'],
  ['1M', '1M', 'Ultimi 30 giorni'],
  ['6M', '6M', 'Ultimi 6 mesi'],
  ['1A', '1A', 'Ultimi 12 mesi'],
  ['5A', '5A', 'Ultimi 5 anni'],
  ['ALL', 'Tutto', 'Da sempre'],
];

const itFmt = (d, opts) => d.toLocaleDateString('it-IT', opts);

function daysBuckets(today, n, labelFn) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const d = addDays(today, -(n - 1 - i));
    out.push({
      start: d.getTime(), end: addDays(d, 1).getTime(),
      label: labelFn(d, i), full: cap(itFmt(d, { weekday: 'long', day: 'numeric', month: 'long' })),
    });
  }
  return out;
}
function monthsBuckets(today, n) {
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const e = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    out.push({
      start: d.getTime(), end: e.getTime(),
      label: itFmt(d, { month: 'short' }).replace('.', ''), full: cap(itFmt(d, { month: 'long', year: 'numeric' })),
    });
  }
  return out;
}
function quartersBuckets(today, n) {
  const out = [];
  const q0 = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1);
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(q0.getFullYear(), q0.getMonth() - i * 3, 1);
    const e = new Date(d.getFullYear(), d.getMonth() + 3, 1);
    const q = d.getMonth() / 3 + 1;
    out.push({ start: d.getTime(), end: e.getTime(), label: q === 1 ? `’${String(d.getFullYear()).slice(2)}` : '', full: `T${q} ${d.getFullYear()}` });
  }
  return out;
}
function yearsBuckets(today, first) {
  const out = [];
  for (let y = first.getFullYear(); y <= today.getFullYear(); y++) {
    out.push({ start: new Date(y, 0, 1).getTime(), end: new Date(y + 1, 0, 1).getTime(), label: String(y), full: String(y) });
  }
  return out;
}

function summarize(span) {
  const today = startOfDay(new Date());
  const tomorrow = addDays(today, 1);
  let buckets;
  if (span === '1S') buckets = daysBuckets(today, 7, d => itFmt(d, { weekday: 'short' }).replace('.', ''));
  else if (span === '1M') buckets = daysBuckets(today, 30, (d, i) => (i % 5 === 0 ? String(d.getDate()) : ''));
  else if (span === '6M') buckets = monthsBuckets(today, 6);
  else if (span === '1A') buckets = monthsBuckets(today, 12);
  else if (span === '5A') buckets = quartersBuckets(today, 20);
  else {
    const first = S.txs.length ? startOfDay(new Date(Math.min(...S.txs.map(t => t.ts)))) : addDays(today, -29);
    const days = Math.round((today - first) / 86400000);
    const months = (today.getFullYear() - first.getFullYear()) * 12 + today.getMonth() - first.getMonth() + 1;
    if (days <= 45) buckets = daysBuckets(today, days + 1, (d, i) => (i % Math.max(1, Math.ceil((days + 1) / 7)) === 0 ? String(d.getDate()) : ''));
    else if (months <= 36) buckets = monthsBuckets(today, months);
    else buckets = yearsBuckets(today, first);
  }
  const from = buckets[0].start;
  const toEnd = buckets[buckets.length - 1].end;
  const inRange = S.txs.filter(t => t.ts >= from && t.ts < toEnd);
  const exp = inRange.filter(t => t.amount < 0);
  buckets.forEach(b => { b.spent = sum(exp.filter(t => t.ts >= b.start && t.ts < b.end), t => -t.amount); });

  const spent = sum(exp, t => -t.amount);
  let prevSpent = null;
  if (span !== 'ALL') {
    const len = tomorrow.getTime() - from;
    prevSpent = sum(S.txs.filter(t => t.amount < 0 && t.ts >= from - len && t.ts < from), t => -t.amount);
  }
  const byCat = new Map();
  exp.forEach(t => byCat.set(t.category, (byCat.get(t.category) || 0) + -t.amount));
  const byTitle = new Map();
  exp.forEach(t => {
    const k = t.title.trim().toLowerCase();
    const cur = byTitle.get(k) || { name: t.title.trim(), v: 0 };
    cur.v += -t.amount;
    byTitle.set(k, cur);
  });
  const days = Math.max(1, Math.round((tomorrow.getTime() - from) / 86400000));
  return {
    title: SPANS.find(s => s[0] === span)[2],
    from: new Date(from), to: today, buckets, spent, prevSpent,
    earned: sum(inRange.filter(t => t.amount > 0), t => t.amount),
    count: inRange.length,
    byCategory: [...byCat.entries()].sort((a, b) => b[1] - a[1]),
    topMerchants: [...byTitle.values()].sort((a, b) => b.v - a.v).slice(0, 5),
    biggest: exp.length ? exp.reduce((m, t) => (t.amount < m.amount ? t : m)) : null,
    avgPerDay: spent / days,
  };
}
