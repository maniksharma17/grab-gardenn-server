"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categorySchema = void 0;
const zod_1 = require("zod");
exports.categorySchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    description: zod_1.z.string().min(10),
    image: (zod_1.z.string().url()).optional(),
});
