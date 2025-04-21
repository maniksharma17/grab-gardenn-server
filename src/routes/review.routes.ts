import express from 'express';
import {
  getReviewsForProduct,
  addReview,
  deleteReview,
} from '../controllers/review.controller'; 

const reviewRouter = express.Router();

// GET: All reviews for a product
reviewRouter.get('/:productId', getReviewsForProduct);

// POST: Add a review (expects userId in params)
reviewRouter.post('/:userId', addReview);

// DELETE: Delete a review (needs both productId and userId)
reviewRouter.delete('/:productId/:userId', deleteReview);

export default reviewRouter;
