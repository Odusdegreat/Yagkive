import { Router } from "express";
import {
  formatPhone,
  getCountry,
  listCountries,
} from "../controllers/location.controller.js";
const router = Router();
router.get("/countries", listCountries);
router.get("/countries/:code", getCountry);
router.post("/phones/format", formatPhone);
export default router;
