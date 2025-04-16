import { Router } from 'express';
import { auth } from '../middleware/auth.middleware';
import { applyPromoCode, getPromos } from '../controllers/promo.controller';

export const promoRouter = Router();

promoRouter.use(auth);
promoRouter.post('/apply', applyPromoCode);
promoRouter.get('/', getPromos);
