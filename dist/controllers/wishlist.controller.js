"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearWishlist = exports.removeFromWishlist = exports.addToWishlist = exports.getWishlist = void 0;
const wishlist_model_1 = __importDefault(require("../models/wishlist.model"));
const mongoose_1 = __importDefault(require("mongoose"));
// GET /wishlist - Get user's wishlist
const getWishlist = async (req, res) => {
    try {
        const wishlist = await wishlist_model_1.default.findOne({ user: req.params.id }).populate('items.product');
        if (!wishlist)
            return res.json({ wishlist: [] });
        res.json({ wishlist });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
exports.getWishlist = getWishlist;
// POST /wishlist - Add item to wishlist
const addToWishlist = async (req, res) => {
    const { productId } = req.body;
    try {
        let wishlist = await wishlist_model_1.default.findOne({ user: req.params.id });
        if (!wishlist) {
            const id = new mongoose_1.default.Types.ObjectId(`${productId}`);
            wishlist = new wishlist_model_1.default({
                user: req.params.id,
                items: [id],
            });
        }
        else {
            const alreadyExists = wishlist.items.find(item => item.toString() === productId);
            if (alreadyExists) {
                return res.status(400).json({ error: true, message: 'Item already in wishlist' });
            }
            const id = new mongoose_1.default.Types.ObjectId(`${productId}`);
            wishlist.items.push(id);
        }
        await wishlist.save();
        res.status(201).json(wishlist);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
exports.addToWishlist = addToWishlist;
// DELETE /wishlist/:productId?variant=500g - Remove item from wishlist
const removeFromWishlist = async (req, res) => {
    const { productId } = req.body;
    try {
        const wishlist = await wishlist_model_1.default.findOne({ user: req.params.id });
        if (!wishlist)
            return res.status(404).json({ message: 'Wishlist not found' });
        wishlist.items = wishlist.items.filter(item => item.toString() !== productId);
        await wishlist.save();
        res.json({ message: 'Item removed', wishlist });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
exports.removeFromWishlist = removeFromWishlist;
const clearWishlist = async (req, res) => {
    try {
        const wishlist = await wishlist_model_1.default.findOne({ user: req.params.id });
        if (!wishlist)
            return res.status(404).json({ message: 'Wishlist not found' });
        await wishlist_model_1.default.findByIdAndDelete(wishlist._id);
        res.json({ message: 'Wishlist cleared', wishlist });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
exports.clearWishlist = clearWishlist;
