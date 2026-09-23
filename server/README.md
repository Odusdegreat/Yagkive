# Yagkive API

Express, TypeScript, MongoDB, and Bun API for the Yagkive storefront.

## Start

Copy `.env.example` to `.env`, set `MONGODB_URI`, `JWT_SECRET`, and `JWT_REFRESH_SECRET`, then run:

```powershell
bun.cmd run dev
```

Use `bun.cmd` in PowerShell where script execution is disabled. In other terminals, `bun run dev` works.

## Routes

| Area | Routes |
| --- | --- |
| Health | `GET /health` |
| Authentication | `POST /api/auth/register`, `/login`, `/refresh`, `/logout` |
| Catalogue | `GET /api/categories`, `GET /api/products`, `GET /api/products/:id` |
| Admin catalogue | `POST/PATCH/DELETE /api/categories`, `POST/PATCH/DELETE /api/products` |
| Customer | `GET /api/cart`, `POST /api/cart/items`, `PATCH/DELETE /api/cart/items/:itemId`, `GET/PUT /api/wishlist/:productId` |
| Orders | `POST/GET /api/orders`, `GET /api/payments/verify/:reference`, `PATCH /api/orders/:id/status` |
| Uploads | `POST /api/uploads/images` (admin, multipart field `image`) |
| Payment webhook | `POST /api/webhooks/paystack` |

Admin-only routes require a user whose `role` is `admin`; make this change directly in MongoDB for the initial administrator. All authenticated routes accept the access-token cookie or `Authorization: Bearer <token>`.

Paystack, Cloudinary, and Resend activate only after their respective environment variables are supplied.

## Checkout and deployment

- MongoDB must be a replica set (including a single-node development replica set) or Atlas. Startup rejects standalone MongoDB because reservations and payment confirmation require transactions.
- Prices and order totals are USD. Set `USD_TO_NGN_RATE` deliberately; the API signs a ten-minute quote showing the exact NGN charge. This is a configured rate, not a live market feed. Shipping is currently free.
- Call `GET /api/orders/quote`, then send its `quoteToken` with the shipping address to `POST /api/orders`. Supply a UUID `Idempotency-Key` and reuse the key and body on retries. A changed cart requires a fresh quote.
- Inventory is reserved for thirty minutes. Expired holds are released every minute and during checkout. Payment confirmation, stock changes, and removal of purchased cart quantities occur in one transaction.
- Late payments reacquire stock if possible. Otherwise the order becomes `payment_review`: payment is recorded, but an operator must arrange fulfillment or a refund. Never fulfill these orders automatically. Refunds are performed in Paystack.
- Only unpaid pending orders can be cancelled through the status endpoint. Paid orders progress through `paid → processing → shipped → delivered`. Paid cancellation requires a refund workflow.
- Configure the Paystack webhook URL as `/api/webhooks/paystack`. Signatures use `PAYSTACK_SECRET_KEY`, per [Paystack's documentation](https://paystack.com/docs/payments/webhooks/). The old `PAYSTACK_WEBHOOK_SECRET` is no longer used. Missing payment configuration rejects callbacks.
- Keep order indexes enabled. Startup waits for order indexes, including the unique customer checkout key, before serving requests.

### Render deployment

For a cross-site setup (Vercel frontend, API on Render), configure the Render service with:

- **Root Directory:** `server`
- **Dockerfile:** `Dockerfile` (or Docker context `server/`)
- **Health Check Path:** `https://yagkive.onrender.com/health`

Environment variables:

| Variable | Value |
| --- | --- |
| `PORT` | 5000 (Render injects its own) |
| `NODE_ENV` | `production` |
| `MONGODB_URI` | Atlas/Replica set URI |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | Random long secrets |
| `PAYSTACK_SECRET_KEY` / `PAYSTACK_PUBLIC_KEY` | Paystack keys |
| `CLIENT_URL` | `https://yagkive.vercel.app` |
| `CORS_ORIGINS` | e.g. `https://yagkive.vercel.app,http://localhost:3000` |
| `COOKIE_SAMESITE` | `none` when frontend and API are on different sites (Vercel → Render); keep `lax` for same-site |

With `COOKIE_SAMESITE=none` the API sends `Secure` cookies, which is required for cross-site authentication. `CLIENT_URL` is the origin sent to Paystack as the payment callback base; `CORS_ORIGINS` is a comma-separated whitelist that defaults to `CLIENT_URL` when empty. Run `bun run seed` once against the production database to load the catalogue before going live.

## Validation

```powershell
bun.cmd run typecheck
bun.cmd run test
```

Tests run under Node.js 22 through tsx, create a temporary MongoDB replica set, and mock Paystack. They never use the application database or make real payments. The first run downloads MongoDB. Use `bun run test`, not the built-in Bun test runner. Run a Paystack test-mode checkout and webhook smoke test on the deployed environment before enabling live payments.
