import { Router } from "express";
import crypto from "crypto";
import { paystackWebhook } from "../controllers/order.controller.js";
import { env } from "../config/env.js";
import { createAppError } from "../middleware/error.middleware.js";

export function validPaystackSignature(
  payload: Buffer,
  signature: unknown,
  secret: string,
): boolean {
  if (
    !secret ||
    typeof signature !== "string" ||
    !/^[a-f0-9]{128}$/i.test(signature)
  )
    return false;
  const expected = crypto.createHmac("sha512", secret).update(payload).digest();
  return crypto.timingSafeEqual(Buffer.from(signature, "hex"), expected);
}

const router = Router();
router.post(
  "/paystack",
  (req, _res, next) => {
    if (!env.PAYSTACK_SECRET_KEY)
      return next(createAppError("Payments are not configured", 503));
    if (
      !Buffer.isBuffer(req.body) ||
      !validPaystackSignature(
        req.body,
        req.headers["x-paystack-signature"],
        env.PAYSTACK_SECRET_KEY,
      )
    ) {
      return next(createAppError("Invalid payment webhook signature", 401));
    }
    next();
  },
  paystackWebhook,
);
export default router;
