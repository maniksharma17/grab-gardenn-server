// models/PromoCode.js
import mongoose from "mongoose";

const promoCodeSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  description: { type: String, default: "" },

  promoMode: {
    type: String,
    enum: ["PERCENT", "FLAT", "BUNDLE"],
    required: true
  },

  value: { type: Number }, // % OR flat OR bundle price

  maxDiscount: { type: Number }, // cap for percent promos

  bundle: {
    minItems: { type: Number },     // e.g. 4
    bundlePrice: { type: Number }   // e.g. 700
  },

  active: { type: Boolean, default: true },
  expiryDate: { type: Date, required: true },
  minimumOrder: { type: Number, default: 0 },
  maxUses: { type: Number },
  usedCount: { type: Number, default: 0 },
  oneTimeUsePerUser: { type: Boolean }
});



export const PromoCode = mongoose.model('PromoCode', promoCodeSchema);