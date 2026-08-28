/* ============================================================
   api.js — everything that talks to Supabase.
   Error codes: SM-1xx orders, SM-2xx customers, SM-3xx bugs.
   ============================================================ */

const HEADERS = {
  "apikey": SB_KEY,
  "Authorization": "Bearer " + SB_KEY,
  "Content-Type": "application/json"
};

/* Generic REST call. Returns parsed JSON or throws with an LP-style code. */
async function sb(path, opts = {}, code = "SM-100") {
  const res = await fetch(SB_URL + "/rest/v1/" + path, {
    ...opts,
    headers: { ...HEADERS, ...(opts.headers || {}) }
  });
  if (!res.ok) {
    const body = await res.text();
    console.error(code, res.status, body);
    throw new Error(code + " (" + res.status + ")");
  }
  const txt = await res.text();
  return txt ? JSON.parse(txt) : null;
}

/* Health check — called before the app renders so a dead backend
   shows a message rather than a blank screen. */
async function healthCheck() {
  try {
    await sb("sm_orders?select=id&limit=1", {}, "SM-101");
    return true;
  } catch (e) {
    return false;
  }
}

/* Short human-readable order reference, e.g. SM-4K7QP */
function makeRef() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 5; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return "SM-" + s;
}

/* ---------- Orders ---------- */

async function createOrder(order) {
  const row = { ...order, order_ref: makeRef() };
  const out = await sb("sm_orders", {
    method: "POST",
    headers: { "Prefer": "return=representation" },
    body: JSON.stringify(row)
  }, "SM-102");
  return out[0];
}

async function getOrder(ref) {
  const out = await sb(
    "sm_orders?order_ref=eq." + encodeURIComponent(ref) + "&select=*",
    {}, "SM-103");
  return out[0] || null;
}

async function listOrders(limit = 50) {
  return sb("sm_orders?select=*&order=created_at.desc&limit=" + limit, {}, "SM-104");
}

async function setOrderStatus(id, status) {
  return sb("sm_orders?id=eq." + id, {
    method: "PATCH",
    headers: { "Prefer": "return=representation" },
    body: JSON.stringify({ status, updated_at: new Date().toISOString() })
  }, "SM-105");
}

/* ---------- Customers ----------
   This is the "own your customers" part of the pitch: every order
   builds the shop's own marketing list, not a platform's. */

async function upsertCustomer(c, spend) {
  const found = await sb(
    "sm_customers?phone=eq." + encodeURIComponent(c.phone) + "&select=*",
    {}, "SM-200");

  if (found.length) {
    const ex = found[0];
    await sb("sm_customers?id=eq." + ex.id, {
      method: "PATCH",
      body: JSON.stringify({
        name: c.name || ex.name,
        email: c.email || ex.email,
        marketing_optin: c.marketing_optin || ex.marketing_optin,
        order_count: ex.order_count + 1,
        total_spent: (Number(ex.total_spent) + spend).toFixed(2),
        stamps: (ex.stamps + 1) % 6
      })
    }, "SM-201");
    return { ...ex, stamps: (ex.stamps + 1) % 6, returning: true };
  }

  const made = await sb("sm_customers", {
    method: "POST",
    headers: { "Prefer": "return=representation" },
    body: JSON.stringify({
      phone: c.phone, name: c.name, email: c.email,
      marketing_optin: c.marketing_optin,
      order_count: 1, total_spent: spend.toFixed(2), stamps: 1
    })
  }, "SM-202");
  return { ...made[0], returning: false };
}

async function getCustomer(phone) {
  const out = await sb(
    "sm_customers?phone=eq." + encodeURIComponent(phone) + "&select=*",
    {}, "SM-203");
  return out[0] || null;
}

async function listCustomers(limit = 200) {
  return sb("sm_customers?select=*&order=created_at.desc&limit=" + limit, {}, "SM-204");
}

/* ---------- Bug reports (Launchpad standard) ---------- */

async function sendBugReport(r) {
  return sb("bug_reports", {
    method: "POST",
    body: JSON.stringify({
      app_url: location.href,
      current_view: r.view || "",
      user_role: "visitor",
      user_email: r.email || "",
      user_name: r.name || "",
      message: r.message,
      client_ref: CLIENT_REF
    })
  }, "SM-300");
}


/* ============================================================
   Postcode lookup — postcodes.io (free, open, no API key).
   Validates a UK postcode and returns coordinates so we can
   check it falls inside the delivery radius.
   Error codes: SM-4xx
   ============================================================ */

const SHOP_POSTCODE = "TS25 5RH";      // 124 Oxford Road, Hartlepool
const DELIVERY_RADIUS_MILES = 3.5;     // confirm the real radius with the client

let shopCoords = null;

async function lookupPostcode(pc) {
  const clean = pc.replace(/\s+/g, "").toUpperCase();
  if (clean.length < 5) throw new Error("SM-400");
  const res = await fetch("https://api.postcodes.io/postcodes/" + encodeURIComponent(clean));
  if (res.status === 404) throw new Error("SM-401");
  if (!res.ok) throw new Error("SM-402 (" + res.status + ")");
  const j = await res.json();
  return j.result;   // { postcode, latitude, longitude, admin_district, ... }
}

async function getShopCoords() {
  if (shopCoords) return shopCoords;
  try {
    const cached = JSON.parse(localStorage.getItem("sm_shop_coords") || "null");
    if (cached) { shopCoords = cached; return cached; }
  } catch (e) {}
  const r = await lookupPostcode(SHOP_POSTCODE);
  shopCoords = { lat: r.latitude, lng: r.longitude };
  try { localStorage.setItem("sm_shop_coords", JSON.stringify(shopCoords)); } catch (e) {}
  return shopCoords;
}

/* Great-circle distance in miles */
function milesBetween(a, b) {
  const toRad = d => d * Math.PI / 180;
  const R = 3958.8;
  const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(s));
}

/* Returns { ok, postcode, area, miles } or throws SM-4xx */
async function checkDelivery(pc) {
  const [place, shop] = await Promise.all([lookupPostcode(pc), getShopCoords()]);
  const miles = milesBetween(shop, { lat: place.latitude, lng: place.longitude });
  return {
    ok: miles <= DELIVERY_RADIUS_MILES,
    postcode: place.postcode,
    area: place.admin_ward || place.admin_district || "",
    miles: Math.round(miles * 10) / 10
  };
}
