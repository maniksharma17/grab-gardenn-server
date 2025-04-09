"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCartItemQuantity = exports.removeFromCart = exports.addToCart = exports.getCart = void 0;
const cart_model_1 = require("../models/cart.model");
const product_model_1 = require("../models/product.model");
const mongoose_1 = __importDefault(require("mongoose"));
const getCart = async (req, res) => {
    const cart = await cart_model_1.Cart.findOne({ user: req.params.id })
        .populate('items.product');
    res.json({ cart });
};
exports.getCart = getCart;
const addToCart = async (req, res) => {
    const { productId, quantity, dimensions, variant, price } = req.body;
    const product = await product_model_1.Product.findById(productId);
    if (!product) {
        return res.status(404).json({ message: 'Product not found' });
    }
    if (product.stock < quantity) {
        return res.status(400).json({ message: 'Insufficient stock' });
    }
    let cart = await cart_model_1.Cart.findOne({ user: req.params.id });
    if (!cart) {
        cart = await cart_model_1.Cart.create({
            user: req.params.id,
            items: [{ product: productId, quantity, price, dimensions, variant }],
        });
    }
    else {
        const itemIndex = cart.items.findIndex(item => {
            const isSameProduct = item.product.toString() === productId;
            const isSameVariant = JSON.stringify(item.variant) === JSON.stringify(variant);
            const isSameDimensions = JSON.stringify(item.dimensions) === JSON.stringify(dimensions);
            return isSameProduct && isSameVariant && isSameDimensions;
        });
        if (itemIndex > -1) {
            cart.items[itemIndex].quantity += quantity;
        }
        else {
            cart.items.push({ product: productId, quantity, price, dimensions, variant });
        }
        await cart.save();
    }
    cart = await cart.populate('items.product');
    res.json({ cart });
};
exports.addToCart = addToCart;
const removeFromCart = async (req, res) => {
    const itemId = req.params.itemId;
    const cart = await cart_model_1.Cart.findOne({ user: req.params.id }); // or req.params.userId if you're passing userId in URL
    if (!cart) {
        return res.status(404).json({ message: "Cart not found" });
    }
    const itemObjectId = new mongoose_1.default.Types.ObjectId(itemId);
    cart.items.pull({ _id: itemObjectId });
    await cart.save();
    res.json({ cart });
};
exports.removeFromCart = removeFromCart;
const updateCartItemQuantity = async (req, res) => {
    const { productId } = req.params;
    const { action } = req.body;
    const cart = await cart_model_1.Cart.findOne({ user: req.params.id });
    if (!cart) {
        return res.status(404).json({ message: 'Cart not found' });
    }
    const itemIndex = cart.items.findIndex(item => item._id.toString() === productId);
    if (itemIndex === -1) {
        res.status(404).json({ message: 'Item not found in cart' });
        return;
    }
    const item = cart.items[itemIndex];
    const product = await product_model_1.Product.findById(item.product._id);
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
    }
    else if (action === 'dec') {
        if (item.quantity > 1) {
            item.quantity -= 1;
        }
        else {
            // Optional: remove item when quantity hits 0
            cart.items.splice(itemIndex, 1);
        }
    }
    else {
        res.status(400).json({ message: 'Invalid action' });
        return;
    }
    await cart.save();
    const populatedCart = await cart.populate('items.product');
    res.json({ cart: populatedCart });
};
exports.updateCartItemQuantity = updateCartItemQuantity;
