# Sweet Munchies — LaunchServe GO demo

Direct ordering app built for a pitch to Sweet Munchies (124 Oxford Road, Hartlepool).
Demonstrates ordering without platform commission, proper item modifiers,
a customer database owned by the shop, and live order tracking.

## URLs
- Customer app: `index.html`
- Kitchen dashboard: `admin.html`

## Stack
- Static HTML/CSS/JS — no build step
- Supabase (`coiwwbroycaznkmhevde`, eu-west-2) via REST
- Cloudflare Pages

## Tables
| Table | Purpose |
|---|---|
| `sm_orders` | Orders, items as JSONB, status flow |
| `sm_customers` | Shop-owned customer list, loyalty stamps, marketing opt-in |
| `bug_reports` | Shared Launchpad bug reporting (`client_ref = 'sweetmunchies'`) |

Status flow: `placed → preparing → on_the_way → completed` (delivery)
or `placed → preparing → ready → completed` (collection).

## Error codes
- `SM-1xx` orders
- `SM-2xx` customers
- `SM-3xx` bug reports

## Standards
- Mobile-first from 375px, `min-width` queries only
- 44px minimum touch targets, 16px inputs
- Bug report button on every screen
- Health check before render
- Version stamp: Ctrl+Shift+V

## Before it goes live
- Replace AI-generated placeholder photography with the client's own images
- Replace the typographic wordmark with the real Sweet Munchies logo
- Add Stripe at checkout (currently records the order without taking payment)
- Confirm the actual delivery-platform commission rate used in the basket comparison
- **Database-side lock-down (needs a one-off SQL step before this is fully live).**
  `admin.html`'s password gate (`login.html`) is now backed by real database
  checks, not just a page-level password comparison: the customer-facing app
  talks to `sm_get_order`/`sm_get_customer` (single-row lookups only), and the
  kitchen dashboard talks to `sm_staff_list_orders`/`sm_staff_list_customers`/
  `sm_staff_set_order_status`, each of which checks the staff PIN *inside the
  database* before returning anything. Direct table reads on `sm_customers`
  and `sm_orders` are meant to be switched off so the anon key can no longer
  read either table in bulk, no matter who's asking.
  **That switch-off migration itself still needs to be run against the live
  database by a human** (or Josh needs to grant the automated build process
  permission to apply it) — it wasn't auto-applied as part of this PR. Until
  it's run, this PR's code changes are safe and backward-compatible (the old
  direct-read behaviour still works), but the underlying bulk-read exposure
  isn't actually closed yet.
