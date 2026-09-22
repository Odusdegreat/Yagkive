import { Schema, model, type InferSchemaType } from "mongoose";
const orderSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    orderNumber: { type: String, required: true, unique: true },
    idempotencyKey: String,
    requestHash: String,
    reservationStatus: {
      type: String,
      enum: ["held", "consumed", "released"],
      default: "held",
    },
    reservationExpiresAt: Date,
    initializationStartedAt: Date,
    receiptSentAt: Date,
    items: [
      {
        cartItemId: String,
        product: { type: Schema.Types.ObjectId, ref: "Product" },
        name: String,
        image: String,
        price: Number,
        quantity: Number,
        size: String,
        color: String,
      },
    ],
    shippingAddress: {
      fullName: String,
      phone: String,
      addressLine1: String,
      addressLine2: String,
      city: String,
      state: String,
      country: String,
      postalCode: String,
    },
    subtotal: Number,
    shippingFee: Number,
    total: Number,
    currency: { type: String, default: "USD" },
    status: {
      type: String,
      enum: [
        "pending",
        "paid",
        "payment_review",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ],
      default: "pending",
    },
    payment: {
      provider: { type: String, default: "paystack" },
      reference: { type: String, unique: true, sparse: true },
      status: { type: String, default: "pending" },
      authorizationUrl: String,
      accessCode: String,
      chargeAmount: Number,
      chargeCurrency: String,
      exchangeRate: Number,
      paidAt: Date,
    },
  },
  { timestamps: true },
);
orderSchema.index(
  { user: 1, idempotencyKey: 1 },
  {
    unique: true,
    partialFilterExpression: { idempotencyKey: { $type: "string" } },
  },
);
orderSchema.index({ reservationStatus: 1, reservationExpiresAt: 1 });
export type OrderDocument = InferSchemaType<typeof orderSchema>;
export const Order = model<OrderDocument>("Order", orderSchema);
