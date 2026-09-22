import pino from "pino";
import { env } from "../config/env.js";

export const logger = pino({
  level:
    env.NODE_ENV === "test"
      ? "silent"
      : env.NODE_ENV === "production"
        ? "info"
        : "debug",
  redact: [
    "req.headers.authorization",
    "req.headers.cookie",
    'res.headers["set-cookie"]',
  ],
  transport:
    env.NODE_ENV === "development"
      ? { target: "pino/file", options: { destination: 1 } }
      : undefined,
});
