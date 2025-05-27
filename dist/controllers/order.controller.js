"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrder = exports.getOrders = exports.getAllOrders = exports.createOrder = void 0;
const order_model_1 = require("../models/order.model");
const cart_model_1 = require("../models/cart.model");
const product_model_1 = require("../models/product.model");
const createOrder = async (req, res) => {
    const cart = await cart_model_1.Cart.findOne({ user: req.params.id })
        .populate('items.product');
    if (!cart || cart.items.length === 0) {
        return res.status(400).json({ message: 'Cart is empty' });
    }
    let total = 0;
    const orderItems = [];
    for (const item of cart.items) {
        const product = await product_model_1.Product.findById(item.product);
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
    const order = await order_model_1.Order.create({
        user: req.params.id,
        items: orderItems,
        total,
        shippingAddress: req.body.shippingAddress,
    });
    await cart_model_1.Cart.findByIdAndDelete(cart._id);
    res.status(201).json({ order });
};
exports.createOrder = createOrder;
const getAllOrders = async (req, res) => {
    const orders = await order_model_1.Order.find()
        .populate('user', 'name email')
        .populate('items.product')
        .sort({ createdAt: -1 });
    res.json({ orders });
};
exports.getAllOrders = getAllOrders;
const getOrders = async (req, res) => {
    const orders = await order_model_1.Order.find({ user: req.params.id })
        .populate('items.product')
        .sort({ createdAt: -1 });
    res.json({ orders });
};
exports.getOrders = getOrders;
const getOrder = async (req, res) => {
    const order = await order_model_1.Order.findOne({
        _id: req.params.id,
        user: req.params.userId,
    }).populate('items.product');
    if (!order) {
        return res.status(404).json({ message: 'Order not found' });
    }
    res.json({ order });
};
exports.getOrder = getOrder;
