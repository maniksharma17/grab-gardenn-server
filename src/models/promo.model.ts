// models/PromoCode.js
import mongoose from "mongoose";

const promoCodeSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  type: { type: String, enum: ['percent', 'flat'], required: true },
  value: { type: Number, required: true },
  active: { type: Boolean, default: true },
  expiryDate: { type: Date, required: true },
  minimumOrder: { type: Number, default: 0 },
  maxUses: { type: Number },
  usedCount: { type: Number, default: 0 }, 
  oneTimeUsePerUser: { type: Boolean }
});


export const PromoCode = mongoose.model('PromoCode', promoCodeSchema);