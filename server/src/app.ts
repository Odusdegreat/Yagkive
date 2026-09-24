import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { notFoundHandler } from "./middleware/notFound.middleware.js";
import healthRoutes from "./routes/health.routes.js";
import authRoutes from "./routes/auth.routes.js";
import catalogueRoutes from "./routes/catalogue.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import orderRoutes from "./routes/order.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import webhookRoutes from "./routes/webhook.routes.js";
import locationRoutes from "./routes/location.routes.js";

const app = express();
app.set("trust proxy", 1);

const allowedOrigins = new Set(
  env.CORS_ORIGINS.length > 0 ? env.CORS_ORIGINS : [env.CLIENT_URL],
);

app.use(helmet());

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
  }),
);

app.use(
  "/api/auth",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: "Too many requests, please try again later",
    },
  }),
);

app.use("/api/webhooks/paystack", express.raw({ type: "application/json" }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(pinoHttp({ logger }));

app.use(healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api", catalogueRoutes);
app.use("/api", cartRoutes);
app.use("/api", orderRoutes);
app.use("/api", uploadRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/api/locations", locationRoutes);

app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Yagkive E-commerce API",
    version: "1.0.0",
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
