"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const user_routes_1 = require("./routes/user.routes");
const product_routes_1 = require("./routes/product.routes");
const cart_routes_1 = require("./routes/cart.routes");
const order_routes_1 = require("./routes/order.routes");
const checkout_routes_1 = require("./routes/checkout.routes");
const error_middleware_1 = require("./middleware/error.middleware");
const category_routes_1 = require("./routes/category.routes");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Middleware
app.use((0, cors_1.default)({
    origin: process.env.CLIENT_URL || 'http://localhost:3001',
    credentials: true
}));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
// Routes
app.use('/api/users', user_routes_1.userRouter);
app.use('/api/products', product_routes_1.productRouter);
app.use('/api/cart', cart_routes_1.cartRouter);
app.use('/api/orders', order_routes_1.orderRouter);
app.use('/api/checkout', checkout_routes_1.checkoutRouter);
app.use('/api/categories', category_routes_1.categoryRouter);
// Error handling middleware
app.use(error_middleware_1.errorHandler);
// Database connection
mongoose_1.default.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce')
    .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
})
    .catch((error) => {
    console.error('MongoDB connection error:', error);
});
