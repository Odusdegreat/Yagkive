import { Resend } from "resend";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";
import { generateReceiptPdf, type ReceiptOrder } from "./receipt.service.js";

export async function sendOrderConfirmation(
  to: string,
  order: ReceiptOrder,
): Promise<void> {
  if (!env.RESEND_API_KEY || !env.RESEND_FROM_EMAIL) {
    logger.info(
      { orderNumber: order.orderNumber },
      "Email skipped: Resend is not configured",
    );
    return;
  }
  const resend = new Resend(env.RESEND_API_KEY);
  const receipt = await generateReceiptPdf(order);
  const result = await resend.emails.send({
    from: env.RESEND_FROM_EMAIL,
    to,
    subject: `Order ${order.orderNumber} confirmed`,
    html: `<p>Thanks for your order.</p><p>Order: <strong>${order.orderNumber}</strong></p><p>Total: $${(order.total ?? 0).toLocaleString("en-US")}</p><p>Your PDF receipt is attached.</p>`,
    attachments: [
      {
        filename: `yagkive-${order.orderNumber}-receipt.pdf`,
        content: receipt,
      },
    ],
  });
  if (result.error) throw new Error("Unable to send order confirmation email");
}
