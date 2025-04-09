"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAddress = exports.addAddress = exports.getProfile = exports.logout = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_model_1 = require("../models/user.model");
const user_schema_1 = require("../schemas/user.schema");
const register = async (req, res) => {
    try {
        const isValid = user_schema_1.userSchema.safeParse(req.body);
        console.log(req.body);
        if (!isValid.success) {
            res.status(400).json({ message: 'Invalid email and password', errors: isValid.error.errors });
            return;
        }
        const existingUser = await user_model_1.User.findOne({ email: req.body.email });
        if (existingUser) {
            res.json({ message: "Account already registered with this email.", error: true });
            return;
        }
        const user = await user_model_1.User.create(req.body);
        const token = jsonwebtoken_1.default.sign({ userId: user._id }, process.env.JWT_SECRET || 'secret');
        res.cookie('token', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
        });
        res.status(201).json({ user: { ...user.toObject(), password: undefined }, token });
    }
    catch (error) {
        res.json({ message: error });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const validatedData = user_schema_1.loginSchema.parse(req.body);
        const user = await user_model_1.User.findOne({ email: validatedData.email });
        if (!user) {
            return res.status(401).json({ message: 'Incorrect email and password' });
        }
        const isValidPassword = await bcryptjs_1.default.compare(validatedData.password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Incorrect email and password' });
        }
        const token = jsonwebtoken_1.default.sign({ userId: user._id }, process.env.JWT_SECRET || 'secret');
        res.cookie('token', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
        });
        res.json({ user: { ...user.toObject(), password: undefined }, token });
    }
    catch (error) {
        throw error;
    }
};
exports.login = login;
const logout = (req, res) => {
    res.cookie('token', '', {
        httpOnly: true,
        expires: new Date(0),
        sameSite: 'none',
    });
    res.json({ message: 'Logged out successfully' });
};
exports.logout = logout;
const getProfile = async (req, res) => {
    const user = await user_model_1.User.findById(req.params.id).select('-password');
    res.json({ user });
};
exports.getProfile = getProfile;
const addAddress = async (req, res) => {
    try {
        const { street, streetOptional, city, state, zipCode, country } = req.body;
        if (!street || !city || !state || !zipCode || !country) {
            return res.status(400).json({ message: "Missing required address fields" });
        }
        const user = await user_model_1.User.findById(req.params.id);
        if (!user)
            return res.status(404).json({ message: "User not found" });
        const newAddress = {
            street,
            streetOptional,
            city,
            state,
            zipCode,
            country,
        };
        user.address.push(newAddress);
        await user.save();
        res.status(200).json({ message: "Address added successfully", newAddress });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};
exports.addAddress = addAddress;
const deleteAddress = async (req, res) => {
    try {
        const userId = req.params.userId;
        const addressId = req.params.addressId;
        const user = await user_model_1.User.findById(userId);
        if (!user)
            return res.status(404).json({ message: "User not found" });
        user.address.pull({ _id: addressId });
        await user.save();
        res.status(200).json({ message: "Address deleted successfully", address: user.address });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};
exports.deleteAddress = deleteAddress;
