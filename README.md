# ReviveAI: AI Revenue Recovery for E-commerce

ReviveAI is a demo e-commerce store with Razorpay checkout and an AI system that wins back lost sales. When a shopper abandons a cart or a payment fails, an n8n workflow uses Google Gemini to write a personal recovery email and sends it through Gmail. When that customer later pays, the dashboard credits the AI with the recovered revenue.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Postgres-3FCF8E?logo=supabase&logoColor=white)
![Razorpay](https://img.shields.io/badge/Razorpay-Checkout-0C2451?logo=razorpay&logoColor=white)
![n8n](https://img.shields.io/badge/n8n-Workflows-EA4B71?logo=n8n&logoColor=white)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)

## Features

- **Storefront and checkout:** product catalog, cart drawer, and checkout form, paid through Razorpay Checkout.
- **Server-side pricing:** the backend prices every order from its own catalog, so a customer can't edit a request and pay less.
- **Verified payments:** the browser's payment response and the Razorpay webhook are both signature-checked.
- **Abandoned-cart detection:** a scheduled n8n workflow finds carts left idle for 30+ minutes.
- **AI recovery emails:** Gemini writes a short, personal email for each abandoned cart or failed payment, sent through Gmail.
- **Recovery tracking:** each email is logged as `Pending` and switches to `Recovered` when the customer pays.
- **Dashboard:** total and recovered revenue, recovery rate, failed payments, abandoned carts, a revenue chart, and a recovery activity table.

## How it works

```
 Shopper ──► React storefront ──► Express backend ──► Supabase (Postgres)
                                    │      ▲
                     create order / │      │ payment.captured / payment.failed
                     verify payment ▼      │ (signed webhook)
                                    Razorpay

 n8n "Abandonment Check" (every 15 min)
   └─► finds idle carts in Supabase ──► POST /api/webhooks/cart-abandoned
                                              │
 backend ──► n8n "Abandoned Cart" / "Failed Payment" workflow
               └─► Gemini writes the email ──► Gmail sends it ──► logged in agent_actions (Pending)

 Customer comes back and pays ──► backend marks their actions "Recovered" ──► dashboard
```

- **Frontend:** talks only to the backend and never holds a secret.
- **Backend:** holds the Razorpay and Supabase secrets. It never calls Gemini itself; it pings n8n and lets the workflows decide what to send.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, React Router, Recharts, lucide-react |
| Backend | Node.js, Express 5 |
| Database | Supabase (Postgres) |
| Payments | Razorpay (test mode) |
| Automation | n8n (Docker) |
| AI | Google Gemini via n8n's AI Agent node |
| Email | Gmail via n8n |

## Project structure

```
.
├── frontend/          React storefront, checkout and dashboard (Vite)
├── backend/           Express API: payments, carts, webhooks, dashboard data
│   └── src/data/catalog.js   server-side product prices (source of truth)
├── n8n/
│   └── workflows.json        the 3 recovery workflows (no secrets)
└── supabase/
    └── schema.sql            database tables
```

## Getting started

### Prerequisites

- Node.js 20+
- Docker Desktop (to run n8n)
- A [Supabase](https://supabase.com) project (the free tier is fine)
- A [Razorpay](https://razorpay.com) account in test mode
- A Google account, with a Google Cloud OAuth client for Gmail and a [Gemini API key](https://aistudio.google.com/app/apikey)

### 1. Create the database

In Supabase, open **SQL Editor → New query**, paste the contents of [`supabase/schema.sql`](supabase/schema.sql) and click **Run**.

### 2. Configure environment variables

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

**`backend/.env`**

| Variable | Where to get it |
|---|---|
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | Razorpay Dashboard → Settings → API Keys |
| `RAZORPAY_WEBHOOK_SECRET` | A random string; enter the same value when you create the webhook in step 5 |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API (use the **secret / service_role** key) |
| `N8N_ABANDONED_CART_WEBHOOK`, `N8N_FAILED_PAYMENT_WEBHOOK` | Keep the defaults if n8n runs on `localhost:5678` |
| `N8N_SHARED_SECRET` | A random string; n8n sends it back in the `x-n8n-secret` header |

To generate a random secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**`frontend/.env`**

| Variable | Value |
|---|---|
| `VITE_API_URL` | `http://localhost:5000/api` |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Supabase URL and **publishable / anon** key (never the secret key) |
| `VITE_RAZORPAY_KEY_ID` | The same Razorpay key ID as the backend (the public key only) |

### 3. Start n8n and import the workflows

```bash
docker run -d --name n8n --restart unless-stopped -p 5678:5678 -v n8n_data:/home/node/.n8n n8nio/n8n
```

1. Open http://localhost:5678 and go to **Workflows → Import from File**. Select [`n8n/workflows.json`](n8n/workflows.json); it contains three workflows:
   - **Abandoned Cart:** webhook → Gemini writes the email → Gmail → logs the action
   - **Failed Payment:** webhook → looks up the cart → Gemini → Gmail → logs the action
   - **Abandonment Check:** runs every 15 minutes and finds carts idle for 30+ minutes
2. Create these credentials in n8n and select them in the workflow nodes:
   - **Supabase:** your project URL and service_role key.
   - **Google Gemini (PaLM) API:** your Gemini API key.
   - **Gmail OAuth2:** a Google Cloud OAuth client.
     - Add `http://localhost:5678/rest/oauth2-credential/callback` as a redirect URI and enable the Gmail API.
     - Publish the OAuth app. In Testing mode, Google expires the login after 7 days.
   - **Header Auth:** name `x-n8n-secret`, with your `N8N_SHARED_SECRET` as the value.
3. **Activate** all three workflows.

The Abandonment Check calls the backend at `http://host.docker.internal:5000`, which reaches your computer from inside Docker. If you run n8n without Docker, change that URL to `http://localhost:5000`.

### 4. Run the app

```bash
# Terminal 1: backend
cd backend
npm install
npm run dev        # http://localhost:5000

# Terminal 2: frontend
cd frontend
npm install
npm run dev        # http://localhost:5173
```

### 5. Razorpay webhooks (optional for local testing)

Razorpay can't reach `localhost`, so open a tunnel:

```bash
npx ngrok http 5000
```

Then in Razorpay Dashboard → **Settings → Webhooks → Add New Webhook**:
- **URL:** `https://<your-ngrok-id>.ngrok-free.app/api/webhooks/razorpay`
- **Events:** `payment.captured`, `payment.failed`
- **Secret:** your `RAZORPAY_WEBHOOK_SECRET`

Without a tunnel, payments still work: the browser confirms each payment through `/api/payment/verify`. You only miss Razorpay's server-to-server events, such as failed-payment emails sent from Razorpay's side.

## Try it

1. Open http://localhost:5173, add products, and go to **Checkout**.
2. Enter your own email address and click **Pay with Razorpay**.
3. Close the popup without paying. About 30–45 minutes later, the recovery email arrives and the dashboard shows a **Pending** action.
4. Go back and pay with the test card `4111 1111 1111 1111`, any future expiry date, CVV `123`, and OTP `123456`.
5. Open http://localhost:5173/dashboard: the action now shows **Recovered**, along with the revenue.

## API

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/carts` | Save the cart and customer details (prices set server-side) |
| `POST` | `/api/payment/create-order` | Create a Razorpay order for `{ cartId }` |
| `POST` | `/api/payment/verify` | Verify the Checkout signature and mark the cart paid |
| `GET` | `/api/payment/:orderId` | Latest payment event for an order |
| `GET` | `/api/dashboard/metrics` | Revenue and recovery totals |
| `GET` | `/api/dashboard/recovery-actions` | Rows for the recovery activity table |
| `POST` | `/api/webhooks/razorpay` | Razorpay webhook (HMAC signature verified) |
| `POST` | `/api/webhooks/cart-abandoned` | Mark a cart abandoned (requires `x-n8n-secret`) |
| `POST` | `/api/webhooks/n8n/recovery-action` | Log a recovery action (requires `x-n8n-secret`) |

More detail is in [`backend/README.md`](backend/README.md) and [`frontend/README.md`](frontend/README.md).

## Security notes

- **Secrets stay on the server.** The Razorpay secret and the Supabase service_role key are used only by the backend. The frontend gets public keys only.
- **Prices come from the server.** Order amounts are read from the cart the backend priced itself, never from the browser.
- **Signatures are checked.** Razorpay payment and webhook signatures are verified with constant-time comparison, and webhook retries are de-duplicated.
- **Internal endpoints are protected.** The n8n-facing endpoints require a shared secret.
- **The database is closed to the public.** Row Level Security is on for every table, so the public anon key can't read customer data.
- **The dashboard has no login yet.** Add authentication (for example Supabase Auth) before deploying publicly.

## Known limitations and roadmap

- [ ] Login for the dashboard
- [ ] Store products in a Supabase table; for now, prices exist in both `backend/src/data/catalog.js` and `frontend/src/data/products.js`
- [ ] Discount-code recovery offers and WhatsApp as a second channel
- [ ] Automated tests for the payment flow
- [ ] Deployment guide (Render/Railway for the backend, Vercel for the frontend)

## License

[MIT](LICENSE) © 2026 Rishabh Kasaudhan
