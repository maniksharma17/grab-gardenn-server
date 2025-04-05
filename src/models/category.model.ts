import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  image: {
    type: String,
  },
  products: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product"
  }]
}, {
  timestamps: true
});

export const Category = mongoose.model('Category', categorySchema);