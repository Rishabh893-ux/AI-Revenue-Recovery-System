# ReviveAI — Frontend

AI-powered e-commerce frontend with Razorpay checkout and an AI revenue
recovery dashboard. This is the **frontend only** — it expects a backend API
for anything involving payments, secrets, or persistence.

## Setup

```bash
npm install
cp .env.example .env   # fill in your own values
npm run dev
```

Build for production:

```bash
npm run build
```

## Environment variables

See `.env.example`. Only public/publishable values ever go in `.env`:

- `VITE_API_URL` — your backend base URL
- `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` — Supabase public project values
- `VITE_RAZORPAY_KEY_ID` — Razorpay **public** key id (`rzp_...`), never the secret

## What's mocked right now

- **Products** (`src/data/products.js`) — swap for a real fetch (backend or
  Supabase) inside `src/pages/Home.jsx`'s `loadProducts()`.
- **Dashboard sample data** (`src/data/dashboardMock.js`) —
  `src/pages/Dashboard.jsx` loads real data from `GET /api/dashboard/metrics`
  and `GET /api/dashboard/recovery-actions`. It shows the sample data (with a
  badge) only when the backend can't be reached at all; if the backend
  answers with an error, the error is shown instead.

Product prices shown here are for display only — the backend re-prices every
order from `backend/src/data/catalog.js`, so keep the two in sync.

## Backend endpoints this app expects

```
POST /api/carts
POST /api/payment/create-order
POST /api/payment/verify
GET  /api/payment/:orderId
GET  /api/dashboard/metrics
GET  /api/dashboard/recovery-actions
```

All calls are centralized in `src/services/api.js` — no component calls
`fetch` directly.

## Payment flow

`src/components/PaymentButton.jsx` implements the full flow: it calls
`POST /api/payment/create-order`, opens Razorpay Checkout with the returned
`orderId`, then calls `POST /api/payment/verify` with Razorpay's response.
The frontend never creates a Razorpay order itself and never treats its own
`handler` callback as proof of payment — that's the backend/webhook's job.

## Cart & abandonment tracking

`src/context/CartContext.jsx` manages cart state in React + `localStorage`.
When a customer enters `/checkout`, the cart is registered with the backend
via `POST /api/carts` (see `src/pages/Checkout.jsx`), and saved again with the
customer's details right before payment (`PaymentButton.jsx`), so the
backend/n8n system can mark it `abandoned` and email the customer if payment
never completes. React does
not implement any abandonment-detection logic itself, per the spec.
