"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.togglePromoCode = exports.deletePromoCode = exports.updatePromoCode = exports.createPromoCode = exports.applyPromoCode = exports.getPromoCodeById = exports.getPromosDashboard = exports.getPromos = void 0;
const promo_model_1 = require("../models/promo.model");
const order_model_1 = require("../models/order.model");
/* -------------------------------------------------------------------------- */
/*                               GET PROMOS                                   */
/* -------------------------------------------------------------------------- */
/**
 * Get all active promo codes (for users)
 */
const getPromos = async (req, res) => {
    try {
        const promos = await promo_model_1.PromoCode.find({ active: true }).sort({ createdAt: -1 });
        return res.status(200).json(promos);
    }
    catch (error) {
        return res.status(500).json({
            message: "Failed to fetch promo codes"
        });
    }
};
exports.getPromos = getPromos;
/**
 * Get all promo codes (for admin dashboard)
 */
const getPromosDashboard = async (req, res) => {
    try {
        const promos = await promo_model_1.PromoCode.find().sort({ createdAt: -1 });
        return res.status(200).json(promos);
    }
    catch (error) {
        return res.status(500).json({
            message: "Failed to fetch promo codes",
            error
        });
    }
};
exports.getPromosDashboard = getPromosDashboard;
/**
 * Get promo code by ID
 */
const getPromoCodeById = async (req, res) => {
    try {
        const promo = await promo_model_1.PromoCode.findById(req.params.id);
        if (!promo) {
            return res.status(404).json({ message: "Promo code not found" });
        }
        return res.status(200).json(promo);
    }
    catch (error) {
        return res.status(500).json({
            message: "Failed to fetch promo code"
        });
    }
};
exports.getPromoCodeById = getPromoCodeById;
/* -------------------------------------------------------------------------- */
/*                             APPLY PROMO CODE                                */
/* -------------------------------------------------------------------------- */
const applyPromoCode = async (req, res) => {
    const { code, total, userId } = req.body;
    if (!code || typeof total !== "number" || !userId) {
        return res.status(400).json({
            error: "Promo code, userId and order total are required"
        });
    }
    try {
        const promo = await promo_model_1.PromoCode.findOne({
            code: code.toUpperCase(),
            active: true
        });
        if (!promo) {
            return res.status(400).json({ error: "Invalid or inactive promo code" });
        }
        /* ----------------------------- EXPIRY CHECK ---------------------------- */
        if (promo.expiryDate < new Date()) {
            promo.active = false;
            await promo.save();
            return res.status(400).json({ error: "Promo code has expired" });
        }
        /* -------------------------- MIN ORDER CHECK ----------------------------- */
        if (promo.minimumOrder && total < promo.minimumOrder) {
            return res.status(400).json({
                error: `Minimum order value of ₹${promo.minimumOrder} required`
            });
        }
        /* --------------------------- USAGE LIMIT -------------------------------- */
        if (promo.maxUses && promo.usedCount >= promo.maxUses) {
            return res.status(400).json({
                error: "Promo code usage limit reached"
            });
        }
        /* ------------------------ ONE TIME PER USER ----------------------------- */
        if (promo.oneTimeUsePerUser) {
            const alreadyUsed = await order_model_1.Order.findOne({
                user: userId,
                promoCode: promo.code
            });
            if (alreadyUsed) {
                return res.status(400).json({
                    error: "You have already used this promo code"
                });
            }
        }
        /* -------------------------- DISCOUNT LOGIC ------------------------------ */
        let discountAmount = 0;
        if (promo.promoMode === "PERCENT") {
            discountAmount = Math.floor((total * promo.value) / 100);
        }
        else {
            discountAmount = Math.min(promo.value, total);
        }
        return res.status(200).json({
            code: promo.code,
            promoCodeId: promo._id,
            discountAmount,
            finalAmount: total - discountAmount,
            message: `Promo applied successfully. You saved ₹${discountAmount}`
        });
    }
    catch (error) {
        return res.status(500).json({
            message: "Failed to apply promo code",
            error
        });
    }
};
exports.applyPromoCode = applyPromoCode;
/* -------------------------------------------------------------------------- */
/*                            CREATE PROMO CODE                                */
/* -------------------------------------------------------------------------- */
const createPromoCode = async (req, res) => {
    const { code, description, value, type, expiryDate, minimumOrder, maxUses, oneTimeUsePerUser } = req.body;
    if (!code || !value || !type || !expiryDate) {
        return res.status(400).json({
            error: "Code, value, type and expiry date are required"
        });
    }
    try {
        const existingPromo = await promo_model_1.PromoCode.findOne({
            code: code.toUpperCase()
        });
        if (existingPromo) {
            return res.status(400).json({
                error: "Promo code already exists"
            });
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
        await promo.save();
        return res.status(201).json(promo);
    }
    catch (error) {
        return res.status(500).json({
            message: "Failed to create promo code",
            error
        });
    }
};
exports.createPromoCode = createPromoCode;
/* -------------------------------------------------------------------------- */
/*                            UPDATE PROMO CODE                                */
/* -------------------------------------------------------------------------- */
const updatePromoCode = async (req, res) => {
    const { code, description, value, type, expiryDate, minimumOrder, maxUses, oneTimeUsePerUser } = req.body;
    if (!code || !value || !type || !expiryDate) {
        return res.status(400).json({
            error: "Code, value, type and expiry date are required"
        });
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
            oneTimeUsePerUser
        }, { new: true });
        if (!promo) {
            return res.status(404).json({
                error: "Promo code not found"
            });
        }
        return res.status(200).json(promo);
    }
    catch (error) {
        return res.status(500).json({
            message: "Failed to update promo code",
            error
        });
    }
};
exports.updatePromoCode = updatePromoCode;
/* -------------------------------------------------------------------------- */
/*                            DELETE PROMO CODE                                */
/* -------------------------------------------------------------------------- */
const deletePromoCode = async (req, res) => {
    try {
        const promo = await promo_model_1.PromoCode.findByIdAndDelete(req.params.id);
        if (!promo) {
            return res.status(404).json({
                message: "Promo code not found"
            });
        }
        return res.status(200).json({
            message: "Promo code deleted successfully"
        });
    }
    catch (error) {
        return res.status(500).json({
            message: "Failed to delete promo code",
            error
        });
    }
};
exports.deletePromoCode = deletePromoCode;
/* -------------------------------------------------------------------------- */
/*                         TOGGLE PROMO ACTIVE STATUS                          */
/* -------------------------------------------------------------------------- */
const togglePromoCode = async (req, res) => {
    try {
        const promo = await promo_model_1.PromoCode.findById(req.params.id);
        if (!promo) {
            return res.status(404).json({
                message: "Promo code not found"
            });
        }
        promo.active = !promo.active;
        await promo.save();
        return res.status(200).json({
            success: true,
            message: `Promo code ${promo.active ? "activated" : "deactivated"} successfully`
        });
    }
    catch (error) {
        return res.status(500).json({
            message: "Failed to toggle promo code",
            error
        });
    }
};
exports.togglePromoCode = togglePromoCode;
