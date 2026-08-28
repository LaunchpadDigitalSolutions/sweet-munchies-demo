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
- Tighten RLS: the admin dashboard currently reads with the anon key
