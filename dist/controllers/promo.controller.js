"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.togglePromoCode = exports.deletePromoCode = exports.updatePromoCode = exports.createPromoCode = exports.applyPromoCode = exports.getPromoCodeById = exports.getPromosDashboard = exports.getPromos = void 0;
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
const getPromosDashboard = async (req, res) => {
    try {
        const promos = await promo_model_1.PromoCode.find();
        res.status(200).json(promos);
    }
    catch (e) {
        res.status(500).json({ message: "Some server occured.", error: e });
    }
};
exports.getPromosDashboard = getPromosDashboard;
const getPromoCodeById = async (req, res) => {
    try {
        const promos = await promo_model_1.PromoCode.find({ _id: req.params.id });
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
const createPromoCode = async (req, res) => {
    const { code, description, value, type, expiryDate, minimumOrder, maxUses, oneTimeUsePerUser } = req.body;
    if (!code || !value || !type || !expiryDate) {
        return res.status(400).json({ error: 'Code, value, type and expiry date are required' });
    }
    const existingPromo = await promo_model_1.PromoCode.findOne({ code: code.toUpperCase() });
    if (existingPromo) {
        return res.status(400).json({ error: 'Promo code already exists' });
    }
    const promo = new promo_model_1.PromoCode({
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
    }
    catch (error) {
        res.status(500).json({ message: "Some server error occurred.", error });
    }
};
exports.createPromoCode = createPromoCode;
const updatePromoCode = async (req, res) => {
    const { code, description, value, type, expiryDate, minimumOrder, maxUses, oneTimeUsePerUser } = req.body;
    if (!code || !value || !type || !expiryDate) {
        return res.status(400).json({ error: 'Code, value, type and expiry date are required' });
    }
    try {
        const promo = await promo_model_1.PromoCode.findByIdAndUpdate(req.params.id, {
            code: code.toUpperCase(),
            description,
            value,
            type,
            expiryDate,
            minimumOrder,
            maxUses,
            oneTimeUsePerUser,
            active: true
        }, { new: true });
        if (!promo) {
            return res.status(404).json({ error: 'Promo code not found' });
        }
        res.status(200).json(promo);
    }
    catch (error) {
        res.status(500).json({ message: "Some server error occurred.", error });
    }
};
exports.updatePromoCode = updatePromoCode;
const deletePromoCode = async (req, res) => {
    try {
        const promo = await promo_model_1.PromoCode.findByIdAndDelete(req.params.id);
        if (!promo) {
            return res.status(404).json({ message: "Promo code not found." });
        }
        res.status(200).json({ message: "Promo code deleted successfully." });
    }
    catch (e) {
        res.status(500).json({ message: "Some server error occurred.", error: e });
    }
};
exports.deletePromoCode = deletePromoCode;
const togglePromoCode = async (req, res) => {
    try {
        const promo = await promo_model_1.PromoCode.findById(req.params.id);
        if (!promo) {
            return res.status(404).json({ message: "Promo code not found." });
        }
        promo.active = !promo.active;
        await promo.save();
        res.status(200).json({ message: `Promo code ${promo.active ? 'activated' : 'deactivated'} successfully.`, success: true });
    }
    catch (e) {
        res.status(500).json({ message: "Some server error occurred.", error: e });
    }
};
exports.togglePromoCode = togglePromoCode;
