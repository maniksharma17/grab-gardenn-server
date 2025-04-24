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
    unique: true
  },
  password: {
    type: String,
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
    phone: String,
    name: String
  }],
  orders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order"
  }],
  cart: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Cart"
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password!, 10);
  }
  next();
});

export const User = mongoose.model('User', userSchema);