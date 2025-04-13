import { Request, Response } from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import { Cart } from "../models/cart.model";
import { Order } from "../models/order.model";
import { Product } from "../models/product.model";
import axios from "axios";
import dotenv from "dotenv";
import { User } from "../models/user.model";
dotenv.config();

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
    const deliveryRate = req.body.deliveryRate;

    let amount = 0;
    if(total >= 1000) {
      amount = total;
    } else {
      amount = total + deliveryRate
    }

    const options = {
      amount: Math.round(amount * 100), 
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

export const createDirectCheckoutSession = async (
  req: Request,
  res: Response
) => {
  try {
    if (!razorpay) {
      razorpay = initializeRazorpay();
      if (!razorpay) {
        res.status(500).json({ message: "Payment service not configured" });
        return;
      }
    }

    let total = req.body.price;
    const deliveryRate = req.body.deliveryRate;

    let amount = 0;
    if(total >= 1000) {
      amount = total;
    } else {
      amount = total + deliveryRate
    }

    const options = {
      amount: Math.round((amount) * 100),
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

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      deliveryRate,
    } = req.body;

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
        dimensions: item.dimensions,
      });
    }

    if(total >= 1000) {
      total = total + 0;
    } else {
      total = total + deliveryRate
    }

    const order = await Order.create({
      user: req.params.id,
      items: orderItems,
      total: total,
      shippingAddress: req.body.shippingAddress,
      paymentId: razorpay_payment_id,
      paymentOrderId: razorpay_order_id,
      type: "prepaid",
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

export const verifyDirectPayment = async (req: Request, res: Response) => {
  try {
    if (!razorpay) {
      razorpay = initializeRazorpay();
      if (!razorpay) {
        res.status(500).json({ message: "Payment service not configured" });
        return;
      }
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      deliveryRate,
      shippingAddress,
      price,
      product,
      quantity,
      variant,
      dimensions
    } = req.body;

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


    let total = 0;
    if(price >= 1000) {
      total = price
    } else {
      total = price + deliveryRate
    }

    const orderItems = [
      {
        product: product,
        quantity: quantity,
        price: price,
        variant: variant,
        dimensions: dimensions,
      },
    ];

    const order = await Order.create({
      user: req.params.id,
      items: orderItems,
      total: total,
      shippingAddress: shippingAddress,
      paymentId: razorpay_payment_id,
      paymentOrderId: razorpay_order_id,
      type: "prepaid",
    });

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

    const { orderId, paymentMethod, courierId } = req.body;
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
      totalWeight += (item.variant?.value as any) * item.quantity;
    
      const lengthCm = (item.dimensions?.length ?? 0) * 2.54;
      const breadthCm = (item.dimensions?.breadth ?? 0) * 2.54;
      const heightCm = (item.dimensions?.height ?? 0) * 2.54;
    
      maxLength = Math.max(maxLength, lengthCm);
      totalBreadth += breadthCm * item.quantity;
      totalHeight += heightCm * item.quantity;
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
      length: maxLength || 10,
      breadth: totalBreadth || 10,
      height: totalHeight || 10,
      weight: totalWeight,
      order_items: order.items.map((item) => ({
        name: (item.product as any).name.toString(),
        sku: (item.product as any)._id.toString(),
        units: item.quantity,
        selling_price: item.price,
      })),
    };

    const response = await axios.post(
      `${SHIPROCKET_API_BASE}/orders/create/adhoc`,
      shiprocketOrder,
      {
        headers: {
          Authorization: "Bearer " + token,
          "Content-Type": "application/json",
        },
      }
    );
    console.log("ORDER GENERATED:", response.data);

    order.shiprocketOrderId = response.data.order_id;
    await order.save();

    // ASSIGN COURIER

    const params = new URLSearchParams({
      pickup_postcode: "247667",
      delivery_postcode: order.shippingAddress?.zipCode as string,
      order_id: response.data.order_id,
      cod: paymentMethod == 'COD' ? "0":"1"
    }).toString();

    const courierResponse = await axios.get(
      `${SHIPROCKET_API_BASE}/courier/serviceability/?${params}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    console.log("COURIER LIST: " + courierResponse.data.data)

    const shippingOptions = courierResponse.data.data.available_courier_companies;

    if (!shippingOptions || shippingOptions.length === 0) {
      return res
        .status(400)
        .json({ message: "No courier options available for this pincode." });
    }

    // You can return all options or pick the cheapest
    const cheapest = shippingOptions.reduce((a: any, b: any) =>
      a.rate < b.rate ? a : b
    );
    
    console.log("CHEAPEST COURIER: " + cheapest.courier_company_id)


    const awbFetchCall = await axios.post(
      `${SHIPROCKET_API_BASE}/courier/assign/awb`,
      {
        shipment_id: response.data.shipment_id,
        courier_id: cheapest.courier_company_id
      },
      {
        headers: {
          Authorization: "Bearer " + token,
          "Content-Type": "application/json",
        },
      }
    );
    console.log("AWB GENERATED:", awbFetchCall.data);

    try {
      const pickupRequestCall = await axios.post(
        `${SHIPROCKET_API_BASE}/courier/generate/pickup`,
        {
          shipment_id: response.data.shipment_id,
        },
        {
          headers: {
            Authorization: "Bearer " + token,
            "Content-Type": "application/json",
          },
        }
      );
      console.log("PICKUP REQUEST GENERATED:", pickupRequestCall.data);
    } catch (error) {
      console.log(error);
    }

    res.json({ success: true, shiprocketOrderId: response.data.order_id });
  } catch (error) {
    console.error("Shiprocket order creation error:", error);
    res.status(500).json({ message: "Error creating Shiprocket order" });
  }
};

export const calculateDeliveryCharge = async (req: Request, res: Response) => {
  try {
    const { userId, destinationPincode } = req.body;

    const cart = await Cart.findOne({ user: userId }).populate("items.product");

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // Calculate weight and dimensions
    let totalWeight = 0;
    let maxLength = 0;
    let totalBreadth = 0;
    let totalHeight = 0;

    for (const item of cart.items) {
      const product = item.product as any;

      totalWeight += (item.variant?.value ?? 0) * item.quantity;

      maxLength = Math.max(maxLength, item.dimensions?.length ?? 0);
      totalBreadth += item.dimensions?.breadth ?? 0 * item.quantity;
      totalHeight += item.dimensions?.height ?? 0 * item.quantity;
    }

    const token = await getShiprocketToken();

    const params = new URLSearchParams({
      pickup_postcode: "247667",
      delivery_postcode: destinationPincode,
      weight: totalWeight.toString(),
      length: maxLength.toString(),
      breadth: totalBreadth.toString(),
      height: totalHeight.toString(),
      cod: "0",
    }).toString();

    const response = await axios.get(
      `${SHIPROCKET_API_BASE}/courier/serviceability/?${params}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const shippingOptions = response.data.data.available_courier_companies;

    if (!shippingOptions || shippingOptions.length === 0) {
      return res
        .status(400)
        .json({ message: "No courier options available for this pincode." });
    }

    // You can return all options or pick the cheapest
    const cheapest = shippingOptions.reduce((a: any, b: any) =>
      a.rate < b.rate ? a : b
    );

    res.json({
      estimatedDeliveryDays: cheapest.etd,
      deliveryCharge: cheapest.rate + cheapest.freight_charge,
      courierName: cheapest.courier_name,
      courierId: cheapest.courier_company_id
    });
  } catch (error) {
    console.error("Error calculating delivery charge:", error);
    res.status(500).json({ message: "Failed to calculate delivery charge" });
  }
};

export const createCodOrder = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const { shippingAddress, deliveryRate, courierId } = req.body;

    const cart = await Cart.findOne({ user: userId }).populate("items.product");

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    let total = 0;
    const orderItems = [];

    for (const item of cart.items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res
          .status(400)
          .json({ message: `Product ${item.product} not found` });
      }

      if (product.stock < item.quantity) {
        return res
          .status(400)
          .json({ message: `Insufficient stock for ${product.name}` });
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

    if(total >= 1000){
      total = total + 0;
    } else {
      total = total + deliveryRate;
    }

    const order = await Order.create({
      user: userId,
      items: orderItems,
      total: total,
      shippingAddress,
      deliveryRate,
      freeShipping: total >= 1000,
      type: "cod",
    });

    const user = await User.findById(userId);
    user?.orders.push(order._id)
    await user?.save()

    // Clear cart
    await Cart.findByIdAndDelete(cart._id);

    // Now call the Shiprocket order creation using internal function
    req.body.orderId = order._id;
    req.body.paymentMethod = "COD";
    req.body.courierId = courierId;
    await createShiprocketOrder(req, res);
  } catch (error) {
    console.error("COD Order creation error:", error);
    res.status(500).json({ message: "Error creating COD order" });
  }
};

export const createDirectCodOrder = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const {
      deliveryRate,
      courierId,
      shippingAddress,
      price,
      product,
      quantity,
      variant,
      dimensions
    } = req.body;

    const productOrdered = await Product.findById(product);
    if(!productOrdered){
      res.status(404).json({message: "Product not found."})
      return;
    }

    if(productOrdered.stock < quantity){
      res.status(400).json({message: "Insufficient stock."})
      return;
    }

    const orderItems = [];

    let total = price*quantity;
    if(price >= 1000){
      total = total;
    } else {
      total = total + deliveryRate;
    }

    orderItems.push({
    product: product,
    quantity: quantity,
    price: price,
    variant: variant,
    dimensions: dimensions,
  });
    

  const order = await Order.create({
    user: userId,
    items: orderItems,
    total,
    shippingAddress,
    type: "cod",
    deliveryRate,
    freeShipping: total >= 1000
  });
  
  const user = await User.findById(userId);
  user?.orders.push(order._id)
  await user?.save()

    req.body.orderId = order._id;
    req.body.paymentMethod = "COD";
    req.body.courierId = courierId;
    await createShiprocketOrder(req, res);
  } catch (error) {
    console.error("COD Order creation error:", error);
    res.status(500).json({ message: "Error creating COD order" });
  }
};

export const calculateDeliveryChargeWithoutCart = async (
  req: Request,
  res: Response
) => {
  try {
    const { destinationPincode, weight, cod } = req.body;

    const token = await getShiprocketToken();

    const params = new URLSearchParams({
      pickup_postcode: "247667",
      delivery_postcode: destinationPincode,
      weight: weight.toString(),
      cod: cod
    }).toString();

    const response = await axios.get(
      `${SHIPROCKET_API_BASE}/courier/serviceability/?${params}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const shippingOptions = response.data.data.available_courier_companies;

    if (!shippingOptions || shippingOptions.length === 0) {
      return res
        .status(400)
        .json({ message: "No courier options available for this pincode." });
    }

    // You can return all options or pick the cheapest
    const cheapest = shippingOptions.reduce((a: any, b: any) =>
      a.rate < b.rate ? a : b
    );

    res.json({
      estimatedDeliveryDays: cheapest.etd,
      deliveryCharge:cheapest.rate,
      courierName: cheapest.courier_name,
      courierId: cheapest.courier_company_id
    });
  } catch (error) {
    console.error("Error calculating delivery charge:", error);
    res.status(500).json({ message: "Failed to calculate delivery charge" });
  }
};

export const cancelShiprocketOrder = async (req: Request, res: Response) => {
  try {
    const { shiprocketOrderId, reason } = req.body;

    if (!shiprocketOrderId) {
      return res.status(400).json({ message: "Shiprocket Order ID is required" });
    }

    const token = await getShiprocketToken();

    const response = await axios.post(
      `${SHIPROCKET_API_BASE}/orders/cancel`,
      {
        ids: [shiprocketOrderId],
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.data.status_code === 200 || response.data.status == 200) {
      await Order.updateOne({shiprocketOrderId}, {
        status: 'cancelled',
        cancellationReason: reason
      })
      return res.status(200).json({
        message: "Shiprocket order cancelled successfully",
        data: response.data,
      });
    } else {
      return res.status(500).json({
        message: "Failed to cancel Shiprocket order",
        data: response.data,
      });
    }
  } catch (error: any) {
    console.error("Error cancelling Shiprocket order:", error.message);
    return res.status(500).json({ message: "Error cancelling Shiprocket order" });
  }
};

export const getExistingAWB = async (req: Request, res: Response) => {
  try {
    const { order_id } = req.params;

    if (!order_id) {
      return res.status(400).json({ message: "Shiprocket order_id is required" });
    }

    const token = await getShiprocketToken();

    const response = await axios.get(
      `${SHIPROCKET_API_BASE}/orders/show/${order_id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const { awb } = response.data.data.awb_data;

    if (!awb) {
      return res.status(404).json({ message: "AWB not generated yet" });
    }

    res.json({ success: true, awb_code: awb });
  } catch (error: any) {
    console.error("Error fetching AWB:", error?.response?.data || error.message);
    res.status(500).json({
      message: "Failed to fetch AWB ID",
      error: error?.response?.data || error.message,
    });
  }
};
