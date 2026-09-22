import mongoose from "mongoose";
import { Cart } from "../models/Cart.js";
import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { User } from "../models/User.js";
import { createAppError } from "../middleware/error.middleware.js";
import { sendOrderConfirmation } from "./email.service.js";
import type { PaystackPayment } from "./paystack.service.js";
import { logger } from "../utils/logger.js";

export async function confirmPayment(payment: PaystackPayment): Promise<void> {
  await mongoose.connection.transaction(async (session) => {
    const order = await Order.findOne({
      "payment.reference": payment.reference,
    }).session(session);
    if (!order?.payment) throw createAppError("Order not found", 404);
    if (
      payment.status !== "success" ||
      payment.amount !== Math.round((order.payment.chargeAmount ?? -1) * 100) ||
      payment.currency !== order.payment.chargeCurrency
    ) {
      throw createAppError("Payment does not match the order", 409);
    }
    if (order.payment.status === "success") return;
    // Legacy orders and expired reservations must acquire inventory before fulfillment.
    const held =
      order.reservationStatus === "held" && !!order.reservationExpiresAt;
    let available = order.status !== "cancelled";
    const quantities = new Map<string, number>();
    for (const item of order.items)
      quantities.set(
        String(item.product),
        (quantities.get(String(item.product)) ?? 0) + (item.quantity ?? 0),
      );
    if (!held && available) {
      for (const [id, quantity] of quantities) {
        if (
          !(await Product.exists({
            _id: id,
            stock: { $gte: quantity },
          }).session(session))
        )
          available = false;
      }
      if (available) {
        for (const [id, quantity] of quantities) {
          const result = await Product.updateOne(
            { _id: id, stock: { $gte: quantity } },
            { $inc: { stock: -quantity } },
            { session },
          );
          if (!result.modifiedCount)
            throw createAppError(
              "Inventory changed; retry payment verification",
              409,
            );
        }
      }
    }
    order.payment.status = "success";
    order.payment.paidAt = payment.paid_at
      ? new Date(payment.paid_at)
      : new Date();
    order.status = available ? "paid" : "payment_review";
    order.reservationStatus = available ? "consumed" : "released";
    await order.save({ session });
    if (available) {
      const cart = await Cart.findOne({ user: order.user }).session(session);
      if (cart) {
        for (const purchased of order.items) {
          const item = cart.items.find(
            (entry) => purchased.cartItemId === entry.id,
          );
          if (!item) continue;
          const remaining = item.quantity - (purchased.quantity ?? 0);
          if (remaining > 0) item.quantity = remaining;
          else cart.items.pull(item._id);
        }
        await cart.save({ session });
      }
    }
  });
}

export async function releaseExpiredReservations(): Promise<void> {
  const expired = await Order.find({
    reservationStatus: "held",
    reservationExpiresAt: { $lte: new Date() },
    "payment.status": { $ne: "success" },
  })
    .select("_id")
    .limit(100);
  for (const candidate of expired) {
    await mongoose.connection.transaction(async (session) => {
      const order = await Order.findOneAndUpdate(
        {
          _id: candidate._id,
          reservationStatus: "held",
          "payment.status": { $ne: "success" },
        },
        { $set: { reservationStatus: "released" } },
        { new: true, session },
      );
      if (!order) return;
      for (const item of order.items)
        await Product.updateOne(
          { _id: item.product },
          { $inc: { stock: item.quantity ?? 0 } },
          { session },
        );
    });
  }
}

export async function sendReceipt(reference: string): Promise<void> {
  try {
    const order = await Order.findOneAndUpdate(
      { "payment.reference": reference, status: "paid", receiptSentAt: null },
      { $set: { receiptSentAt: new Date() } },
      { new: true },
    );
    if (!order) return;
    const user = await User.findById(order.user);
    if (user) await sendOrderConfirmation(user.email, order);
  } catch (error) {
    await Order.updateOne(
      { "payment.reference": reference },
      { $unset: { receiptSentAt: 1 } },
    );
    logger.error(
      { err: error, reference },
      "Receipt delivery failed; payment remains confirmed",
    );
  }
}
