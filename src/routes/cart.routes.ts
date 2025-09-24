import { Router } from "express";
import {
  getCart,
  addToCart,
  removeFromCart,
  updateCartItemQuantity,
} from "../controllers/cart.controller";
import { optionalAuth, auth } from "../middleware/auth.middleware";

export const cartRouter = Router();

// ✅ Works for both guests and logged-in users
cartRouter.get("/", optionalAuth, getCart);
cartRouter.post("/add", optionalAuth, addToCart);
cartRouter.delete("/:itemId", optionalAuth, removeFromCart);
cartRouter.put("/:productId", optionalAuth, updateCartItemQuantity);

// Only admins/users explicitly
cartRouter.get("/user/:id", auth, getCart);
