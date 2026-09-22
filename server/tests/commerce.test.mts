import {
  after as afterAll,
  before as beforeAll,
  beforeEach,
  test,
} from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import type { Server } from "node:http";
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server-core";

// Never use project credentials or the project database in this test suite.
process.env.NODE_ENV = "test";
process.env.MONGOMS_VERSION = "8.2.6";
process.env.MONGODB_URI = "mongodb://127.0.0.1:27017/unused-test-placeholder";
process.env.JWT_SECRET = "test-access-secret-only";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret-only";
process.env.PAYSTACK_SECRET_KEY = "sk_test_isolated";
process.env.RESEND_API_KEY = "";
process.env.RESEND_FROM_EMAIL = "";
process.env.USD_TO_NGN_RATE = "1600";
const { default: app } = await import("../src/app");
const { Product } = await import("../src/models/Product");
const { Category } = await import("../src/models/Category");
const { User } = await import("../src/models/User");
const { Cart } = await import("../src/models/Cart");
const { Order } = await import("../src/models/Order");
const { confirmPayment, releaseExpiredReservations } =
  await import("../src/services/order.service");
const { validPaystackSignature } = await import("../src/routes/webhook.routes");
const { default: jwt } = await import("jsonwebtoken");
let database: MongoMemoryReplSet;
let server: Server;
let base: string;
let token: string;
let userId: mongoose.Types.ObjectId;
let categoryId: mongoose.Types.ObjectId;
let initializations = 0;
const realFetch = globalThis.fetch;

beforeAll(
  async () => {
    database = await MongoMemoryReplSet.create({
      replSet: { count: 1 },
      instanceOpts: [{ launchTimeout: 60000 }],
    });
    await mongoose.connect(database.getUri());
    await Promise.all([
      Product.init(),
      Category.init(),
      User.init(),
      Cart.init(),
      Order.init(),
    ]);
    server = app.listen(0, "127.0.0.1");
    await new Promise<void>((resolve) => server.once("listening", resolve));
    base = "http://127.0.0.1:" + (server.address() as { port: number }).port;
    globalThis.fetch = (async (
      input: Parameters<typeof fetch>[0],
      init?: RequestInit,
    ) => {
      if (String(input).startsWith("https://api.paystack.co/")) {
        initializations++;
        const body = JSON.parse(String(init?.body));
        return Response.json({
          status: true,
          data: {
            authorization_url: "https://checkout.paystack.com/test",
            access_code: "test",
            reference: body.reference,
          },
        });
      }
      return realFetch(input, init);
    }) as typeof fetch;
  },
  { timeout: 120000 },
);
afterAll(async () => {
  globalThis.fetch = realFetch;
  if (server)
    await new Promise<void>((resolve) => server.close(() => resolve()));
  await mongoose.disconnect();
  await database?.stop();
});
beforeEach(async () => {
  await Promise.all([
    Product.deleteMany({}),
    Category.deleteMany({}),
    User.deleteMany({}),
    Cart.deleteMany({}),
    Order.deleteMany({}),
  ]);
  const user = await User.create({
    name: "Test Customer",
    email: "customer@example.test",
    password: "password123",
  });
  userId = user._id;
  categoryId = (await Category.create({ name: "Outerwear", slug: "outerwear" }))
    ._id;
  token = jwt.sign(
    { sub: String(userId), role: "customer" },
    process.env.JWT_SECRET!,
  );
  initializations = 0;
});
const address = {
  fullName: "Test Customer",
  phone: "+2348012345678",
  addressLine1: "1 Test Road",
  city: "Lagos",
  state: "Lagos",
  country: "Nigeria",
  postalCode: "100001",
};
async function request(
  path: string,
  method = "GET",
  body?: unknown,
  headers: Record<string, string> = {},
) {
  return fetch(base + "/api" + path, {
    method,
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
      ...headers,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}
async function product(stock = 5, extra = {}) {
  const suffix = crypto.randomUUID();
  return Product.create({
    name: "Field jacket",
    slug: "jacket-" + suffix,
    ref: suffix,
    price: 10,
    stock,
    category: categoryId,
    ...extra,
  });
}
async function checkout() {
  const quote = await (await request("/orders/quote")).json();
  assert.equal(quote.success, true);
  const body = { shippingAddress: address, quoteToken: quote.data.quoteToken };
  const headers = { "Idempotency-Key": crypto.randomUUID() };
  const response = await request("/orders", "POST", body, headers);
  return { response, body, headers, data: await response.json() };
}
function payment(order: {
  payment: { reference: string; chargeAmount: number };
}) {
  return {
    status: "success",
    reference: order.payment.reference,
    amount: order.payment.chargeAmount * 100,
    currency: "NGN",
  };
}

test("webhook signature fails closed and rejects malformed signatures", () => {
  const payload = Buffer.from('{"event":"charge.success"}');
  const signature = crypto
    .createHmac("sha512", "secret")
    .update(payload)
    .digest("hex");
  assert.equal(validPaystackSignature(payload, signature, "secret"), true);
  assert.equal(validPaystackSignature(payload, signature, ""), false);
  assert.equal(
    validPaystackSignature(payload, "é".repeat(128), "secret"),
    false,
  );
  assert.equal(
    validPaystackSignature(Buffer.from("{}"), signature, "secret"),
    false,
  );
});
test("unsigned webhook cannot confirm a payment", async () => {
  const response = await request("/webhooks/paystack", "POST", {
    event: "charge.success",
    data: {},
  });
  assert.equal(response.status, 401);
});
test("checkout retry reuses one order, reservation and provider transaction", async () => {
  const item = await product();
  await Cart.create({
    user: userId,
    items: [{ product: item._id, quantity: 2 }],
  });
  const first = await checkout();
  assert.equal(first.response.status, 201);
  const retry = await request("/orders", "POST", first.body, first.headers);
  assert.equal(retry.status, 201);
  assert.equal(await Order.countDocuments(), 1);
  assert.equal((await Product.findById(item._id))!.stock, 3);
  assert.equal(initializations, 1);
});
test("reservation failure rolls back every earlier stock deduction", async () => {
  const available = await product(5);
  const unavailable = await product(0);
  await Cart.create({
    user: userId,
    items: [
      { product: available._id, quantity: 2 },
      { product: unavailable._id, quantity: 1 },
    ],
  });
  const result = await checkout();
  assert.equal(result.response.status, 409);
  assert.equal((await Product.findById(available._id))!.stock, 5);
  assert.equal(await Order.countDocuments(), 0);
});
test("concurrent checkout retries cannot create duplicate reservations", async () => {
  const item = await product(8);
  await Cart.create({
    user: userId,
    items: [{ product: item._id, quantity: 2 }],
  });
  const quote = await (await request("/orders/quote")).json();
  const body = { shippingAddress: address, quoteToken: quote.data.quoteToken };
  const headers = { "Idempotency-Key": crypto.randomUUID() };
  const responses = await Promise.all([
    request("/orders", "POST", body, headers),
    request("/orders", "POST", body, headers),
  ]);
  assert.equal(
    responses.some((response) => response.status === 201),
    true,
  );
  assert.equal(await Order.countDocuments(), 1);
  assert.equal((await Product.findById(item._id))!.stock, 6);
  assert.equal(initializations, 1);
});
test("concurrent confirmations consume stock once and preserve new cart additions", async () => {
  const item = await product(8);
  const later = await product();
  const cart = await Cart.create({
    user: userId,
    items: [{ product: item._id, quantity: 2 }],
  });
  const result = await checkout();
  await Cart.updateOne({ _id: cart._id }, { $set: { "items.0.quantity": 3 } });
  await Cart.updateOne(
    { _id: cart._id },
    { $push: { items: { product: later._id, quantity: 1 } } },
  );
  await Promise.all([
    confirmPayment(payment(result.data.data.order)),
    confirmPayment(payment(result.data.data.order)),
  ]);
  assert.equal((await Product.findById(item._id))!.stock, 6);
  const remaining = await Cart.findById(cart._id);
  assert.equal(remaining!.items.length, 2);
  assert.equal(remaining!.items[0]!.quantity, 1);
  assert.equal((await Order.findOne())!.status, "paid");
});
test("wrong amount or currency leaves payment pending", async () => {
  const item = await product();
  await Cart.create({
    user: userId,
    items: [{ product: item._id, quantity: 1 }],
  });
  const result = await checkout();
  const valid = payment(result.data.data.order);
  await assert.rejects(
    () => confirmPayment({ ...valid, amount: 1 }),
    new RegExp("does not match"),
  );
  await assert.rejects(
    () => confirmPayment({ ...valid, currency: "USD" }),
    new RegExp("does not match"),
  );
  assert.equal((await Order.findOne())!.payment!.status, "pending");
});
test("expired reservations release once; late paid orders without stock require review", async () => {
  const item = await product(1);
  await Cart.create({
    user: userId,
    items: [{ product: item._id, quantity: 1 }],
  });
  const result = await checkout();
  await Order.updateOne({}, { $set: { reservationExpiresAt: new Date(0) } });
  await Promise.all([
    releaseExpiredReservations(),
    releaseExpiredReservations(),
  ]);
  assert.equal((await Product.findById(item._id))!.stock, 1);
  await Product.updateOne({ _id: item._id }, { $set: { stock: 0 } });
  await confirmPayment(payment(result.data.data.order));
  assert.equal((await Order.findOne())!.status, "payment_review");
  assert.equal((await Order.findOne())!.payment!.status, "success");
});
test("public callers cannot expose drafts and slugs resolve correctly", async () => {
  const item = await product();
  await product(5, { isPublished: false });
  assert.equal(
    (await request("/products?includeUnpublished=true")).status,
    403,
  );
  assert.equal(
    (await fetch(base + "/api/products?includeUnpublished=true")).status,
    401,
  );
  assert.equal((await request("/products/" + item.slug)).status, 200);
  assert.equal(
    (await (await request("/products")).json()).data.products.length,
    1,
  );
});
test("deleted products are removed from customer carts", async () => {
  const item = await product();
  await Cart.create({
    user: userId,
    items: [{ product: item._id, quantity: 1 }],
  });
  await item.deleteOne();
  const response = await request("/cart");
  assert.deepEqual((await response.json()).data.items, []);
  assert.equal((await Cart.findOne())!.items.length, 0);
});
test("variants and total quantity are validated", async () => {
  const item = await product(100, { sizes: ["M"], colors: ["Navy"] });
  assert.equal(
    (await request("/cart/items", "POST", { productId: item.id, quantity: 1 }))
      .status,
    400,
  );
  assert.equal(
    (
      await request("/cart/items", "POST", {
        productId: item.id,
        quantity: 20,
        size: "M",
        color: "Navy",
      })
    ).status,
    201,
  );
  assert.equal(
    (
      await request("/cart/items", "POST", {
        productId: item.id,
        quantity: 1,
        size: "M",
        color: "Navy",
      })
    ).status,
    400,
  );
});
test("status transitions reject unpaid shipment and cancellation releases stock once", async () => {
  const item = await product(5);
  await Cart.create({
    user: userId,
    items: [{ product: item._id, quantity: 2 }],
  });
  const result = await checkout();
  token = jwt.sign(
    { sub: String(userId), role: "admin" },
    process.env.JWT_SECRET!,
  );
  const path = "/orders/" + result.data.data.order._id + "/status";
  assert.equal(
    (await request(path, "PATCH", { status: "shipped" })).status,
    409,
  );
  assert.equal(
    (await request(path, "PATCH", { status: "cancelled" })).status,
    200,
  );
  assert.equal(
    (await request(path, "PATCH", { status: "cancelled" })).status,
    409,
  );
  assert.equal((await Product.findById(item._id))!.stock, 5);
  await confirmPayment(payment(result.data.data.order));
  assert.equal((await Order.findOne())!.status, "payment_review");
});
