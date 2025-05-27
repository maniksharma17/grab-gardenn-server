"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteReview = exports.addReview = exports.getReviewsForProduct = void 0;
const review_model_1 = __importDefault(require("../models/review.model"));
const getReviewsForProduct = async (req, res) => {
    const { productId } = req.params;
    try {
        const reviews = await review_model_1.default.find({ product: productId })
            .populate('user') // Show name of user
            .sort({ createdAt: -1 });
        res.status(200).json(reviews);
    }
    catch (err) {
        res.status(500).json({ message: 'Failed to get reviews' });
    }
};
exports.getReviewsForProduct = getReviewsForProduct;
const addReview = async (req, res) => {
    const { userId } = req.params;
    const { rating, comment, productId } = req.body;
    if (!rating)
        return res.status(400).json({ message: 'Rating is required' });
    try {
        const existing = await review_model_1.default.findOne({ user: userId, product: productId });
        if (existing) {
            return res.status(400).json({ message: 'You already reviewed this product' });
        }
        const review = new review_model_1.default({
            user: userId,
            product: productId,
            rating,
            comment,
        });
        await review.save();
        res.status(201).json({ message: 'Review added', review });
    }
    catch (err) {
        res.status(500).json({ message: 'Failed to add review' });
    }
};
exports.addReview = addReview;
// DELETE: Remove a user's review from a product
const deleteReview = async (req, res) => {
    const { productId, userId } = req.params;
    if (!productId || !userId)
        return res.status(400).json({ message: 'Product ID and User ID are required' });
    try {
        const deleted = await review_model_1.default.findOneAndDelete({
            user: userId,
            product: productId,
        });
        if (!deleted)
            return res.status(404).json({ message: 'Review not found' });
        res.status(200).json({ message: 'Review deleted' });
    }
    catch (err) {
        res.status(500).json({ message: 'Failed to delete review' });
    }
};
exports.deleteReview = deleteReview;
