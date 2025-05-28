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
import { promoRouter } from './routes/promo.routes';
import wishlistRouter from './routes/wishlist.routes';
import reviewRouter from './routes/review.routes';
import uploadRouter from './routes/upload.routes';
import { blogRouter } from './routes/blog.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://grabgardenn.com',
  'https://www.grabgardenn.com',
  'https://dashboard.grabgardenn.com',
  'https://www.dashboard.grabgardenn.com',
];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
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
app.use('/api/promo-code', promoRouter);
app.use('/api/wishlist', wishlistRouter);
app.use('/api/reviews', reviewRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/blogs', blogRouter);

// Error handling middleware
app.use(errorHandler);

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce')
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });