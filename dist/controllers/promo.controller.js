"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyPromoCode = exports.getPromoCodeById = exports.getPromos = void 0;
const promo_model_1 = require("../models/promo.model");
const order_model_1 = require("../models/order.model");
const getPromos = async (req, res) => {
    try {
        const promos = await promo_model_1.PromoCode.find({ active: true });
        res.status(200).json(promos);
    }
    catch (e) {
        res.status(500).json({ message: "Some server occured." });
    }
};
exports.getPromos = getPromos;
const getPromoCodeById = async (req, res) => {
    try {
        const promos = await promo_model_1.PromoCode.find({ active: true, _id: req.params.id });
        if (!promos)
            return res.status(404).json({ message: "Promo code not found." });
        res.status(200).json(promos);
    }
    catch (e) {
        res.status(500).json({ message: "Some server occured." });
    }
};
exports.getPromoCodeById = getPromoCodeById;
const applyPromoCode = async (req, res) => {
    const { code, total, userId } = req.body;
    if (!code || typeof total !== 'number' || !userId) {
        return res.status(400).json({ error: 'Code, user, and total required' });
    }
    const promo = await promo_model_1.PromoCode.findOne({ code: code.toUpperCase(), active: true });
    if (!promo)
        return res.status(400).json({ error: 'Invalid or inactive promo code' });
    if (promo.expiryDate < new Date()) {
        await promo_model_1.PromoCode.updateOne({ _id: promo._id }, { active: false });
        return res.status(400).json({ error: 'Promo code expired' });
    }
    if (promo.minimumOrder && total < promo.minimumOrder) {
        return res.status(400).json({ error: `Minimum order ₹${promo.minimumOrder} required` });
    }
    if (promo.maxUses && promo.usedCount >= promo.maxUses) {
        return res.status(400).json({ error: 'Promo code usage limit reached' });
    }
    if (promo.oneTimeUsePerUser) {
        const alreadyUsed = await order_model_1.Order.findOne({
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
exports.applyPromoCode = applyPromoCode;
