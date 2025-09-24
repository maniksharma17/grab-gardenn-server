"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCartItemQuantity = exports.removeFromCart = exports.addToCart = exports.getCart = void 0;
const cart_model_1 = require("../models/cart.model");
const product_model_1 = require("../models/product.model");
const lodash_1 = require("lodash");
const uuid_1 = require("uuid");
const getCartFilter = (req) => {
    if (req.user) {
        return { user: req.user._id };
    }
    let guestId = req.cookies.guestId;
    if (!guestId) {
        guestId = (0, uuid_1.v4)();
        req.res?.cookie("guestId", guestId, {
            httpOnly: true,
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        });
    }
    return { guestId };
};
// 🔄 Keep cart prices in sync
const updateCartPrices = async (filter) => {
    try {
        const cart = await cart_model_1.Cart.findOne(filter).populate("items.product");
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
// 📥 Get cart
const getCart = async (req, res) => {
    const filter = getCartFilter(req);
    await updateCartPrices(filter);
    const cart = await cart_model_1.Cart.findOne(filter).populate("items.product");
    res.json({ cart });
};
exports.getCart = getCart;
// ➕ Add to cart
const addToCart = async (req, res) => {
    const { productId, quantity, dimensions, variant, priceIndex } = req.body;
    const filter = getCartFilter(req);
    const product = await product_model_1.Product.findById(productId);
    if (!product)
        return res.status(404).json({ message: "Product not found" });
    if (product.stock < quantity)
        return res.status(400).json({ message: "Insufficient stock" });
    let cart = await cart_model_1.Cart.findOne(filter);
    if (!cart) {
        cart = await cart_model_1.Cart.create({
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
    }
    else {
        const itemIndex = cart.items.findIndex((item) => item.product.toString() === productId &&
            item.variant?.value === variant.value);
        if (itemIndex > -1) {
            cart.items[itemIndex].quantity += quantity;
        }
        else {
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
exports.addToCart = addToCart;
// ❌ Remove from cart
const removeFromCart = async (req, res) => {
    const filter = getCartFilter(req);
    const itemId = req.params.itemId;
    const cart = await cart_model_1.Cart.findOne(filter);
    if (!cart)
        return res.status(404).json({ message: "Cart not found" });
    cart.items.pull({ _id: itemId });
    await cart.save();
    res.json({ cart });
};
exports.removeFromCart = removeFromCart;
// 🔄 Update item qty
const updateCartItemQuantity = async (req, res) => {
    const filter = getCartFilter(req);
    const { productId } = req.params;
    const { action } = req.body;
    const cart = await cart_model_1.Cart.findOne(filter);
    if (!cart)
        return res.status(404).json({ message: "Cart not found" });
    const itemIndex = cart.items.findIndex((item) => item._id.toString() === productId);
    if (itemIndex === -1)
        return res.status(404).json({ message: "Item not found in cart" });
    const item = cart.items[itemIndex];
    const product = await product_model_1.Product.findById(item.product._id);
    if (!product)
        return res.status(404).json({ message: "Product not found" });
    if (action === "inc") {
        if (item.quantity >= product.stock) {
            return res.status(400).json({ message: "No more stock available" });
        }
        item.quantity += 1;
    }
    else if (action === "dec") {
        if (item.quantity > 1) {
            item.quantity -= 1;
        }
        else {
            cart.items.splice(itemIndex, 1); // remove item
        }
    }
    else {
        return res.status(400).json({ message: "Invalid action" });
    }
    await cart.save();
    const populatedCart = await cart.populate("items.product");
    res.json({ cart: populatedCart });
};
exports.updateCartItemQuantity = updateCartItemQuantity;
