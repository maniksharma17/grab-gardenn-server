import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  phone: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  address: [{
    street: String,
    streetOptional: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
  }],
  orders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order"
  }],
  cart: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Cart"
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

export const User = mongoose.model('User', userSchema);