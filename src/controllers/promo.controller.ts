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

export const getPromosDashboard = async (req: Request, res: Response) => {
  try{
    const promos = await PromoCode.find();
    res.status(200).json(promos);
  } catch (e) {
    res.status(500).json({ message: "Some server occured.", error: e });
  }
};

export const getPromoCodeById = async (req: Request, res: Response) => {
  try{
    const promos = await PromoCode.find({_id: req.params.id});
    if (!promos) return res.status(404).json({ message: "Promo code not found." });
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

export const createPromoCode = async (req: Request, res: Response) => {
  const { code, description, value, type, expiryDate, minimumOrder, maxUses, oneTimeUsePerUser } = req.body;

  if (!code || !value || !type || !expiryDate) {
    return res.status(400).json({ error: 'Code, value, type and expiry date are required' });
  }

  const existingPromo = await PromoCode.findOne({ code: code.toUpperCase() });
  if (existingPromo) {
    return res.status(400).json({ error: 'Promo code already exists' });
  }

  const promo = new PromoCode({
    code: code.toUpperCase(),
    description,
    value,
    type,
    expiryDate,
    minimumOrder,
    maxUses,
    oneTimeUsePerUser,
    active: true
  });

  try {
    await promo.save();
    res.status(201).json(promo);
  } catch (error) {
    res.status(500).json({ message: "Some server error occurred.", error });
  }
}
 
export const updatePromoCode = async (req: Request, res: Response) => {
  const { code, description, value, type, expiryDate, minimumOrder, maxUses, oneTimeUsePerUser } = req.body;

  if (!code || !value || !type || !expiryDate) {
    return res.status(400).json({ error: 'Code, value, type and expiry date are required' });
  }

  try {
    const promo = await PromoCode.findByIdAndUpdate(
      req.params.id,
      {
        code: code.toUpperCase(),
        description,
        value,
        type,
        expiryDate,
        minimumOrder,
        maxUses,
        oneTimeUsePerUser,
        active: true
      },
      { new: true }
    );

    if (!promo) {
      return res.status(404).json({ error: 'Promo code not found' });
    }

    res.status(200).json(promo);
  } catch (error) {
    res.status(500).json({ message: "Some server error occurred.", error });
  }
}

export const deletePromoCode = async (req: Request, res: Response) => {
  try {
    const promo = await PromoCode.findByIdAndDelete(req.params.id);
    if (!promo) {
      return res.status(404).json({ message: "Promo code not found." });
    }
    res.status(200).json({ message: "Promo code deleted successfully." });
  } catch (e) {
    res.status(500).json({ message: "Some server error occurred.", error: e });
  }
}

export const togglePromoCode = async (req: Request, res: Response) => {
  try {
    const promo = await PromoCode.findById(req.params.id);
    if (!promo) {
      return res.status(404).json({ message: "Promo code not found." });
    }
    promo.active = !promo.active;
    await promo.save();
    res.status(200).json({ message: `Promo code ${promo.active ? 'activated' : 'deactivated'} successfully.`, success: true });
  } catch (e) {
    res.status(500).json({ message: "Some server error occurred.", error: e });
  }
}