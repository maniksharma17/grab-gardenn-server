"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.togglePromoCode = exports.deletePromoCode = exports.updatePromoCode = exports.createPromoCode = exports.applyPromoCode = exports.getPromoCodeById = exports.getPromosDashboard = exports.getPromos = void 0;
const promo_model_1 = require("../models/promo.model");
const order_model_1 = require("../models/order.model");
const cart_model_1 = require("../models/cart.model");
/* -------------------------------------------------------------------------- */
/*                               GET PROMOS                                   */
/* -------------------------------------------------------------------------- */
/**
 * Get all active promo codes (for users)
 */
const getPromos = async (req, res) => {
    try {
        const promos = await promo_model_1.PromoCode.find({ active: true }).sort({
            createdAt: -1,
        });
        return res.status(200).json(promos);
    }
    catch (error) {
        return res.status(500).json({
            message: "Failed to fetch promo codes",
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
            error,
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
            message: "Failed to fetch promo code",
        });
    }
};
exports.getPromoCodeById = getPromoCodeById;
/* -------------------------------------------------------------------------- */
/*                             APPLY PROMO CODE                                */
/* -------------------------------------------------------------------------- */
const applyPromoCode = async (req, res) => {
    const { code, userId } = req.body;
    if (!code || !userId) {
        return res.status(400).json({
            error: "Promo code and userId are required",
        });
    }
    try {
        const promo = await promo_model_1.PromoCode.findOne({
            code: code.toUpperCase(),
            active: true,
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
        /* ----------------------------- FETCH CART ----------------------------- */
        const cart = await cart_model_1.Cart.findOne({ user: userId }).populate("items.product");
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ error: "Cart is empty" });
        }
        const total = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        /* -------------------------- MIN ORDER CHECK ----------------------------- */
        if (promo.minimumOrder && total < promo.minimumOrder) {
            return res.status(400).json({
                error: `Minimum order value of ₹${promo.minimumOrder} required`,
            });
        }
        /* --------------------------- USAGE LIMIT -------------------------------- */
        if (promo.maxUses && promo.usedCount >= promo.maxUses) {
            return res.status(400).json({
                error: "Promo code usage limit reached",
            });
        }
        /* ------------------------ ONE TIME PER USER ----------------------------- */
        if (promo.oneTimeUsePerUser) {
            const alreadyUsed = await order_model_1.Order.findOne({
                user: userId,
                promoCode: promo.code,
            });
            if (alreadyUsed) {
                return res.status(400).json({
                    error: "You have already used this promo code",
                });
            }
        }
        let discountAmount = 0;
        /* ========================== PERCENT ========================== */
        if (promo.promoMode === "PERCENT") {
            discountAmount = Math.floor((total * promo.value) / 100);
            if (promo.maxDiscount) {
                discountAmount = Math.min(discountAmount, promo.maxDiscount);
            }
        }
        else if (promo.promoMode === "FLAT") {
            /* =========================== FLAT ============================ */
            discountAmount = Math.min(promo.value, total);
        }
        else if (promo.promoMode === "BUNDLE") {
            /* =========================== BUNDLE ========================== */
            if (!promo.bundle || !promo.eligibleProducts?.length) {
                return res.status(400).json({
                    error: "Invalid bundle configuration",
                });
            }
            const eligibleUnitPrices = [];
            // 1️⃣ Collect unit prices of eligible products
            for (const item of cart.items) {
                const isEligible = promo.eligibleProducts.some((id) => id.toString() === item.product._id.toString());
                if (isEligible) {
                    // Push price once per quantity
                    for (let i = 0; i < item.quantity; i++) {
                        eligibleUnitPrices.push(item.price);
                    }
                }
            }
            // 2️⃣ Check eligibility count
            if (promo.bundle.minItems &&
                eligibleUnitPrices.length < promo.bundle.minItems) {
                return res.status(400).json({
                    error: `Add ${promo.bundle.minItems - eligibleUnitPrices.length} more eligible products to apply this offer`,
                });
            }
            // 3️⃣ Sort prices ascending (cheapest first)
            eligibleUnitPrices.sort((a, b) => a - b);
            // 4️⃣ Take EXACT number of items for bundle
            const bundledItems = eligibleUnitPrices.slice(0, promo.bundle.minItems);
            const bundledSubtotal = bundledItems.reduce((sum, price) => sum + price, 0);
            // 5️⃣ Calculate discount
            discountAmount = Math.max(bundledSubtotal - promo.bundle.bundlePrice, 0);
        }
        return res.status(200).json({
            code: promo.code,
            promoCodeId: promo._id,
            discountAmount,
            finalAmount: Math.max(total - discountAmount, 0),
            message: `Promo applied successfully. You saved ₹${discountAmount}`,
        });
    }
    catch (error) {
        return res.status(500).json({
            message: "Failed to apply promo code",
            error,
        });
    }
};
exports.applyPromoCode = applyPromoCode;
/* -------------------------------------------------------------------------- */
/*                            CREATE PROMO CODE                                */
/* -------------------------------------------------------------------------- */
const createPromoCode = async (req, res) => {
    const { code, description, promoMode, value, maxDiscount, bundle, eligibleProducts, expiryDate, minimumOrder, maxUses, oneTimeUsePerUser, active = true, } = req.body;
    /* -------------------------------------------------------------------------- */
    /*                                BASE VALIDATION                             */
    /* -------------------------------------------------------------------------- */
    if (!code || !promoMode || !expiryDate) {
        return res.status(400).json({
            error: "Code, promoMode and expiryDate are required",
        });
    }
    /* -------------------------------------------------------------------------- */
    /*                           MODE-SPECIFIC VALIDATION                          */
    /* -------------------------------------------------------------------------- */
    if (promoMode === "PERCENT") {
        if (value == null || value <= 0) {
            return res.status(400).json({
                error: "Percentage promo requires a valid value",
            });
        }
    }
    if (promoMode === "FLAT") {
        if (value == null || value <= 0) {
            return res.status(400).json({
                error: "Flat promo requires a valid value",
            });
        }
    }
    if (promoMode === "BUNDLE") {
        if (!bundle || bundle.minItems == null || bundle.bundlePrice == null) {
            return res.status(400).json({
                error: "Bundle promo requires minItems and bundlePrice",
            });
        }
        if (!Array.isArray(eligibleProducts) || eligibleProducts.length === 0) {
            return res.status(400).json({
                error: "Bundle promo requires eligibleProducts",
            });
        }
    }
    /* -------------------------------------------------------------------------- */
    /*                               DUPLICATE CHECK                              */
    /* -------------------------------------------------------------------------- */
    try {
        const existingPromo = await promo_model_1.PromoCode.findOne({
            code: code.toUpperCase(),
        });
        if (existingPromo) {
            return res.status(400).json({
                error: "Promo code already exists",
            });
        }
        /* -------------------------------------------------------------------------- */
        /*                                CREATE PROMO                                */
        /* -------------------------------------------------------------------------- */
        const promo = new promo_model_1.PromoCode({
            code: code.toUpperCase(),
            description,
            promoMode,
            // pricing logic
            value: promoMode !== "BUNDLE" ? value : undefined,
            maxDiscount: promoMode === "PERCENT" ? maxDiscount : undefined,
            bundle: promoMode === "BUNDLE" ? bundle : undefined,
            eligibleProducts: promoMode === "BUNDLE" ? eligibleProducts : [],
            expiryDate,
            minimumOrder,
            maxUses,
            oneTimeUsePerUser,
            active,
        });
        await promo.save();
        return res.status(201).json(promo);
    }
    catch (error) {
        return res.status(500).json({
            message: "Failed to create promo code",
            error,
        });
    }
};
exports.createPromoCode = createPromoCode;
const updatePromoCode = async (req, res) => {
    const { description, promoMode, value, maxDiscount, bundle, eligibleProducts, expiryDate, minimumOrder, maxUses, oneTimeUsePerUser, active, } = req.body;
    /* -------------------------------------------------------------------------- */
    /*                                BASE VALIDATION                             */
    /* -------------------------------------------------------------------------- */
    if (!promoMode || !expiryDate) {
        return res.status(400).json({
            error: "promoMode and expiryDate are required",
        });
    }
    /* -------------------------------------------------------------------------- */
    /*                           MODE-SPECIFIC VALIDATION                          */
    /* -------------------------------------------------------------------------- */
    if (promoMode === "PERCENT") {
        if (value == null || value <= 0) {
            return res.status(400).json({
                error: "Percentage promo requires a valid value",
            });
        }
    }
    if (promoMode === "FLAT") {
        if (value == null || value <= 0) {
            return res.status(400).json({
                error: "Flat promo requires a valid value",
            });
        }
    }
    if (promoMode === "BUNDLE") {
        if (!bundle || bundle.minItems == null || bundle.bundlePrice == null) {
            return res.status(400).json({
                error: "Bundle promo requires minItems and bundlePrice",
            });
        }
        if (!Array.isArray(eligibleProducts) || eligibleProducts.length === 0) {
            return res.status(400).json({
                error: "Bundle promo requires eligibleProducts",
            });
        }
    }
    /* -------------------------------------------------------------------------- */
    /*                                UPDATE PROMO                                */
    /* -------------------------------------------------------------------------- */
    try {
        const updatePayload = {
            description,
            promoMode,
            expiryDate,
            minimumOrder,
            maxUses,
            oneTimeUsePerUser,
            active,
        };
        // Reset everything first
        updatePayload.value = undefined;
        updatePayload.maxDiscount = undefined;
        updatePayload.bundle = undefined;
        updatePayload.eligibleProducts = [];
        // Apply based on mode
        if (promoMode === "PERCENT") {
            updatePayload.value = value;
            updatePayload.maxDiscount = maxDiscount;
        }
        if (promoMode === "FLAT") {
            updatePayload.value = value;
        }
        if (promoMode === "BUNDLE") {
            updatePayload.bundle = bundle;
            updatePayload.eligibleProducts = eligibleProducts;
        }
        const promo = await promo_model_1.PromoCode.findByIdAndUpdate(req.params.id, updatePayload, { new: true });
        if (!promo) {
            return res.status(404).json({
                error: "Promo code not found",
            });
        }
        return res.status(200).json(promo);
    }
    catch (error) {
        return res.status(500).json({
            message: "Failed to update promo code",
            error,
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
                message: "Promo code not found",
            });
        }
        return res.status(200).json({
            message: "Promo code deleted successfully",
        });
    }
    catch (error) {
        return res.status(500).json({
            message: "Failed to delete promo code",
            error,
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
                message: "Promo code not found",
            });
        }
        promo.active = !promo.active;
        await promo.save();
        return res.status(200).json({
            success: true,
            message: `Promo code ${promo.active ? "activated" : "deactivated"} successfully`,
        });
    }
    catch (error) {
        return res.status(500).json({
            message: "Failed to toggle promo code",
            error,
        });
    }
};
exports.togglePromoCode = togglePromoCode;
