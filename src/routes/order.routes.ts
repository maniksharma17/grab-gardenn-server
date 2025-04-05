import { Router } from 'express';
import { createOrder, getOrders, getOrder } from '../controllers/order.controller';
import { auth } from '../middleware/auth.middleware';

export const orderRouter = Router();

orderRouter.use(auth);
orderRouter.post('/:id', createOrder);
orderRouter.get('/:id', getOrders);
orderRouter.get('/:userId/:id', getOrder);