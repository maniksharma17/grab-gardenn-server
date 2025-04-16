import express from 'express';
import { getWishlist, addToWishlist, removeFromWishlist, clearWishlist } from '../controllers/wishlist.controller';
import { auth } from '../middleware/auth.middleware';

const wishlistRouter = express.Router();

wishlistRouter.use(auth);
wishlistRouter.get('/:id', getWishlist);
wishlistRouter.post('/add/:id', addToWishlist);
wishlistRouter.post('/remove/:id', removeFromWishlist);
wishlistRouter.delete('/:id', clearWishlist);


export default wishlistRouter;
