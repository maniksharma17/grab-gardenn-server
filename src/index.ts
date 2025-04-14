import express from 'express';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import { userRouter } from './routes/user.routes';
import { productRouter } from './routes/product.routes';
import { cartRouter } from './routes/cart.routes';
import { orderRouter } from './routes/order.routes';
import { checkoutRouter } from './routes/checkout.routes';
import { errorHandler } from './middleware/error.middleware';
import { categoryRouter } from './routes/category.routes';
import { PromoCode } from './models/promo.model';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/users', userRouter);
app.use('/api/products', productRouter);
app.use('/api/cart', cartRouter);
app.use('/api/orders', orderRouter);
app.use('/api/checkout', checkoutRouter);
app.use('/api/categories', categoryRouter);
app.use('/api/promo-code', categoryRouter);

// Error handling middleware
app.use(errorHandler);

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce')
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
    const promoCode = new PromoCode({
      code: 'LAUNCH30',
      discountPercentage: 30,
      maxUsage: 100,
      usedCount: 0,
      oneTimeUsePerUser: true,
      expiryDate: new Date('2025-10-11T00:00:00Z')
    });
    
    promoCode.save()
      .then(() => {
        console.log('Promo code LAUNCH30 created successfully');
      })
      .catch((error) => {
        console.error('Error creating promo code:', error);
      });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });