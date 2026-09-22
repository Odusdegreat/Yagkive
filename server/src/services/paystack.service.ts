import { env } from "../config/env.js";
import { createAppError } from "../middleware/error.middleware.js";

export interface PaystackInitialization {
  authorization_url: string;
  access_code: string;
  reference: string;
}
export interface PaystackPayment {
  status: string;
  reference: string;
  amount: number;
  currency: string;
  paid_at?: string;
}

async function paystack<T>(path: string, body?: unknown): Promise<T> {
  if (!env.PAYSTACK_SECRET_KEY)
    throw createAppError("Payments are not configured", 503);
  const response = await fetch(`https://api.paystack.co${path}`, {
    method: body ? "POST" : "GET",
    signal: AbortSignal.timeout(15000),
    headers: {
      Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const result = (await response.json()) as { status: boolean; data?: T };
  if (!response.ok || !result.status || !result.data)
    throw createAppError(
      "Unable to contact the payment provider. Please retry.",
      502,
    );
  return result.data;
}
export function initializePaystackPayment(
  email: string,
  amount: number,
  reference: string,
  currency = "NGN",
): Promise<PaystackInitialization> {
  return paystack("/transaction/initialize", {
    email,
    amount: Math.round(amount * 100),
    reference,
    currency,
    callback_url: `${env.CLIENT_URL}/payment/verify`,
  });
}
export function verifyPaystackPayment(
  reference: string,
): Promise<PaystackPayment> {
  return paystack(`/transaction/verify/${encodeURIComponent(reference)}`);
}
