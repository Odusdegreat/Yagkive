import { Router } from "express";
import {
  createCategory,
  createProduct,
  deleteCategory,
  deleteProduct,
  getProduct,
  listCategories,
  listProducts,
  updateCategory,
  updateProduct,
} from "../controllers/catalogue.controller.js";
import { authorize, protect } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  categorySchema,
  categoryUpdateSchema,
  productSchema,
  productUpdateSchema,
} from "../validators/schemas.js";
const router = Router();
router.get("/categories", listCategories);
router.post(
  "/categories",
  protect,
  authorize("admin"),
  validate(categorySchema),
  createCategory,
);
router.patch(
  "/categories/:id",
  protect,
  authorize("admin"),
  validate(categoryUpdateSchema),
  updateCategory,
);
router.delete("/categories/:id", protect, authorize("admin"), deleteCategory);
router.get(
  "/products",
  (req, res, next) => {
    if (req.query.includeUnpublished !== "true") return next();
    protect(req, res, (error) => {
      if (error) return next(error);
      authorize("admin")(req, res, next);
    });
  },
  listProducts,
);
router.get("/products/:id", getProduct);
router.post(
  "/products",
  protect,
  authorize("admin"),
  validate(productSchema),
  createProduct,
);
router.patch(
  "/products/:id",
  protect,
  authorize("admin"),
  validate(productUpdateSchema),
  updateProduct,
);
router.delete("/products/:id", protect, authorize("admin"), deleteProduct);
export default router;
