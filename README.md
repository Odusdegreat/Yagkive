# Yagkive storefront

Next.js, React, and Tailwind storefront backed by the Express API in `server/`.

## Development

```powershell
bun.cmd install
bun.cmd run dev
```

Use `bun` instead of `bun.cmd` outside PowerShell. The frontend runs at http://localhost:3000. Copy `.env.local.example` to `.env.local` to configure `NEXT_PUBLIC_API_URL`; the default is http://localhost:5000/api.

Start the backend separately, following [server/README.md](server/README.md). Checkout requires MongoDB Atlas or a replica set for inventory transactions.

## Shopping flow

- The catalogue and categories come from the API. Loading, empty, and error states are explicit; errors offer retry.
- Catalogue pagination is fetched completely. Search, category filters, and wishlist filtering operate on the loaded products.
- Products expose available sizes, colors, and stock. Unavailable products cannot be added, and variant choices are validated by the API.
- Signed-in customers have a server-backed cart and wishlist. Cart updates wait for the server and deleted products are handled safely.
- Checkout displays the USD total, configured exchange rate, and exact NGN charge before redirecting to Paystack. Failed requests reuse a persisted checkout key to prevent duplicate orders.
- Payment verification supports retry and sign-in recovery without losing the payment reference. Confirmed orders offer a downloadable receipt.
- Authentication and checkout dialogs support keyboard focus containment and Escape.

Product records are managed through the API or the backend seed script. `lib/products.ts` contains editorial sample data for the lookbook; it is not the live shop catalogue.

## Validation

```powershell
bun.cmd run lint
bun.cmd run typecheck
bun.cmd run build
bun.cmd x playwright install chromium
bun.cmd run test
```

Use `bun run test` for the frontend, not the built-in `bun test` command. Browser tests run a separate local frontend on port 3100 using `.next-playwright/`, with mocked API responses; an existing development server can stay running. Backend integration-test instructions are in [server/README.md](server/README.md).

## Structure

- `app/`: pages and global styles.
- `components/storefront/`: catalogue, cart, checkout, authentication, and receipts.
- `components/ui/`: shared controls and accessible dialogs.
- `lib/api.ts`: typed API client, session refresh, and catalogue pagination.
- `server/`: API, persistence, payment handling, and integration tests.
- `tests/`: browser regression tests.

The visual theme is defined in `app/globals.css`.
