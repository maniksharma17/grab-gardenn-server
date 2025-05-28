// controllers/s3Controller.js
import AWS from 'aws-sdk';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const s3 = new AWS.S3({ region: 'ap-south-1' });

export const generatePresignedUrl = async (req: Request, res: Response) => {
  const { filename, fileType } = req.query;

  if (!filename || !fileType) {
    return res.status(400).json({ error: 'Filename and fileType are required' });
  }

  const key = `${uuidv4()}-${filename}`;

  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    ContentType: fileType,
    Expires: 120, 
  };

  try {
    const uploadUrl = await s3.getSignedUrlPromise('putObject', params);
    const fileUrl = `https://${params.Bucket}.s3.amazonaws.com/${key}`;
    res.json({ uploadUrl, fileUrl });
  } catch (error) {
    console.error('S3 URL Error:', error);
    res.status(500).json({ error: 'Failed to generate upload URL' });
  }
};
