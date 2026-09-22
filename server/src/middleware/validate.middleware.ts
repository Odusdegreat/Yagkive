import type { NextFunction, Request, Response } from "express";
import type { ZodTypeAny } from "zod";
import { createAppError } from "./error.middleware.js";

export const validate = (schema: ZodTypeAny) => (req: Request, _res: Response, next: NextFunction): void => {
  const result = schema.safeParse({ body: req.body, params: req.params, query: req.query });
  if (!result.success) return next(createAppError(result.error.issues.map((issue) => issue.message).join(", "), 400));
  req.body = result.data.body;
  next();
};
