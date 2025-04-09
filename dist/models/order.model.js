"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Order = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const orderItemSchema = new mongoose_1.default.Schema({
    product: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    variant: {
        display: {
            type: String,
            required: true
        },
        value: {
            type: Number,
            required: true
        }
    },
    dimensions: {
        length: {
            type: Number,
            required: true
        },
        breadth: {
            type: Number,
            required: true
        },
        height: {
            type: Number,
            required: true
        }
    }
});
const orderSchema = new mongoose_1.default.Schema({
    user: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    items: [orderItemSchema],
    total: {
        type: Number,
        required: true,
    },
    type: {
        type: String,
        enum: ['prepaid', 'cod']
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending',
    },
    shippingAddress: {
        street: String,
        streetOptional: String,
        city: String,
        state: String,
        zipCode: String,
        country: String,
        name: String,
        phone: String
    },
    paymentId: {
        type: String,
    },
    paymentOrderId: {
        type: String,
    },
    shiprocketOrderId: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});
exports.Order = mongoose_1.default.model('Order', orderSchema);
