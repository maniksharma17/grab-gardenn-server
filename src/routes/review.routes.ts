import express from 'express';
import {
  getReviewsForProduct,
  addReview,
  deleteReview,
} from '../controllers/review.controller'; 
import { auth } from '../middleware/auth.middleware';

const reviewRouter = express.Router();

// GET: All reviews for a product
reviewRouter.get('/:productId', getReviewsForProduct);

// POST: Add a review (expects userId in params)
reviewRouter.post('/:userId', auth, addReview);

// DELETE: Delete a review (needs both productId and userId)
reviewRouter.delete('/:productId/:userId', auth, deleteReview);

export default reviewRouter;
