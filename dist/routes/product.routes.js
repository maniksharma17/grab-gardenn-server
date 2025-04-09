"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productRouter = void 0;
const express_1 = require("express");
const product_controller_1 = require("../controllers/product.controller");
exports.productRouter = (0, express_1.Router)();
// ✅ Get all products
exports.productRouter.get('/', product_controller_1.getProducts);
// ✅ Get a single product by ID
exports.productRouter.get('/:id', product_controller_1.getProduct);
// ✅ Create a new product
exports.productRouter.post('/', product_controller_1.createProduct);
// ✅ Update a product by ID
exports.productRouter.put('/:id', product_controller_1.updateProduct);
// ✅ Delete a product by ID
exports.productRouter.delete('/:id', product_controller_1.deleteProduct);
