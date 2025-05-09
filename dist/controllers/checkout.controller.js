"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCodOrder = exports.calculateDeliveryCharge = exports.createShiprocketOrder = exports.verifyPayment = exports.createCheckoutSession = void 0;
const razorpay_1 = __importDefault(require("razorpay"));
const crypto_1 = __importDefault(require("crypto"));
const cart_model_1 = require("../models/cart.model");
const order_model_1 = require("../models/order.model");
const product_model_1 = require("../models/product.model");
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
let razorpay = null;
const initializeRazorpay = () => {
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (!key_id || !key_secret) {
        console.error("Razorpay key_id or key_secret is not set in environment variables.");
        return null;
    }
    return new razorpay_1.default({
        key_id,
        key_secret,
    });
};
const createCheckoutSession = async (req, res) => {
    try {
        if (!razorpay) {
            razorpay = initializeRazorpay();
            if (!razorpay) {
                res.status(500).json({ message: "Payment service not configured" });
                return;
            }
        }
        const cart = await cart_model_1.Cart.findOne({ user: req.params.id }).populate("items.product");
        if (!cart || cart.items.length === 0) {
            res.status(400).json({ message: "Cart is empty" });
            return;
        }
        let total = 0;
        for (const item of cart.items) {
            total += item.price * item.quantity;
        }
        const deliveryRate = req.body.deliveryRate;
        const options = {
            amount: Math.round((total + deliveryRate) * 100),
            currency: "INR",
            receipt: `order_${Date.now()}`,
        };
        const order = await razorpay.orders.create(options);
        res.json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: process.env.RAZORPAY_KEY_ID,
        });
    }
    catch (error) {
        console.error("Razorpay order creation error:", error);
        res.status(500).json({ message: "Error creating checkout session" });
    }
};
exports.createCheckoutSession = createCheckoutSession;
const verifyPayment = async (req, res) => {
    try {
        if (!razorpay) {
            razorpay = initializeRazorpay();
            if (!razorpay) {
                res.status(500).json({ message: "Payment service not configured" });
                return;
            }
        }
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, deliveryRate } = req.body;
        const key_secret = process.env.RAZORPAY_KEY_SECRET;
        if (!key_secret) {
            res.status(500).json({ message: "Payment service not configured" });
            return;
        }
        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto_1.default
            .createHmac("sha256", key_secret)
            .update(sign)
            .digest("hex");
        if (razorpay_signature !== expectedSign) {
            res.status(400).json({ message: "Invalid payment signature" });
            return;
        }
        // Create order from cart
        const cart = await cart_model_1.Cart.findOne({ user: req.params.id }).populate("items.product");
        if (!cart) {
            res.status(404).json({ message: "Cart not found" });
            return;
        }
        let total = 0;
        const orderItems = [];
        for (const item of cart.items) {
            const product = await product_model_1.Product.findById(item.product);
            if (!product) {
                res.status(400).json({
                    message: `Product ${item.product} not found`,
                });
                return;
            }
            if (product.stock < item.quantity) {
                res.status(400).json({
                    message: `Insufficient stock for ${product.name}`,
                });
                return;
            }
            product.stock -= item.quantity;
            await product.save();
            total += item.price * item.quantity;
            orderItems.push({
                product: item.product,
                quantity: item.quantity,
                price: item.price,
                variant: item.variant,
                dimensions: item.dimensions,
            });
        }
        const order = await order_model_1.Order.create({
            user: req.params.id,
            items: orderItems,
            total: total + deliveryRate,
            shippingAddress: req.body.shippingAddress,
            paymentId: razorpay_payment_id,
            paymentOrderId: razorpay_order_id,
            type: 'prepaid'
        });
        // Clear the cart
        await cart_model_1.Cart.findByIdAndDelete(cart._id);
        res.json({
            success: true,
            order,
        });
    }
    catch (error) {
        console.error("Payment verification error:", error);
        res.status(500).json({ message: "Error verifying payment" });
    }
};
exports.verifyPayment = verifyPayment;
// SHIPROCKET CONFIG
const SHIPROCKET_API_BASE = "https://apiv2.shiprocket.in/v1/external";
const SHIPROCKET_EMAIL = process.env.SHIPROCKET_EMAIL;
const SHIPROCKET_PASSWORD = process.env.SHIPROCKET_PASSWORD;
const getShiprocketToken = async () => {
    const response = await axios_1.default.post(`${SHIPROCKET_API_BASE}/auth/login`, {
        email: SHIPROCKET_EMAIL,
        password: SHIPROCKET_PASSWORD,
    });
    return response.data.token;
};
const createShiprocketOrder = async (req, res) => {
    try {
        const token = await getShiprocketToken();
        const { orderId, paymentMethod } = req.body;
        const order = await order_model_1.Order.findById(orderId)
            .populate("items.product")
            .populate("user");
        const user = order?.user;
        if (!order) {
            res.status(404).json({ message: "Order not found" });
            return;
        }
        let totalWeight = 0;
        let maxLength = 0;
        let totalBreadth = 0;
        let totalHeight = 0;
        order.items.forEach((item) => {
            totalWeight += item.variant?.value * item.quantity;
            maxLength = Math.max(maxLength, item.dimensions?.length);
            totalBreadth += item.dimensions?.breadth * item.quantity;
            totalHeight += item.dimensions?.height;
        });
        const shiprocketOrder = {
            order_id: order._id.toString(),
            order_date: new Date().toISOString(),
            pickup_location: "Primary",
            billing_customer_name: order.shippingAddress?.name?.split(" ")[0] || "",
            billing_last_name: order.shippingAddress?.name?.split(" ")[-1] || "",
            billing_address: order.shippingAddress?.street || "",
            billing_address_2: order.shippingAddress?.streetOptional || "",
            billing_city: order.shippingAddress?.city || "",
            company_name: "GRAB GARDENN HEALTHY FOODS",
            billing_pincode: order.shippingAddress?.zipCode || "",
            billing_state: order.shippingAddress?.state || "",
            billing_country: order.shippingAddress?.country || "",
            billing_email: user.email || "",
            billing_phone: order.shippingAddress?.phone || "",
            shipping_is_billing: true,
            payment_method: paymentMethod,
            sub_total: order.total,
            length: (maxLength || 10),
            breadth: (totalBreadth || 10),
            height: (totalHeight || 10),
            weight: totalWeight,
            order_items: order.items.map((item) => ({
                name: item.product.name.toString(),
                sku: item.product._id.toString(),
                units: item.quantity,
                selling_price: item.price,
            })),
        };
        const response = await axios_1.default.post(`${SHIPROCKET_API_BASE}/orders/create/adhoc`, shiprocketOrder, {
            headers: {
                Authorization: "Bearer " + token,
                "Content-Type": "application/json",
            },
        });
        console.log("ORDER GENERATED:", response.data);
        order.shiprocketOrderId = response.data.order_id;
        await order.save();
        const awbFetchCall = await axios_1.default.post(`${SHIPROCKET_API_BASE}/courier/assign/awb`, {
            shipment_id: response.data.shipment_id
        }, {
            headers: {
                Authorization: "Bearer " + token,
                "Content-Type": "application/json",
            },
        });
        console.log("AWB GENERATED:", awbFetchCall.data);
        try {
            const pickupRequestCall = await axios_1.default.post(`${SHIPROCKET_API_BASE}/courier/generate/pickup`, {
                shipment_id: response.data.shipment_id
            }, {
                headers: {
                    Authorization: "Bearer " + token,
                    "Content-Type": "application/json",
                },
            });
            console.log("PICKUP REQUEST GENERATED:", pickupRequestCall.data);
        }
        catch (error) {
            console.log(error);
        }
        res.json({ success: true, shiprocketOrderId: response.data.order_id });
    }
    catch (error) {
        console.error("Shiprocket order creation error:", error);
        res.status(500).json({ message: "Error creating Shiprocket order" });
    }
};
exports.createShiprocketOrder = createShiprocketOrder;
const calculateDeliveryCharge = async (req, res) => {
    try {
        const { userId, destinationPincode } = req.body;
        const cart = await cart_model_1.Cart.findOne({ user: userId }).populate("items.product");
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ message: "Cart is empty" });
        }
        // Calculate weight and dimensions
        let totalWeight = 0;
        let maxLength = 0;
        let totalBreadth = 0;
        let totalHeight = 0;
        for (const item of cart.items) {
            const product = item.product;
            totalWeight += (item.variant?.value ?? 0) * item.quantity;
            maxLength = Math.max(maxLength, item.dimensions?.length ?? 0);
            totalBreadth += item.dimensions?.breadth ?? 0 * item.quantity;
            totalHeight += item.dimensions?.height ?? 0 * item.quantity;
        }
        const token = await getShiprocketToken();
        const params = new URLSearchParams({
            pickup_postcode: "247667",
            delivery_postcode: destinationPincode,
            weight: (totalWeight).toString(),
            length: (maxLength).toString(),
            breadth: (totalBreadth).toString(),
            height: (totalHeight).toString(),
            cod: "0",
        }).toString();
        const response = await axios_1.default.get(`${SHIPROCKET_API_BASE}/courier/serviceability/?${params}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const shippingOptions = response.data.data.available_courier_companies;
        if (!shippingOptions || shippingOptions.length === 0) {
            return res
                .status(400)
                .json({ message: "No courier options available for this pincode." });
        }
        // You can return all options or pick the cheapest
        const cheapest = shippingOptions.reduce((a, b) => a.rate < b.rate ? a : b);
        res.json({
            estimatedDeliveryDays: cheapest.etd,
            deliveryCharge: cheapest.rate,
            courierName: cheapest.courier_name,
        });
    }
    catch (error) {
        console.error("Error calculating delivery charge:", error);
        res.status(500).json({ message: "Failed to calculate delivery charge" });
    }
};
exports.calculateDeliveryCharge = calculateDeliveryCharge;
const createCodOrder = async (req, res) => {
    try {
        const userId = req.params.id;
        const { shippingAddress, deliveryRate } = req.body;
        const cart = await cart_model_1.Cart.findOne({ user: userId }).populate("items.product");
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ message: "Cart is empty" });
        }
        let total = 0;
        const orderItems = [];
        for (const item of cart.items) {
            const product = await product_model_1.Product.findById(item.product);
            if (!product) {
                return res.status(400).json({ message: `Product ${item.product} not found` });
            }
            if (product.stock < item.quantity) {
                return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
            }
            product.stock -= item.quantity;
            await product.save();
            total += item.price * item.quantity;
            orderItems.push({
                product: item.product,
                quantity: item.quantity,
                price: item.price,
                variant: item.variant,
                dimensions: item.dimensions,
            });
        }
        const order = await order_model_1.Order.create({
            user: userId,
            items: orderItems,
            total: total + deliveryRate,
            shippingAddress,
            type: "cod",
        });
        // Clear cart
        await cart_model_1.Cart.findByIdAndDelete(cart._id);
        // Now call the Shiprocket order creation using internal function
        req.body.orderId = order._id;
        req.body.paymentMethod = "COD";
        await (0, exports.createShiprocketOrder)(req, res);
    }
    catch (error) {
        console.error("COD Order creation error:", error);
        res.status(500).json({ message: "Error creating COD order" });
    }
};
exports.createCodOrder = createCodOrder;
