'use strict';
/* Interfaccia di Tasca (versione web). */

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const ui = {
  tab: 'movs',
  month: ymKey(new Date()),
  searching: false,
  search: '',
  span: '1M',
  sel: null,
  openGroup: null,
};

const dayLabel = ts => cap(new Date(ts).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' }));
const timeLabel = ts => new Date(ts).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
const shortDay = d => d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }).replace('.', '');

/* ---------- elementi comuni ---------- */

function badge(iconKey, { size = 44, bg = '', fg = '' } = {}) {
  const style = `width:${size}px;height:${size}px;${bg ? `background:${bg};` : ''}${fg ? `color:${fg};` : ''}`;
  return `<span class="badge" style="${style}">${icon(iconKey, Math.round(size * 0.5))}</span>`;
}

function head(title, right = '') {
  return `<div class="head"><h1>${title}</h1>${right}</div>`;
}

function txRow(t) {
  const st = catStyle(t.category);
  const g = t.groupId ? groupById(t.groupId) : null;
  const extra = (t.source === 'recurring' ? ' · Ricorrente' : '') + (g ? ` · ${esc(g.name)}` : '');
  return `<button class="row" data-act="editTx" data-id="${t.id}">
    ${badge(st.icon)}
    <span class="rt"><b>${esc(t.title)}</b><small>${esc(t.category)} · ${timeLabel(t.ts)}${extra}</small></span>
    <span class="amt ${t.amount > 0 ? 'in' : ''}">${t.amount > 0 ? '+' : ''}${money(t.amount)}</span>
  </button>`;
}

function dayGroups(list) {
  const map = new Map();
  list.forEach(t => {
    const k = dayKey(t.ts);
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(t);
  });
  return [...map.values()].map(items => {
    const day = sum(items.filter(t => t.amount < 0), t => -t.amount);
    return `<div class="daycap"><span>${dayLabel(items[0].ts)}</span>${day > 0 ? `<span>${money(day)}</span>` : ''}</div>
      ${items.map(txRow).join('')}`;
  }).join('');
}

/* ---------- Movimenti ---------- */

function movList() {
  const q = ui.search.trim().toLowerCase();
  const isSearch = ui.searching && q;
  const monthTx = sortedTx().filter(t => ymKey(new Date(t.ts)) === ui.month);
  const shown = isSearch
    ? sortedTx().filter(t => t.title.toLowerCase().includes(q) || t.category.toLowerCase().includes(q))
    : monthTx;
  const spent = sum(monthTx.filter(t => t.amount < 0), t => -t.amount);
  const earned = sum(monthTx.filter(t => t.amount > 0), t => t.amount);
  const [y, m] = ui.month.split('-').map(Number);
  const monthName = cap(new Date(y, m - 1, 1).toLocaleDateString('it-IT', { month: 'long', year: 'numeric' }));
  const canNext = ui.month < ymKey(new Date());
  const ag = S.groups.find(g => g.active);

  let html = '';
  if (!isSearch) {
    const over = S.budget > 0 && spent > S.budget;
    html += `<div class="hero">
      <div class="hero-nav">
        <button class="hn" data-act="prevMonth" aria-label="Mese precedente">${icon('left', 22)}</button>
        <span>${monthName}</span>
        <button class="hn" data-act="nextMonth" aria-label="Mese successivo" ${canNext ? '' : 'disabled'}>${icon('right', 22)}</button>
      </div>
      <div class="hero-label">Speso</div>
      <div class="hero-amt">${money(spent)}</div>
      ${earned > 0 ? `<div class="hero-sub">Entrate ${money(earned)} · Saldo ${money(earned - spent)}</div>` : ''}
      ${S.budget > 0 ? `<div class="budget"><div class="bar"><i class="${over ? 'over' : ''}" style="width:${Math.min(100, spent / S.budget * 100)}%"></i></div>
        <small>${over ? `Budget sforato di ${money(spent - S.budget)} (limite ${money(S.budget)})` : `Ti restano ${money(S.budget - spent)} su ${money(S.budget)}`}</small></div>` : ''}
    </div>`;
    if (ag) {
      html += `<button class="banner" data-act="openGroup" data-id="${ag.id}">
        ${badge(ag.icon, { size: 36, bg: ag.color, fg: '#fff' })}
        <span class="rt"><b>${esc(ag.name)}</b><small>Gruppo attivo: le nuove spese entrano qui</small></span>
        ${icon('right', 20)}
      </button>`;
    }
  }
  html += shown.length
    ? dayGroups(shown)
    : `<p class="empty">${isSearch ? 'Nessun risultato.' : 'Nessuna transazione in questo mese.<br>Con + ne aggiungi una.'}</p>`;
  return html;
}

function movsView() {
  return `${head('Movimenti', `<button class="icon-btn" data-act="toggleSearch" aria-label="Cerca">${icon(ui.searching ? 'close' : 'search', 24)}</button>`)}
    ${ui.searching ? `<input id="q" class="input" placeholder="Cerca per nome o categoria" value="${esc(ui.search)}" autocomplete="off" enterkeyhint="search">` : ''}
    <div id="movlist">${movList()}</div>`;
}

/* ---------- Gruppi ---------- */

function groupSubtitle(txs) {
  if (!txs.length) return 'Nessuna spesa';
  const from = new Date(Math.min(...txs.map(t => t.ts)));
  const to = new Date(Math.max(...txs.map(t => t.ts)));
  const n = txs.length === 1 ? '1 movimento' : `${txs.length} movimenti`;
  const range = dayKey(from.getTime()) === dayKey(to.getTime()) ? shortDay(from) : `${shortDay(from)} – ${shortDay(to)}`;
  return `${n} · ${range}`;
}
const spentIn = txs => sum(txs.filter(t => t.amount < 0), t => -t.amount);

function groupsView() {
  const open = groupById(ui.openGroup);
  if (!open) {
    const cards = S.groups.slice().sort((a, b) => Number(b.active) - Number(a.active) || b.created - a.created).map(g => {
      const txs = S.txs.filter(t => t.groupId === g.id);
      return `<button class="card gcard" data-act="openGroup" data-id="${g.id}">
        ${badge(g.icon, { size: 48, bg: g.color, fg: '#fff' })}
        <span class="rt"><b>${esc(g.name)}${g.active ? '<em class="pill">Attivo</em>' : ''}</b><small>${groupSubtitle(txs)}</small></span>
        <strong>${money(spentIn(txs))}</strong>
      </button>`;
    }).join('');
    return `${head('Gruppi', `<button class="btn small" data-act="newGroup">${icon('plus', 18)}Nuovo</button>`)}
      <p class="muted">Raggruppa le spese di un viaggio o di un evento. Restano nei movimenti e contano nel totale di ogni mese.</p>
      ${cards || '<p class="empty">Nessun gruppo.<br>Creane uno prima di partire: con "attivo" le spese ci entrano da sole.</p>'}`;
  }
  const txs = sortedTx().filter(t => t.groupId === open.id);
  const spent = spentIn(txs);
  const earned = sum(txs.filter(t => t.amount > 0), t => t.amount);
  const cats = new Map();
  txs.filter(t => t.amount < 0).forEach(t => cats.set(t.category, (cats.get(t.category) || 0) + -t.amount));
  const top = [...cats.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  return `<div class="head">
      <button class="icon-btn" data-act="closeGroup" aria-label="Indietro">${icon('left', 24)}</button>
      <h2 class="grow">${esc(open.name)}</h2>
      <button class="icon-btn" data-act="editGroup" data-id="${open.id}" aria-label="Modifica">${icon('edit', 22)}</button>
      <button class="icon-btn" data-act="delGroup" data-id="${open.id}" aria-label="Elimina">${icon('trash', 22)}</button>
    </div>
    <div class="hero">
      <div class="hero-top">${badge(open.icon, { size: 36, bg: open.color, fg: '#fff' })}<span class="hero-label">Speso nel gruppo</span></div>
      <div class="hero-amt">${money(spent)}</div>
      <div class="hero-sub">${groupSubtitle(txs)}</div>
      ${earned > 0 ? `<div class="hero-sub">Entrate ${money(earned)}</div>` : ''}
      <div class="hero-note">Queste spese sono già comprese nel totale di ogni mese.</div>
    </div>
    <div class="card between">
      <div><b>Gruppo attivo</b><small class="block muted">Le nuove spese entrano qui da sole.</small></div>
      <label class="switch"><input type="checkbox" data-act="toggleActive" data-id="${open.id}" ${open.active ? 'checked' : ''}><i></i></label>
    </div>
    <button class="btn wide" data-act="addToGroup" data-id="${open.id}">${icon('plus', 18)}Aggiungi spesa al gruppo</button>
    ${top.length ? `<div class="card"><h3>Per categoria</h3>${top.map(([c, v]) => {
      const st = catStyle(c);
      return `<div class="li">${badge(st.icon, { size: 34, bg: st.color, fg: '#fff' })}<span class="grow">${esc(c)}</span><b>${money(v)}</b></div>`;
    }).join('')}</div>` : ''}
    <h3 class="sec">Movimenti</h3>
    ${txs.length ? txs.map(txRow).join('') : '<p class="empty">Ancora nessuna spesa in questo gruppo.</p>'}`;
}

/* ---------- Statistiche ---------- */

function donut(data, total) {
  let acc = 0;
  const rings = data.map(([cat, v]) => {
    const pct = v / total * 100;
    const dash = Math.max(0.1, pct - (data.length > 1 ? 0.7 : 0));
    const el = `<circle cx="21" cy="21" r="15.9155" fill="none" stroke="${catStyle(cat).color}" stroke-width="5.5"
      stroke-dasharray="${dash} ${100 - dash}" stroke-dashoffset="${-acc}"/>`;
    acc += pct;
    return el;
  }).join('');
  return `<div class="donut"><svg viewBox="0 0 42 42"><g transform="rotate(-90 21 21)">${rings}</g></svg>
    <div class="donut-c"><small>Totale</small><b>${moneyShort(total)}</b></div></div>`;
}

function statsView() {
  const s = summarize(ui.span);
  const max = Math.max(1, ...s.buckets.map(b => b.spent));
  const sel = ui.sel !== null ? s.buckets[ui.sel] : null;
  const prev = s.prevSpent;
  let delta = '';
  if (prev !== null && prev > 0) {
    const pct = Math.round((s.spent - prev) / prev * 100);
    delta = `<span class="chip-w">${pct === 0 ? '' : icon(pct < 0 ? 'down' : 'up', 14)}${pct === 0 ? 'Come il periodo precedente' : `${Math.abs(pct)}% rispetto al periodo precedente`}</span>`;
  }
  let body;
  if (!s.count) {
    body = '<p class="empty">Nessun dato in questo periodo.<br>Appena registri delle transazioni compariranno i grafici.</p>';
  } else {
    body = `<div class="card">
        <h3>${sel ? esc(sel.full) : 'Spese nel tempo'}</h3>
        <p class="muted">${sel ? money(sel.spent) : 'Tocca una barra per vedere il dettaglio'}</p>
        <div class="bars">${s.buckets.map((b, i) => `<button class="bcol ${ui.sel === i ? 'sel' : ''} ${ui.sel !== null && ui.sel !== i ? 'dim' : ''}" data-act="selBar" data-i="${i}" aria-label="${esc(b.full)}"><i class="${b.spent ? '' : 'zero'}" style="height:${b.spent / max * 100}%"></i></button>`).join('')}</div>
        <div class="blabels">${s.buckets.map(b => `<span>${esc(b.label)}</span>`).join('')}</div>
      </div>
      ${s.byCategory.length ? `<div class="card"><h3>Per categoria</h3>
        <div class="center">${donut(s.byCategory, s.spent)}</div>
        ${s.byCategory.map(([c, v]) => {
          const st = catStyle(c);
          return `<div class="li">${badge(st.icon, { size: 34, bg: st.color, fg: '#fff' })}<span class="grow">${esc(c)}</span><small class="muted pct">${Math.round(v / s.spent * 100)}%</small><b>${money(v)}</b></div>`;
        }).join('')}</div>` : ''}
      <div class="tiles">
        <div class="tile"><small>Media al giorno</small><b>${money(s.avgPerDay)}</b></div>
        <div class="tile"><small>Transazioni</small><b>${s.count}</b></div>
        <div class="tile"><small>Entrate</small><b class="good">${money(s.earned)}</b></div>
        <div class="tile"><small>Spesa più alta</small><b>${s.biggest ? money(-s.biggest.amount) : '—'}</b>${s.biggest ? `<small class="ell">${esc(s.biggest.title)}</small>` : ''}</div>
      </div>
      ${s.topMerchants.length ? `<div class="card"><h3>Dove spendi di più</h3>${s.topMerchants.map(m => `
        <div class="merch"><div class="between"><span class="ell">${esc(m.name)}</span><b>${money(m.v)}</b></div>
        <div class="bar thin"><i style="width:${m.v / s.topMerchants[0].v * 100}%"></i></div></div>`).join('')}</div>` : ''}`;
  }
  return `${head('Statistiche')}
    <div class="seg six">${SPANS.map(([k, label]) => `<button class="${ui.span === k ? 'on' : ''}" data-act="span" data-k="${k}">${label}</button>`).join('')}</div>
    <div class="hero">
      <div class="hero-label">${s.title}</div>
      <div class="hero-amt">${money(s.spent)}</div>
      <div class="hero-sub">${shortDay(s.from)} ${s.from.getFullYear()} – ${shortDay(s.to)} ${s.to.getFullYear()}</div>
      ${delta}
    </div>
    ${body}`;
}

/* ---------- Impostazioni ---------- */

const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isStandalone = navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;

function settingsView() {
  const lock = lockCfg();
  const budgetVal = S.budget > 0 ? String(S.budget).replace('.', ',') : '';
  return `${head('Impostazioni')}
    ${!isStandalone ? `<div class="card"><h3>Installa su iPhone</h3>
      <p class="muted">Apri questa pagina in Safari, tocca il tasto Condividi ${icon('share', 16)} e poi "Aggiungi alla schermata Home": Tasca si apre a schermo intero, come un'app.</p></div>` : ''}
    <div class="card"><h3>Budget mensile</h3>
      <p class="muted">Imposta un limite di spesa: nei Movimenti vedrai quanto ti resta.</p>
      <div class="inline"><input id="budget" class="input" inputmode="decimal" placeholder="Budget (€)" value="${budgetVal}" autocomplete="off"><button class="btn" data-act="saveBudget">${S.budget > 0 ? 'Aggiorna' : 'Imposta'}</button></div>
      ${S.budget > 0
        ? `<div class="status ok">${icon('check', 22)}<b class="grow">Budget attivo: ${money(S.budget)} al mese</b><button class="link danger" data-act="clearBudget">Rimuovi</button></div>`
        : '<p class="muted">Nessun budget impostato.</p>'}</div>
    <div class="card"><h3>Sicurezza</h3>
      <div class="between"><div><b>Blocco con PIN</b><small class="block muted">Chiede un PIN di 4 cifre quando apri Tasca.</small></div>
        <label class="switch"><input type="checkbox" data-act="toggleLock" ${lock ? 'checked' : ''}><i></i></label></div></div>
    <div class="card"><h3>Categorie</h3>
      <p class="muted">Oltre a quelle già presenti, puoi crearne di tue.</p>
      ${S.cats.length ? S.cats.map(c => `<div class="li">${badge(c.icon, { size: 40, bg: c.color, fg: '#fff' })}<b class="grow">${esc(c.name)}</b>
        <button class="icon-btn" data-act="editCat" data-name="${esc(c.name)}" aria-label="Modifica">${icon('edit', 20)}</button>
        <button class="icon-btn" data-act="delCat" data-name="${esc(c.name)}" aria-label="Elimina">${icon('trash', 20)}</button></div>`).join('')
        : '<p class="muted">Nessuna categoria personalizzata.</p>'}
      <button class="btn secondary" data-act="newCat">${icon('plus', 18)}Nuova categoria</button></div>
    <div class="card"><h3>Spese ricorrenti</h3>
      <p class="muted">Abbonamenti, affitto, stipendio: si registrano da soli ogni mese al giorno che scegli (quando apri l'app).</p>
      ${S.recs.map(r => `<div class="li">${badge(catStyle(r.category).icon, { size: 40 })}
        <span class="rt grow"><b>${esc(r.title)}</b><small>${money(r.amount)} · ogni mese il ${r.day}</small></span>
        <button class="icon-btn" data-act="delRec" data-id="${r.id}" aria-label="Elimina">${icon('trash', 20)}</button></div>`).join('')}
      <button class="btn secondary" data-act="newRec">${icon('plus', 18)}Nuova ricorrente</button></div>
    <div class="card"><h3>Dati</h3>
      <p class="muted">I dati restano su questo telefono. Fai ogni tanto un backup e conservalo (iCloud Drive, Dropbox…): se cancelli i dati di Safari o cambi telefono, lo ripristini da qui. Il file è compatibile con l'app Android.</p>
      <div class="inline wrap">
        <button class="btn" data-act="backup">${icon('download', 18)}Salva backup</button>
        <button class="btn secondary" data-act="restore">${icon('upload', 18)}Ripristina</button>
        <button class="btn secondary" data-act="csv">${icon('share', 18)}Esporta CSV</button>
      </div>
      <input id="file" type="file" accept=".json,application/json" hidden></div>`;
}

/* ---------- disegno della pagina ---------- */

const views = { movs: movsView, groups: groupsView, stats: statsView, settings: settingsView };
const TABS = [['movs', 'receipt', 'Movimenti'], ['groups', 'folder', 'Gruppi'], ['stats', 'chart', 'Statistiche'], ['settings', 'settings', 'Impostazioni']];

function render() {
  const main = $('#main');
  main.innerHTML = views[ui.tab]();
  $('#tabs').innerHTML = TABS.map(([k, ic, label]) =>
    `<button class="${ui.tab === k ? 'on' : ''}" data-act="tab" data-tab="${k}"><span class="tp">${icon(ic, 24)}</span><small>${label}</small></button>`).join('');
  $('#fab').hidden = ui.tab !== 'movs';
}

/* ---------- finestre (sheet) ---------- */

function openSheet(html, mount) {
  const wrap = document.createElement('div');
  wrap.className = 'sheet-wrap';
  wrap.innerHTML = `<div class="backdrop" data-act="closeSheet"></div><div class="sheet" role="dialog"><div class="grab"></div>${html}</div>`;
  $('#sheet-root').appendChild(wrap);
  requestAnimationFrame(() => wrap.classList.add('open'));
  if (mount) mount($('.sheet', wrap), wrap);
  return wrap;
}
function closeSheet(wrap) {
  const w = wrap || $('#sheet-root').lastElementChild;
  if (!w) return;
  w.classList.remove('open');
  setTimeout(() => w.remove(), 220);
}

const chip = (label, iconKey, on, attrs) =>
  `<button type="button" class="chip ${on ? 'on' : ''}" ${attrs}>${iconKey ? icon(iconKey, 18) : ''}${esc(label)}</button>`;

const dateValue = ts => dayKey(ts);

function txSheet(opts = {}) {
  const tx = opts.tx || null;
  const st = {
    kind: tx ? (tx.amount < 0 ? 'out' : 'in') : (opts.income ? 'in' : 'out'),
    cat: tx ? tx.category : (opts.income ? INCOME : OTHER),
    touched: !!tx,
    gid: tx ? tx.groupId : (opts.groupId || activeGroupId()),
  };
  const amt = tx ? Math.abs(tx.amount).toFixed(2).replace('.', ',') : '';
  openSheet(`
    <h2>${tx ? 'Modifica transazione' : 'Nuova transazione'}</h2>
    <div class="seg two"><button type="button" data-k="out">Spesa</button><button type="button" data-k="in">Entrata</button></div>
    <label class="field"><span>Importo (€)</span><input id="f-amt" class="input" inputmode="decimal" autocomplete="off" placeholder="0,00" value="${amt}"></label>
    <label class="field"><span>Descrizione</span><input id="f-title" class="input" autocomplete="off" value="${esc(tx ? tx.title : '')}"></label>
    <div class="field"><span>Categoria</span><div class="chips" id="f-cats"></div></div>
    <div class="field"><span>Gruppo</span><div class="chips" id="f-grps"></div></div>
    <label class="field"><span>Data</span><input id="f-date" type="date" class="input" value="${dateValue(tx ? tx.ts : Date.now())}"></label>
    <div class="actions">
      ${tx ? '<button type="button" class="btn danger" id="f-del">Elimina</button>' : ''}
      <button type="button" class="btn secondary" data-act="closeSheet">Annulla</button>
      <button type="button" class="btn" id="f-save">Salva</button>
    </div>`, (sheet, wrap) => {
    const amtEl = $('#f-amt', sheet), titleEl = $('#f-title', sheet), saveEl = $('#f-save', sheet);
    const paintKind = () => $$('.seg button', sheet).forEach(b => b.classList.toggle('on', b.dataset.k === st.kind));
    const paintCats = () => {
      $('#f-cats', sheet).innerHTML = allCats().map(c => chip(c.name, c.icon, st.cat === c.name, `data-cat="${esc(c.name)}"`)).join('')
        + chip('Altro', 'plus', false, 'data-newcat="1"');
    };
    const paintGroups = () => {
      $('#f-grps', sheet).innerHTML = chip('Nessuno', '', st.gid === 0, 'data-gid="0"')
        + S.groups.map(g => chip(g.name, g.icon, st.gid === g.id, `data-gid="${g.id}"`)).join('')
        + chip('Nuovo', 'plus', false, 'data-newgrp="1"');
    };
    const check = () => {
      const a = parseAmount(amtEl.value);
      saveEl.disabled = !(a > 0) || !titleEl.value.trim();
    };
    paintKind(); paintCats(); paintGroups(); check();

    sheet.addEventListener('click', e => {
      const k = e.target.closest('.seg button');
      if (k) {
        st.kind = k.dataset.k;
        if (!st.touched) st.cat = st.kind === 'in' ? INCOME : guessCategory(titleEl.value, false);
        paintKind(); paintCats();
        return;
      }
      const c = e.target.closest('[data-cat]');
      if (c) { st.cat = c.dataset.cat; st.touched = true; paintCats(); return; }
      const g = e.target.closest('[data-gid]');
      if (g) { st.gid = Number(g.dataset.gid); paintGroups(); return; }
      if (e.target.closest('[data-newcat]')) {
        catSheet({ onSave: nc => { st.cat = nc.name; st.touched = true; paintCats(); } });
      } else if (e.target.closest('[data-newgrp]')) {
        groupSheet({ onSave: id => { st.gid = id; paintGroups(); } });
      }
    });
    amtEl.addEventListener('input', check);
    titleEl.addEventListener('input', () => {
      if (!st.touched) { st.cat = guessCategory(titleEl.value, st.kind === 'in'); paintCats(); }
      check();
    });
    saveEl.addEventListener('click', () => {
      const v = parseAmount(amtEl.value);
      if (!(v > 0) || !titleEl.value.trim()) return;
      const dv = $('#f-date', sheet).value;
      let ts = tx ? tx.ts : Date.now();
      if (dv && dv !== dateValue(ts)) {
        const [Y, M, D] = dv.split('-').map(Number);
        const t = new Date(ts);
        ts = new Date(Y, M - 1, D, t.getHours(), t.getMinutes(), t.getSeconds()).getTime();
      }
      const data = {
        id: tx ? tx.id : 0, amount: st.kind === 'out' ? -v : v, title: titleEl.value.trim(), category: st.cat,
        ts, source: tx ? tx.source : 'manual', raw: tx ? tx.raw : '', groupId: st.gid,
      };
      if (tx) updateTx(data); else addTx(data);
      closeSheet(wrap);
      render();
    });
    const del = $('#f-del', sheet);
    if (del) del.addEventListener('click', () => { closeSheet(wrap); removeTx(tx.id); });
    if (!tx) setTimeout(() => amtEl.focus(), 300);
  });
}

function removeTx(id) {
  const t = deleteTx(id);
  render();
  if (t) toast('Transazione eliminata', 'Annulla', () => { addTx({ ...t, id: 0 }); render(); });
}

function iconGrid(keys, selected) {
  return keys.map(k => `<button type="button" class="ig ${k === selected ? 'on' : ''}" data-ic="${k}" aria-label="${k}">${icon(k, 22)}</button>`).join('');
}
function colorRow(selected) {
  return COLORS.map(c => `<button type="button" class="cd ${c === selected ? 'on' : ''}" data-col="${c}" style="background:${c}" aria-label="${c}"></button>`).join('');
}

/** Selettori di icona e colore condivisi da categorie e gruppi. */
function pickers(sheet, st, preview) {
  const paint = () => {
    $$('.ig', sheet).forEach(b => b.classList.toggle('on', b.dataset.ic === st.icon));
    $$('.cd', sheet).forEach(b => b.classList.toggle('on', b.dataset.col === st.color));
    preview();
  };
  sheet.addEventListener('click', e => {
    const i = e.target.closest('.ig');
    if (i) { st.icon = i.dataset.ic; paint(); return; }
    const c = e.target.closest('.cd');
    if (c) { st.color = c.dataset.col; paint(); }
  });
  paint();
}

function catSheet({ cat = null, onSave } = {}) {
  const st = { icon: cat ? cat.icon : PICKABLE[0], color: cat ? cat.color : COLORS[0] };
  openSheet(`
    <h2>${cat ? 'Modifica categoria' : 'Nuova categoria'}</h2>
    <label class="field"><span>Nome</span><input id="c-name" class="input" maxlength="24" autocomplete="off" value="${esc(cat ? cat.name : '')}"></label>
    <p class="err" id="c-err" hidden>Esiste già una categoria con questo nome</p>
    <div class="field"><span>Icona</span><div class="grid">${iconGrid(PICKABLE, st.icon)}</div></div>
    <div class="field"><span>Colore</span><div class="colors">${colorRow(st.color)}</div></div>
    <div class="preview" id="c-prev"></div>
    <div class="actions"><button type="button" class="btn secondary" data-act="closeSheet">Annulla</button><button type="button" class="btn" id="c-save">${cat ? 'Salva' : 'Crea'}</button></div>`,
  (sheet, wrap) => {
    const nameEl = $('#c-name', sheet), saveEl = $('#c-save', sheet);
    const taken = () => nameTaken(nameEl.value, cat ? cat.name : undefined);
    const check = () => {
      $('#c-err', sheet).hidden = !(nameEl.value.trim() && taken());
      saveEl.disabled = !nameEl.value.trim() || taken();
      $('#c-prev', sheet).innerHTML = `${badge(st.icon, { size: 44, bg: st.color, fg: '#fff' })}<b>${esc(nameEl.value.trim() || 'Anteprima')}</b>`;
    };
    pickers(sheet, st, check);
    nameEl.addEventListener('input', check);
    saveEl.addEventListener('click', () => {
      const data = { name: nameEl.value.trim(), icon: st.icon, color: st.color };
      const ok = cat ? updateCategory(cat.name, data) : addCategory(data);
      if (!ok) { check(); return; }
      closeSheet(wrap);
      if (onSave) onSave(data);
      render();
    });
    if (!cat) setTimeout(() => nameEl.focus(), 300);
  });
}

function groupSheet({ group = null, onSave } = {}) {
  const st = { icon: group ? group.icon : 'plane', color: group ? group.color : COLORS[2] };
  openSheet(`
    <h2>${group ? 'Modifica gruppo' : 'Nuovo gruppo'}</h2>
    <label class="field"><span>Nome (es. Viaggio a Praga)</span><input id="g-name" class="input" maxlength="30" autocomplete="off" value="${esc(group ? group.name : '')}"></label>
    <p class="err" id="g-err" hidden>Esiste già un gruppo con questo nome</p>
    <div class="field"><span>Icona</span><div class="grid">${iconGrid(GROUP_ICONS, st.icon)}</div></div>
    <div class="field"><span>Colore</span><div class="colors">${colorRow(st.color)}</div></div>
    <div class="between"><div><b>Gruppo attivo</b><small class="block muted">Le nuove spese entrano qui da sole.</small></div>
      <label class="switch"><input id="g-active" type="checkbox" ${group ? (group.active ? 'checked' : '') : 'checked'}><i></i></label></div>
    <div class="preview" id="g-prev"></div>
    <div class="actions"><button type="button" class="btn secondary" data-act="closeSheet">Annulla</button><button type="button" class="btn" id="g-save">${group ? 'Salva' : 'Crea'}</button></div>`,
  (sheet, wrap) => {
    const nameEl = $('#g-name', sheet), saveEl = $('#g-save', sheet);
    const taken = () => S.groups.some(g => g.id !== (group ? group.id : 0) && g.name.toLowerCase() === nameEl.value.trim().toLowerCase());
    const check = () => {
      $('#g-err', sheet).hidden = !(nameEl.value.trim() && taken());
      saveEl.disabled = !nameEl.value.trim() || taken();
      $('#g-prev', sheet).innerHTML = `${badge(st.icon, { size: 44, bg: st.color, fg: '#fff' })}<b>${esc(nameEl.value.trim() || 'Anteprima')}</b>`;
    };
    pickers(sheet, st, check);
    nameEl.addEventListener('input', check);
    saveEl.addEventListener('click', () => {
      const id = saveGroup({
        id: group ? group.id : 0, name: nameEl.value, icon: st.icon, color: st.color, active: $('#g-active', sheet).checked,
      });
      if (!id) { check(); return; }
      closeSheet(wrap);
      if (onSave) onSave(id);
      render();
    });
    if (!group) setTimeout(() => nameEl.focus(), 300);
  });
}

function recSheet() {
  const st = { kind: 'out', cat: OTHER };
  openSheet(`
    <h2>Nuova spesa ricorrente</h2>
    <div class="seg two"><button type="button" data-k="out">Spesa</button><button type="button" data-k="in">Entrata</button></div>
    <label class="field"><span>Descrizione (es. Netflix, Affitto)</span><input id="r-title" class="input" autocomplete="off"></label>
    <label class="field"><span>Importo (€)</span><input id="r-amt" class="input" inputmode="decimal" autocomplete="off" placeholder="0,00"></label>
    <label class="field"><span>Giorno del mese (1-31)</span><input id="r-day" class="input" inputmode="numeric" maxlength="2" value="1"></label>
    <div class="field"><span>Categoria</span><div class="chips" id="r-cats"></div></div>
    <p class="muted">Si registra da sola ogni mese, quando apri l'app. Il mese in corso conta solo se il giorno non è ancora passato.</p>
    <div class="actions"><button type="button" class="btn secondary" data-act="closeSheet">Annulla</button><button type="button" class="btn" id="r-save">Crea</button></div>`,
  (sheet, wrap) => {
    const titleEl = $('#r-title', sheet), amtEl = $('#r-amt', sheet), dayEl = $('#r-day', sheet), saveEl = $('#r-save', sheet);
    const paintKind = () => $$('.seg button', sheet).forEach(b => b.classList.toggle('on', b.dataset.k === st.kind));
    const paintCats = () => {
      $('#r-cats', sheet).innerHTML = allCats().map(c => chip(c.name, c.icon, st.cat === c.name, `data-cat="${esc(c.name)}"`)).join('');
    };
    const check = () => {
      const a = parseAmount(amtEl.value), d = Number(dayEl.value);
      saveEl.disabled = !(a > 0) || !(d >= 1 && d <= 31) || !titleEl.value.trim();
    };
    paintKind(); paintCats(); check();
    sheet.addEventListener('click', e => {
      const k = e.target.closest('.seg button');
      if (k) { st.kind = k.dataset.k; st.cat = st.kind === 'in' ? INCOME : OTHER; paintKind(); paintCats(); return; }
      const c = e.target.closest('[data-cat]');
      if (c) { st.cat = c.dataset.cat; paintCats(); }
    });
    titleEl.addEventListener('input', () => { st.cat = guessCategory(titleEl.value, st.kind === 'in'); paintCats(); check(); });
    amtEl.addEventListener('input', check);
    dayEl.addEventListener('input', () => { dayEl.value = dayEl.value.replace(/\D/g, ''); check(); });
    saveEl.addEventListener('click', () => {
      const v = parseAmount(amtEl.value);
      addRecurring({ title: titleEl.value, amount: st.kind === 'out' ? -v : v, category: st.cat, day: Number(dayEl.value) });
      closeSheet(wrap);
      render();
    });
  });
}

function confirmSheet({ title, text, ok, onOk }) {
  openSheet(`<h2>${esc(title)}</h2><p class="muted">${esc(text)}</p>
    <div class="actions"><button type="button" class="btn secondary" data-act="closeSheet">Annulla</button><button type="button" class="btn danger" id="ok">${esc(ok)}</button></div>`,
  (sheet, wrap) => $('#ok', sheet).addEventListener('click', () => { closeSheet(wrap); onOk(); }));
}

/* ---------- avvisi ---------- */

let toastTimer;
function toast(msg, action, fn) {
  const t = $('#toast');
  t.innerHTML = `<span>${esc(msg)}</span>${action ? `<button type="button" id="toast-act">${esc(action)}</button>` : ''}`;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), action ? 5000 : 3000);
  if (action) {
    $('#toast-act').onclick = () => { t.classList.remove('show'); fn(); };
  }
}

/* ---------- blocco con PIN ---------- */

const LOCK_KEY = 'tasca.lock';
function lockCfg() {
  try { return JSON.parse(localStorage.getItem(LOCK_KEY) || 'null'); } catch (e) { return null; }
}
async function sha(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map(x => x.toString(16).padStart(2, '0')).join('');
}

/** Tastierino per il PIN; onDone(pin) riceve le 4 cifre, `api.reset(msg)` le cancella. */
function pinPad(box, { title, sub, onDone }) {
  let pin = '';
  box.innerHTML = `<div class="pin-title"><b>${esc(title)}</b><small class="muted" id="pin-sub">${esc(sub || '')}</small></div>
    <div class="dots" id="dots"><i></i><i></i><i></i><i></i></div>
    <div class="keys">${[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, 'del'].map(k => k === ''
      ? '<span></span>'
      : `<button type="button" data-key="${k}" aria-label="${k === 'del' ? 'Cancella' : k}">${k === 'del' ? icon('backspace', 24) : k}</button>`).join('')}</div>`;
  const paint = () => $$('#dots i', box).forEach((d, i) => d.classList.toggle('on', i < pin.length));
  box.onclick = e => {
    const b = e.target.closest('[data-key]');
    if (!b) return;
    if (b.dataset.key === 'del') pin = pin.slice(0, -1);
    else if (pin.length < 4) pin += b.dataset.key;
    paint();
    if (pin.length === 4) {
      const done = pin;
      setTimeout(() => onDone(done), 120);
    }
  };
  return {
    reset(msg, shake = true) {
      pin = '';
      paint();
      if (msg) $('#pin-sub', box).textContent = msg;
      if (!shake) return;
      const d = $('#dots', box);
      d.classList.remove('shake');
      void d.offsetWidth;
      d.classList.add('shake');
    },
  };
}

let hiddenAt = 0;
let isLocked = false;
function showLock(cover) {
  const el = $('#lock');
  el.hidden = false;
  el.classList.toggle('cover', !!cover);
  if (cover) { $('#lock-pad').innerHTML = ''; return; }
  const cfg = lockCfg();
  if (!cfg) { el.hidden = true; isLocked = false; return; }
  isLocked = true;
  const pad = pinPad($('#lock-pad'), {
    title: 'Tasca', sub: 'Inserisci il PIN',
    async onDone(pin) {
      if (await sha(cfg.salt + pin) === cfg.hash) { el.hidden = true; isLocked = false; $('#lock-pad').innerHTML = ''; }
      else pad.reset('PIN errato, riprova');
    },
  });
}

function needSecure() {
  if (window.crypto && crypto.subtle) return false;
  toast('Il blocco con PIN funziona solo con il sito aperto in modo sicuro (https).');
  return true;
}

function enableLock() {
  if (needSecure()) { render(); return; }
  let first = null;
  openSheet('<div id="pin-box"></div><div class="actions"><button type="button" class="btn secondary" data-act="closeSheet">Annulla</button></div>', (sheet, wrap) => {
    const pad = pinPad($('#pin-box', sheet), {
      title: 'Scegli un PIN', sub: '4 cifre',
      async onDone(pin) {
        if (first === null) { first = pin; pad.reset('Per conferma', false); $('#pin-box .pin-title b', sheet).textContent = 'Ripeti il PIN'; return; }
        if (pin !== first) { first = null; $('#pin-box .pin-title b', sheet).textContent = 'Scegli un PIN'; pad.reset('Non coincidono, riprova'); return; }
        const salt = crypto.getRandomValues(new Uint32Array(2)).join('-');
        localStorage.setItem(LOCK_KEY, JSON.stringify({ salt, hash: await sha(salt + pin) }));
        closeSheet(wrap);
        render();
        toast('Blocco attivato');
      },
    });
  });
}

function disableLock() {
  const cfg = lockCfg();
  if (!cfg) return;
  openSheet('<div id="pin-box"></div><div class="actions"><button type="button" class="btn secondary" data-act="closeSheet">Annulla</button></div>', (sheet, wrap) => {
    const pad = pinPad($('#pin-box', sheet), {
      title: 'Inserisci il PIN', sub: 'Per disattivare il blocco',
      async onDone(pin) {
        if (await sha(cfg.salt + pin) === cfg.hash) {
          localStorage.removeItem(LOCK_KEY);
          closeSheet(wrap);
          render();
          toast('Blocco disattivato');
        } else pad.reset('PIN errato, riprova');
      },
    });
  });
}

/* ---------- file ---------- */

async function shareOrDownload(name, text, mime) {
  const file = new File([text], name, { type: mime });
  try {
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: name });
      return;
    }
  } catch (e) {
    if (e && e.name === 'AbortError') return;
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(file);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}

function exportCsv() {
  const names = new Map(S.groups.map(g => [g.id, g.name.replace(/;/g, ',')]));
  const rows = ['data;descrizione;categoria;importo;origine;gruppo'];
  S.txs.slice().sort((a, b) => a.ts - b.ts).forEach(t => {
    const d = new Date(t.ts);
    const stamp = `${dayKey(t.ts)} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
    rows.push([stamp, t.title.replace(/[;\n]/g, ' '), t.category, t.amount.toFixed(2).replace('.', ','), t.source, names.get(t.groupId) || ''].join(';'));
  });
  shareOrDownload('Tasca.csv', '﻿' + rows.join('\n'), 'text/csv');
}

/* ---------- azioni ---------- */

const acts = {
  tab(el) { ui.tab = el.dataset.tab; ui.openGroup = null; render(); $('#main').scrollTop = 0; },
  closeSheet(el) { closeSheet(el.closest('.sheet-wrap')); },
  prevMonth() { const [y, m] = ui.month.split('-').map(Number); ui.month = ymKey(new Date(y, m - 2, 1)); render(); },
  nextMonth() {
    const [y, m] = ui.month.split('-').map(Number);
    const n = ymKey(new Date(y, m, 1));
    if (n <= ymKey(new Date())) { ui.month = n; render(); }
  },
  toggleSearch() {
    ui.searching = !ui.searching;
    if (!ui.searching) ui.search = '';
    render();
    if (ui.searching) $('#q').focus();
  },
  editTx(el) { const t = S.txs.find(x => x.id === Number(el.dataset.id)); if (t) txSheet({ tx: t }); },
  add() { txSheet({}); },
  openGroup(el) { ui.openGroup = Number(el.dataset.id); ui.tab = 'groups'; render(); $('#main').scrollTop = 0; },
  closeGroup() { ui.openGroup = null; render(); },
  newGroup() { groupSheet({ onSave: id => { ui.openGroup = id; render(); } }); },
  editGroup(el) { groupSheet({ group: groupById(Number(el.dataset.id)) }); },
  delGroup(el) {
    const g = groupById(Number(el.dataset.id));
    confirmSheet({
      title: 'Eliminare il gruppo?', text: `"${g.name}" verrà eliminato. Le sue spese restano nei movimenti, senza gruppo.`, ok: 'Elimina',
      onOk: () => { deleteGroup(g.id); ui.openGroup = null; render(); },
    });
  },
  toggleActive(el) { setGroupActive(Number(el.dataset.id), el.checked); render(); },
  addToGroup(el) { txSheet({ groupId: Number(el.dataset.id) }); },
  selBar(el) { const i = Number(el.dataset.i); ui.sel = ui.sel === i ? null : i; render(); },
  span(el) { ui.span = el.dataset.k; ui.sel = null; render(); },
  saveBudget() {
    const n = parseAmount($('#budget').value);
    S.budget = n > 0 ? n : 0;
    persist();
    render();
    toast(S.budget > 0 ? `Budget impostato: ${money(S.budget)} al mese` : 'Budget rimosso');
    const st = $('.status');
    if (st) { st.classList.remove('flash'); void st.offsetWidth; st.classList.add('flash'); }
  },
  clearBudget() {
    S.budget = 0;
    persist();
    render();
    toast('Budget rimosso');
  },
  toggleLock(el) {
    const want = el.checked;
    el.checked = !!lockCfg(); // lo stato vero lo decide il PIN: render() lo aggiorna a operazione conclusa
    if (want) enableLock(); else disableLock();
  },
  newCat() { catSheet({}); },
  editCat(el) { const c = S.cats.find(x => x.name === el.dataset.name); if (c) catSheet({ cat: c }); },
  delCat(el) {
    const name = el.dataset.name;
    confirmSheet({
      title: 'Eliminare la categoria?', text: `"${name}" verrà eliminata. Le sue spese passano a "${OTHER}".`, ok: 'Elimina',
      onOk: () => { deleteCategory(name); render(); },
    });
  },
  newRec() { recSheet(); },
  delRec(el) { deleteRecurring(Number(el.dataset.id)); render(); },
  backup() { shareOrDownload(`tasca-backup-${dayKey(Date.now())}.json`, exportBackup(), 'application/json'); },
  restore() { $('#file').click(); },
  csv() { if (!S.txs.length) { toast('Non ci sono ancora transazioni da esportare'); return; } exportCsv(); },
};

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el || el.type === 'checkbox') return;
  const f = acts[el.dataset.act];
  if (f) f(el, e);
});
document.addEventListener('change', e => {
  const el = e.target;
  if (el.matches('input[type=checkbox][data-act]')) acts[el.dataset.act](el, e);
  if (el.id === 'file' && el.files[0]) {
    const file = el.files[0];
    el.value = '';
    file.text().then(text => {
      const n = importBackup(text);
      render();
      toast(`Backup ripristinato: ${n} nuove transazioni`);
    }).catch(() => toast('File non valido: non è un backup di Tasca'));
  }
});
document.addEventListener('input', e => {
  if (e.target.id === 'q') {
    ui.search = e.target.value;
    $('#movlist').innerHTML = movList();
  }
});

/* ---------- avvio ---------- */

load();
processRecurring();
render();
$('#fab').addEventListener('click', () => txSheet({}));
if (lockCfg()) showLock(false);

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    hiddenAt = Date.now();
    if (lockCfg()) showLock(true);
  } else {
    if (processRecurring()) render();
    const cfg = lockCfg();
    if (!cfg) { $('#lock').hidden = true; isLocked = false; return; }
    if (isLocked || Date.now() - hiddenAt > 30000) showLock(false);
    else { $('#lock').hidden = true; }
  }
});

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
