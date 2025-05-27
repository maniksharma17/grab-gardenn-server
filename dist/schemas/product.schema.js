"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productSchema = void 0;
const zod_1 = require("zod");
exports.productSchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    hindiName: zod_1.z.string().min(2).optional(),
    description: zod_1.z.string().min(10),
    price: zod_1.z.array(zod_1.z.number().positive()),
    cutoffPrice: zod_1.z.array(zod_1.z.number().positive()),
    variants: zod_1.z.array(zod_1.z.object({
        display: zod_1.z.string().min(1),
        value: zod_1.z.number().positive().optional(),
    })),
    dimensions: zod_1.z.array(zod_1.z.object({
        length: zod_1.z.number().positive(),
        breadth: zod_1.z.number().positive(),
        height: zod_1.z.number().positive(),
    })),
    images: zod_1.z.array(zod_1.z.string().url()).optional(),
    category: zod_1.z.string(),
    benefits: zod_1.z.array(zod_1.z.string()),
    ingredients: zod_1.z.array(zod_1.z.string()),
    storage: zod_1.z.string().min(5),
    instructions: zod_1.z.array(zod_1.z.string()),
    stock: zod_1.z.number(),
});
