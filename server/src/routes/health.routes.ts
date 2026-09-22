import { Router } from "express";
import type { Request, Response } from "express";

const router = Router();

router.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "E-commerce API is running",
  });
});

export default router;
