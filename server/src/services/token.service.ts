import jwt from "jsonwebtoken";
import type { Response } from "express";
import { env } from "../config/env.js";
import type { UserDocument } from "../models/User.js";

const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production" || env.COOKIE_SAMESITE === "none",
  sameSite: env.COOKIE_SAMESITE,
  maxAge: 15 * 60 * 1000,
};
export const issueTokens = (
  user: UserDocument,
  res: Response,
): { accessToken: string; refreshToken: string } => {
  const payload = {
    sub: user._id.toString(),
    role: user.role as "customer" | "admin",
  };
  const accessToken = jwt.sign(payload, env.JWT_SECRET, { expiresIn: "15m" });
  const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: "30d",
  });
  res
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
  return { accessToken, refreshToken };
};
export const clearTokens = (res: Response): void => {
  res.clearCookie("accessToken").clearCookie("refreshToken");
};
