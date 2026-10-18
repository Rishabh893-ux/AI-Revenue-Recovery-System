# ReviveAI — Backend

Express API for Razorpay payments, cart/abandonment tracking, and the
revenue recovery dashboard. Holds every secret the frontend must never see.

## Setup

```bash
npm install
cp .env.example .env   # fill in real Razorpay + Supabase values
npm run dev
```

Health check: `GET /health` → `{ "status": "ok" }`

## Database schema

The tables this API uses are defined in [`../supabase/schema.sql`](../supabase/schema.sql)
(`carts`, `cart_items`, `payment_events`, `agent_actions`). Run it once in the
Supabase SQL Editor. Only the files in `src/services/` (plus
`webhookController.js`) reference table and column names, so a schema change
only needs edits there.

## Environment variables

See `.env.example`. Never commit `.env` — it's already in `.gitignore`.

| Variable | Required | Notes |
|---|---|---|
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Yes | From the Razorpay dashboard |
| `RAZORPAY_WEBHOOK_SECRET` | Yes | Set when you register the webhook URL in Razorpay |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | Yes | Service-role key — full access, backend only |
| `N8N_ABANDONED_CART_WEBHOOK` / `N8N_FAILED_PAYMENT_WEBHOOK` | No | If unset, the backend logs a warning and skips the ping instead of failing |
| `N8N_SHARED_SECRET` | For recovery | Long random string sent as the `x-n8n-secret` header to `/api/webhooks/cart-abandoned` and `/api/webhooks/n8n/recovery-action`. If unset, both endpoints reject every request |

**Startup validation is strict, on purpose.** The server refuses to start —
with a specific, actionable error naming the exact variable and exactly
what's wrong — if any required variable is missing, or if a value doesn't
match the shape it should have (e.g. `SUPABASE_URL` isn't a real URL,
`SUPABASE_SERVICE_ROLE_KEY` doesn't look like a Supabase JWT, `RAZORPAY_KEY_ID`
doesn't start with `rzp_test_`/`rzp_live_`, or a secret got pasted into the
wrong field). This is what catches most misconfiguration before it turns
into a confusing crash three files deep — if you hit one of these errors,
the fix is exactly what the message says.

On a successful boot, the server also logs a masked summary of every config
value it loaded (e.g. `eyJd...ummy` instead of the full key) — enough to
eyeball "yep, that's the right project" without ever printing a working
secret to your terminal or a screenshot.

`FRONTEND_URL` accepts a comma-separated list (e.g.
`http://localhost:5173,http://localhost:5174`) if you run more than one
frontend origin at once — any other origin is rejected by CORS with a
logged warning naming exactly which origin was blocked.

## Endpoints

```
GET  /health

POST /api/carts                          — register/update a cart; prices/total are set server-side from src/data/catalog.js
POST /api/payment/create-order           — create a Razorpay order for { cartId } (amount comes from the saved cart)
POST /api/payment/verify                 — verify Razorpay's response after Checkout
GET  /api/payment/:orderId               — look up a payment by order id

GET  /api/dashboard/metrics              — aggregate revenue/recovery numbers
GET  /api/dashboard/recovery-actions     — recovery activity table rows

POST /api/webhooks/razorpay              — Razorpay server-to-server webhook (signature-verified)
POST /api/webhooks/cart-abandoned        — called by a scheduled job/n8n, marks a cart abandoned (needs x-n8n-secret)
POST /api/webhooks/n8n/recovery-action   — n8n calls this after a recovery action completes (needs x-n8n-secret)
```

## Payment flow (matches the frontend exactly)

1. Frontend saves the cart and customer details with `POST /api/carts` (the
   backend prices every item from `src/data/catalog.js` — client prices are
   ignored), then calls `POST /api/payment/create-order` with just the
   `cartId`. The backend creates the Razorpay order for the cart's stored
   total (secret key never leaves the server) and returns
   `{ orderId, amount, currency }`.
2. Frontend opens Razorpay Checkout with that `orderId`.
3. On success, Razorpay hands the frontend a payment id + signature, which
   it forwards to `POST /api/payment/verify`. This backend re-derives the
   signature with the secret key to confirm it's genuine.
4. **Independently**, Razorpay also calls `POST /api/webhooks/razorpay`
   directly (server-to-server) with the real payment status. This webhook —
   not the frontend's Checkout callback — is the actual source of truth,
   since a customer's browser could close before step 3 completes.

## Recovery architecture

This backend never calls Gemini or n8n's internal logic. It only:
- **Writes** cart/payment state to Supabase.
- **Pings** an n8n webhook URL (`recoveryService.js`) to say "here's what
  happened" — n8n owns the actual recovery decision-making from there.
- **Records** whatever recovery action n8n completes, via
  `POST /api/webhooks/n8n/recovery-action`, so it shows up on the dashboard.
- **Credits** recoveries: when a cart is paid (via `/api/payment/verify` or the
  `payment.captured` webhook), any `Pending` recovery actions for that cart
  are set to `Recovered`, which drives the dashboard's recovered revenue and
  recovery rate.

The n8n workflows themselves are exported (without secrets) in
`../n8n/workflows.json` — import them with n8n's *Import from File*.

If your n8n workflows already trigger directly off Supabase changes (e.g. a
Supabase-triggered webhook or polling), the `N8N_*_WEBHOOK` env vars are
optional — just leave them unset and the backend will log a warning and
skip the ping instead of failing.

## Testing without real Razorpay/Supabase credentials

`GET /health` and route wiring work with placeholder env values. Anything
touching Supabase or Razorpay will fail until you supply real project
credentials — that's expected, not a bug.
