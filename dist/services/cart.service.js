"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartService = void 0;
const cart_model_1 = require("../models/cart.model");
class CartService {
    /**
     * Merge a guest cart into a user's cart.
     * Called after login/signup.
     */
    static async mergeGuestCart(req, userId) {
        const guestId = req.cookies.guestId;
        if (!guestId)
            return null;
        const guestCart = await cart_model_1.Cart.findOne({ guestId });
        if (!guestCart)
            return null;
        let userCart = await cart_model_1.Cart.findOne({ user: userId });
        if (!userCart) {
            userCart = await cart_model_1.Cart.create({ user: userId, items: [] });
        }
        for (const guestItem of guestCart.items) {
            const existing = userCart.items.find((i) => i.product.toString() === guestItem.product.toString() &&
                i.variant.value === guestItem.variant.value);
            if (existing) {
                existing.quantity += guestItem.quantity;
            }
            else {
                userCart.items.push(guestItem);
            }
        }
        await userCart.save();
        await cart_model_1.Cart.deleteOne({ guestId });
        req.res?.clearCookie("guestId");
        return userCart.populate("items.product");
    }
}
exports.CartService = CartService;
