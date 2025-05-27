"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCategory = exports.updateCategory = exports.createCategory = exports.getCategoryByName = exports.getCategory = exports.getCategories = void 0;
const category_model_1 = require("../models/category.model");
const category_schema_1 = require("../schemas/category.schema");
const getCategories = async (req, res) => {
    const categories = await category_model_1.Category.find();
    res.status(200).json(categories);
};
exports.getCategories = getCategories;
const getCategory = async (req, res) => {
    const category = await category_model_1.Category.findById(req.params.id).populate('products');
    if (!category) {
        return res.status(404).json({ message: 'Category not found' });
    }
    res.json({ category });
};
exports.getCategory = getCategory;
const getCategoryByName = async (req, res) => {
    const category = await category_model_1.Category.find({ name: req.params.name }).populate('products');
    if (!category) {
        return res.status(404).json({ message: 'Category not found' });
    }
    res.json({ category });
};
exports.getCategoryByName = getCategoryByName;
const createCategory = async (req, res) => {
    try {
        const categoryData = req.body;
        const isValid = category_schema_1.categorySchema.safeParse(categoryData);
        if (!isValid.success) {
            res.json({ message: "Invalid data" });
            return;
        }
        const newCategory = await category_model_1.Category.create(categoryData);
        res.status(201).json(newCategory);
    }
    catch (error) {
        res.status(400).json({ message: "Server error" });
    }
};
exports.createCategory = createCategory;
const updateCategory = async (req, res) => {
    try {
        const categoryData = req.body;
        const isValid = category_schema_1.categorySchema.safeParse(categoryData);
        if (!isValid.success) {
            res.json({ message: "Invalid data" });
            return;
        }
        const { id } = req.params;
        const updatedCategory = await category_model_1.Category.findByIdAndUpdate(id, categoryData, { new: true, runValidators: true });
        res.status(201).json(updatedCategory);
    }
    catch (error) {
        res.status(400).json({ message: "Server Error" });
    }
};
exports.updateCategory = updateCategory;
const deleteCategory = async (req, res) => {
    try {
        const deletedCategory = await category_model_1.Category.findByIdAndDelete(req.params.id);
        if (!exports.deleteCategory) {
            return res.status(404).json({ message: 'Category not found' });
        }
        res.json({ message: 'Category deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};
exports.deleteCategory = deleteCategory;
