// Catches typos in config.js / items.js before they reach the live site.
// Runs automatically in GitHub Actions; you can also run it yourself: node tools/check.mjs
import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "site");
const errors = [];
const warnings = [];
const fail = m => errors.push(m);
const warn = m => warnings.push(m);

// 1. Every script must at least parse.
for (const f of ["config.js", "items.js", "app.js"]) {
  try { new vm.Script(fs.readFileSync(path.join(root, f), "utf8"), { filename: f }); }
  catch (e) { fail(`${f} has a syntax error: ${e.message}`); }
}

// 2. Load config and items the way the browser does.
const box = {}; box.window = box; vm.createContext(box);
for (const f of ["config.js", "items.js"]) {
  try { vm.runInContext(fs.readFileSync(path.join(root, f), "utf8"), box, { filename: f }); }
  catch (e) { fail(`${f} could not run: ${e.message}`); }
}
const C = box.WISHLIST_CONFIG, ITEMS = box.WISHLIST_ITEMS;
if (!C) fail("config.js did not define WISHLIST_CONFIG.");
if (!Array.isArray(ITEMS)) fail("items.js did not define a WISHLIST_ITEMS list.");

const num = s => parseFloat(String(s ?? "").replace(/[^0-9.]/g, "")) || 0;
const isUrl = s => /^https?:\/\//.test(String(s));

if (C) {
  const b = C.birthday || {};
  const d = new Date(b.year, (b.month || 0) - 1, b.day);
  if (!b.year || d.getMonth() !== b.month - 1 || d.getDate() !== b.day) fail("config.js: birthday is not a real date.");
  if (C.lastUpdated && !/^\d{4}-\d{2}-\d{2}$/.test(C.lastUpdated)) fail('config.js: lastUpdated should look like "2026-11-19".');
  if (C.passwordHash && !/^[0-9a-f]{64}$/.test(C.passwordHash)) fail("config.js: passwordHash should be the 64-character line from tools/set-password.html.");
  const fb = C.firebase || {};
  const set = ["apiKey", "projectId", "appId", "authDomain"].filter(k => fb[k]);
  if (set.length && set.length < 4) fail("config.js: the firebase section is only partly filled in. Paste all four values or none.");
  if (!C.passwordHash) warn("No family password is set, so anyone with the link can open the site.");
  if (!set.length) warn("Firebase isn't set up yet, so the site is in preview mode (claims won't be shared).");
  if (!C.recipientKey) warn("No recipientKey set, so there's no way to hide claims from you.");
}

if (Array.isArray(ITEMS)) {
  const seen = new Set();
  const PRIORITIES = ["critical", "high", "standard", "discretionary"];
  ITEMS.forEach((it, i) => {
    const label = `Item ${i + 1}${it && it.name ? ` (${it.name})` : ""}`;
    if (!it || !it.name) { fail(`${label}: needs a name.`); return; }
    const slug = String(it.id || it.name).toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
    if (!slug) fail(`${label}: needs an id or a name with letters in it.`);
    if (seen.has(slug)) fail(`${label}: the id "${slug}" is used twice. Each item needs its own.`);
    seen.add(slug);
    const prices = (it.stores || []).map(s => num(s.price)).filter(Boolean);
    if (!num(it.price) && !prices.length) fail(`${label}: needs a price.`);
    if (it.priority && !PRIORITIES.includes(it.priority)) fail(`${label}: priority must be one of ${PRIORITIES.join(", ")}.`);
    if (it.images !== undefined && (!Array.isArray(it.images) || it.images.some(u => !isUrl(u)))) fail(`${label}: images must be a list of web addresses starting with https://`);
    if (it.link && !isUrl(it.link)) fail(`${label}: link must start with https://`);
    (it.stores || []).forEach((s, k) => {
      if (!s || !s.name || !isUrl(s.link) || !num(s.price)) fail(`${label}: store ${k + 1} needs a name, a price and a link starting with https://`);
    });
    if (it.version !== undefined && (!Array.isArray(it.version) || it.version.some(p => !Array.isArray(p) || p.length !== 2))) fail(`${label}: version should look like [["Storage","256GB"],["Color","Black"]].`);
    if (it.split && num(it.price) < 50) warn(`${label}: split is on for a very cheap item.`);
  });
  if (!ITEMS.length) warn("items.js has no items yet.");
}

warnings.forEach(w => console.log(`::warning::${w}`));
if (errors.length) {
  errors.forEach(e => console.log(`::error::${e}`));
  console.log(`\n${errors.length} problem${errors.length === 1 ? "" : "s"} found. The live site was not updated.`);
  process.exit(1);
}
console.log(`All good: ${ITEMS.length} item${ITEMS.length === 1 ? "" : "s"} checked.`);
