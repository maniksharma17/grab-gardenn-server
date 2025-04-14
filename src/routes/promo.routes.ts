import { Router } from 'express';
import { auth } from '../middleware/auth.middleware';
import { applyPromoCode } from '../controllers/promo.controller';

export const promoRouter = Router();

promoRouter.use(auth);
promoRouter.post('/apply-promo-code', applyPromoCode);
