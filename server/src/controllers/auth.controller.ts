import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { env } from "../config/env.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createAppError } from "../middleware/error.middleware.js";
import { clearTokens, issueTokens } from "../services/token.service.js";
import type { AuthRequest } from "../middleware/auth.middleware.js";

const userData = (user: { _id: unknown; name: string; email: string; role: string; wishlist?: unknown[] }) => ({ id: String(user._id), name: user.name, email: user.email, role: user.role, wishlist: user.wishlist ?? [] });
export const register = asyncHandler(async (req: Request, res: Response) => { const { name, email, password } = req.body; if (await User.exists({ email })) throw createAppError("An account with this email already exists", 409); const user = await User.create({ name, email, password }); const { accessToken } = issueTokens(user, res); res.status(201).json({ success: true, message: "Account created", data: { user: userData(user), accessToken } }); });
export const login = asyncHandler(async (req: Request, res: Response) => { const { email, password } = req.body; const user = await User.findOne({ email }).select("+password"); if (!user || !(await user.comparePassword(password))) throw createAppError("Invalid email or password", 401); const { accessToken } = issueTokens(user, res); res.json({ success: true, message: "Logged in", data: { user: userData(user), accessToken } }); });
export const logout = (_req: Request, res: Response): void => { clearTokens(res); res.json({ success: true, message: "Logged out" }); };
export const me = asyncHandler(async (req: AuthRequest, res: Response) => { const user = await User.findById(req.user!.id); if (!user) throw createAppError("User not found", 404); res.json({ success: true, message: "Session retrieved", data: { user: userData(user) } }); });
export const refresh = asyncHandler(async (req: Request, res: Response) => { const token = req.cookies?.refreshToken ?? req.body.refreshToken; if (!token) throw createAppError("Refresh token is required", 401); let payload: { sub: string }; try { payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as { sub: string }; } catch { throw createAppError("Invalid or expired refresh token", 401); } const user = await User.findById(payload.sub); if (!user) throw createAppError("User not found", 401); const { accessToken } = issueTokens(user, res); res.json({ success: true, message: "Token refreshed", data: { accessToken } }); });
