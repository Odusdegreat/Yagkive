import { v2 as cloudinary } from "cloudinary";
import { env } from "./env.js";
import { logger } from "../utils/logger.js";

export function configureCloudinary(): void {
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    logger.warn("Cloudinary credentials not configured — uploads will be disabled");
    return;
  }

  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });

  logger.info("✅ Cloudinary configured successfully");
}

export { cloudinary };
