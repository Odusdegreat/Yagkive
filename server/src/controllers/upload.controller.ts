import type { Request, Response } from "express";
import { cloudinary } from "../config/cloudinary.js";
import { env } from "../config/env.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createAppError } from "../middleware/error.middleware.js";

export const uploadImage = asyncHandler(async (req: Request, res: Response) => {
  if (!env.CLOUDINARY_CLOUD_NAME || !req.file)
    throw createAppError(
      "Image uploads are not configured or no image was supplied",
      503,
    );
  const result = await new Promise<{ secure_url: string; public_id: string }>(
    (resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "yagkive/products", resource_type: "image" },
        (error, upload) =>
          error || !upload
            ? reject(error ?? new Error("Upload failed"))
            : resolve(upload),
      );
      stream.end(req.file!.buffer);
    },
  );
  res
    .status(201)
    .json({
      success: true,
      message: "Image uploaded",
      data: { url: result.secure_url, publicId: result.public_id },
    });
});
