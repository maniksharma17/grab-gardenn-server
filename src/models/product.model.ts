import mongoose from 'mongoose';

import { Document, Types } from 'mongoose';

export interface ProductVariant {
  display: string;
  value: number;
}

export interface ProductDocument extends Document {
  name: string;
  hindiName: string;
  description: string;
  price: number[];
  cutoffPrice: number[];
  variants: ProductVariant[];
  images: string[];
  category: Types.ObjectId;
  benefits: string;
  ingredients: string;
  storage: string;
  rating: number;
  instructions: string;
  stock: number;
  dimensions: {
    length: number;
    breadth: number;
    height: number;
  };
}

const productSchema = new mongoose.Schema({
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
    type: mongoose.Schema.Types.ObjectId,
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

export const Product = mongoose.model('Product', productSchema);