import mongoose, { Document, Types } from 'mongoose';
import { ProductDocument } from './product.model';

export interface CartItem {
  product: ProductDocument;
  quantity: number;
  price: number;
  variant: {
    display: string;
    value: number;
  };
  dimensions: {
    length: number;
    breadth: number;
    height: number;
  };
}

export interface CartDocument extends Document {
  user?: Types.ObjectId; // optional for guests
  guestId?: string; // unique ID for guest
  items: CartItem[];
  updatedAt: Date;
}

const cartItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },
  variant: {
    display: { type: String, required: true },
    value: { type: Number, required: true },
  },
  dimensions: {
    length: { type: Number, required: true },
    breadth: { type: Number, required: true },
    height: { type: Number, required: true },
  },
});

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // make optional
  },
  guestId: {
    type: String,
    required: false, // for guest carts
    index: true,     // quick lookup by guestId
  },
  items: [cartItemSchema],
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export const Cart = mongoose.model<CartDocument>('Cart', cartSchema);
