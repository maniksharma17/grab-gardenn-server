import { Request, Response } from 'express';
import { Cart } from '../models/cart.model';
import { Product, ProductDocument } from '../models/product.model';
import mongoose from 'mongoose';

export const getCart = async (req: Request, res: Response) => {
  updateCartPrices(req.params.id)
  const cart = await Cart.findOne({ user: req.params.id })
    .populate('items.product');
  res.json({ cart });
};

import { isEqual } from "lodash";

const updateCartPrices = async (userId: string) => {
  try {
    const cart = await Cart.findOne({ user: userId }).populate("items.product");

    if (!cart) return;

    for (const item of cart.items) {
      const product = item.product as unknown as  ProductDocument;

      if (!product || !product.price?.length || !product.variants?.length) continue;

      const matchedIndex = product.variants.findIndex(
        (v) => isEqual(v.value, item.variant?.value)
      );

      const priceIndex = matchedIndex >= 0 ? matchedIndex : 0;

      item.price = product.price[priceIndex] ?? product.price[0];
    }

    await cart.save();
  } catch (error) {
    console.error("Failed to update cart prices:", error);
  }
};


export const addToCart = async (req: Request, res: Response) => {
  const { productId, quantity, dimensions, variant, priceIndex } = req.body;

  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  if (product.stock < quantity) {
    return res.status(400).json({ message: 'Insufficient stock' });
  }

  let cart = await Cart.findOne({ user: req.params.id });
  if (!cart) {
    cart = await Cart.create({
      user: req.params.id,
      items: [{ product: productId, quantity, price: product.price[priceIndex], dimensions, variant }],
    });
  } else {
    const itemIndex = cart.items.findIndex(item => {
      const isSameProduct = item.product.toString() === productId;
      const isSameVariant = JSON.stringify(item.variant) === JSON.stringify(variant);
      const isSameDimensions = JSON.stringify(item.dimensions) === JSON.stringify(dimensions);
      return isSameProduct && isSameVariant && isSameDimensions;
    });
    

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += quantity;
    } else {
      cart.items.push({ product: productId, quantity, price: product.price[priceIndex], dimensions, variant });
    }
    await cart.save();
  }

  cart = await cart.populate('items.product');
  res.json({ cart });
};

export const removeFromCart = async (req: Request, res: Response) => {
  const itemId = req.params.itemId;

  const cart = await Cart.findOne({ user: req.params.id }); // or req.params.userId if you're passing userId in URL
  if (!cart) {
    return res.status(404).json({ message: "Cart not found" });
  }
  const itemObjectId = new mongoose.Types.ObjectId(itemId);
  cart.items.pull({ _id: itemObjectId });

  await cart.save();

  res.json({ cart });
};


export const updateCartItemQuantity = async (req: Request, res: Response) => {
  const { productId } = req.params;
  const { action } = req.body; 

  const cart = await Cart.findOne({ user: req.params.id });
  if (!cart) {
    return res.status(404).json({ message: 'Cart not found' });
  }

  const itemIndex = cart.items.findIndex(
    item => item._id.toString() === productId
    
  );

  if (itemIndex === -1) {
    res.status(404).json({ message: 'Item not found in cart' });
    return;
  }

  const item = cart.items[itemIndex];
  const product = await Product.findById(item.product._id);
  if (!product) {
    res.status(404).json({ message: 'Product not found' });
    return;
  }

  if (action === 'inc') {
    if (item.quantity >= product.stock) {
      res.status(400).json({ message: 'No more stock available' });
      return;
    }
    item.quantity += 1;
  } else if (action === 'dec') {
    if (item.quantity > 1) {
      item.quantity -= 1;
    } else {
      // Optional: remove item when quantity hits 0
      cart.items.splice(itemIndex, 1);
    }
  } else {
    res.status(400).json({ message: 'Invalid action' });
    return;
  }

  await cart.save();
  const populatedCart = await cart.populate('items.product');
  res.json({ cart: populatedCart });
};

