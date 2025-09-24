import { Cart } from "../models/cart.model";
import { Types } from "mongoose";
import { Request } from "express";

export class CartService {
  /**
   * Merge a guest cart into a user's cart.
   * Called after login/signup.
   */
  static async mergeGuestCart(req: Request, userId: Types.ObjectId) {
    const guestId = req.cookies.guestId;
    if (!guestId) return null;

    const guestCart = await Cart.findOne({ guestId });
    if (!guestCart) return null;

    let userCart = await Cart.findOne({ user: userId });
    if (!userCart) {
      userCart = await Cart.create({ user: userId, items: [] });
    }

    for (const guestItem of guestCart.items) {
      const existing = userCart.items.find(
        (i) =>
          i.product.toString() === guestItem.product.toString() &&
          i.variant.value === guestItem.variant.value
      );

      if (existing) {
        existing.quantity += guestItem.quantity;
      } else {
        userCart.items.push(guestItem);
      }
    }

    await userCart.save();
    await Cart.deleteOne({ guestId });
    req.res?.clearCookie("guestId");

    return userCart.populate("items.product");
  }
}
