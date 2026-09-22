import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { createAppError } from "./error.middleware.js";

export interface AuthRequest extends Request { user?: { id: string; role: "customer" | "admin" } }
interface TokenPayload { sub: string; role: "customer" | "admin" }

export function protect(req: AuthRequest, _res: Response, next: NextFunction): void {
  const token = req.cookies?.accessToken ?? req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token) return next(createAppError("Authentication is required", 401));
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch { next(createAppError("Invalid or expired access token", 401)); }
}

export function authorize(...roles: Array<"customer" | "admin">) {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) return next(createAppError("You are not authorized to perform this action", 403));
    next();
  };
}
