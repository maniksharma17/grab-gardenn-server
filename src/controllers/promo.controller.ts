import { Request, Response } from "express";
import { PromoCode } from "../models/promo.model";
import { Order } from "../models/order.model";

export const getPromos = async (req: Request, res: Response) => {
  try{
    const promos = await PromoCode.find({active: true});
    res.status(200).json(promos);
  } catch (e) {
    res.status(500).json({ message: "Some server occured." });
  }
};

export const applyPromoCode = async (req: Request, res: Response) => {
  const { code, total, userId } = req.body;

  if (!code || typeof total !== 'number' || !userId) {
    return res.status(400).json({ error: 'Code, user, and total required' });
  }

  const promo = await PromoCode.findOne({ code: code.toUpperCase(), active: true });

  if (!promo) return res.status(400).json({ error: 'Invalid or inactive promo code' });
  if (promo.expiryDate < new Date()) {
    await PromoCode.updateOne({ _id: promo._id }, { active: false });  
    return res.status(400).json({ error: 'Promo code expired' });
  }  if (promo.minimumOrder && total < promo.minimumOrder) {
    return res.status(400).json({ error: `Minimum order ₹${promo.minimumOrder} required` });
  }
  if (promo.maxUses && promo.usedCount >= promo.maxUses) {
    return res.status(400).json({ error: 'Promo code usage limit reached' });
  }


  if(promo.oneTimeUsePerUser){
    const alreadyUsed = await Order.findOne({
      user: userId,
      promoCode: promo.code
    });
  
    if (alreadyUsed) {
      return res.status(400).json({ error: 'You have already used this promo code' });
    }
  }

  const discountAmount = promo.type === 'percent'
    ? Math.floor(total * (promo.value / 100))
    : Math.min(promo.value, total);

  return res.json({
    discountAmount,
    message: `Promo applied! You saved ₹${discountAmount}`,
    code: promo.code,
    promoCodeId: promo._id
  });
};


