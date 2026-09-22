import crypto from "crypto";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { z } from "zod";
import type { Request, Response } from "express";
import { Cart } from "../models/Cart.js";
import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { User } from "../models/User.js";
import type { AuthRequest } from "../middleware/auth.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createAppError } from "../middleware/error.middleware.js";
import { env } from "../config/env.js";
import {
  initializePaystackPayment,
  verifyPaystackPayment,
} from "../services/paystack.service.js";
import {
  confirmPayment,
  releaseExpiredReservations,
  sendReceipt,
} from "../services/order.service.js";

const digest = (value: unknown) =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
async function snapshot(userId: string, session?: mongoose.ClientSession) {
  const cart = await Cart.findOne({ user: userId }).session(session ?? null);
  if (!cart?.items.length) throw createAppError("Your cart is empty", 400);
  const items = [];
  let cents = 0;
  for (const item of cart.items) {
    const product = await Product.findById(item.product).session(
      session ?? null,
    );
    if (!product?.isPublished)
      throw createAppError(
        "An item is no longer available. Update your cart.",
        409,
      );
    if (
      (product.sizes.length && !product.sizes.includes(item.size ?? "")) ||
      (product.colors.length && !product.colors.includes(item.color ?? ""))
    )
      throw createAppError("Select an available size and color", 409);
    if (item.quantity < 1 || item.quantity > 20)
      throw createAppError("Quantity must be between 1 and 20", 409);
    cents += Math.round(product.price * 100) * item.quantity;
    items.push({
      cartItemId: item.id,
      product: product._id,
      name: product.name,
      image: product.images[0]?.url ?? "",
      price: product.price,
      quantity: item.quantity,
      size: item.size,
      color: item.color,
    });
  }
  return { items, subtotal: cents / 100, total: cents / 100, shippingFee: 0 };
}
export const quoteOrder = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const data = await snapshot(req.user!.id);
    const exchangeRate = env.USD_TO_NGN_RATE;
    const chargeAmount = Math.round(data.total * exchangeRate * 100) / 100;
    const quoteToken = jwt.sign(
      {
        sub: req.user!.id,
        fingerprint: digest(data),
        exchangeRate,
        chargeAmount,
      },
      env.JWT_SECRET,
      { expiresIn: "10m", audience: "checkout-quote" },
    );
    res.json({
      success: true,
      message: "Checkout quote",
      data: {
        fingerprint: digest(data),
        total: data.total,
        shippingFee: data.shippingFee,
        currency: "USD",
        chargeAmount,
        chargeCurrency: "NGN",
        exchangeRate,
        quoteToken,
      },
    });
  },
);

export const createOrder = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!env.PAYSTACK_SECRET_KEY)
      throw createAppError("Payments are not configured", 503);
    const key = req.get("Idempotency-Key");
    if (!key || !/^[a-zA-Z0-9-]{16,80}$/.test(key))
      throw createAppError("A valid checkout request key is required", 400);
    const requestHash = digest(req.body);
    let order = await Order.findOne({
      user: req.user!.id,
      idempotencyKey: key,
    });
    if (order && order.requestHash !== requestHash)
      throw createAppError(
        "This checkout request has changed. Start a new checkout.",
        409,
      );
    if (!order) {
      let quote: {
        sub: string;
        fingerprint: string;
        exchangeRate: number;
        chargeAmount: number;
      };
      try {
        quote = jwt.verify(req.body.quoteToken, env.JWT_SECRET, {
          audience: "checkout-quote",
        }) as typeof quote;
      } catch {
        throw createAppError(
          "Your quote expired. Review the updated total.",
          409,
        );
      }
      if (quote.sub !== req.user!.id)
        throw createAppError("Invalid checkout quote", 400);
      await releaseExpiredReservations();
      try {
        await mongoose.connection.transaction(async (session) => {
          const data = await snapshot(req.user!.id, session);
          if (digest(data) !== quote.fingerprint)
            throw createAppError(
              "Your cart changed. Review the updated total.",
              409,
            );
          for (const item of data.items) {
            const updated = await Product.updateOne(
              {
                _id: item.product,
                isPublished: true,
                stock: { $gte: item.quantity },
              },
              { $inc: { stock: -item.quantity } },
              { session },
            );
            if (!updated.modifiedCount)
              throw createAppError("One or more items are out of stock", 409);
          }
          const created = await Order.create(
            [
              {
                user: req.user!.id,
                idempotencyKey: key,
                requestHash,
                orderNumber: `YAG-${crypto.randomUUID().toUpperCase()}`,
                ...data,
                shippingAddress: req.body.shippingAddress,
                currency: "USD",
                reservationStatus: "held",
                reservationExpiresAt: new Date(Date.now() + 30 * 60 * 1000),
                payment: {
                  provider: "paystack",
                  reference: `yag_${crypto.randomUUID().replaceAll("-", "")}`,
                  status: "pending",
                  chargeAmount: quote.chargeAmount,
                  chargeCurrency: "NGN",
                  exchangeRate: quote.exchangeRate,
                },
              },
            ],
            { session },
          );
          order = created[0]!;
        });
      } catch (error) {
        if ((error as { code?: number }).code !== 11000) throw error;
        order = await Order.findOne({
          user: req.user!.id,
          idempotencyKey: key,
        });
        if (!order || order.requestHash !== requestHash)
          throw createAppError("Checkout request conflict", 409);
      }
    }
    if (!order?.payment?.reference)
      throw createAppError("Unable to create order", 500);
    if (order.payment.status === "success")
      throw createAppError(
        "This order is already paid. Check your payment status.",
        409,
      );
    if (
      order.reservationStatus !== "held" ||
      !order.reservationExpiresAt ||
      order.reservationExpiresAt <= new Date()
    )
      throw createAppError("This checkout expired. Start a new checkout.", 409);
    if (!order.payment.authorizationUrl) {
      // A lease prevents concurrent retries from initializing the same payment twice.
      const claimed = await Order.findOneAndUpdate(
        {
          _id: order._id,
          "payment.authorizationUrl": null,
          $or: [
            { initializationStartedAt: null },
            { initializationStartedAt: { $lt: new Date(Date.now() - 30000) } },
          ],
        },
        { $set: { initializationStartedAt: new Date() } },
        { new: true },
      );
      if (!claimed) {
        const ready = await Order.findById(order._id);
        if (ready?.payment?.authorizationUrl) {
          res
            .status(201)
            .json({
              success: true,
              message: "Order ready for payment",
              data: {
                order: ready,
                payment: { authorization_url: ready.payment.authorizationUrl },
              },
            });
          return;
        }
        throw createAppError(
          "Payment is being prepared. Retry in a moment.",
          409,
        );
      }
      const user = await User.findById(req.user!.id);
      if (!user) throw createAppError("User not found", 404);
      const payment = await initializePaystackPayment(
        user.email,
        order.payment.chargeAmount!,
        order.payment.reference,
        "NGN",
      );
      order = await Order.findByIdAndUpdate(
        order._id,
        {
          $set: {
            "payment.authorizationUrl": payment.authorization_url,
            "payment.accessCode": payment.access_code,
          },
          $unset: { initializationStartedAt: 1 },
        },
        { new: true },
      );
    }
    res.status(201).json({
      success: true,
      message: "Order ready for payment",
      data: {
        order,
        payment: { authorization_url: order!.payment!.authorizationUrl },
      },
    });
  },
);

export const verifyOrderPayment = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const reference = String(req.params.reference);
    const order = await Order.findOne({
      "payment.reference": reference,
      user: req.user!.id,
    });
    if (!order) throw createAppError("Order not found", 404);
    if (order.payment?.status !== "success") {
      const payment = await verifyPaystackPayment(reference);
      if (payment.reference !== reference)
        throw createAppError("Payment reference does not match", 409);
      if (payment.status !== "success")
        throw createAppError(
          "Payment has not completed. Please retry shortly.",
          409,
        );
      await confirmPayment(payment);
    }
    void sendReceipt(reference);
    res.json({
      success: true,
      message: "Payment verified",
      data: await Order.findById(order.id),
    });
  },
);

const webhookSchema = z.object({ event: z.string(), data: z.unknown() });
const paymentSchema = z.object({
  status: z.literal("success"),
  reference: z.string(),
  amount: z.number().int().nonnegative(),
  currency: z.string(),
  paid_at: z.string().datetime({ offset: true }).optional(),
});
export const paystackWebhook = asyncHandler(
  async (req: Request, res: Response) => {
    let body: unknown;
    try {
      body = JSON.parse(req.body.toString("utf8"));
    } catch {
      throw createAppError("Invalid webhook payload", 400);
    }
    const event = webhookSchema.safeParse(body);
    if (!event.success) throw createAppError("Invalid webhook payload", 400);
    if (event.data.event === "charge.success") {
      const payment = paymentSchema.safeParse(event.data.data);
      if (!payment.success) throw createAppError("Invalid payment event", 400);
      if (await Order.exists({ "payment.reference": payment.data.reference })) {
        await confirmPayment(payment.data);
        void sendReceipt(payment.data.reference);
      }
    }
    res.sendStatus(200);
  },
);

export const listOrders = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const orders = await Order.find(
      req.user!.role === "admin" ? {} : { user: req.user!.id },
    )
      .populate("user", "name email")
      .sort("-createdAt");
    res.json({ success: true, message: "Orders retrieved", data: orders });
  },
);

const transitions: Record<string, string[]> = {
  pending: ["cancelled"],
  paid: ["processing"],
  processing: ["shipped"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
  payment_review: [],
};
export const updateOrderStatus = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    await mongoose.connection.transaction(async (session) => {
      const order = await Order.findById(req.params.id).session(session);
      if (!order) throw createAppError("Order not found", 404);
      const status = req.body.status as string;
      if (!transitions[order.status]?.includes(status))
        throw createAppError(
          "This order status transition is not allowed",
          409,
        );
      if (
        status === "cancelled" &&
        order.reservationStatus === "held" &&
        order.reservationExpiresAt
      ) {
        for (const item of order.items)
          await Product.updateOne(
            { _id: item.product },
            { $inc: { stock: item.quantity ?? 0 } },
            { session },
          );
        order.reservationStatus = "released";
      }
      order.status = status as typeof order.status;
      await order.save({ session });
    });
    res.json({
      success: true,
      message: "Order updated",
      data: await Order.findById(req.params.id),
    });
  },
);
