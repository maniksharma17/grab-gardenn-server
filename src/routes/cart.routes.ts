import { Router } from 'express';
import { getCart, addToCart, removeFromCart } from '../controllers/cart.controller';
import { auth } from '../middleware/auth.middleware';

export const cartRouter = Router();

cartRouter.use(auth);
cartRouter.get('/:id', getCart);
cartRouter.post('/add/:id', addToCart);
cartRouter.delete('/:id/:productId', removeFromCart);