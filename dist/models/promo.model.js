"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromoCode = void 0;
// models/PromoCode.js
const mongoose_1 = __importDefault(require("mongoose"));
const promoCodeSchema = new mongoose_1.default.Schema({
    code: { type: String, required: true, unique: true, uppercase: true },
    description: { type: String, default: '' },
    type: { type: String, enum: ['percent', 'flat'], required: true },
    value: { type: Number, required: true },
    active: { type: Boolean, default: true },
    expiryDate: { type: Date, required: true },
    minimumOrder: { type: Number, default: 0 },
    maxUses: { type: Number },
    usedCount: { type: Number, default: 0 },
    oneTimeUsePerUser: { type: Boolean }
});
exports.PromoCode = mongoose_1.default.model('PromoCode', promoCodeSchema);
