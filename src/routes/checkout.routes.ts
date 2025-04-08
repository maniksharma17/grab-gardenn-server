import { Router } from 'express';
import { calculateDeliveryCharge, createCheckoutSession, createCodOrder, createShiprocketOrder, verifyPayment } from '../controllers/checkout.controller';
import { auth } from '../middleware/auth.middleware';

export const checkoutRouter = Router();

checkoutRouter.use(auth);
checkoutRouter.post('/create-checkout-session/:id', createCheckoutSession);
checkoutRouter.post('/verify-payment/:id', verifyPayment);
checkoutRouter.post('/delivery-rate', calculateDeliveryCharge);
checkoutRouter.post('/place-shiprocket-prepaid-order', createShiprocketOrder)
checkoutRouter.post('/place-shiprocket-cod-order/:id', createCodOrder)