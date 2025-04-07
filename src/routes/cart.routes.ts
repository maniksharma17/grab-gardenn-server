import { Router } from 'express';
import { getCart, addToCart, removeFromCart, updateCartItemQuantity } from '../controllers/cart.controller';
import { auth } from '../middleware/auth.middleware';

export const cartRouter = Router();

cartRouter.use(auth);
cartRouter.get('/:id', getCart);
cartRouter.post('/add/:id', addToCart);
cartRouter.delete('/:id/:itemId', removeFromCart);
cartRouter.put('/:id/:productId', updateCartItemQuantity);