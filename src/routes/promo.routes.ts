import { Router } from 'express';
import { auth } from '../middleware/auth.middleware';
import { applyPromoCode, getPromoCodeById, getPromos } from '../controllers/promo.controller';

export const promoRouter = Router();

promoRouter.post('/apply', auth, applyPromoCode);
promoRouter.get('/', getPromos);
promoRouter.get('/:id', getPromoCodeById);
