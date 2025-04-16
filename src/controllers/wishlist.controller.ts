import Wishlist from "../models/wishlist.model";
import { Product } from "../models/product.model";
import { Request, Response } from "express";

// GET /wishlist - Get user's wishlist
export const getWishlist = async (req: Request, res: Response) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.params.id }).populate('items.product');

    if (!wishlist) return res.json({ items: [] });

    res.json(wishlist);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// POST /wishlist - Add item to wishlist
export const addToWishlist = async (req: Request, res: Response) => {
  const { productId } = req.body;

  try {
    let wishlist = await Wishlist.findOne({ user: req.params.id });

    if (!wishlist) {
      wishlist = new Wishlist({
        user: req.params.id,
        items: [{ product: productId }],
      });
    } else {
      const alreadyExists = wishlist.items.find(
        item => item.toString() === productId
      );

      if (alreadyExists) {
        return res.status(400).json({ error: true, message: 'Item already in wishlist' });
      }

      wishlist.items.push(productId);
    }

    await wishlist.save();
    res.status(201).json(wishlist);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// DELETE /wishlist/:productId?variant=500g - Remove item from wishlist
export const removeFromWishlist = async (req: Request, res: Response) => {
  const { productId } = req.body;

  try {
    const wishlist = await Wishlist.findOne({ user: req.params.id });
    if (!wishlist) return res.status(404).json({ message: 'Wishlist not found' });

    wishlist.items = wishlist.items.filter(
      item => item.toString() !== productId 
    );

    await wishlist.save();
    res.json({ message: 'Item removed', wishlist });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
