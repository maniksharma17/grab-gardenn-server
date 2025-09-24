"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cart = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const cartItemSchema = new mongoose_1.default.Schema({
    product: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true },
    variant: {
        display: { type: String, required: true },
        value: { type: Number, required: true },
    },
    dimensions: {
        length: { type: Number, required: true },
        breadth: { type: Number, required: true },
        height: { type: Number, required: true },
    },
});
const cartSchema = new mongoose_1.default.Schema({
    user: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: false, // make optional
    },
    guestId: {
        type: String,
        required: false, // for guest carts
        index: true, // quick lookup by guestId
    },
    items: [cartItemSchema],
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});
exports.Cart = mongoose_1.default.model('Cart', cartSchema);
