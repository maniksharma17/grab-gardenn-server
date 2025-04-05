import { Request, Response } from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import { Cart } from "../models/cart.model";
import { Order } from "../models/order.model";
import { Product } from "../models/product.model";
import axios from "axios";

let razorpay: Razorpay | null = null;

const initializeRazorpay = () => {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    console.error(
      "Razorpay key_id or key_secret is not set in environment variables."
    );
    return null;
  }

  return new Razorpay({
    key_id,
    key_secret,
  });
};

export const createCheckoutSession = async (req: Request, res: Response) => {
  try {
    if (!razorpay) {
      razorpay = initializeRazorpay();
      if (!razorpay) {
        res.status(500).json({ message: "Payment service not configured" });
        return;
      }
    }

    const cart = await Cart.findOne({ user: req.params.id }).populate(
      "items.product"
    );

    if (!cart || cart.items.length === 0) {
      res.status(400).json({ message: "Cart is empty" });
      return;
    }

    let total = 0;
    for (const item of cart.items) {
      total += item.price * item.quantity;
    }

    const options = {
      amount: Math.round(total * 100),
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
  } catch (error) {
    console.error("Razorpay order creation error:", error);
    res.status(500).json({ message: "Error creating checkout session" });
  }
};

export const verifyPayment = async (req: Request, res: Response) => {
  try {
    if (!razorpay) {
      razorpay = initializeRazorpay();
      if (!razorpay) {
        res.status(500).json({ message: "Payment service not configured" });
        return;
      }
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (!key_secret) {
      res.status(500).json({ message: "Payment service not configured" });
      return;
    }

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", key_secret)
      .update(sign)
      .digest("hex");

    if (razorpay_signature !== expectedSign) {
      res.status(400).json({ message: "Invalid payment signature" });
      return;
    }

    // Create order from cart
    const cart = await Cart.findOne({ user: req.params.id }).populate(
      "items.product"
    );

    if (!cart) {
      res.status(404).json({ message: "Cart not found" });
      return;
    }

    let total = 0;
    const orderItems = [];

    for (const item of cart.items) {
      const product = await Product.findById(item.product);
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
      });
    }

    const order = await Order.create({
      user: req.params.id,
      items: orderItems,
      total,
      shippingAddress: req.body.shippingAddress,
      paymentId: razorpay_payment_id,
      paymentOrderId: razorpay_order_id,
    });

    // Clear the cart
    await Cart.findByIdAndDelete(cart._id);

    res.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    res.status(500).json({ message: "Error verifying payment" });
  }
};

// SHIPROCKET CONFIG
const SHIPROCKET_API_BASE = "https://apiv2.shiprocket.in/v1/external";
const SHIPROCKET_EMAIL = process.env.SHIPROCKET_EMAIL!;
const SHIPROCKET_PASSWORD = process.env.SHIPROCKET_PASSWORD!;

const getShiprocketToken = async () => {
  const response = await axios.post(`${SHIPROCKET_API_BASE}/auth/login`, {
    email: SHIPROCKET_EMAIL,
    password: SHIPROCKET_PASSWORD,
  });
  return response.data.token;
};

export const createShiprocketOrder = async (req: Request, res: Response) => {
  try {
    const token = await getShiprocketToken();

    const { orderId, paymentMethod } = req.body;
    const order = await Order.findById(orderId)
      .populate("items.product")
      .populate("user");
    const user = order?.user as any;

    if (!order) {
      res.status(404).json({ message: "Order not found" });
      return;
    }

    let totalWeight = 0;
    let maxLength = 0;
    let totalBreadth = 0;
    let totalHeight = 0;

    order.items.forEach((item) => {
      totalWeight += (item.variant?.value as any).weight * item.quantity;

      maxLength = Math.max(maxLength, item.dimensions?.length as number);
      totalBreadth += (item.dimensions?.breadth as number) * item.quantity;
      totalHeight += item.dimensions?.height as number;
    });

    const shiprocketOrder = {
      order_id: order._id,
      order_date: new Date().toISOString(),
      pickup_location: "Warehouse",
      billing_customer_name: user.name,
      billing_address: order.shippingAddress?.street,
      billing_city: order.shippingAddress?.city,
      billing_pincode: order.shippingAddress?.zipCode,
      billing_state: order.shippingAddress?.state,
      billing_country: order.shippingAddress?.country,
      billing_email: user.email,
      billing_phone: user.phone,
      order_items: order.items.map((item) => ({
        name: (item.product as any).name,
        sku: (item.product as any)._id,
        units: item.quantity,
        selling_price: item.price,
        discount: 0,
        tax: 0,
        hsn: "123456",
      })),
      payment_method: paymentMethod,
      shipping_charges: 0,
      giftwrap_charges: 0,
      transaction_charges: 0,
      total_discount: 0,
      sub_total: order.total,
      length: maxLength || 10, // Default to 10 if no value
      breadth: totalBreadth || 10,
      height: totalHeight || 10,
      weight: totalWeight,
    };

    const response = await axios.post(
      `${SHIPROCKET_API_BASE}/orders/create/adhoc`,
      shiprocketOrder,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    order.shiprocketOrderId = response.data.order_id;
    await order.save();

    res.json({ success: true, shiprocketOrderId: response.data.order_id });
  } catch (error) {
    console.error("Shiprocket order creation error:", error);
    res.status(500).json({ message: "Error creating Shiprocket order" });
  }
};
