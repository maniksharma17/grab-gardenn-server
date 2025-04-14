import mongoose from 'mongoose';
import { string } from 'zod';

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
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

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
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
    enum: ['confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'confirmed',
  },
  cancellationReason: String,
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
  deliveryRate: {
    type: Number
  },
  freeShipping: {
    type: Boolean
  },
  promoCode: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PromoCode"
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const Order = mongoose.model('Order', orderSchema);