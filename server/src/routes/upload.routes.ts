import { Router } from "express";
import multer from "multer";
import { uploadImage } from "../controllers/upload.controller.js";
import { authorize, protect } from "../middleware/auth.middleware.js";
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) =>
    callback(null, file.mimetype.startsWith("image/")),
});
const router = Router();
router.post(
  "/uploads/images",
  protect,
  authorize("admin"),
  upload.single("image"),
  uploadImage,
);
export default router;
