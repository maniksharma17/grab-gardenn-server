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
    updateCartPrices(req.params.id);
    const cart = await cart_model_1.Cart.findOne({ user: req.params.id })
        .populate('items.product');
    res.json({ cart });
};
exports.getCart = getCart;
const lodash_1 = require("lodash");
const updateCartPrices = async (userId) => {
    try {
        const cart = await cart_model_1.Cart.findOne({ user: userId }).populate("items.product");
        if (!cart)
            return;
        for (const item of cart.items) {
            const product = item.product;
            if (!product || !product.price?.length || !product.variants?.length)
                continue;
            const matchedIndex = product.variants.findIndex((v) => (0, lodash_1.isEqual)(v.value, item.variant?.value));
            const priceIndex = matchedIndex >= 0 ? matchedIndex : 0;
            item.price = product.price[priceIndex] ?? product.price[0];
        }
        await cart.save();
    }
    catch (error) {
        console.error("Failed to update cart prices:", error);
    }
};
const addToCart = async (req, res) => {
    const { productId, quantity, dimensions, variant, priceIndex } = req.body;
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
            items: [{ product: productId, quantity, price: product.price[priceIndex], dimensions, variant }],
        });
    }
    else {
        const itemIndex = cart.items.findIndex(item => {
            const isSameProduct = item.product.toString() === productId;
            const isSameVariant = (item.variant?.value) === (variant.value);
            return isSameProduct && isSameVariant;
        });
        if (itemIndex > -1) {
            cart.items[itemIndex].quantity += quantity;
        }
        else {
            cart.items.push({ product: productId, quantity, price: product.price[priceIndex], dimensions, variant });
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
