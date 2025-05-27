"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const wishlist_controller_1 = require("../controllers/wishlist.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const wishlistRouter = express_1.default.Router();
wishlistRouter.use(auth_middleware_1.auth);
wishlistRouter.get('/:id', wishlist_controller_1.getWishlist);
wishlistRouter.post('/add/:id', wishlist_controller_1.addToWishlist);
wishlistRouter.post('/remove/:id', wishlist_controller_1.removeFromWishlist);
wishlistRouter.delete('/:id', wishlist_controller_1.clearWishlist);
exports.default = wishlistRouter;
