import type { Request, Response, NextFunction } from "express";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export function createAppError(message: string, statusCode: number): AppError {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const statusCode = err.statusCode ?? 500;
  const message = err.isOperational ? err.message : "Something went wrong";

  const logDetails = { statusCode, method: _req.method, path: _req.originalUrl, message: err.message };
  if (statusCode >= 500) {
    logger.error({ err, ...logDetails }, "Request failed");
  } else {
    logger.warn(logDetails, "Request rejected");
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(env.NODE_ENV === "development" && !err.isOperational && { stack: err.stack }),
  });
}
