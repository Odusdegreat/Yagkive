import { Schema, model, type InferSchemaType } from "mongoose";
const categorySchema = new Schema({ name: { type: String, required: true, unique: true, trim: true }, slug: { type: String, required: true, unique: true, lowercase: true }, description: { type: String, default: "" }, image: { type: String, default: "" } }, { timestamps: true });
export type CategoryDocument = InferSchemaType<typeof categorySchema>;
export const Category = model<CategoryDocument>("Category", categorySchema);
