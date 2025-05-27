"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const review_controller_1 = require("../controllers/review.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const reviewRouter = express_1.default.Router();
// GET: All reviews for a product
reviewRouter.get('/:productId', review_controller_1.getReviewsForProduct);
// POST: Add a review (expects userId in params)
reviewRouter.post('/:userId', auth_middleware_1.auth, review_controller_1.addReview);
// DELETE: Delete a review (needs both productId and userId)
reviewRouter.delete('/:productId/:userId', auth_middleware_1.auth, review_controller_1.deleteReview);
exports.default = reviewRouter;
