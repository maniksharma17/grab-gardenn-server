import { Router } from 'express';
import { createCheckoutSession, verifyPayment } from '../controllers/checkout.controller';
import { auth } from '../middleware/auth.middleware';

export const checkoutRouter = Router();

checkoutRouter.use(auth);
checkoutRouter.post('/create-checkout-session', createCheckoutSession);
checkoutRouter.post('/verify-payment', verifyPayment);