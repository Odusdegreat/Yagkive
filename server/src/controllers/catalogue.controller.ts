import type { Request, Response } from "express";
import { isValidObjectId } from "mongoose";
import { Category } from "../models/Category.js";
import { Product } from "../models/Product.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createAppError } from "../middleware/error.middleware.js";
import { slugify } from "../utils/slug.js";

export const listCategories = asyncHandler(
  async (_req: Request, res: Response) => {
    res.json({
      success: true,
      message: "Categories retrieved",
      data: await Category.find().sort("name"),
    });
  },
);
export const createCategory = asyncHandler(
  async (req: Request, res: Response) => {
    const { name, description, image } = req.body;
    const category = await Category.create({
      name,
      description,
      image,
      slug: slugify(name),
    });
    res
      .status(201)
      .json({ success: true, message: "Category created", data: category });
  },
);
export const updateCategory = asyncHandler(
  async (req: Request, res: Response) => {
    const category = await Category.findById(req.params.id);
    if (!category) throw createAppError("Category not found", 404);
    Object.assign(category, req.body);
    if (req.body.name) category.slug = slugify(req.body.name);
    await category.save();
    res.json({ success: true, message: "Category updated", data: category });
  },
);
export const deleteCategory = asyncHandler(
  async (req: Request, res: Response) => {
    if (await Product.exists({ category: req.params.id }))
      throw createAppError("Cannot delete a category that has products", 409);
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) throw createAppError("Category not found", 404);
    res.json({ success: true, message: "Category deleted" });
  },
);
export const listProducts = asyncHandler(
  async (req: Request, res: Response) => {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const filter: Record<string, unknown> = {};
    if (req.query.category) filter.category = req.query.category;
    if (req.query.featured === "true") filter.featured = true;
    if (req.query.search) filter.$text = { $search: String(req.query.search) };
    if (req.query.includeUnpublished !== "true") filter.isPublished = true;
    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate("category", "name slug")
        .sort("-createdAt")
        .skip((page - 1) * limit)
        .limit(limit),
      Product.countDocuments(filter),
    ]);
    res.json({
      success: true,
      message: "Products retrieved",
      data: {
        products,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
    });
  },
);
export const getProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await Product.findOne(
    isValidObjectId(req.params.id)
      ? { _id: req.params.id }
      : { slug: req.params.id },
  ).populate("category", "name slug");
  if (!product || !product.isPublished)
    throw createAppError("Product not found", 404);
  res.json({ success: true, message: "Product retrieved", data: product });
});
export const createProduct = asyncHandler(
  async (req: Request, res: Response) => {
    const product = await Product.create({
      ...req.body,
      slug: slugify(req.body.name),
    });
    res
      .status(201)
      .json({ success: true, message: "Product created", data: product });
  },
);
export const updateProduct = asyncHandler(
  async (req: Request, res: Response) => {
    const product = await Product.findById(req.params.id);
    if (!product) throw createAppError("Product not found", 404);
    Object.assign(product, req.body);
    if (req.body.name) product.slug = slugify(req.body.name);
    await product.save();
    res.json({ success: true, message: "Product updated", data: product });
  },
);
export const deleteProduct = asyncHandler(
  async (req: Request, res: Response) => {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) throw createAppError("Product not found", 404);
    res.json({ success: true, message: "Product deleted" });
  },
);
