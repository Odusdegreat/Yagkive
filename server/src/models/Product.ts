import { Schema, model, type InferSchemaType } from "mongoose";
const imageSchema = new Schema({ url: { type: String, required: true }, publicId: { type: String, default: "" }, alt: { type: String, default: "" } }, { _id: false });
const productSchema = new Schema({
  name: { type: String, required: true, trim: true }, slug: { type: String, required: true, unique: true, lowercase: true }, ref: { type: String, required: true, unique: true, trim: true },
  description: { type: String, default: "" }, note: { type: String, default: "" }, category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
  price: { type: Number, required: true, min: 0 }, compareAtPrice: { type: Number, min: 0 }, images: { type: [imageSchema], default: [] }, sizes: { type: [String], default: [] }, colors: { type: [String], default: [] }, stock: { type: Number, required: true, min: 0, default: 0 }, isPublished: { type: Boolean, default: true }, featured: { type: Boolean, default: false },
}, { timestamps: true });
productSchema.index({ name: "text", ref: "text", description: "text", note: "text" });
export type ProductDocument = InferSchemaType<typeof productSchema>;
export const Product = model<ProductDocument>("Product", productSchema);
