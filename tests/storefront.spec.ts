import { expect, test, type Page } from "@playwright/test";

const product = {
  _id: "aaaaaaaaaaaaaaaaaaaaaaaa",
  name: "Field jacket",
  ref: "REF-1",
  note: "Test jacket",
  description: "",
  price: 10,
  stock: 3,
  sizes: ["M", "L"],
  colors: ["Navy"],
  images: [{ url: "/images/yags.png" }],
  isPublished: true,
  category: { name: "New category", slug: "new-category" },
};
const user = {
  id: "bbbbbbbbbbbbbbbbbbbbbbbb",
  name: "Customer",
  email: "customer@example.test",
  role: "customer",
  wishlist: [],
};
const item = {
  _id: "cccccccccccccccccccccccc",
  product,
  quantity: 1,
  size: "M",
  color: "Navy",
};
const quote = {
  fingerprint: "cart-fingerprint",
  total: 10,
  shippingFee: 0,
  currency: "USD",
  chargeAmount: 16000,
  chargeCurrency: "NGN",
  exchangeRate: 1600,
  quoteToken: "signed-quote",
};

async function mockApi(
  page: Page,
  options: { empty?: boolean; stale?: boolean; catalogueError?: boolean } = {},
) {
  await page.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.replace("/api", "");
    let data: unknown;
    if (path === "/products") {
      if (options.catalogueError)
        return route.fulfill({
          status: 503,
          json: { success: false, message: "Unavailable" },
        });
      data = {
        products: options.empty ? [] : [product],
        pagination: { pages: 1 },
      };
    } else if (path === "/categories") data = [product.category];
    else if (path === "/auth/me") data = { user };
    else if (path === "/wishlist") data = [];
    else if (path === "/cart")
      data = { items: options.stale ? [{ ...item, product: null }] : [item] };
    else if (path === "/cart/items") data = { items: [item] };
    else if (path === "/orders/quote") data = quote;
    else if (path === "/locations/countries")
      data = [{ code: "NG", name: "Nigeria", dialCode: "+234" }];
    else if (path === "/locations/phones/format")
      data = {
        e164: "+2348012345678",
        international: "+234 801 234 5678",
        isValid: true,
      };
    else if (path === "/auth/login") data = { user };
    else
      return route.fulfill({
        status: 404,
        json: { success: false, message: "Unexpected test route: " + path },
      });
    return route.fulfill({ json: { success: true, data } });
  });
}

test("empty catalogue does not show demo products or crash the hero", async ({
  page,
}) => {
  await mockApi(page, { empty: true });
  await page.goto("/");
  await expect(page.getByText("THE ARCHIVE IS CURRENTLY EMPTY.")).toBeVisible();
  await expect(page.getByText("M-51 Field Jacket")).toHaveCount(0);
});
test("catalogue errors have an explicit retry action", async ({ page }) => {
  await mockApi(page, { catalogueError: true });
  await page.goto("/");
  await expect(page.getByText("Unable to load the catalogue.")).toBeVisible();
  await mockApi(page);
  await page.getByRole("button", { name: "Retry", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Field jacket" }),
  ).toBeVisible();
});
test("catalogue fetches every API page", async ({ page }) => {
  await mockApi(page);
  const pages: string[] = [];
  await page.route("**/api/products?*", async (route) => {
    const pageNumber = new URL(route.request().url()).searchParams.get("page")!;
    pages.push(pageNumber);
    await route.fulfill({
      json: {
        success: true,
        data: {
          products: [
            {
              ...product,
              _id: pageNumber.padStart(24, "a"),
              name: "Page " + pageNumber + " jacket",
            },
          ],
          pagination: { pages: 2 },
        },
      },
    });
  });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Page 2 jacket" }),
  ).toBeVisible();
  // Development Strict Mode may repeat the read effect; every page must still render once.
  expect([...new Set(pages)]).toEqual(["1", "2"]);
  await expect(
    page.getByRole("heading", { name: "Page 2 jacket" }),
  ).toHaveCount(1);
});
test("cart quantity controls wait for the server and honor stock limits", async ({
  page,
}) => {
  await mockApi(page);
  let updates = 0;
  await page.route("**/api/cart/items/" + item._id, async (route) => {
    updates++;
    await new Promise((resolve) => setTimeout(resolve, 500));
    await route.fulfill({
      json: { success: true, data: { items: [{ ...item, quantity: 3 }] } },
    });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Open cart", exact: true }).click();
  const increase = page.getByRole("button", { name: "Increase quantity" });
  await increase.click();
  await expect(
    page.getByRole("button", { name: "Decrease quantity" }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Decrease quantity" }),
  ).toBeEnabled();
  await expect(increase).toBeDisabled();
  expect(updates).toBe(1);
});
test("API categories and required variants are available", async ({ page }) => {
  await mockApi(page);
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "NEW CATEGORY", exact: true }),
  ).toBeVisible();
  const add = page.getByRole("button", { name: "Add Field jacket to cart" });
  await expect(add).toBeDisabled();
  await page.getByLabel("Size for Field jacket").selectOption("M");
  await page.getByLabel("Color for Field jacket").selectOption("Navy");
  await expect(add).toBeEnabled();
  const request = page.waitForRequest(
    (request) =>
      request.url().endsWith("/cart/items") && request.method() === "POST",
  );
  await add.click();
  expect((await request).postDataJSON()).toEqual({
    productId: product._id,
    quantity: 1,
    size: "M",
    color: "Navy",
  });
});
test("deleted cart products render a removable unavailable item", async ({
  page,
}) => {
  await mockApi(page, { stale: true });
  await page.goto("/");
  await page.getByRole("button", { name: "Open cart", exact: true }).click();
  await expect(
    page.getByText("This item is no longer available."),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Remove unavailable item" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "CHECKOUT", exact: true }),
  ).toBeDisabled();
});
test("checkout closes cart, traps focus, shows NGN quote and preserves retry key", async ({
  page,
}) => {
  await mockApi(page);
  const keys: string[] = [];
  await page.route("**/api/orders", async (route) => {
    keys.push(route.request().headers()["idempotency-key"]);
    await route.fulfill({
      status: 503,
      json: { success: false, message: "Temporary payment outage" },
    });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Open cart", exact: true }).click();
  await page.getByRole("button", { name: "CHECKOUT", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Delivery details" });
  await expect(dialog).toBeVisible();
  await expect(page.getByRole("dialog", { name: "Your Archive" })).toBeHidden();
  await expect(
    page.getByText("Paystack will charge NGN 16,000.00"),
  ).toBeVisible();
  await page.getByLabel("FULL NAME").fill("Test Customer");
  await page.getByLabel("PHONE", { exact: true }).fill("8012345678");
  await page.getByLabel("ADDRESS", { exact: true }).fill("1 Test Road");
  await page.getByLabel("CITY", { exact: true }).fill("Lagos");
  await page.getByLabel("STATE / REGION").fill("Lagos");
  await page.getByLabel("POSTAL CODE (OPTIONAL)").fill("100001");
  await page.getByRole("button", { name: "CONTINUE TO PAYSTACK" }).click();
  await expect(dialog.getByText("Temporary payment outage")).toBeVisible();
  await page.getByRole("button", { name: "CONTINUE TO PAYSTACK" }).click();
  await expect.poll(() => keys.length).toBe(2);
  expect(keys[0]).toBe(keys[1]);
  for (let count = 0; count < 15; count++) {
    await page.keyboard.press("Tab");
    expect(
      await dialog.evaluate((element) =>
        element.contains(document.activeElement),
      ),
    ).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});
test("payment verification supports sign-in and retry without losing reference", async ({
  page,
}) => {
  await mockApi(page);
  let signedIn = false;
  await page.route("**/api/auth/refresh", (route) =>
    route.fulfill({
      status: 401,
      json: { success: false, message: "Sign in required" },
    }),
  );
  await page.route("**/api/auth/login", async (route) => {
    signedIn = true;
    await route.fulfill({ json: { success: true, data: { user } } });
  });
  await page.route("**/api/payments/verify/test-reference", (route) =>
    route.fulfill(
      signedIn
        ? {
            status: 409,
            json: {
              success: false,
              message: "Payment has not completed. Please retry shortly.",
            },
          }
        : {
            status: 401,
            json: { success: false, message: "Sign in required" },
          },
    ),
  );
  await page.goto("/payment/verify?reference=test-reference");
  await page.getByRole("button", { name: "SIGN IN TO VERIFY" }).click();
  await page.getByLabel("EMAIL", { exact: true }).fill("customer@example.test");
  await page.getByLabel("PASSWORD", { exact: true }).fill("password123");
  await page.getByRole("button", { name: "SIGN IN", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "RETRY VERIFICATION" }),
  ).toBeVisible();
  await expect(page).toHaveURL(/reference=test-reference/);
});
