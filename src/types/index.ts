import mongoose from "mongoose";

export interface Product {
  name: string;
  hindiName?: string;
  description: string;
  price: number[];
  category: string;
  images: string[];
  benefits: string[];
  ingredients: string[];
  storage: string;
  cutoffPrice: number[];
  rating: number;
  variants: string[];
  instructions?: string[];
}

export interface Cart {
  _id: string;
  userId: mongoose.Schema.Types.ObjectId;
  items: [
    {
      product: Product,
      quantity: number
    }
  ],
}

export interface User {
  _id: string;
  name: string;
  email: string;
  password: string;
  address: [{
    street: string,
    city: string,
    state: string,
    zipcode: string,
    country: string
  }]
}

export interface Order {
  _id: string;
  userId: mongoose.Schema.Types.ObjectId;
  items: [
    {
      product: Product,
      quantity: number
    }
  ],
  amount: number
}