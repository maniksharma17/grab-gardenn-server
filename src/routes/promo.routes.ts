import { Router } from "express";
import { auth } from "../middleware/auth.middleware";
import {
  applyPromoCode,
  createPromoCode,
  deletePromoCode,
  getPromoCodeById,
  getPromos,
  getPromosDashboard,
  togglePromoCode,
  updatePromoCode,
} from "../controllers/promo.controller";

export const promoRouter = Router();

promoRouter.post("/apply", auth, applyPromoCode);
promoRouter.get("/", auth, getPromos);

// admin routes
promoRouter.get("/dashboard/get", getPromosDashboard);
promoRouter.get("/:id", getPromoCodeById);
promoRouter.post("/", createPromoCode);
promoRouter.put("/:id", updatePromoCode);
promoRouter.put("/status/:id", togglePromoCode);
promoRouter.delete("/:id", deletePromoCode);
