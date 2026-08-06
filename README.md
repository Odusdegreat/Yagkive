# Yagkive — Technical Archive Storefront

A single-page storefront for **YAGKIVE**, a technical-archive streetwear brand. Products are catalogued like schematic parts — REF numbers, blueprint grid, corner crops, safety-orange stamps — over a navy drafting-table ground.

## Stack

- **Next.js 16** (App Router) + **React 19**
- **Tailwind CSS v4** (PostCSS)
- **shadcn/ui** components (`components/ui`) — Card, Button, Sheet, Input, Badge
- **lucide-react** icons
- **Bun** package manager

## Getting started

```bash
bun install
bun run dev
```

Open http://localhost:3000.

## Scripts

| Command        | Description                  |
| -------------- | ---------------------------- |
| `bun run dev`  | Start the dev server         |
| `bun run build`| Create a production build    |
| `bun run start`| Serve the production build   |

## Features

- **Catalogue grid** — 14 pieces across Outerwear for now, Bottoms, Accessories, and Footwear, filterable by category.
- **Live search** — search by name, REF, spec, or category; opens via the header search icon.
- **Wishlist** — heart a piece from its card, or toggle the wishlist-only view from the header heart (with count badge).
- **Archive (cart)** — a right-hand sheet holds added items with quantity steppers, product thumbnails, and subtotal.
- **Hero** — product photo in a schematic frame; click it (or the logo) to navigate. The hero hides while searching or viewing the wishlist.

## Project structure

```
app/                  App Router pages, layout, global styles
components/
  storefront/         Storefront, ProductCard, CartDrawer, Marquee, …
  ui/                 shadcn/ui primitives
lib/
  products.ts         Catalogue data (products, categories, types)
  utils.ts            cn() helper
```

## Customizing the catalogue

Edit `lib/products.ts` — each product needs a unique `id`, `ref`, `name`, `category`, `price`, `note`, `icon`, and `image` URL. Images are served from `images.unsplash.com` (see `next.config.mjs` `remotePatterns`).

## Theming

The design tokens live in `app/globals.css`: the blueprint palette is defined as custom properties on `.page` (navy, cyan, paper, orange), and the shadcn/ui theme variables (`--background`, `--primary`, `--border`, `--radius`, …) are themed to match in `:root`.
