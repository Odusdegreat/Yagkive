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

Paystack, Cloudinary, and Resend activate only after their respective environment variables are supplied. Amounts are currently handled in NGN.
