import type { Response } from "express";
import { Cart } from "../models/Cart.js";
import { Product } from "../models/Product.js";
import { User } from "../models/User.js";
import type { AuthRequest } from "../middleware/auth.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createAppError } from "../middleware/error.middleware.js";

const cartFor = async (userId: string) => {
  const cart = await Cart.findOne({ user: userId }).populate("items.product");
  if (!cart) return null;
  const stale = cart.items
    .filter((item) => !item.product)
    .map((item) => item._id);
  if (stale.length)
    await Cart.updateOne(
      { _id: cart._id },
      { $pull: { items: { _id: { $in: stale } } }, $inc: { __v: 1 } },
    );
  const result = cart.toObject();
  return { ...result, items: result.items.filter((item) => !!item.product) };
};
export const getCart = asyncHandler(async (req: AuthRequest, res: Response) => {
  const cart = await cartFor(req.user!.id);
  res.json({
    success: true,
    message: "Cart retrieved",
    data: cart ?? { items: [] },
  });
});
export const addCartItem = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { productId, quantity, size, color } = req.body;
    const product = await Product.findById(productId);
    if (!product || !product.isPublished)
      throw createAppError("Product not found", 404);
    if (
      (product.sizes.length ? !product.sizes.includes(size) : !!size) ||
      (product.colors.length ? !product.colors.includes(color) : !!color)
    )
      throw createAppError("Select an available size and color", 400);
    if (product.stock < quantity)
      throw createAppError("Insufficient stock", 409);
    const cart = await Cart.findOneAndUpdate(
      { user: req.user!.id },
      { $setOnInsert: { user: req.user!.id } },
      { upsert: true, new: true },
    );
    const existing = cart.items.find(
      (item) =>
        item.product.toString() === productId &&
        item.size === size &&
        item.color === color,
    );
    if (existing) {
      if (existing.quantity + quantity > 20)
        throw createAppError("Maximum quantity is 20", 400);
      if (existing.quantity + quantity > product.stock)
        throw createAppError("Insufficient stock", 409);
      existing.quantity += quantity;
    } else cart.items.push({ product: product._id, quantity, size, color });
    await cart.save();
    res
      .status(201)
      .json({
        success: true,
        message: "Item added to cart",
        data: await cartFor(req.user!.id),
      });
  },
);
export const updateCartItem = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const cart = await Cart.findOne({ user: req.user!.id });
    if (!cart) throw createAppError("Cart not found", 404);
    const item = cart.items.id(String(req.params.itemId));
    if (!item) throw createAppError("Cart item not found", 404);
    const product = await Product.findById(item.product);
    if (!product || !product.isPublished || product.stock < req.body.quantity)
      throw createAppError("Insufficient stock", 409);
    item.quantity = req.body.quantity;
    await cart.save();
    res.json({
      success: true,
      message: "Cart updated",
      data: await cartFor(req.user!.id),
    });
  },
);
export const removeCartItem = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const cart = await Cart.findOne({ user: req.user!.id });
    if (!cart) throw createAppError("Cart not found", 404);
    cart.items.pull({ _id: req.params.itemId });
    await cart.save();
    res.json({
      success: true,
      message: "Item removed from cart",
      data: await cartFor(req.user!.id),
    });
  },
);
export const clearCart = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    await Cart.findOneAndUpdate(
      { user: req.user!.id },
      { $set: { items: [] } },
    );
    res.json({ success: true, message: "Cart cleared" });
  },
);
export const getWishlist = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const user = await User.findById(req.user!.id).populate("wishlist");
    res.json({
      success: true,
      message: "Wishlist retrieved",
      data: user?.wishlist ?? [],
    });
  },
);
export const toggleWishlist = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const product = await Product.findById(req.params.productId);
    if (!product) throw createAppError("Product not found", 404);
    const user = await User.findById(req.user!.id);
    if (!user) throw createAppError("User not found", 404);
    const exists = user.wishlist.some((id) => id.toString() === product.id);
    user.wishlist = exists
      ? user.wishlist.filter((id) => id.toString() !== product.id)
      : [...user.wishlist, product._id];
    await user.save();
    res.json({
      success: true,
      message: exists ? "Removed from wishlist" : "Added to wishlist",
      data: { wishlisted: !exists },
    });
  },
);
