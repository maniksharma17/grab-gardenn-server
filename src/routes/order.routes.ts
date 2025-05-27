import { Router } from 'express';
import { createOrder, getOrders, getOrder, getAllOrders } from '../controllers/order.controller';
import { auth } from '../middleware/auth.middleware';

export const orderRouter = Router();

orderRouter.post('/:id', auth, createOrder);
orderRouter.get('/:id', auth, getOrders);
orderRouter.get('/', getAllOrders);
orderRouter.get('/:userId/:id', auth, getOrder);