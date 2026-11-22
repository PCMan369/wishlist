/* Jacob's wishlist: app logic. You shouldn't need to edit this file.
   Settings are in config.js and the items are in items.js. */
(() => {
"use strict";

const C = window.WISHLIST_CONFIG || {};
const RAW = window.WISHLIST_ITEMS || [];

/* ---------- small helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ESC[c]);
const num = s => parseFloat(String(s ?? "").replace(/[^0-9.]/g, "")) || 0;
const priceText = it => it.priceLabel || (it.priceN > 0 ? money(it.priceN) : "");
const money = n => new Intl.NumberFormat("en-US", {
  style: "currency", currency: "USD",
  minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2
}).format(n);
const LS = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
  del(k) { try { localStorage.removeItem(k); } catch { /* ignore */ } }
};
const slugOf = it => String(it.id || it.name).toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
const readJSON = (k, d) => { try { return JSON.parse(LS.get(k) || ""); } catch { return d; } };

const PRIORITY = { critical: "Most wanted", high: "Would love", standard: "Nice to have", discretionary: "Optional" };
const RANK = { critical: 0, high: 1, standard: 2, discretionary: 3 };
const isBig = it => it.priority === "critical" || it.priority === "high";

// Short display name: "iPhone 18 Pro, 256GB (Black)" becomes "iPhone 18 Pro" unless the item has its own "short".
const shortOf = it => it.short || String(it.name).split(/[,(]/)[0].trim();
// One-line description: the item's "tagline", or its version details after the model line.
const taglineOf = it => it.tagline || (it.version || []).slice(1).map(p => p[1]).join(", ");

const ITEMS = RAW.map((it, idx) => {
  const sp = (it.stores || []).map(s => num(s.price)).filter(Boolean);
  return { ...it, idx, slug: slugOf(it), priceN: num(it.price) || (sp.length ? Math.min(...sp) : 0) };
});

const imgsOf = it => (it.images && it.images.length ? it.images : (it.image ? [it.image] : []));
const imgHtml = (src, it, eager) =>
  `<img${it.fill ? ` class="fill"${it.zoom ? ` style="--z:${Number(it.zoom) || 1}"` : ""}` : ""} src="${esc(src)}" alt="${esc(it.name)}" loading="${eager ? "eager" : "lazy"}" decoding="async" referrerpolicy="no-referrer" data-ph="${esc(shortOf(it).charAt(0).toUpperCase())}">`;
const plateHtml = (it, eager) => {
  const imgs = imgsOf(it);
  return `<div class="plate art">${imgs.length ? imgHtml(imgs[0], it, eager) : `<span class="ph" aria-hidden="true">${esc(shortOf(it).charAt(0).toUpperCase())}</span>`}</div>`;
};
function wireImages(root) {
  $$("img[data-ph]", root).forEach(img => {
    const fallback = () => {
      const s = document.createElement("span");
      s.className = "ph";
      s.setAttribute("aria-hidden", "true");
      s.textContent = img.dataset.ph;
      img.replaceWith(s);
    };
    img.addEventListener("error", fallback, { once: true });
    if (img.complete && img.naturalWidth === 0 && img.getAttribute("src")) fallback();
  });
}

/* ---------- app state ---------- */
let started = false, recipient = false, store = null;
let filter = "all", current = null, inAppNav = false, lastFocus = null, busy = false, pendingClaimScroll = false;
const state = {
  pledges: [], ready: false, live: false,
  name: LS.get("wl_name") || "",
  mine: new Set(readJSON("wl_mine", []))
};
const saveMine = () => LS.set("wl_mine", JSON.stringify([...state.mine]));

/* =====================================================
   Password screen
   ===================================================== */
async function sha256(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}
// Case-insensitive and trims spaces, so nobody gets stuck on a capital letter.
const hashPw = pw => sha256("wishlist-v1:" + pw.trim().toLowerCase());

async function boot() {
  // ?as=<recipientKey> turns on the private view for this device. ?as=guest turns it off.
  const params = new URLSearchParams(location.search);
  if (params.has("as")) {
    const as = params.get("as");
    if (as === "guest") LS.del("wl_recipient");
    else if (C.recipientKey && as === C.recipientKey) LS.set("wl_recipient", "1");
    params.delete("as");
    const q = params.toString();
    history.replaceState(null, "", location.pathname + (q ? "?" + q : "") + location.hash);
  }
  recipient = LS.get("wl_recipient") === "1";

  // Invite links can carry the password: https://site/#key=password
  let linkKey = "";
  const m = location.hash.match(/^#key=(.*)$/);
  if (m) {
    try { linkKey = decodeURIComponent(m[1]); } catch { linkKey = m[1]; }
    history.replaceState(null, "", location.pathname + location.search);
  }

  if (!C.passwordHash) return start();
  try {
    if (LS.get("wl_auth") === C.passwordHash) return start();
    if (linkKey && (await hashPw(linkKey)) === C.passwordHash) {
      LS.set("wl_auth", C.passwordHash);
      return start();
    }
  } catch { /* fall through to the password screen */ }
  showGate();
}

function showGate() {
  $("#gate").hidden = false;
  $("#gatePw").focus();
  $("#gateForm").addEventListener("submit", async e => {
    e.preventDefault();
    const pw = $("#gatePw").value;
    if (!pw.trim()) return;
    const card = $(".gate-card"), err = $("#gateErr");
    try {
      if ((await hashPw(pw)) === C.passwordHash) {
        LS.set("wl_auth", C.passwordHash);
        $("#gate").hidden = true;
        start();
        return;
      }
      err.textContent = "That's not it. Check the message you were sent.";
    } catch {
      err.textContent = "This page has to be opened over https to check the password.";
    }
    card.classList.remove("shake"); void card.offsetWidth; card.classList.add("shake");
    $("#gatePw").select();
  });
}

/* =====================================================
   Claim storage: Firebase when configured, otherwise a local preview
   Each row: { id, itemId, name, amount (null = whole item), ts }
   ===================================================== */
async function firebaseStore(fb) {
  const base = "https://www.gstatic.com/firebasejs/10.14.1/";
  const [appMod, fs] = await Promise.all([import(base + "firebase-app.js"), import(base + "firebase-firestore.js")]);
  const db = fs.getFirestore(appMod.initializeApp(fb));
  const col = fs.collection(db, "pledges");
  const toRow = d => {
    const v = d.data();
    return {
      id: d.id, itemId: v.itemId, name: v.name,
      amount: v.amount == null ? null : Number(v.amount),
      ts: v.ts && v.ts.toMillis ? v.ts.toMillis() : Date.now()
    };
  };
  return {
    mode: "firebase",
    subscribe: (onData, onErr) => fs.onSnapshot(col, s => onData(s.docs.map(toRow)), onErr),
    // The whole-item claim has a fixed document id, so the database itself refuses a second claim.
    async claimFull(itemId, name) {
      const id = "full_" + itemId;
      await fs.setDoc(fs.doc(db, "pledges", id), { itemId, name, amount: null, ts: fs.serverTimestamp() });
      return id;
    },
    async pledge(itemId, name, amount) {
      const r = await fs.addDoc(col, { itemId, name, amount, ts: fs.serverTimestamp() });
      return r.id;
    },
    remove: id => fs.deleteDoc(fs.doc(db, "pledges", id))
  };
}

function demoStore() {
  const KEY = "wl_demo_pledges";
  const read = () => readJSON(KEY, []);
  const subs = [];
  const write = a => { LS.set(KEY, JSON.stringify(a)); subs.forEach(f => f(a.slice())); };
  window.addEventListener("storage", e => { if (e.key === KEY) subs.forEach(f => f(read())); });
  return {
    mode: "demo",
    subscribe(onData) { subs.push(onData); onData(read()); },
    async claimFull(itemId, name) {
      const a = read();
      if (a.some(p => p.itemId === itemId && p.amount == null)) { const e = new Error("taken"); e.code = "permission-denied"; throw e; }
      const id = "full_" + itemId;
      a.push({ id, itemId, name, amount: null, ts: Date.now() });
      write(a);
      return id;
    },
    async pledge(itemId, name, amount) {
      const a = read(), id = "p_" + Math.random().toString(36).slice(2, 10);
      a.push({ id, itemId, name, amount, ts: Date.now() });
      write(a);
      return id;
    },
    async remove(id) { write(read().filter(p => p.id !== id)); }
  };
}

function offlineStore() {
  const fail = () => Promise.reject(new Error("offline"));
  return { mode: "offline", subscribe: (_ok, onErr) => onErr(new Error("offline")), claimFull: fail, pledge: fail, remove: fail };
}

async function makeStore() {
  const fb = C.firebase || {};
  if (fb.apiKey && fb.projectId) {
    try { return await firebaseStore(fb); } catch (e) { console.error(e); return offlineStore(); }
  }
  return demoStore();
}

/* ---------- derived claim status ---------- */
function statusOf(it) {
  const ps = state.pledges.filter(p => p.itemId === it.slug).sort((a, b) => a.ts - b.ts);
  const full = ps.find(p => p.amount == null) || null;
  const gifts = ps.filter(p => p.amount != null);
  const pledged = gifts.reduce((s, p) => s + p.amount, 0);
  const price = it.priceN;
  const funded = !!it.split && price > 0 && pledged >= price - 0.005;
  return {
    full, gifts, pledged, price, funded,
    taken: !!full || funded,
    remaining: Math.max(0, Math.round((price - pledged) * 100) / 100)
  };
}
const isMine = p => state.mine.has(p.id) || (!!state.name && p.name.toLowerCase() === state.name.toLowerCase());
// Claims are only ever shown once they have loaded, and never in the private view.
const showsClaims = () => !recipient && state.live;
const takenOf = it => (showsClaims() && statusOf(it).taken) ? 1 : 0;

/* ---------- avatars ---------- */
const TINTS = ["#3A3A42", "#4A3A28", "#2A3A33", "#33304A", "#4A2F36"];
const tintOf = n => TINTS[[...n.toLowerCase()].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % TINTS.length];
const initialOf = n => (n.trim().charAt(0) || "?").toUpperCase();
function giversOf(s) {
  const seen = new Set(), out = [];
  s.gifts.forEach(p => { const k = p.name.toLowerCase(); if (!seen.has(k)) { seen.add(k); out.push(p.name); } });
  return out;
}
function namesLabel(names) {
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  if (names.length === 3) return `${names[0]}, ${names[1]} and ${names[2]}`;
  return `${names[0]}, ${names[1]} and ${names.length - 2} others`;
}
function avatarsHtml(names) {
  if (!names.length) return "";
  const shown = names.length > 3 ? names.slice(0, 2) : names;
  const extra = names.length > 3 ? names.length - 2 : 0;
  return `<span class="avatars" role="img" aria-label="Pledged by ${esc(namesLabel(names))}">` +
    shown.map(n => `<span class="av" style="background:${tintOf(n)}">${esc(initialOf(n))}</span>`).join("") +
    (extra ? `<span class="av more">+${extra}</span>` : "") + `</span>`;
}

/* =====================================================
   Top of page: bar, strip, closing note
   ===================================================== */
function daysLeft() {
  const b = C.birthday || {};
  const t = new Date(), today = new Date(t.getFullYear(), t.getMonth(), t.getDate());
  const date = new Date(b.year, (b.month || 1) - 1, b.day || 1);
  return { n: Math.round((date - today) / 86400000), date };
}

function renderChrome() {
  const name = C.name || "Jacob", { n, date } = daysLeft();
  document.title = `${name}'s Birthday Wishlist`;
  $("#brand").textContent = `${name}'s list`;
  const pretty = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  $("#countdown").innerHTML = n > 1 ? `${n} days<span class="hide-sm"> · ${esc(pretty)}</span>`
    : n === 1 ? `Tomorrow<span class="hide-sm"> · ${esc(pretty)}</span>`
    : n === 0 ? "Today" : "Birthday has passed";

  const strip = esc(C.stripText || "");
  $("#strip").innerHTML = recipient
    ? `${strip} Claims are hidden on this device.`
    : `${strip} <button type="button" class="linkbtn" id="howBtn">How claiming works ›</button>`;
  $("#strip").hidden = !(C.stripText);

  $("#noteTitle").textContent = C.noteTitle || "";
  $("#noteText").textContent = C.note || "";
  $("#note").hidden = !(C.noteTitle || C.note);
  const D = C.delivery || {};
  const rows = [["Ship to", D.ship], ["Arrive by", D.by], ["Gift wrap", D.wrap]].filter(([, v]) => v);
  const facts = $("#facts");
  facts.hidden = !rows.length;
  facts.innerHTML = rows.map(([k, v]) => `<div><dt class="mono">${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("");

  const a = C.about || [], box = $("#about");
  box.hidden = !a.length;
  if (a.length) box.innerHTML = `<div class="about-grid">${a.map(x => `<div><h4 class="mono">${esc(x.title)}</h4><p>${esc(x.text)}</p></div>`).join("")}</div>`;

  const [y, mo, d] = String(C.lastUpdated || "").split("-").map(Number);
  const upd = y ? `List updated ${new Date(y, mo - 1, d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}` : "";
  $("#foot").innerHTML = `<span>${recipient ? "" : "Tap an item, then choose “I'll get this one” so nobody doubles up."}</span><span>${esc(upd)}</span>`;
}

/* ---------- filters ---------- */
const TIERS = [
  { id: "u100", label: "Under $100", test: p => p < 100 },
  { id: "mid", label: "$100–$999", test: p => p >= 100 && p < 1000 },
  { id: "big", label: "$1,000 and up", test: p => p >= 1000 }
];
function renderChips() {
  const box = $("#chips");
  if (ITEMS.length < 3) { box.hidden = true; return; }
  const chips = [{ id: "all", label: "All" }];
  if (!recipient) chips.push({ id: "open", label: "Still available" });
  TIERS.filter(t => ITEMS.some(it => it.priceN > 0 && t.test(it.priceN))).forEach(t => chips.push(t));
  if (!chips.some(c => c.id === filter)) filter = "all";
  box.innerHTML = chips.map(c => `<button type="button" class="pill-btn" data-filter="${c.id}" aria-pressed="${c.id === filter}">${esc(c.label)}</button>`).join("");
}

/* =====================================================
   The list: hero, full-width modules, two-up tiles
   Rules: the first available item becomes the hero. Other "Most wanted" and
   "Would love" items get a full-width module. Everything else is a tile.
   ===================================================== */
let fadeOn = true;
const fadeAttr = i => fadeOn ? ` fade" style="--i:${i}` : `" style="`;
const hrefOf = it => `#item-${encodeURIComponent(it.slug)}`;

function eyebrowOf(it, taken) {
  const s = taken ? statusOf(it) : null;
  const parts = [PRIORITY[it.priority], it.split ? "Split OK" : "", taken ? "" : it.badge, taken ? (s.full ? "Claimed" : "Fully funded") : ""];
  return parts.filter(Boolean).join(" · ");
}

function progressHtml(it, s) {
  if (!it.split || !showsClaims()) return "";
  const pct = s.price ? Math.min(100, s.pledged / s.price * 100) : 0;
  const caption = s.pledged > 0 ? `${money(s.pledged)} of ${money(s.price)} pledged` : "Nobody has chipped in yet";
  return `<div class="progress"><div class="bar-track"><i style="width:${pct}%"></i></div><div class="prow"><span class="mono">${esc(caption)}</span>${avatarsHtml(giversOf(s))}</div></div>`;
}

const CHECK = `<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="7" fill="none" stroke="#6FD1A0" stroke-width="1.5"/><path d="M4.8 8.2l2.2 2.2 4.2-4.4" fill="none" stroke="#6FD1A0" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
function claimedHtml(s) {
  return `<p class="claimed">${CHECK}${s.full ? `Claimed by ${esc(s.full.name)}` : "Fully funded"}</p>`;
}

// The main button on a card: claims or chips in when claims are live, otherwise just opens the details.
function primaryHtml(it, taken) {
  if (taken) return "";
  if (recipient || !state.live) return `<a class="btn primary" href="${hrefOf(it)}">View details</a>`;
  if (it.joke) return `<button type="button" class="btn primary" data-joke="1">Try to claim it</button>`;
  return it.split
    ? `<button type="button" class="btn primary" data-chip="${esc(it.slug)}">Chip in</button>`
    : `<button type="button" class="btn primary" data-claim="${esc(it.slug)}">I'll get this one</button>`;
}
const moreHtml = (it, taken) => (recipient || !state.live) && !taken ? "" : `<a class="more" href="${hrefOf(it)}">View details ›</a>`;

function cardParts(it) {
  const taken = !!takenOf(it);
  const s = taken || (showsClaims() && it.split) ? statusOf(it) : null;
  return { taken, s: s || statusOf(it) };
}

function heroHtml(it, i) {
  const { taken, s } = cardParts(it);
  const lede = [taglineOf(it) && taglineOf(it) + ".", it.split ? "Split it with family and friends, or take it on yourself." : ""].filter(Boolean).join(" ");
  return `<section class="hero${fadeAttr(i)}${taken ? "; " : ""}" data-taken="${taken ? 1 : 0}"${""}>` +
    `<div class="hero-copy${taken ? " is-taken" : ""}">
      <p class="mono eyebrow amber">${esc(eyebrowOf(it, taken))}</p>
      <h1 class="display">${esc(shortOf(it))}.</h1>
      ${lede ? `<p class="lede">${esc(lede)}</p>` : ""}
      ${taken ? claimedHtml(s) : progressHtml(it, s)}
      <div class="actions">${primaryHtml(it, taken)}${moreHtml(it, taken)}<span class="price">${esc(priceText(it))}</span></div>
    </div>
    <a class="hero-art${taken ? " is-taken" : " hov"}" href="${hrefOf(it)}" aria-label="Details for ${esc(it.name)}">${plateHtml(it, true)}</a>
  </section>`;
}

function moduleHtml(it, i) {
  const { taken, s } = cardParts(it);
  const sub = [taglineOf(it), priceText(it)].filter(Boolean).join(". ") + ".";
  return `<section class="module${fadeAttr(i)}${taken ? "; " : ""}" data-taken="${taken ? 1 : 0}">` +
    `<div class="mod-in${taken ? " is-taken" : ""}" style="display:contents">
      <p class="mono eyebrow amber">${esc(eyebrowOf(it, taken))}</p>
      <h2 class="display md">${esc(shortOf(it))}.</h2>
      <p class="sub">${esc(sub)}</p>
      ${taken ? claimedHtml(s) : ""}
      <div class="actions center">${primaryHtml(it, taken)}${moreHtml(it, taken)}</div>
      ${taken ? "" : progressHtml(it, s)}
    </div>
    <a class="module-art${taken ? " is-taken" : " hov"}" href="${hrefOf(it)}" tabindex="-1" aria-hidden="true">${plateHtml(it, false)}</a>
  </section>`;
}

function tileHtml(it, i) {
  const { taken, s } = cardParts(it);
  const sub = [taglineOf(it), priceText(it)].filter(Boolean).join(". ") + ".";
  return `<section class="tile${fadeAttr(i)}${taken ? "; " : ""}" data-taken="${taken ? 1 : 0}">` +
    `<div class="tile-in${taken ? " is-taken" : ""}" style="display:contents">
      <p class="mono eyebrow ${taken ? "" : "amber"}">${esc(eyebrowOf(it, taken))}</p>
      <h2 class="display sm">${esc(shortOf(it))}</h2>
      <p class="sub">${esc(sub)}</p>
      ${taken ? claimedHtml(s) : ""}
      <div class="actions center">${primaryHtml(it, taken)}${moreHtml(it, taken)}</div>
      ${taken ? "" : progressHtml(it, s)}
      ${!taken && it.notes ? `<p class="note-line">${esc(it.notes)}</p>` : ""}
    </div>
    <a class="tile-art${taken ? " is-taken" : " hov"}" href="${hrefOf(it)}" tabindex="-1" aria-hidden="true">${plateHtml(it, false)}</a>
  </section>`;
}

function renderList(animate) {
  fadeOn = !!animate;
  const tier = TIERS.find(t => t.id === filter);
  const items = ITEMS.filter(it => filter === "open" ? !takenOf(it) : tier ? (it.priceN > 0 && tier.test(it.priceN)) : true);
  // Still-available items first, then by how much he wants them, then in the order written.
  items.sort((a, b) => takenOf(a) - takenOf(b) || (RANK[a.priority] ?? 9) - (RANK[b.priority] ?? 9) || a.idx - b.idx);

  let html = "";
  if (!items.length) {
    html = `<p class="empty">Nothing matches that filter.</p>`;
  } else if (filter === "all") {
    const rest = items.slice(1);
    const mods = rest.filter(isBig), tiles = rest.filter(it => !isBig(it));
    let k = 1;
    html = heroHtml(items[0], 0) +
      (mods.length ? `<div class="modules">${mods.map(it => moduleHtml(it, k++)).join("")}</div>` : "") +
      (tiles.length ? `<div class="tiles">${tiles.map(it => tileHtml(it, k++)).join("")}</div>` : "");
  } else {
    html = `<div class="tiles">${items.map((it, i) => tileHtml(it, i)).join("")}</div>`;
  }
  const box = $("#list");
  box.innerHTML = html;
  wireImages(box);
}

/* =====================================================
   Details drawer
   ===================================================== */
function drawerHtml(it) {
  const imgs = imgsOf(it), stores = it.stores || [], version = it.version || [];
  const prices = stores.map(s => num(s.price)), lo = Math.min(...prices), hi = Math.max(...prices);

  const gallery = imgs.length
    ? `<div class="stage${it.fill ? " wide" : ""}" id="stage" ${imgs.length > 1 ? 'tabindex="0" aria-label="Photos. Swipe or use the arrow keys."' : ""}>
         <div class="slides" id="slides">${imgs.map((s, k) => `<div class="slide">${imgHtml(s, it, k === 0)}</div>`).join("")}</div>
         ${imgs.length > 1 ? `<button type="button" class="nav prev" id="prevPic" aria-label="Previous photo">&#8249;</button><button type="button" class="nav next" id="nextPic" aria-label="Next photo">&#8250;</button><span class="count mono" id="count">1 / ${imgs.length}</span>` : ""}
       </div>
       ${imgs.length > 1 ? `<div class="thumbs">${imgs.map((s, k) => `<button type="button" data-pic="${k}" class="${k ? "" : "on"}" aria-label="Photo ${k + 1}">${imgHtml(s, it, false)}</button>`).join("")}</div>` : ""}`
    : `<div class="stage"><span class="ph big" aria-hidden="true">${esc(shortOf(it).charAt(0).toUpperCase())}</span></div>`;

  const extras = [it.condition ? `<p class="dnote">Used or refurbished: ${esc(it.condition)}</p>` : "", it.notes ? `<p class="dnote">${esc(it.notes)}</p>` : ""].join("");
  const link = it.link || (stores[0] && stores[0].link) || "";

  return `
    ${gallery}
    <h2 class="dtitle" id="dTitle">${esc(it.name)}</h2>
    <div class="dprice"><span>${esc(priceText(it))}</span>${it.split ? `<span class="tag">Split OK</span>` : ""}</div>
    <div id="claimBox"></div>
    ${version.length ? `<section class="dsec"><span class="label mono">${esc(it.versionTitle || "Make sure it's this version")}</span><dl class="rows">${version.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl></section>` : ""}
    ${stores.length ? `<section class="dsec"><span class="label mono">Where to buy</span><div class="rows">${stores.map(s => `<a href="${esc(s.link)}" target="_blank" rel="noopener"><span class="rname">${esc(s.name)} ↗${hi > lo && num(s.price) === lo ? `<span class="lowest">LOWEST</span>` : ""}</span><span class="rprice">${money(num(s.price))}</span></a>`).join("")}</div>${extras}</section>`
      : (extras || link) ? `<section class="dsec">${extras}</section>` : ""}
    ${(it.why || it.whyThis) ? `<section class="dsec"><span class="label mono">Why I want this</span>${it.why ? `<p>${esc(it.why)}</p>` : ""}${it.whyThis ? `<h5>Why this exact one</h5><p>${esc(it.whyThis)}</p>` : ""}</section>` : ""}
    ${(it.substitutes || it.unacceptable) ? `<section class="dsec"><span class="label mono">If you can't find this exact one</span>${it.substitutes ? `<h5 class="ok">Fine instead</h5><p>${esc(it.substitutes)}</p>` : ""}${it.unacceptable ? `<h5 class="no">Please avoid</h5><p>${esc(it.unacceptable)}</p>` : ""}</section>` : ""}
  `;
}

function wireGallery(it) {
  const imgs = imgsOf(it);
  if (imgs.length < 2) return;
  const slides = $("#slides"), btns = $$("#dBody .thumbs button");
  let idx = 0;
  const paint = () => {
    $("#count").textContent = `${idx + 1} / ${imgs.length}`;
    $("#prevPic").disabled = idx === 0;
    $("#nextPic").disabled = idx === imgs.length - 1;
    btns.forEach((b, k) => b.classList.toggle("on", k === idx));
  };
  const go = k => slides.scrollTo({ left: Math.max(0, Math.min(imgs.length - 1, k)) * slides.clientWidth, behavior: "smooth" });
  slides.addEventListener("scroll", () => {
    const k = Math.round(slides.scrollLeft / slides.clientWidth);
    if (k !== idx) { idx = k; paint(); }
  });
  $("#prevPic").addEventListener("click", () => go(idx - 1));
  $("#nextPic").addEventListener("click", () => go(idx + 1));
  btns.forEach((b, k) => b.addEventListener("click", () => go(k)));
  $("#stage").addEventListener("keydown", e => {
    if (e.key === "ArrowLeft") { e.preventDefault(); go(idx - 1); }
    if (e.key === "ArrowRight") { e.preventDefault(); go(idx + 1); }
  });
  paint();
}

function claimHtml(it) {
  if (recipient || !store) return "";
  const demo = store.mode === "demo" ? `<p class="mini warn">Preview mode: this only saves on your own device.</p>` : "";
  if (!state.ready) return `<div class="claim"><p class="mini">Checking if it's still available…</p></div>`;
  if (!state.live) return `<div class="claim"><p class="mini">Claims aren't loading right now. Please refresh in a moment before you buy, so nobody doubles up.</p></div>`;

  if (it.joke) return `<div class="claim"><p class="mini">${esc(it.jokeNote || "Not actually desired. You're welcome to try claiming it, but it won't work.")}</p></div>`;
  const s = statusOf(it);
  const me = state.name ? `<p class="mini">Claiming as <b>${esc(state.name)}</b> · <button type="button" class="linkbtn" data-act="rename">change</button></p>` : "";

  if (s.full) {
    const mine = isMine(s.full);
    return `<div class="claim taken">
      <p class="who"><b>${esc(s.full.name)}</b> is getting this one.</p>
      ${mine ? `<button type="button" class="btn ghost small" data-remove="${esc(s.full.id)}">Unclaim</button>` : `<p class="mini">Take a look at the rest of the list instead.</p>`}
      ${demo}</div>`;
  }
  if (!it.split) {
    return `<div class="claim"><p class="mini">Choose “I'll get this one” below to mark it as taken so nobody doubles up.</p>${me}${demo}</div>`;
  }

  const names = giversOf(s);
  const givers = s.gifts.length ? `<ul class="givers">${s.gifts.map(p => `<li><span>${esc(p.name)}</span><b>${money(p.amount)}</b>${isMine(p) ? `<button type="button" class="x" data-remove="${esc(p.id)}">Remove</button>` : ""}</li>`).join("")}</ul>` : "";
  const progress = progressHtml(it, s) + (names.length ? `<p class="pledgers">${avatarsHtml(names)}<span>${esc(namesLabel(names))}</span></p>` : "");
  if (s.funded) {
    return `${progress}<div class="claim taken"><p class="who"><b>Fully funded.</b> Thank you, everyone.</p>${givers}${demo}</div>`;
  }
  const quick = [25, 50, 100].filter(a => a < s.remaining);
  return `${progress}<div class="claim">
    <div class="label">Chip in</div>
    <div class="amt-chips">${quick.map(a => `<button type="button" data-amt="${a}">${money(a)}</button>`).join("")}<button type="button" data-amt="${s.remaining}">${s.gifts.length ? "Cover the rest" : "All of it"} · ${money(s.remaining)}</button></div>
    <div class="amt-row"><input id="amt" type="text" inputmode="decimal" placeholder="Other amount" aria-label="Amount in dollars" autocomplete="off"><button type="button" class="btn primary small" data-act="pledge">Chip in</button></div>
    ${s.gifts.length ? "" : `<p class="or">or</p><button type="button" class="btn ghost small full" data-act="full">I'll buy it all myself</button>`}
    ${givers}${me}${demo}</div>`;
}

function footHtml(it) {
  const stores = it.stores || [];
  const best = stores.length ? stores.reduce((a, b) => num(b.price) < num(a.price) ? b : a) : null;
  const href = best ? best.link : it.link;
  const label = it.joke ? "View listing ↗" : best ? `Buy at ${best.name} ↗` : "Open product page ↗";
  let primary = "";
  if (it.joke && showsClaims()) primary = `<button type="button" class="btn primary" data-act="joke">Try to claim it</button>`;
  else if (showsClaims() && !statusOf(it).taken) {
    primary = it.split
      ? `<button type="button" class="btn primary" data-act="scroll-claim">Chip in</button>`
      : `<button type="button" class="btn primary" data-act="full">I'll get this one</button>`;
  }
  const merchant = href ? `<a class="btn ${primary ? "ghost" : "primary"}" href="${esc(href)}" target="_blank" rel="noopener">${esc(label)}</a>` : "";
  return primary + merchant;
}

function renderDrawerDynamic() {
  if (!current) return;
  const box = $("#claimBox");
  const amt = $("#amt"), keep = amt ? { v: amt.value, f: document.activeElement === amt } : null;
  box.innerHTML = claimHtml(current);
  if (keep) { const n = $("#amt"); if (n) { n.value = keep.v; if (keep.f) n.focus(); } }
  $("#dFoot").innerHTML = footHtml(current);
}

const PAGE_PARTS = "#bar,#strip,#list,#note,#about,#foot,#preview";
function showSheet(it) {
  const drawer = $("#drawer");
  if (current && current.slug === it.slug && drawer.classList.contains("open")) return;
  current = it;
  $("#dEyebrow").textContent = [PRIORITY[it.priority], it.split ? "Split OK" : ""].filter(Boolean).join(" · ");
  $("#dBody").innerHTML = drawerHtml(it);
  wireImages($("#dBody"));
  wireGallery(it);
  renderDrawerDynamic();
  $("#dScroll").scrollTop = 0;
  drawer.classList.add("open");
  drawer.setAttribute("aria-hidden", "false");
  $$(PAGE_PARTS).forEach(e => { e.inert = true; });
  document.body.classList.add("lock");
  document.title = `${it.name} · ${C.name || "Jacob"}'s Birthday Wishlist`;
  $("#dClose").focus({ preventScroll: true });
  if (pendingClaimScroll) {
    pendingClaimScroll = false;
    setTimeout(() => { const b = $("#claimBox"); if (b) b.scrollIntoView({ block: "center", behavior: "smooth" }); }, 400);
  }
}

function hideSheet() {
  const drawer = $("#drawer");
  if (!drawer.classList.contains("open")) return;
  drawer.classList.remove("open");
  drawer.setAttribute("aria-hidden", "true");
  $$(PAGE_PARTS).forEach(e => { e.inert = false; });
  document.body.classList.remove("lock");
  document.title = `${C.name || "Jacob"}'s Birthday Wishlist`;
  current = null;
  if (lastFocus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
}

function closeSheet() {
  if (inAppNav) { inAppNav = false; history.back(); }
  else { history.replaceState(null, "", location.pathname + location.search); hideSheet(); }
}

function route() {
  const m = location.hash.match(/^#item-(.+)$/);
  let slug = null;
  if (m) { try { slug = decodeURIComponent(m[1]); } catch { slug = m[1]; } }
  const it = slug && ITEMS.find(x => x.slug === slug);
  if (it) showSheet(it); else hideSheet();
}

/* =====================================================
   Claiming
   ===================================================== */
let toastTimer;
function toast(msg, undo) {
  const t = $("#toast");
  t.innerHTML = `<span>${esc(msg)}</span>${undo ? `<button type="button">Undo</button>` : ""}`;
  if (undo) $("button", t).addEventListener("click", async () => {
    t.classList.remove("show");
    try { await undo(); } catch (e) { toast(failMsg(e)); }
  });
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), undo ? 7000 : 3600);
}

function askName(prefill = "") {
  return new Promise(resolve => {
    const d = $("#nameDialog"), inp = $("#nameInput");
    inp.value = prefill;
    d.returnValue = "";
    const done = () => {
      d.removeEventListener("close", done);
      const v = d.returnValue === "ok" ? inp.value.trim().slice(0, 40) : "";
      if (v) { state.name = v; LS.set("wl_name", v); }
      resolve(v || null);
    };
    d.addEventListener("close", done);
    d.showModal();
    inp.focus();
  });
}
const ensureName = async () => state.name || askName();

async function guard(fn) {
  if (busy) return;
  busy = true;
  try { await fn(); } finally { busy = false; }
}

const failMsg = e => (e && e.code === "permission-denied")
  ? "Looks like someone just claimed that one. Pick another?"
  : "Couldn't save that. Check your connection and try again.";

async function doClaimFull(it) {
  const name = await ensureName();
  if (!name) return;
  try {
    const id = await store.claimFull(it.slug, name);
    state.mine.add(id); saveMine();
    toast(`Marked as yours. Thanks, ${name}!`, async () => { await store.remove(id); state.mine.delete(id); saveMine(); });
  } catch (e) { toast(failMsg(e)); }
}

async function doPledge(it) {
  const s = statusOf(it);
  let amount = parseFloat(String($("#amt").value).replace(/[^0-9.]/g, ""));
  if (!(amount > 0)) { toast("Pick an amount first."); return; }
  amount = Math.round(amount * 100) / 100;
  if (amount > s.remaining + 0.005) {
    $("#amt").value = String(s.remaining);
    toast(`Only ${money(s.remaining)} is left on this one.`);
    return;
  }
  const name = await ensureName();
  if (!name) return;
  try {
    const id = await store.pledge(it.slug, name, amount);
    state.mine.add(id); saveMine();
    toast(`${money(amount)} added. Thank you, ${name}!`, async () => { await store.remove(id); state.mine.delete(id); saveMine(); });
  } catch (e) { toast(failMsg(e)); }
}

async function doRemove(id) {
  if (!confirm("Remove this? Others will see it as available again.")) return;
  try { await store.remove(id); state.mine.delete(id); saveMine(); toast("Removed."); }
  catch (e) { toast(failMsg(e)); }
}

/* =====================================================
   Start
   ===================================================== */
function refresh() {
  renderList(false);
  renderChips();
  if (current) renderDrawerDynamic();
  $("#preview").hidden = !(store && store.mode === "demo");
}

async function start() {
  if (started) return;
  started = true;
  $("#app").hidden = false;

  renderChrome(); renderChips(); renderList(true);

  $("#strip").addEventListener("click", e => { if (e.target.closest("#howBtn")) $("#howDialog").showModal(); });

  $("#chips").addEventListener("click", e => {
    const b = e.target.closest("[data-filter]");
    if (!b || b.dataset.filter === filter) return;
    filter = b.dataset.filter;
    renderChips(); renderList(true);
  });

  $("#list").addEventListener("click", e => {
    if (e.target.closest("[data-joke]")) { toast("Nice try. This one is a joke, so it can't be claimed."); return; }
    const claim = e.target.closest("[data-claim]");
    if (claim) { const it = ITEMS.find(x => x.slug === claim.dataset.claim); if (it) guard(() => doClaimFull(it)); return; }
    const chip = e.target.closest("[data-chip]");
    if (chip) {
      const it = ITEMS.find(x => x.slug === chip.dataset.chip);
      if (it) { pendingClaimScroll = true; inAppNav = true; lastFocus = chip; location.hash = "item-" + it.slug; }
      return;
    }
    const a = e.target.closest("a[href^='#item-']");
    if (a && !(e.metaKey || e.ctrlKey || e.shiftKey || e.button)) { inAppNav = true; lastFocus = a; }
  });

  $("#scrim").addEventListener("click", closeSheet);
  $("#dClose").addEventListener("click", closeSheet);
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && $("#drawer").classList.contains("open") && !$("#nameDialog").open && !$("#howDialog").open) closeSheet();
  });
  window.addEventListener("hashchange", route);
  window.addEventListener("popstate", route);

  const onDrawerClick = e => {
    const b = e.target.closest("[data-act],[data-remove],[data-amt]");
    if (!b || !current) return;
    const it = current;
    if (b.dataset.amt) {
      $("#amt").value = b.dataset.amt;
      $$(".amt-chips button").forEach(x => x.classList.toggle("on", x === b));
      return;
    }
    if (b.dataset.remove) return guard(() => doRemove(b.dataset.remove));
    if (b.dataset.act === "joke") { toast("Nice try. This one is a joke, so it can't be claimed."); return; }
    if (b.dataset.act === "full") return guard(() => doClaimFull(it));
    if (b.dataset.act === "pledge") return guard(() => doPledge(it));
    if (b.dataset.act === "scroll-claim") { const box = $("#claimBox"); if (box) box.scrollIntoView({ block: "center", behavior: "smooth" }); return; }
    if (b.dataset.act === "rename") return guard(async () => { await askName(state.name); renderDrawerDynamic(); });
  };
  $("#dBody").addEventListener("click", onDrawerClick);
  $("#dFoot").addEventListener("click", onDrawerClick);

  route();

  if (recipient) return; // Never even loads the claims for you.
  store = await makeStore();
  refresh();
  store.subscribe(
    rows => { state.pledges = rows; state.ready = true; state.live = true; refresh(); },
    err => { console.error(err); state.ready = true; state.live = false; refresh(); }
  );
}

boot();
})();
