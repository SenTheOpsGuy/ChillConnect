import express from 'express';
import multer from 'multer';
import AWS from 'aws-sdk';
import { authenticate, AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';
import { asyncHandler } from '../middleware/errorHandler';
import { auditLog } from '../services/auditService';
import { prisma } from '../utils/database';

const router = express.Router();

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow only images and documents
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Upload profile image
router.post('/profile-image', [
  authenticate,
  upload.single('image')
], asyncHandler(async (req: AuthRequest, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const file = req.file;
  const userId = req.user!.id;
  const fileName = `profile-images/${userId}-${Date.now()}.${file.originalname.split('.').pop()}`;

  try {
    const uploadParams = {
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read'
    };

    const result = await s3.upload(uploadParams).promise();
    
    // Update user profile with image URL
    await prisma.profile.update({
      where: { userId },
      data: { profileImageUrl: result.Location }
    });

    await auditLog(
      userId,
      'PROFILE_IMAGE_UPLOADED',
      'profile',
      userId,
      { fileName, fileSize: file.size },
      req.ip,
      req.get('User-Agent')
    );

    logger.info(`Profile image uploaded for user ${userId}: ${fileName}`);

    res.json({
      message: 'Profile image uploaded successfully',
      imageUrl: result.Location
    });
  } catch (error) {
    logger.error('Profile image upload failed:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
}));

// Upload verification documents
router.post('/verification-documents', [
  authenticate,
  upload.array('documents', 5)
], asyncHandler(async (req: AuthRequest, res) => {
  if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' });
  }

  const files = req.files as Express.Multer.File[];
  const userId = req.user!.id;
  const uploadedUrls: string[] = [];

  try {
    for (const file of files) {
      const fileName = `verification-docs/${userId}-${Date.now()}-${file.originalname}`;
      
      const uploadParams = {
        Bucket: process.env.AWS_S3_BUCKET!,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'private' // Verification documents should be private
      };

      const result = await s3.upload(uploadParams).promise();
      uploadedUrls.push(result.Location);
    }

    await auditLog(
      userId,
      'VERIFICATION_DOCUMENTS_UPLOADED',
      'verification',
      userId,
      { documentCount: files.length, totalSize: files.reduce((sum, f) => sum + f.size, 0) },
      req.ip,
      req.get('User-Agent')
    );

    logger.info(`Verification documents uploaded for user ${userId}: ${files.length} files`);

    res.json({
      message: 'Verification documents uploaded successfully',
      documentUrls: uploadedUrls
    });
  } catch (error) {
    logger.error('Verification documents upload failed:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
}));

// Upload chat media
router.post('/chat-media', [
  authenticate,
  upload.single('media')
], asyncHandler(async (req: AuthRequest, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const file = req.file;
  const userId = req.user!.id;
  const { bookingId } = req.body;

  if (!bookingId) {
    return res.status(400).json({ error: 'Booking ID required' });
  }

  // Verify user is part of the booking
  const booking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      OR: [
        { seekerId: userId },
        { providerId: userId }
      ]
    }
  });

  if (!booking) {
    return res.status(403).json({ error: 'Access denied to this booking' });
  }

  const fileName = `chat-media/${bookingId}/${userId}-${Date.now()}.${file.originalname.split('.').pop()}`;

  try {
    const uploadParams = {
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'private'
    };

    const result = await s3.upload(uploadParams).promise();

    await auditLog(
      userId,
      'CHAT_MEDIA_UPLOADED',
      'message',
      bookingId,
      { fileName, fileSize: file.size, mediaType: file.mimetype },
      req.ip,
      req.get('User-Agent')
    );

    logger.info(`Chat media uploaded for booking ${bookingId} by user ${userId}: ${fileName}`);

    res.json({
      message: 'Media uploaded successfully',
      mediaUrl: result.Location
    });
  } catch (error) {
    logger.error('Chat media upload failed:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
}));

// Get signed URL for private file access
router.get('/signed-url/:key', [
  authenticate
], asyncHandler(async (req: AuthRequest, res) => {
  const { key } = req.params;
  const userId = req.user!.id;

  // Verify user has access to this file
  // This is a simplified check - in production, you'd have more sophisticated access control
  if (!key.includes(userId) && !['ADMIN', 'SUPER_ADMIN'].includes(req.user!.role)) {
    return res.status(403).json({ error: 'Access denied to this file' });
  }

  try {
    const signedUrl = s3.getSignedUrl('getObject', {
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: key,
      Expires: 3600 // 1 hour
    });

    res.json({ signedUrl });
  } catch (error) {
    logger.error('Signed URL generation failed:', error);
    res.status(500).json({ error: 'Failed to generate signed URL' });
  }
}));

export { router as uploadRoutes };