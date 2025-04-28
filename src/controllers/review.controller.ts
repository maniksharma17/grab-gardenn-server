import { Request, Response } from 'express';
import Review from '../models/review.model';

export const getReviewsForProduct = async (req: Request, res: Response) => {
  const { productId } = req.params;

  try {
    const reviews = await Review.find({ product: productId })
      .populate('user') // Show name of user
      .sort({ createdAt: -1 });

    res.status(200).json(reviews);
  } catch (err) {
    res.status(500).json({ message: 'Failed to get reviews' });
  }
};

export const addReview = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { rating, comment, productId } = req.body;

  if (!rating)
    return res.status(400).json({ message: 'Rating is required' });

  try {
    const existing = await Review.findOne({ user: userId, product: productId });
    if (existing) {
      return res.status(400).json({ message: 'You already reviewed this product' });
    }

    const review = new Review({
      user: userId,
      product: productId,
      rating,
      comment,
    });

    await review.save();
    res.status(201).json({ message: 'Review added', review });
  } catch (err) {
    res.status(500).json({ message: 'Failed to add review' });
  }
};

// DELETE: Remove a user's review from a product
export const deleteReview = async (req: Request, res: Response) => {
  const { productId, userId } = req.params;

  if (!productId || !userId)
    return res.status(400).json({ message: 'Product ID and User ID are required' });
  try {
    const deleted = await Review.findOneAndDelete({
      user: userId,
      product: productId,
    });

    if (!deleted) return res.status(404).json({ message: 'Review not found' });

    res.status(200).json({ message: 'Review deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete review' });
  }
};
