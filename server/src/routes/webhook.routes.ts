import { Router } from "express";
import crypto from "crypto";
import { paystackWebhook } from "../controllers/order.controller.js";
import { env } from "../config/env.js";
import { createAppError } from "../middleware/error.middleware.js";
const router = Router();
router.post("/paystack", (req, _res, next) => { if (!env.PAYSTACK_WEBHOOK_SECRET) return next(); const signature = req.headers["x-paystack-signature"]; const payload = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body)); const expected = crypto.createHmac("sha512", env.PAYSTACK_WEBHOOK_SECRET).update(payload).digest("hex"); if (typeof signature !== "string" || signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return next(createAppError("Invalid payment webhook signature", 401)); next(); }, paystackWebhook);
export default router;
