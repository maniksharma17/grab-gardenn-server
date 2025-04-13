import { Router } from 'express';
import { calculateDeliveryCharge, calculateDeliveryChargeWithoutCart, cancelShiprocketOrder, createCheckoutSession, createCodOrder, createDirectCheckoutSession, createDirectCodOrder, createShiprocketOrder, getExistingAWB, verifyDirectPayment, verifyPayment } from '../controllers/checkout.controller';
import { auth } from '../middleware/auth.middleware';

export const checkoutRouter = Router();

checkoutRouter.post('/create-checkout-session/:id', auth, createCheckoutSession);
checkoutRouter.post('/create-direct-checkout-session/:id', auth, createDirectCheckoutSession);
checkoutRouter.post('/verify-payment/:id', auth, verifyPayment);
checkoutRouter.post('/verify-direct-payment/:id', auth, verifyDirectPayment);
checkoutRouter.post('/delivery-rate', auth, calculateDeliveryCharge);
checkoutRouter.post('/direct-delivery-rate', calculateDeliveryChargeWithoutCart);
checkoutRouter.post('/place-shiprocket-prepaid-order', auth, createShiprocketOrder)
checkoutRouter.post('/place-shiprocket-cod-order/:id', auth, createCodOrder)
checkoutRouter.post('/place-direct-shiprocket-cod-order/:id', auth, createDirectCodOrder)
checkoutRouter.post('/cancel-order', auth, cancelShiprocketOrder);
checkoutRouter.get("/get-awb_id/:order_id", auth, getExistingAWB);

