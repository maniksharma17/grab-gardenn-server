"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const zod_1 = require("zod");
const errorHandler = (err, req, res, next) => {
    if (err instanceof zod_1.ZodError) {
        return res.status(400).json({
            message: 'Validation error',
            errors: err.errors
        });
    }
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
};
exports.errorHandler = errorHandler;
