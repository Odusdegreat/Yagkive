import { env } from "../config/env.js";
import { createAppError } from "../middleware/error.middleware.js";
import { logger } from "../utils/logger.js";

interface PaystackInitialization { authorization_url: string; access_code: string; reference: string }
export async function initializePaystackPayment(email: string, amount: number, reference: string, currency: "USD" | "NGN" = "USD"): Promise<PaystackInitialization> {
  if (!env.PAYSTACK_SECRET_KEY) throw createAppError("Payments are not configured", 503);
  const response = await fetch("https://api.paystack.co/transaction/initialize", { method: "POST", headers: { Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ email, amount: Math.round(amount * 100), reference, currency, callback_url: `${env.CLIENT_URL}/payment/verify` }) });
  const data = await response.json() as { status: boolean; message: string; data?: PaystackInitialization };
  if (!response.ok || !data.status || !data.data) {
    logger.error({ status: response.status, paystackMessage: data.message }, "Paystack payment initialization failed");
    throw createAppError(data.message || "Unable to initialize payment", 502);
  }
  return data.data;
}
export async function verifyPaystackPayment(reference: string): Promise<{ status: string; paidAt?: string }> {
  if (!env.PAYSTACK_SECRET_KEY) throw createAppError("Payments are not configured", 503);
  const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, { headers: { Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}` } });
  const data = await response.json() as { status: boolean; data?: { status: string; paid_at?: string } };
  if (!response.ok || !data.status || !data.data) {
    logger.error({ status: response.status }, "Paystack payment verification failed");
    throw createAppError("Unable to verify payment", 502);
  }
  return { status: data.data.status, paidAt: data.data.paid_at };
}
