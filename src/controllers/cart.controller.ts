import { Request, Response } from 'express';
import { Cart } from '../models/cart.model';
import { Product } from '../models/product.model';

export const getCart = async (req: Request, res: Response) => {
  const cart = await Cart.findOne({ user: req.params.id })
    .populate('items.product');
  res.json({ cart });
};

export const addToCart = async (req: Request, res: Response) => {
  const { productId, quantity, dimensions, variant, price } = req.body;

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
      items: [{ product: productId, quantity, price, dimensions, variant }],
    });
  } else {
    const itemIndex = cart.items.findIndex(
      item => item.product.toString() === productId
    );

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity = quantity;
    } else {
      cart.items.push({ product: productId, quantity, price, dimensions, variant });
    }
    await cart.save();
  }

  cart = await cart.populate('items.product');
  res.json({ cart });
};

export const removeFromCart = async (req: Request, res: Response) => {
  const { productId } = req.params;

  const cart = await Cart.findOne({ user: req.params.id });
  if (!cart) {
    return res.status(404).json({ message: 'Cart not found' });
  }

  cart.items.pull({ product: productId });

  await cart.save();

  res.json({ cart });
};
