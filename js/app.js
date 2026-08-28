/* ============================================================
   app.js — customer ordering app
   ============================================================ */

let basket = [], mode = "delivery", current = null, chosen = {}, qty = 1;
let activeCat = "All", term = "", liveRef = null, pollTimer = null;

const $ = id => document.getElementById(id);
const money = n => "£" + Number(n).toFixed(2);

/* ---------- basket persistence (survives refresh) ---------- */
function saveBasket() {
  try { localStorage.setItem("sm_basket", JSON.stringify(basket)); } catch (e) {}
}
function loadBasket() {
  try { basket = JSON.parse(localStorage.getItem("sm_basket") || "[]"); } catch (e) { basket = []; }
}

/* ---------- rendering ---------- */
function cardHTML(m) {
  return `<button class="card" onclick="openItem('${m.id}',false)">
    <img src="${m.img}" alt="${m.name}" loading="lazy">
    <span class="card-body"><span class="card-name">${m.name}</span>
    <span class="card-desc">${m.desc || ""}</span>
    <span class="card-foot"><span class="price">${money(m.price)}</span><span class="add">+</span></span>
    </span></button>`;
}

function renderRail() {
  $("rail-pop").innerHTML = [MENU[0], MENU[5], MENU[3], MENU[2], MENU[7]].map(cardHTML).join("");
}

function renderOffers() {
  $("offers").innerHTML = DEALS.map(d => `
    <button class="offer" onclick="openItem('${d.id}',true)">
      <img src="${d.img}" alt="${d.name}" loading="lazy">
      <span class="offer-info"><span class="offer-name">${d.name}</span>
        <div class="offer-price">${money(d.price)}</div>
        <span class="offer-desc">${d.desc}</span></span>
      <span class="add">+</span></button>`).join("");
}

function renderChips() {
  const cats = ["All", ...new Set(MENU.map(m => m.cat))];
  $("chips").innerHTML = cats.map(c =>
    `<button class="chip ${c === activeCat ? "on" : ""}" onclick="setCat('${c}')">${c}</button>`).join("");
}

function renderGrid() {
  let items = activeCat === "All" ? MENU : MENU.filter(m => m.cat === activeCat);
  if (term) items = MENU.filter(m => (m.name + " " + (m.desc || "")).toLowerCase().includes(term));
  $("grid").innerHTML = items.length ? items.map(cardHTML).join("")
    : `<div class="empty" style="grid-column:1/-1">Nothing matched "${term}"</div>`;
}

function setCat(c) {
  activeCat = c; term = "";
  const bar = document.querySelector(".chipbar");
  const stuck = bar && bar.getBoundingClientRect().top <= 1;
  renderChips(); renderGrid();
  // Only jump to the menu if the chip bar isn't already pinned at the top.
  if (!stuck) $("menu-anchor").scrollIntoView({ behavior: "smooth", block: "start" });
  centreChip();
}

/* Keep the selected chip visible in the horizontal scroller */
function centreChip() {
  const on = document.querySelector(".chip.on");
  if (on) on.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
}
function search(v) {
  term = v.trim().toLowerCase();
  renderGrid();
  if (term) $("menu-anchor").scrollIntoView({ behavior: "smooth", block: "start" });
}
function setMode(b) {
  document.querySelectorAll(".mode").forEach(x => x.classList.remove("sel"));
  b.classList.add("sel"); mode = b.dataset.mode; renderBasket();
}

/* ---------- item detail ---------- */
function openItem(id, isDeal) {
  current = (isDeal ? DEALS : MENU).find(x => x.id === id);
  chosen = {}; qty = 1;
  $("d-img").src = current.img;
  $("d-name").textContent = current.name;
  $("d-price").textContent = money(current.price);
  $("d-desc").textContent = current.desc || "";
  $("d-qty").textContent = 1;
  renderOptions(); updateTotal(); go("item"); window.scrollTo(0, 0);
}

function renderOptions() {
  $("d-options").innerHTML = (current.groups || []).map((g, i) => `
    <div class="hr"></div>
    <div class="opt-head"><h3>${g.label}</h3><span>${g.req ? "1 required" : "optional"}</span></div>
    <div class="opts">${g.opts.map(o =>
      `<button class="opt" data-g="${i}" data-o="${o}" onclick="pick(${i},'${o.replace(/'/g, "\\'")}')">${o}${g.add ? ` <span class="plus">+${money(g.add)}</span>` : ""}</button>`
    ).join("")}</div>`).join("");
}

function pick(gi, opt) {
  const g = current.groups[gi];
  if (g.req) { chosen[gi] = [opt]; }
  else {
    chosen[gi] = chosen[gi] || [];
    const i = chosen[gi].indexOf(opt);
    if (i > -1) chosen[gi].splice(i, 1); else chosen[gi].push(opt);
  }
  document.querySelectorAll(`.opt[data-g="${gi}"]`).forEach(b =>
    b.classList.toggle("on", (chosen[gi] || []).includes(b.dataset.o)));
  updateTotal();
}

function unitPrice() {
  let p = current.price;
  (current.groups || []).forEach((g, i) => { if (g.add) p += (chosen[i] || []).length * g.add; });
  return p;
}
function updateTotal() { $("d-total").textContent = money(unitPrice() * qty); }
function bumpQty(n) { qty = Math.max(1, qty + n); $("d-qty").textContent = qty; updateTotal(); }

function addToBasket() {
  const gs = current.groups || [];
  for (let i = 0; i < gs.length; i++) {
    if (gs[i].req && !(chosen[i] || []).length) { toast("Choose " + gs[i].label.toLowerCase()); return; }
  }
  basket.push({ name: current.name, img: current.img, opts: Object.values(chosen).flat(), qty, unit: unitPrice() });
  saveBasket(); renderBasket(); updateBadge(); toast(current.name + " added"); go("home");
}

/* ---------- basket ---------- */
function totals() {
  const sub = basket.reduce((s, l) => s + l.unit * l.qty, 0);
  const del = mode === "delivery" ? 2.50 : 0;
  return { sub, del, total: sub + del };
}

function renderBasket() {
  const L = $("basket-lines"), F = $("basket-foot");
  if (!basket.length) {
    L.innerHTML = `<div class="empty"><strong>Nothing in here yet</strong><br>Have a look at the menu.</div>`;
    F.innerHTML = `<div style="padding:0 18px 24px"><button class="btn btn-primary" onclick="go('home')">Browse the menu</button></div>`;
    return;
  }
  L.innerHTML = basket.map((l, i) => `<div class="line">
    <img src="${l.img}" alt="">
    <span class="line-info"><span class="line-name">${l.name}</span>
      ${l.opts.length ? `<div class="line-opts">${l.opts.join(" · ")}</div>` : ""}</span>
    <span class="line-right"><div class="line-price">${money(l.unit * l.qty)}</div>
      <div class="miniqty"><button onclick="lineQty(${i},-1)">−</button><span>${l.qty}</span>
      <button onclick="lineQty(${i},1)">+</button></div></span></div>`).join("");

  const t = totals();
  F.innerHTML = `
    <button class="notebox" onclick="focusNote()">
      <span>Add a note (e.g. allergies, special request)</span><span>›</span></button>
    <div class="totals">
      <div class="trow"><span>Subtotal</span><span>${money(t.sub)}</span></div>
      <div class="trow"><span>${mode === "delivery" ? "Delivery fee" : "Collection"}</span>
        <span>${t.del ? money(t.del) : "<span class='free'>Free</span>"}</span></div>
      <div class="trow"><span>Service fee</span><span class="free">£0.00</span></div>
      <div class="trow"><span>Bag fee</span><span class="free">£0.00</span></div>
      <div class="trow grand"><span>Total</span><span>${money(t.total)}</span></div></div>
    <div class="saving"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="m5 13 4 4L19 7"/></svg>
      <span>Ordered direct. On a delivery platform at 14% commission this order would have cost the shop about ${money(t.sub * .14)}.</span></div>
    <div class="sticky-foot" style="margin-top:18px">
      <button class="btn btn-primary" onclick="go('checkout')">Go to checkout · ${money(t.total)}</button></div>`;
}

function lineQty(i, n) {
  basket[i].qty += n;
  if (basket[i].qty < 1) basket.splice(i, 1);
  saveBasket(); renderBasket(); updateBadge();
}
function clearBasket() { basket = []; saveBasket(); renderBasket(); updateBadge(); toast("Basket cleared"); }
function focusNote() { go("checkout"); setTimeout(() => $("co-note").focus(), 300); }

/* ---------- checkout ---------- */
function renderCheckout() {
  const t = totals();
  $("co-summary").innerHTML = `
    <div class="trow"><span>${basket.reduce((s, l) => s + l.qty, 0)} item(s)</span><span>${money(t.sub)}</span></div>
    <div class="trow"><span>${mode === "delivery" ? "Delivery" : "Collection"}</span>
      <span>${t.del ? money(t.del) : "<span class='free'>Free</span>"}</span></div>
    <div class="trow grand"><span>Total</span><span>${money(t.total)}</span></div>`;
  $("co-address-wrap").style.display = mode === "delivery" ? "block" : "none";
  $("co-pay").textContent = "Place order · " + money(t.total);
}

async function placeOrder() {
  const name = $("co-name").value.trim();
  const phone = $("co-phone").value.trim();
  const email = $("co-email").value.trim();
  const addr = $("co-address").value.trim();
  const note = $("co-note").value.trim();
  const optin = $("co-optin").checked;

  if (!name) { toast("We need your name"); return; }
  if (phone.length < 9) { toast("We need a phone number"); return; }
  if (mode === "delivery" && !addr) { toast("We need a delivery address"); return; }

  const btn = $("co-pay");
  btn.disabled = true; btn.textContent = "Placing order…";
  const t = totals();

  try {
    const order = await createOrder({
      fulfilment: mode,
      status: "placed",
      customer_name: name, customer_phone: phone, customer_email: email || null,
      address: mode === "delivery" ? addr : null,
      note: note || null,
      marketing_optin: optin,
      items: basket,
      subtotal: t.sub.toFixed(2),
      delivery_fee: t.del.toFixed(2),
      total: t.total.toFixed(2)
    });

    const cust = await upsertCustomer({ name, phone, email, marketing_optin: optin }, t.total);

    liveRef = order.order_ref;
    try { localStorage.setItem("sm_last_ref", liveRef); } catch (e) {}
    basket = []; saveBasket(); updateBadge();
    showTrack(order, cust);
    go("track");
  } catch (err) {
    toast(err.message || "Could not place the order");
    btn.disabled = false;
  }
  btn.disabled = false;
  renderCheckout();
}

/* ---------- tracking (polls Supabase) ---------- */
const STATUS_ORDER = ["placed", "preparing", "on_the_way", "completed"];
const STATUS_LABEL = {
  placed: "Order placed", preparing: "Preparing your order",
  on_the_way: "On the way", ready: "Ready for collection", completed: "Delivered"
};

function showTrack(order, cust) {
  $("track-ref").textContent = order.order_ref;
  const collect = order.fulfilment === "collection";
  $("track-title").textContent = collect ? "Order received!" : "Order on the way!";
  $("track-sub").textContent = collect
    ? "We'll let you know when it's ready to collect."
    : "We've got your order and it's on its way to you.";

  if (cust) {
    $("track-stamps").style.display = "block";
    $("track-stamps").innerHTML = cust.stamps === 0
      ? "🎁 That's 6 orders — your next one is free."
      : `🍭 ${cust.stamps} of 6 stamps. ${6 - cust.stamps} more for a free order.`;
  }
  renderSteps(order.status, collect);
  startPolling();
}

function renderSteps(status, collect) {
  const flow = collect ? ["placed", "preparing", "ready", "completed"] : STATUS_ORDER;
  const idx = flow.indexOf(status);
  $("steps").innerHTML = flow.map((s, i) => {
    const cls = i < idx ? "done" : i === idx ? "now" : "";
    const tick = i < idx
      ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="m5 13 4 4L19 7"/></svg>` : "";
    return `<li class="step ${cls}"><span class="dot">${tick}</span>
      <span><span class="step-label">${s === "completed" && collect ? "Collected" : STATUS_LABEL[s]}</span></span></li>`;
  }).join("");
}

function startPolling() {
  clearInterval(pollTimer);
  pollTimer = setInterval(async () => {
    if (!liveRef) return;
    try {
      const o = await getOrder(liveRef);
      if (o) renderSteps(o.status, o.fulfilment === "collection");
    } catch (e) { /* quiet — next tick retries */ }
  }, 8000);
}

/* ---------- nav / misc ---------- */
/* Menu tab: go home, then pin the category bar to the top of the screen */
function goMenu() {
  go("home");
  setTimeout(() => {
    document.getElementById("menu-anchor").scrollIntoView({ behavior: "smooth", block: "start" });
  }, 60);
}

function go(v) {
  document.querySelectorAll(".view").forEach(x => x.classList.remove("active"));
  $("v-" + v).classList.add("active");
  document.querySelectorAll(".nav-item").forEach(n => n.classList.toggle("on", n.dataset.nav === v));
  if (v === "basket") renderBasket();
  if (v === "checkout") renderCheckout();
  window.scrollTo(0, 0);
}

let tt;
function toast(m) {
  const t = $("toast"); t.textContent = m; t.classList.add("show");
  clearTimeout(tt); tt = setTimeout(() => t.classList.remove("show"), 2400);
}

function updateBadge() {
  const n = basket.reduce((s, l) => s + l.qty, 0), b = $("nav-badge");
  b.style.display = n ? "flex" : "none"; b.textContent = n;
}

/* ---------- bug report ---------- */
function openBug() { $("bugmodal").classList.add("open"); }
function closeBug() { $("bugmodal").classList.remove("open"); }
async function sendBug() {
  const msg = $("bug-msg").value.trim();
  if (!msg) { toast("Tell us what happened"); return; }
  try {
    await sendBugReport({
      name: $("bug-name").value.trim(), email: $("bug-email").value.trim(),
      message: msg, view: document.querySelector(".view.active")?.id || ""
    });
    closeBug(); toast("Thanks — report sent"); $("bug-msg").value = "";
  } catch (e) { toast("Could not send that (" + e.message + ")"); }
}

/* ---------- version stamp ---------- */
document.addEventListener("keydown", e => {
  if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "v")
    alert("Sweet Munchies — LaunchServe GO\nv" + APP_VERSION +
      "\nLaunchpad Digital Solutions\nSupabase: " + SB_URL);
});

/* ---------- boot ---------- */
(async function init() {
  loadBasket();
  renderChips(); renderRail(); renderOffers(); renderGrid(); updateBadge();

  const ok = await healthCheck();
  if (!ok) $("health").style.display = "block";

  // Resume tracking a previous order if there is one
  try {
    const ref = localStorage.getItem("sm_last_ref");
    if (ref) {
      const o = await getOrder(ref);
      if (o && o.status !== "completed") { liveRef = ref; showTrack(o, null); }
    }
  } catch (e) {}
})();
