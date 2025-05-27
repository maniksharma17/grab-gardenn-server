"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// routes/s3Routes.js
const express_1 = __importDefault(require("express"));
const upload_controller_1 = require("../controllers/upload.controller");
const router = express_1.default.Router();
router.get('/get-upload-url', upload_controller_1.generatePresignedUrl);
exports.default = router;
