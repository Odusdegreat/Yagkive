import mongoose from "mongoose";
import { env } from "./env.js";
import { logger } from "../utils/logger.js";

export async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(env.MONGODB_URI);
    const topology = await mongoose.connection.db!.admin().command({ hello: 1 });
    if (!topology.setName && topology.msg !== "isdbgrid") {
      throw new Error("Checkout requires MongoDB Atlas or a replica set for inventory transactions.");
    }
    logger.info("✅ MongoDB connected successfully");
  } catch (error) {
    logger.error({ err: error }, "MongoDB connection failed");
    process.exit(1);
  }

  mongoose.connection.on("error", (error) => {
    logger.error("MongoDB connection error:", error);
  });

  mongoose.connection.on("disconnected", () => {
    logger.warn("MongoDB disconnected");
  });
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await mongoose.disconnect();
    logger.info("MongoDB disconnected gracefully");
  } catch (error) {
    logger.error({ err: error }, "Error disconnecting from MongoDB");
  }
}
