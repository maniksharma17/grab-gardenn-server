"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Product = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const productSchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        required: true,
    },
    hindiName: {
        type: String
    },
    description: {
        type: String,
        required: true,
    },
    price: [{
            type: Number,
            required: true,
        }],
    cutoffPrice: [{
            type: Number,
            required: true,
        }],
    variants: [{
            display: {
                type: String,
                required: true,
            },
            value: {
                type: Number,
                required: true
            }
        }],
    images: [{
            type: String,
        }],
    category: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Category',
        required: true,
    },
    benefits: [{
            type: String,
            required: true,
        }],
    ingredients: [{
            type: String,
            required: true,
        }],
    storage: {
        type: String,
        required: true
    },
    rating: {
        type: Number,
    },
    instructions: [{
            type: String,
            required: true
        }],
    stock: {
        type: Number,
        required: true
    },
    dimensions: [{
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
        }]
}, {
    timestamps: true
});
exports.Product = mongoose_1.default.model('Product', productSchema);
