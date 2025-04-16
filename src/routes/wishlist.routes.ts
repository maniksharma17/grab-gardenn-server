import express from 'express';
import { getWishlist, addToWishlist, removeFromWishlist } from '../controllers/wishlist.controller';
import { auth } from '../middleware/auth.middleware';

const wishlistRouter = express.Router();

wishlistRouter.use(auth);
wishlistRouter.get('/:id', getWishlist);
wishlistRouter.post('/:id', addToWishlist);
wishlistRouter.delete('/:id', removeFromWishlist);

export default wishlistRouter;
