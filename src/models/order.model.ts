import mongoose from 'mongoose';

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
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending',
  },
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
  },
  paymentId: {
    type: String,
    required: true,
  },
  paymentOrderId: {
    type: String,
    required: true,
  },
  shiprocketOrderId: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const Order = mongoose.model('Order', orderSchema);