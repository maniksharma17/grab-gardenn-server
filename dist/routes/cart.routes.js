"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cartRouter = void 0;
const express_1 = require("express");
const cart_controller_1 = require("../controllers/cart.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
exports.cartRouter = (0, express_1.Router)();
// ✅ Works for both guests and logged-in users
exports.cartRouter.get("/", auth_middleware_1.optionalAuth, cart_controller_1.getCart);
exports.cartRouter.post("/add", auth_middleware_1.optionalAuth, cart_controller_1.addToCart);
exports.cartRouter.delete("/:itemId", auth_middleware_1.optionalAuth, cart_controller_1.removeFromCart);
exports.cartRouter.put("/:productId", auth_middleware_1.optionalAuth, cart_controller_1.updateCartItemQuantity);
// Only admins/users explicitly
exports.cartRouter.get("/user/:id", auth_middleware_1.auth, cart_controller_1.getCart);
