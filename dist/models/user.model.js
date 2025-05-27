"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const userSchema = new mongoose_1.default.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    phone: {
        type: String,
        unique: true
    },
    password: {
        type: String,
    },
    name: {
        type: String,
        required: true,
    },
    address: [{
            street: String,
            streetOptional: String,
            city: String,
            state: String,
            zipCode: String,
            country: String,
            phone: String,
            name: String
        }],
    orders: [{
            type: mongoose_1.default.Schema.Types.ObjectId,
            ref: "Order"
        }],
    cart: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Cart"
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    createdAt: {
        type: Date,
        default: Date.now,
    },
});
userSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        this.password = await bcryptjs_1.default.hash(this.password, 10);
    }
    next();
});
exports.User = mongoose_1.default.model('User', userSchema);
