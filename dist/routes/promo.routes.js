"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.promoRouter = void 0;
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const promo_controller_1 = require("../controllers/promo.controller");
exports.promoRouter = (0, express_1.Router)();
exports.promoRouter.post("/apply", auth_middleware_1.auth, promo_controller_1.applyPromoCode);
exports.promoRouter.get("/", auth_middleware_1.auth, promo_controller_1.getPromos);
// admin routes
exports.promoRouter.get("/dashboard/get", promo_controller_1.getPromosDashboard);
exports.promoRouter.get("/:id", promo_controller_1.getPromoCodeById);
exports.promoRouter.post("/", promo_controller_1.createPromoCode);
exports.promoRouter.put("/:id", promo_controller_1.updatePromoCode);
exports.promoRouter.put("/status/:id", promo_controller_1.togglePromoCode);
exports.promoRouter.delete("/:id", promo_controller_1.deletePromoCode);
