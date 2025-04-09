"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoryRouter = void 0;
const express_1 = require("express");
const category_controller_1 = require("../controllers/category.controller");
exports.categoryRouter = (0, express_1.Router)();
// ✅ Get all categories
exports.categoryRouter.get('/', category_controller_1.getCategories);
// ✅ Get a single category by ID
exports.categoryRouter.get('/id/:id', category_controller_1.getCategory);
exports.categoryRouter.get('/:name', category_controller_1.getCategoryByName);
// ✅ Create a new category
exports.categoryRouter.post('/', category_controller_1.createCategory);
// ✅ Update a category by ID
exports.categoryRouter.put('/:id', category_controller_1.updateCategory);
// ✅ Delete a category by ID
exports.categoryRouter.delete('/:id', category_controller_1.deleteCategory);
