import mongoose from 'mongoose';

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