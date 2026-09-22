import { Router } from "express";
import { addCartItem, clearCart, getCart, getWishlist, removeCartItem, toggleWishlist, updateCartItem } from "../controllers/cart.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { cartItemSchema, cartQuantitySchema } from "../validators/schemas.js";
const router = Router(); router.get("/cart", protect, getCart); router.post("/cart/items", protect, validate(cartItemSchema), addCartItem); router.patch("/cart/items/:itemId", protect, validate(cartQuantitySchema), updateCartItem); router.delete("/cart/items/:itemId", protect, removeCartItem); router.delete("/cart", protect, clearCart); router.get("/wishlist", protect, getWishlist); router.put("/wishlist/:productId", protect, toggleWishlist); export default router;
