import { env } from "./config/env.js";
import { connectDatabase, disconnectDatabase } from "./config/database.js";
import { configureCloudinary } from "./config/cloudinary.js";
import { logger } from "./utils/logger.js";
import app from "./app.js";
import { Order } from "./models/Order.js";
import { releaseExpiredReservations } from "./services/order.service.js";

async function startServer(): Promise<void> {
  try {
    await connectDatabase();
    await Order.init();
    configureCloudinary();
    let sweeping = false;
    const reservationTimer = setInterval(async () => {
      if (sweeping) return;
      sweeping = true;
      try {
        await releaseExpiredReservations();
      } catch (error) {
        logger.error({ err: error }, "Reservation cleanup failed");
      } finally {
        sweeping = false;
      }
    }, 60000);
    reservationTimer.unref();

    const server = app.listen(env.PORT, () => {
      logger.info(
        `🚀 Server running on port ${env.PORT} in ${env.NODE_ENV} mode`,
      );
    });

    const shutdown = async (signal: string): Promise<void> => {
      clearInterval(reservationTimer);
      logger.info(`${signal} received. Shutting down gracefully...`);
      server.close(async () => {
        await disconnectDatabase();
        logger.info("Server shut down");
        process.exit(0);
      });

      setTimeout(() => {
        logger.error("Forced shutdown after timeout");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (error) {
    logger.error({ err: error }, "Failed to start server");
    process.exit(1);
  }
}

startServer();
