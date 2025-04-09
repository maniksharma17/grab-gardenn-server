"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProduct = exports.updateProduct = exports.createProduct = exports.getProduct = exports.getProducts = void 0;
const product_model_1 = require("../models/product.model");
const product_schema_1 = require("../schemas/product.schema");
const getProducts = async (req, res) => {
    const { category, search, sort, page = 1, limit = 30 } = req.query;
    const query = {};
    if (category)
        query.category = category;
    if (search)
        query.name = { $regex: search, $options: 'i' };
    const products = await product_model_1.Product.find(query)
        .sort(sort ? { [sort]: -1 } : { createdAt: 1 })
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit));
    const total = await product_model_1.Product.countDocuments(query);
    res.json({
        products,
        total,
        pages: Math.ceil(total / Number(limit)),
        currentPage: Number(page),
    });
};
exports.getProducts = getProducts;
const getProduct = async (req, res) => {
    const product = await product_model_1.Product.findById(req.params.id).populate('category');
    if (!product) {
        return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ product });
};
exports.getProduct = getProduct;
const createProduct = async (req, res) => {
    try {
        const productData = req.body;
        const isValid = product_schema_1.productSchema.safeParse(productData);
        if (!isValid.success) {
            res.json({ message: "Invalid data" });
            return;
        }
        const newProduct = await product_model_1.Product.create(productData);
        res.status(201).json(newProduct);
    }
    catch (error) {
        res.status(400).json({ message: "Server error" });
    }
};
exports.createProduct = createProduct;
const updateProduct = async (req, res) => {
    try {
        const productData = req.body;
        const isValid = product_schema_1.productSchema.safeParse(productData);
        if (!isValid.success) {
            res.json({ message: "Invalid data" });
            return;
        }
        const { id } = req.params;
        const updatedProduct = await product_model_1.Product.findByIdAndUpdate(id, productData, { new: true, runValidators: true });
        res.status(201).json(updatedProduct);
    }
    catch (error) {
        res.status(400).json({ message: "Server Error" });
    }
};
exports.updateProduct = updateProduct;
const deleteProduct = async (req, res) => {
    try {
        const deletedProduct = await product_model_1.Product.findByIdAndDelete(req.params.id);
        if (!deletedProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json({ message: 'Product deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};
exports.deleteProduct = deleteProduct;
