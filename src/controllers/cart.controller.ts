import { Request, Response } from "express";
import { Cart } from "../models/cart.model";
import { Product, ProductDocument } from "../models/product.model";
import mongoose from "mongoose";
import { isEqual } from "lodash";
import { v4 as uuid } from "uuid";

const getCartFilter = (req: Request) => {
  if (req.user) {
    return { user: req.user._id };
  }
  let guestId = req.cookies.guestId;
  if (!guestId) {
    guestId = uuid();
    req.res?.cookie("guestId", guestId, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });
  }
  return { guestId };
};

// 🔄 Keep cart prices in sync
const updateCartPrices = async (filter: any) => {
  try {
    const cart = await Cart.findOne(filter).populate("items.product");
    if (!cart) return;

    for (const item of cart.items) {
      const product = item.product as unknown as ProductDocument;
      if (!product || !product.price?.length || !product.variants?.length)
        continue;

      const matchedIndex = product.variants.findIndex((v) =>
        isEqual(v.value, item.variant?.value)
      );
      const priceIndex = matchedIndex >= 0 ? matchedIndex : 0;
      item.price = product.price[priceIndex] ?? product.price[0];
    }
    await cart.save();
  } catch (error) {
    console.error("Failed to update cart prices:", error);
  }
};

// 📥 Get cart
export const getCart = async (req: Request, res: Response) => {
  const filter = getCartFilter(req);
  await updateCartPrices(filter);
  const cart = await Cart.findOne(filter).populate("items.product");
  res.json({ cart });
};

// ➕ Add to cart
export const addToCart = async (req: Request, res: Response) => {
  const { productId, quantity, dimensions, variant, priceIndex } = req.body;
  const filter = getCartFilter(req);

  const product = await Product.findById(productId);
  if (!product) return res.status(404).json({ message: "Product not found" });

  if (product.stock < quantity)
    return res.status(400).json({ message: "Insufficient stock" });

  let cart = await Cart.findOne(filter);
  if (!cart) {
    cart = await Cart.create({
      ...filter,
      items: [
        {
          product: productId,
          quantity,
          price: product.price[priceIndex],
          dimensions,
          variant,
        },
      ],
    });
  } else {
    const itemIndex = cart.items.findIndex(
      (item) =>
        item.product.toString() === productId &&
        item.variant?.value === variant.value
    );

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += quantity;
    } else {
      cart.items.push({
        product: productId,
        quantity,
        price: product.price[priceIndex],
        dimensions,
        variant,
      });
    }
    await cart.save();
  }

  cart = await cart.populate("items.product");
  res.json({ cart });
};

// ❌ Remove from cart
export const removeFromCart = async (req: Request, res: Response) => {
  const filter = getCartFilter(req);
  const itemId = req.params.itemId;

  const cart = await Cart.findOne(filter);
  if (!cart) return res.status(404).json({ message: "Cart not found" });

  (cart.items as mongoose.Types.DocumentArray<any>).pull({ _id: itemId });
  await cart.save();

  res.json({ cart });
};

// 🔄 Update item qty
export const updateCartItemQuantity = async (req: Request, res: Response) => {
  const filter = getCartFilter(req);
  const { productId } = req.params;
  const { action } = req.body;

  const cart = await Cart.findOne(filter);
  if (!cart) return res.status(404).json({ message: "Cart not found" });

  const itemIndex = (cart.items as any).findIndex(
    (item: any) => item._id.toString() === productId
  );
  if (itemIndex === -1)
    return res.status(404).json({ message: "Item not found in cart" });

  const item = cart.items[itemIndex];
  const product = await Product.findById(item.product._id);
  if (!product) return res.status(404).json({ message: "Product not found" });

  if (action === "inc") {
    if (item.quantity >= product.stock) {
      return res.status(400).json({ message: "No more stock available" });
    }
    item.quantity += 1;
  } else if (action === "dec") {
    if (item.quantity > 1) {
      item.quantity -= 1;
    } else {
      cart.items.splice(itemIndex, 1); // remove item
    }
  } else {
    return res.status(400).json({ message: "Invalid action" });
  }

  await cart.save();
  const populatedCart = await cart.populate("items.product");
  res.json({ cart: populatedCart });
};
