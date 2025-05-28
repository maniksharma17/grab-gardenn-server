import { Request, Response } from 'express';
import { Order } from '../models/order.model';
import { Cart } from '../models/cart.model';
import { Product } from '../models/product.model';

export const createOrder = async (req: Request, res: Response) => {
  const cart = await Cart.findOne({ user: req.params.id })
    .populate('items.product');

  if (!cart || cart.items.length === 0) {
    return res.status(400).json({ message: 'Cart is empty' });
  }

  let total = 0;
  const orderItems = [];

  for (const item of cart.items) {
    const product = await Product.findById(item.product);
    if (!product) {
      return res.status(400).json({ 
        message: `Product ${item.product} not found` 
      });
    }

    if (product.stock < item.quantity) {
      return res.status(400).json({ 
        message: `Insufficient stock for ${product.name}` 
      });
    }

    product.stock -= item.quantity;
    await product.save();

    total += item.price * item.quantity;
    orderItems.push({
      product: item.product,
      quantity: item.quantity,
      price: item.price,
      variant: item.variant
    });
  }

  const order = await Order.create({
    user: req.params.id,
    items: orderItems,
    total,
    shippingAddress: req.body.shippingAddress,
  });

  await Cart.findByIdAndDelete(cart._id);

  res.status(201).json({ order });
};


export const getAllOrders = async (req: Request, res: Response) => {
  const orders = await Order.find()
    .populate('user', 'name email')
    .populate('items.product')
    .sort({ createdAt: -1 });
  res.json({ orders });
};

export const getOrders = async (req: Request, res: Response) => {
  const orders = await Order.find({ user: req.params.id })
    .populate('items.product')
    .sort({ createdAt: -1 });

  res.json({ orders });
};

export const getOrder = async (req: Request, res: Response) => {
  const order = await Order.findOne({
    _id: req.params.id,
    user: req.params.userId,
  }).populate('items.product');

  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  res.json({ order });
};

export const getOrderById = async (req: Request, res: Response) => {
  const order = await Order.findById(req.params.id)
    .populate('user')
    .populate('items.product');

  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  res.json({ order });
}

export const updateOrderStatus = async (req: Request, res: Response) => {
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ message: 'Status is required' });
  }

  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  ).populate('items.product');

  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  res.json({ order });
}