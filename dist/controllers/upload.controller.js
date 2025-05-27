"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePresignedUrl = void 0;
// controllers/s3Controller.js
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const uuid_1 = require("uuid");
const s3 = new aws_sdk_1.default.S3({ region: 'ap-south-1' });
const generatePresignedUrl = async (req, res) => {
    const { filename, fileType } = req.query;
    if (!filename || !fileType) {
        return res.status(400).json({ error: 'Filename and fileType are required' });
    }
    const key = `${(0, uuid_1.v4)()}-${filename}`;
    const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
        ContentType: fileType,
        ACL: 'public-read',
        Expires: 60, // URL valid for 1 minute
    };
    try {
        const uploadUrl = await s3.getSignedUrlPromise('putObject', params);
        const fileUrl = `https://${params.Bucket}.s3.amazonaws.com/${key}`;
        res.json({ uploadUrl, fileUrl });
    }
    catch (error) {
        console.error('S3 URL Error:', error);
        res.status(500).json({ error: 'Failed to generate upload URL' });
    }
};
exports.generatePresignedUrl = generatePresignedUrl;
