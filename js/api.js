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
