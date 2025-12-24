import { Request, Response } from "express";
import { PromoCode } from "../models/promo.model";
import { Order } from "../models/order.model";

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
  const { code, total, userId } = req.body;

  if (!code || typeof total !== "number" || !userId) {
    return res.status(400).json({
      error: "Promo code, userId and order total are required"
    });
  }

  try {
    const promo = await PromoCode.findOne({
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
      const alreadyUsed = await Order.findOne({
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
      discountAmount = Math.floor((total * promo.value!) / 100);
    } else {
      discountAmount = Math.min(promo.value!, total);
    }

    return res.status(200).json({
      code: promo.code,
      promoCodeId: promo._id,
      discountAmount,
      finalAmount: total - discountAmount,
      message: `Promo applied successfully. You saved ₹${discountAmount}`
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to apply promo code",
      error
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
    value,
    type,
    expiryDate,
    minimumOrder,
    maxUses,
    oneTimeUsePerUser
  } = req.body;

  if (!code || !value || !type || !expiryDate) {
    return res.status(400).json({
      error: "Code, value, type and expiry date are required"
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
    code,
    description,
    value,
    type,
    expiryDate,
    minimumOrder,
    maxUses,
    oneTimeUsePerUser
  } = req.body;

  if (!code || !value || !type || !expiryDate) {
    return res.status(400).json({
      error: "Code, value, type and expiry date are required"
    });
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
        oneTimeUsePerUser
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
