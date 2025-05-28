import { Request, Response } from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import { Cart } from "../models/cart.model";
import { Order } from "../models/order.model";
import { Product } from "../models/product.model";
import axios from "axios";
import dotenv from "dotenv";
import { User } from "../models/user.model";
import { PromoCode } from "../models/promo.model";
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
    const promoCodeDiscount = req.body.promoCodeDiscount;

    let amount = 0;
    if(total >= 1000) {
      amount = total - promoCodeDiscount;
    } else {
      amount = total + deliveryRate - promoCodeDiscount;
    }
    console.log(total, "total");

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

    let total = req.body.total;
    const deliveryRate = req.body.deliveryRate;
    const promoCodeDiscount = req.body.promoCodeDiscount;

    let amount = 0;
    if(total >= 1000) {
      amount = total - promoCodeDiscount;
    } else {
      amount = total + deliveryRate - promoCodeDiscount;
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
      shippingAddress,
      promoCode,
      promoCodeDiscount
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
      total = total - promoCodeDiscount;
    } else {
      total = total + deliveryRate - promoCodeDiscount;
    }

    const order = await Order.create({
      user: req.params.id,
      items: orderItems,
      total: total,
      shippingAddress,
      deliveryRate: total >= 1000 ? 0 : deliveryRate,
      freeShipping: total >= 1000,
      promoCode,
      promoCodeDiscount,
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
      total,
      price,
      product,
      quantity,
      variant,
      dimensions,
      promoCode,
      promoCodeDiscount
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


    let amount = 0;
    if(total >= 1000) {
      amount = total - promoCodeDiscount;
    } else {
      amount = total + deliveryRate - promoCodeDiscount;
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
      total: amount,
      deliveryRate: total >= 1000 ? 0 : deliveryRate,
      freeShipping: total >= 1000,
      promoCode,
      promoCodeDiscount,
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
    let maxBreadth = 0;
    let totalHeight = 0;

    let total = 0;

    order.items.forEach((item) => {
      total += item.price * item.quantity;
      totalWeight += (item.variant?.value as any) * item.quantity;
    
      const lengthCm = (item.dimensions?.length ?? 0) * 2.54;
      const breadthCm = (item.dimensions?.breadth ?? 0) * 2.54;
      const heightCm = (item.dimensions?.height ?? 0) * 2.54;
    
      maxLength = Math.max(maxLength, lengthCm);
      maxBreadth = Math.max(maxBreadth, breadthCm);
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
      billing_pincode: order.shippingAddress?.zipCode || "",
      billing_state: order.shippingAddress?.state || "",
      billing_country: order.shippingAddress?.country || "",
      billing_email: user.email || "",
      billing_phone: order.shippingAddress?.phone || "",
      shipping_is_billing: true,
      payment_method: paymentMethod,
      sub_total: total,
      length: maxLength || 10,
      breadth: maxBreadth || 10,
      height: totalHeight || 10,
      weight: totalWeight,
      order_items: order.items.map((item) => ({
        name: (item.product as any).name.toString(),
        sku: (item.product as any)._id.toString(),
        units: item.quantity,
        selling_price: item.price,
      })),
      shipping_charges: order.deliveryRate,
      total_discount: order.promoCodeDiscount
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

    try{
      const awbFetchCall = await axios.post(
        `${SHIPROCKET_API_BASE}/courier/assign/awb`,
        {
          shipment_id: response.data.shipment_id,
          courier_id: courierId
        },
        {
          headers: {
            Authorization: "Bearer " + token,
            "Content-Type": "application/json",
          },
        }
      );
      console.log("AWB GENERATED:", awbFetchCall.data);

    } catch (err) {
      res.json({ success: true, shiprocketOrderId: response.data.order_id });
    }

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
    const { userId, destinationPincode, cod } = req.body;

    const cart = await Cart.findOne({ user: userId }).populate("items.product");

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // Calculate weight and dimensions
    let totalWeight = 0;
    let maxLength = 0;
    let maxBreadth = 0;
    let totalHeight = 0;

    for (const item of cart.items) {
      const product = item.product as any;

      totalWeight += (item.variant?.value ?? 0) * item.quantity;

      maxLength = Math.max(maxLength, item.dimensions?.length ?? 0);
      maxBreadth = Math.max(maxBreadth, item.dimensions?.breadth ?? 0);
      totalHeight += item.dimensions?.height ?? 0 * item.quantity;
    }

    const token = await getShiprocketToken();

    const params = new URLSearchParams({
      pickup_postcode: "247667",
      delivery_postcode: destinationPincode,
      weight: totalWeight.toString(),
      length: maxLength.toString(),
      breadth: maxBreadth.toString(),
      height: totalHeight.toString(),
      cod: cod,
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
      deliveryCharge: cheapest.rate,
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
    const { shippingAddress, deliveryRate, courierId, promoCode, promoCodeDiscount } = req.body;

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

    let finalTotal = total;
    if(total >= 1000){
      finalTotal = total + 0 - promoCodeDiscount;
    } else {
      finalTotal = total + deliveryRate - promoCodeDiscount;
    }

    const order = await Order.create({
      user: userId,
      items: orderItems,
      total: finalTotal,
      shippingAddress,
      deliveryRate: total>=1000 ? 0 : deliveryRate,
      freeShipping: total >= 1000,
      type: "cod",
      promoCode,
      promoCodeDiscount
    });

    if (promoCode) {
      await PromoCode.updateOne(
        { code: promoCode },
        { $inc: { usedCount: 1 } }
      );
    }

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
      dimensions,
      promoCode,
      promoCodeDiscount
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

    let finalTotal = total;
    if(total >= 1000){
      finalTotal = total + 0 - promoCodeDiscount;
    } else {
      finalTotal = total + deliveryRate - promoCodeDiscount;
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
    total: finalTotal,
    shippingAddress,
    type: "cod",
    deliveryRate: total>=1000 ? 0 : deliveryRate,
    freeShipping: total >= 1000,
    promoCode,
    promoCodeDiscount
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



// SHIPMOZO CONFIG
const SHIPMOZO_API_BASE = "https://shipping-api.com/app/api/v1"

export const calculateDeliveryCharge2 = async (req: Request, res: Response) => {
  try {
    const { userId, destinationPincode, cod } = req.body;

    const cart = await Cart.findOne({ user: userId }).populate("items.product");

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // Calculate weight and dimensions
    let totalWeight = 0;
    let maxLength = 0;
    let maxBreadth = 0;
    let totalHeight = 0;
    let totalAmount = 0;

    for (const item of cart.items) {
      totalWeight += (item.variant?.value ?? 0) * item.quantity;
      totalAmount += item.price * item.quantity;
      maxLength = Math.max(maxLength, item.dimensions?.length ?? 0);
      maxBreadth = Math.max(maxBreadth, item.dimensions?.breadth ?? 0);
      totalHeight += item.dimensions?.height ?? 0 * item.quantity;
    }

    const params = {
      pickup_pincode: "247667",
      delivery_pincode: destinationPincode,
      weight: (totalWeight*1000).toString(),
      order_amount: totalAmount.toString(),
      dimensions: [
      {
        no_of_box: 1,
        length: (maxLength*2.54).toString(),
        width: (maxBreadth*2.54).toString(),
        height: (totalHeight*2.54).toString()
      }
      ],
      payment_type: cod === "1" ? "COD" : "PREPAID",
      shipment_type: "FORWARD",
      type_of_package: "SPS",
      rov_type: "ROV_OWNER",
      order_id: "",
      cod_amount: cod === "1" ? totalAmount.toString() : "0",
    }

    const response = await axios.post(
      `${SHIPMOZO_API_BASE}/rate-calculator`, params,
      { 
        headers: { 
          "public-key": process.env.SHIPMOZO_PUBLIC_KEY || "",
          "private-key": process.env.SHIPMOZO_PRIVATE_KEY || ""
        },
      }
    );

    const shippingOptions = response.data.data;

    if (!shippingOptions || shippingOptions.length === 0) {
      return res
        .status(400)
        .json({ message: "No courier options available for this pincode." });
    }

    // You can return all options or pick the cheapest
    const cheapest = shippingOptions.reduce((a: any, b: any) =>
      a.total_charges < b.total_charges ? a : b
    );

    res.json({
      estimatedDeliveryDays: cheapest.estimatedDelivery,
      deliveryCharge: cheapest.total_charges,
      courierName: cheapest.name,
      courierId: cheapest.id
    });
  } catch (error) {
    console.error("Error calculating delivery charge:", error);
    res.status(500).json({ message: "Failed to calculate delivery charge" });
  }
};


export const calculateDeliveryChargeWithoutCart2 = async (
  req: Request,
  res: Response
) => {
  try {
    const { destinationPincode, weight, cod, totalAmount, length, breadth, height, quantity } = req.body;

    const totalWeight = weight * quantity;
    const totalHeight = height * quantity;

    const params = {
      pickup_pincode: "247667",
      delivery_pincode: destinationPincode,
      weight: (totalWeight*1000).toString(),
      order_amount: totalAmount.toString(),
      dimensions: [
      {
        no_of_box: 1,
        length: (length*2.54).toString(),
        width: (breadth*2.54).toString(),
        height: (totalHeight*2.54).toString()
      }
      ],
      payment_type: cod === "1" ? "COD" : "PREPAID",
      shipment_type: "FORWARD",
      type_of_package: "SPS",
      rov_type: "ROV_OWNER",
      order_id: "",
      cod_amount: cod === "1" ? totalAmount.toString() : "0",
    }

    console.log(params, "params");

     const response = await axios.post(
      `${SHIPMOZO_API_BASE}/rate-calculator`, params,
      { 
        headers: { 
          "public-key": process.env.SHIPMOZO_PUBLIC_KEY || "",
          "private-key": process.env.SHIPMOZO_PRIVATE_KEY || ""
        },
      }
    );

    const shippingOptions = response.data.data;

    if (!shippingOptions || shippingOptions.length === 0) {
      return res
        .status(400)
        .json({ message: "No courier options available for this pincode." });
    }

    // You can return all options or pick the cheapest
    const cheapest = shippingOptions.reduce((a: any, b: any) =>
      a.total_charges < b.total_charges ? a : b
    );

    res.json({
      estimatedDeliveryDays: cheapest.estimatedDelivery,
      deliveryCharge: cheapest.total_charges,
      courierName: cheapest.name,
      courierId: cheapest.id
    });

  } catch (error) {
    console.error("Error calculating delivery charge:", error);
    res.status(500).json({ message: "Failed to calculate delivery charge" });
  }
};


export const createShipmozoOrder = async (req: Request, res: Response) => {
  try {

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
    let maxBreadth = 0;
    let totalHeight = 0;

    let total = 0;

    order.items.forEach((item) => {
      total += item.price * item.quantity;
      totalWeight += (item.variant?.value as any) * item.quantity;
    
      const lengthCm = (item.dimensions?.length ?? 0) * 2.54;
      const breadthCm = (item.dimensions?.breadth ?? 0) * 2.54;
      const heightCm = (item.dimensions?.height ?? 0) * 2.54;
    
      maxLength = Math.max(maxLength, lengthCm);
      maxBreadth = Math.max(maxBreadth, breadthCm);
      totalHeight += heightCm * item.quantity;
    });

    const shipmozoOrder = {
      order_id: order._id.toString(),
      order_date: new Date().toISOString(),
      pickup_location: "Primary",
      order_type: "Order",
      consignee_name: order.shippingAddress?.name || "",
      consignee_address_line_one: order.shippingAddress?.street || "",
      consignee_address_line_two: order.shippingAddress?.streetOptional || "",
      consignee_city: order.shippingAddress?.city || "",
      consignee_pin_code: order.shippingAddress?.zipCode || "",
      consignee_state: order.shippingAddress?.state || "",
      consignee_email: user.email || "",
      consignee_phone: order.shippingAddress?.phone || "",
      payment_method: paymentMethod.toString().toUpperCase(), 
      sub_total: total,
      length: maxLength || 10,
      width: maxBreadth || 10,
      height: totalHeight || 10,
      weight: totalWeight*1000,
      product_detail: order.items.map((item) => ({
        name: (item.product as any).name.toString(),
        sku_number: (item.product as any)._id.toString(),
        quantity: item.quantity,
        unit_price: item.price,
      })),
      shipping_charges: order.deliveryRate,
      total_discount: order.promoCodeDiscount,
      warehouse_id: "56046",
      gst_ewaybill_number: "",
      gstin_number: ""
    };

    const response = await axios.post(
      `${SHIPMOZO_API_BASE}/push-order`,
      shipmozoOrder,
      {
        headers: { 
          "public-key": process.env.SHIPMOZO_PUBLIC_KEY || "",
          "private-key": process.env.SHIPMOZO_PRIVATE_KEY || ""
        },
      }
    );
    console.log("ORDER GENERATED:", response.data);

    const shippingId = response.data.data.order_id;

    order.shiprocketOrderId = response.data.data.order_id;
    await order.save();

    try{
      const awbFetchCall = await axios.post(
        `${SHIPMOZO_API_BASE}/assign-courier`,
        {
          order_id: shippingId,
          courier_id: courierId
        },
        {
          headers: {
            "public-key": process.env.SHIPMOZO_PUBLIC_KEY || "",
            "private-key": process.env.SHIPMOZO_PRIVATE_KEY || ""
          },
        }
      );
      console.log("AWB GENERATED:", awbFetchCall.data);

    } catch (err) {
      res.json({ success: true, shiprocketOrderId: response.data.order_id });
    }

    try {
      const pickupRequestCall = await axios.post(
        `${SHIPMOZO_API_BASE}/schedule-pickup`,
        {
          order_id: shippingId,
        },
        {
          headers: {
            "public-key": process.env.SHIPMOZO_PUBLIC_KEY || "",
            "private-key": process.env.SHIPMOZO_PRIVATE_KEY || ""
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

export const cancelShipmozoOrder = async (req: Request, res: Response) => {
  try {
    const { shipmozoOrderId, awbNumber, reason } = req.body;

    if (!shipmozoOrderId) {
      return res.status(400).json({ message: "Order ID is required" });
    }

    const response = await axios.post(
      `${SHIPMOZO_API_BASE}/cancel-order`,
      {
        order_id: shipmozoOrderId,
        awb_number: awbNumber
      },
      {
        headers: {
          "public-key": process.env.SHIPMOZO_PUBLIC_KEY || "",
          "private-key": process.env.SHIPMOZO_PRIVATE_KEY || ""
        },
      }
    );

    if (response.data.status_code === 200 || response.data.status == 200) {
      await Order.updateOne({shippingOrderId: shipmozoOrderId}, {
        status: 'cancelled',
        cancellationReason: reason
      })
      return res.status(200).json({
        message: "Order cancelled successfully",
        data: response.data,
      });
    } else {
      return res.status(500).json({
        message: "Failed to cancel order",
        data: response.data,
      });
    }
  } catch (error: any) {
    console.error("Error cancelling order:", error.message);
    return res.status(500).json({ message: "Error cancelling order" });
  }
};
