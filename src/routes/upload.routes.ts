// routes/s3Routes.js
import express from 'express';
import { generatePresignedUrl } from '../controllers/upload.controller';

const router = express.Router();
router.get('/get-upload-url', generatePresignedUrl);
export default router;
