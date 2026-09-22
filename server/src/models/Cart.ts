import { Schema, model, type InferSchemaType } from "mongoose";
const cartSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    items: [
      {
        product: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: { type: Number, required: true, min: 1 },
        size: String,
        color: String,
      },
    ],
  },
  { timestamps: true, optimisticConcurrency: true },
);
export type CartDocument = InferSchemaType<typeof cartSchema>;
export const Cart = model<CartDocument>("Cart", cartSchema);
