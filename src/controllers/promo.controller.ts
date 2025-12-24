import { Request, Response } from "express";
import { PromoCode } from "../models/promo.model";
import { Order } from "../models/order.model";
import { Cart } from "../models/cart.model";

/* -------------------------------------------------------------------------- */
/*                               GET PROMOS                                   */
/* -------------------------------------------------------------------------- */

/**
 * Get all active promo codes (for users)
 */
export const getPromos = async (req: Request, res: Response) => {
  try {
    const promos = await PromoCode.find({ active: true }).sort({ createdAt: -1 });
    return res.status(200).json(promos);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch promo codes"
    });
  }
};

/**
 * Get all promo codes (for admin dashboard)
 */
export const getPromosDashboard = async (req: Request, res: Response) => {
  try {
    const promos = await PromoCode.find().sort({ createdAt: -1 });
    return res.status(200).json(promos);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch promo codes",
      error
    });
  }
};

/**
 * Get promo code by ID
 */
export const getPromoCodeById = async (req: Request, res: Response) => {
  try {
    const promo = await PromoCode.findById(req.params.id);

    if (!promo) {
      return res.status(404).json({ message: "Promo code not found" });
    }

    return res.status(200).json(promo);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch promo code"
    });
  }
};

/* -------------------------------------------------------------------------- */
/*                             APPLY PROMO CODE                                */
/* -------------------------------------------------------------------------- */

export const applyPromoCode = async (req: Request, res: Response) => {
  const { code, userId } = req.body;

  if (!code || !userId) {
    return res.status(400).json({
      error: "Promo code and userId are required",
    });
  }

  try {
    const promo = await PromoCode.findOne({
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
    const cart = await Cart.findOne({ user: userId }).populate("items.product");

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    const total = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

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
      const alreadyUsed = await Order.findOne({
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
      discountAmount = Math.floor((total * promo.value!) / 100);
      if (promo.maxDiscount) {
        discountAmount = Math.min(discountAmount, promo.maxDiscount);
      }
    }

    /* =========================== FLAT ============================ */
    else if (promo.promoMode === "FLAT") {
      discountAmount = Math.min(promo.value!, total);
    }

    /* =========================== BUNDLE ========================== */
    else if (promo.promoMode === "BUNDLE") {
      if (!promo.bundle || !promo.eligibleProducts?.length) {
        return res.status(400).json({ error: "Invalid bundle configuration" });
      }

      let eligibleItemCount = 0;
      let eligibleSubtotal = 0;

      for (const item of cart.items) {
        if (
          promo.eligibleProducts.some(
            (id) => id.toString() === (item.product._id as any).toString()
          )
        ) {
          eligibleItemCount += item.quantity;
          eligibleSubtotal += item.price * item.quantity;
        }
      }

      if (promo.bundle.minItems && eligibleItemCount < promo.bundle.minItems) {
        return res.status(400).json({
          error: `Add ${
            promo.bundle.minItems - eligibleItemCount
          } more eligible products to apply this offer`,
        });
      }

      discountAmount = Math.max(
        eligibleSubtotal - promo.bundle.bundlePrice!,
        0
      );
    }

    return res.status(200).json({
      code: promo.code,
      promoCodeId: promo._id,
      discountAmount,
      finalAmount: Math.max(total - discountAmount, 0),
      message: `Promo applied successfully. You saved ₹${discountAmount}`,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to apply promo code",
      error,
    });
  }
};


/* -------------------------------------------------------------------------- */
/*                            CREATE PROMO CODE                                */
/* -------------------------------------------------------------------------- */

export const createPromoCode = async (req: Request, res: Response) => {
  const {
    code,
    description,
    promoMode,
    value,
    maxDiscount,
    bundle,
    expiryDate,
    minimumOrder,
    maxUses,
    oneTimeUsePerUser,
    active = true
  } = req.body;

  if (!code || !promoMode || !expiryDate) {
    return res.status(400).json({
      error: "Code, promoMode and expiryDate are required"
    });
  }

  // Mode-specific validation
  if (promoMode === "PERCENT" && (value == null || value <= 0)) {
    return res.status(400).json({
      error: "Percentage promo requires a valid value"
    });
  }

  if (promoMode === "FLAT" && (value == null || value <= 0)) {
    return res.status(400).json({
      error: "Flat promo requires a valid value"
    });
  }

  if (
    promoMode === "BUNDLE" &&
    (!bundle ||
      bundle.minItems == null ||
      bundle.bundlePrice == null)
  ) {
    return res.status(400).json({
      error: "Bundle promo requires minItems and bundlePrice"
    });
  }

  try {
    const existingPromo = await PromoCode.findOne({
      code: code.toUpperCase()
    });

    if (existingPromo) {
      return res.status(400).json({
        error: "Promo code already exists"
      });
    }

    const promo = new PromoCode({
      code: code.toUpperCase(),
      description,
      promoMode,
      value: promoMode !== "BUNDLE" ? value : undefined,
      maxDiscount: promoMode === "PERCENT" ? maxDiscount : undefined,
      bundle: promoMode === "BUNDLE" ? bundle : undefined,
      expiryDate,
      minimumOrder,
      maxUses,
      oneTimeUsePerUser,
      active
    });

    await promo.save();

    return res.status(201).json(promo);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to create promo code",
      error
    });
  }
};

/* -------------------------------------------------------------------------- */
/*                            UPDATE PROMO CODE                                */
/* -------------------------------------------------------------------------- */

export const updatePromoCode = async (req: Request, res: Response) => {
  const {
    description,
    promoMode,
    value,
    maxDiscount,
    bundle,
    expiryDate,
    minimumOrder,
    maxUses,
    oneTimeUsePerUser,
    active
  } = req.body;

  if (!promoMode || !expiryDate) {
    return res.status(400).json({
      error: "promoMode and expiryDate are required"
    });
  }

  // Mode-specific validation
  if (promoMode === "PERCENT" && (value == null || value <= 0)) {
    return res.status(400).json({
      error: "Percentage promo requires a valid value"
    });
  }

  if (promoMode === "FLAT" && (value == null || value <= 0)) {
    return res.status(400).json({
      error: "Flat promo requires a valid value"
    });
  }

  if (
    promoMode === "BUNDLE" &&
    (!bundle ||
      bundle.minItems == null ||
      bundle.bundlePrice == null)
  ) {
    return res.status(400).json({
      error: "Bundle promo requires minItems and bundlePrice"
    });
  }

  try {
    const promo = await PromoCode.findByIdAndUpdate(
      req.params.id,
      {
        description,
        promoMode,
        value: promoMode !== "BUNDLE" ? value : undefined,
        maxDiscount: promoMode === "PERCENT" ? maxDiscount : undefined,
        bundle: promoMode === "BUNDLE" ? bundle : undefined,
        expiryDate,
        minimumOrder,
        maxUses,
        oneTimeUsePerUser,
        active
      },
      { new: true }
    );

    if (!promo) {
      return res.status(404).json({
        error: "Promo code not found"
      });
    }

    return res.status(200).json(promo);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update promo code",
      error
    });
  }
};

/* -------------------------------------------------------------------------- */
/*                            DELETE PROMO CODE                                */
/* -------------------------------------------------------------------------- */

export const deletePromoCode = async (req: Request, res: Response) => {
  try {
    const promo = await PromoCode.findByIdAndDelete(req.params.id);

    if (!promo) {
      return res.status(404).json({
        message: "Promo code not found"
      });
    }

    return res.status(200).json({
      message: "Promo code deleted successfully"
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to delete promo code",
      error
    });
  }
};

/* -------------------------------------------------------------------------- */
/*                         TOGGLE PROMO ACTIVE STATUS                          */
/* -------------------------------------------------------------------------- */

export const togglePromoCode = async (req: Request, res: Response) => {
  try {
    const promo = await PromoCode.findById(req.params.id);

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
  } catch (error) {
    return res.status(500).json({
      message: "Failed to toggle promo code",
      error
    });
  }
};
