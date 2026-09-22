import { z } from "zod";
const id = z.string().regex(/^[a-f\d]{24}$/i, "Invalid resource ID");
export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(80),
    email: z.string().email(),
    password: z.string().min(8).max(128),
  }),
});
export const loginSchema = z.object({
  body: z.object({ email: z.string().email(), password: z.string().min(1) }),
});
const productBody = z.object({
  name: z.string().min(2),
  ref: z.string().min(2),
  description: z.string().optional(),
  note: z.string().optional(),
  category: id,
  price: z.coerce.number().nonnegative(),
  compareAtPrice: z.coerce.number().nonnegative().optional(),
  images: z
    .array(
      z.object({
        url: z.string().url(),
        publicId: z.string().optional(),
        alt: z.string().optional(),
      }),
    )
    .optional(),
  sizes: z.array(z.string()).optional(),
  colors: z.array(z.string()).optional(),
  stock: z.coerce.number().int().nonnegative(),
  isPublished: z.boolean().optional(),
  featured: z.boolean().optional(),
});
export const productSchema = z.object({ body: productBody });
export const productUpdateSchema = z.object({
  body: productBody
    .partial()
    .refine(
      (value) => Object.keys(value).length > 0,
      "At least one field is required",
    ),
});
const categoryBody = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  image: z.string().url().optional(),
});
export const categorySchema = z.object({ body: categoryBody });
export const categoryUpdateSchema = z.object({
  body: categoryBody
    .partial()
    .refine(
      (value) => Object.keys(value).length > 0,
      "At least one field is required",
    ),
});
export const cartItemSchema = z.object({
  body: z.object({
    productId: id,
    quantity: z.coerce.number().int().min(1).max(20),
    size: z.string().max(30).optional(),
    color: z.string().max(30).optional(),
  }),
});
export const cartQuantitySchema = z.object({
  body: z.object({ quantity: z.coerce.number().int().min(1).max(20) }),
});
export const orderSchema = z.object({
  body: z.object({
    quoteToken: z.string().min(1),
    shippingAddress: z.object({
      fullName: z.string().min(2),
      phone: z.string().min(5),
      addressLine1: z.string().min(3),
      addressLine2: z.string().optional(),
      city: z.string().min(2),
      state: z.string().min(2),
      country: z.string().min(2),
      postalCode: z.string().optional(),
    }),
  }),
});
