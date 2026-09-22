import { Router } from "express";
import { createOrder, listOrders, updateOrderStatus, verifyOrderPayment } from "../controllers/order.controller.js";
import { authorize, protect } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { orderSchema } from "../validators/schemas.js";
const router = Router(); router.post("/orders", protect, validate(orderSchema), createOrder); router.get("/orders", protect, listOrders); router.get("/payments/verify/:reference", protect, verifyOrderPayment); router.patch("/orders/:id/status", protect, authorize("admin"), updateOrderStatus); export default router;
