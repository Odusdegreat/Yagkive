import { Router } from "express";
import { login, logout, me, refresh, register } from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { loginSchema, registerSchema } from "../validators/schemas.js";
const router = Router(); router.post("/register", validate(registerSchema), register); router.post("/login", validate(loginSchema), login); router.post("/refresh", refresh); router.post("/logout", logout); router.get("/me", protect, me); export default router;
