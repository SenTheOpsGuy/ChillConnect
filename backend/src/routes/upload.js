const express = require('express');
const multer = require('multer');
const multerS3 = require('multer-s3');
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const { auth, requireVerification } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Configure AWS S3
const s3 = new AWS.S3({
  region: process.env.S3_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

// File validation
const fileFilter = (req, file, cb) => {
  // Allow only specific file types
  const allowedMimes = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'application/pdf': 'pdf'
  };

  if (allowedMimes[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, WebP, and PDF files are allowed.'), false);
  }
};

// Configure multer storage (S3 or local)
let upload;

if (process.env.AWS_S3_BUCKET && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  // S3 configuration when credentials are available
  upload = multer({
    storage: multerS3({
      s3: s3,
      bucket: process.env.AWS_S3_BUCKET,
      acl: 'private', // Files are private by default
      key: function (req, file, cb) {
        const folder = getUploadFolder(req.uploadType);
        const fileExtension = file.originalname.split('.').pop();
        const filename = `${folder}/${uuidv4()}.${fileExtension}`;
        cb(null, filename);
      },
    metadata: function (req, file, cb) {
      cb(null, {
        fieldName: file.fieldname,
        originalName: file.originalname,
        uploadedBy: req.user.id,
        uploadedAt: new Date().toISOString()
      });
    },
    contentType: multerS3.AUTO_CONTENT_TYPE
  }),
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Max 5 files per request
  }
});
} else {
  // Local file storage fallback when S3 is not configured
  const fs = require('fs');
  const path = require('path');
  
  // Ensure uploads directory exists
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  
  upload = multer({
    storage: multer.diskStorage({
      destination: function (req, file, cb) {
        const folder = getUploadFolder(req.uploadType);
        const uploadPath = path.join(uploadsDir, folder);
        if (!fs.existsSync(uploadPath)) {
          fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
      },
      filename: function (req, file, cb) {
        const fileExtension = file.originalname.split('.').pop();
        const filename = `${uuidv4()}.${fileExtension}`;
        cb(null, filename);
      }
    }),
    fileFilter: fileFilter,
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
      files: 5 // Max 5 files per request
    }
  });
  
  logger.warn('S3 configuration not found, using local file storage. This is not recommended for production.');
}

// Get upload folder based on upload type
const getUploadFolder = (uploadType) => {
  switch (uploadType) {
    case 'profile':
      return 'profiles';
    case 'verification':
      return 'verification-documents';
    case 'chat':
      return 'chat-media';
    default:
      return 'misc';
  }
};

// Middleware to set upload type
const setUploadType = (type) => {
  return (req, res, next) => {
    req.uploadType = type;
    next();
  };
};

// @route   POST /api/upload/profile
// @desc    Upload profile photo
// @access  Private
router.post('/profile', [
  auth,
  requireVerification,
  setUploadType('profile'),
  upload.single('photo')
], async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const fileUrl = req.file.location;
    const fileKey = req.file.key;

    // Update user profile with photo URL
    await req.prisma.userProfile.update({
      where: { userId: req.user.id },
      data: { profilePhoto: fileUrl }
    });

    // Log the upload
    logger.info(`Profile photo uploaded by user ${req.user.id}: ${fileKey}`);

    res.json({
      success: true,
      data: {
        url: fileUrl,
        key: fileKey,
        size: req.file.size,
        mimetype: req.file.mimetype
      },
      message: 'Profile photo uploaded successfully'
    });

  } catch (error) {
    // Clean up uploaded file on error
    if (req.file && req.file.key) {
      try {
        await s3.deleteObject({
          Bucket: process.env.S3_BUCKET_NAME,
          Key: req.file.key
        }).promise();
      } catch (deleteError) {
        logger.error('Error deleting uploaded file:', deleteError);
      }
    }
    next(error);
  }
});

// @route   POST /api/upload/verification
// @desc    Upload verification documents
// @access  Private
router.post('/verification', [
  auth,
  setUploadType('verification'),
  upload.array('documents', 5)
], async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files uploaded'
      });
    }

    const { documentType = 'ID' } = req.body;

    const uploadedFiles = req.files.map(file => ({
      url: file.location,
      key: file.key,
      size: file.size,
      mimetype: file.mimetype,
      originalName: file.originalname
    }));

    // Create verification record
    const verification = await req.prisma.verification.create({
      data: {
        userId: req.user.id,
        documentType,
        documentUrl: uploadedFiles[0].url, // Primary document
        status: 'PENDING'
      }
    });

    // Update user profile with document URLs
    await req.prisma.userProfile.update({
      where: { userId: req.user.id },
      data: {
        verificationDocs: {
          push: uploadedFiles.map(file => file.url)
        }
      }
    });

    // Assign verification to employee
    const assignmentService = require('../services/assignmentService');
    await assignmentService.assignVerification(verification.id);

    logger.info(`Verification documents uploaded by user ${req.user.id}: ${uploadedFiles.length} files`);

    res.json({
      success: true,
      data: {
        verification: {
          id: verification.id,
          status: verification.status,
          documentType: verification.documentType
        },
        files: uploadedFiles
      },
      message: 'Verification documents uploaded successfully'
    });

  } catch (error) {
    // Clean up uploaded files on error
    if (req.files && req.files.length > 0) {
      const deletePromises = req.files.map(file => 
        s3.deleteObject({
          Bucket: process.env.S3_BUCKET_NAME,
          Key: file.key
        }).promise()
      );
      
      try {
        await Promise.all(deletePromises);
      } catch (deleteError) {
        logger.error('Error deleting uploaded files:', deleteError);
      }
    }
    next(error);
  }
});

// @route   POST /api/upload/chat
// @desc    Upload chat media
// @access  Private
router.post('/chat', [
  auth,
  requireVerification,
  setUploadType('chat'),
  upload.single('media')
], async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        error: 'Booking ID is required'
      });
    }

    // Verify user has access to this booking
    const booking = await req.prisma.booking.findUnique({
      where: { id: bookingId }
    });

    if (!booking || (req.user.id !== booking.seekerId && req.user.id !== booking.providerId)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const fileUrl = req.file.location;
    const fileKey = req.file.key;

    logger.info(`Chat media uploaded by user ${req.user.id} for booking ${bookingId}: ${fileKey}`);

    res.json({
      success: true,
      data: {
        url: fileUrl,
        key: fileKey,
        size: req.file.size,
        mimetype: req.file.mimetype
      },
      message: 'Media uploaded successfully'
    });

  } catch (error) {
    // Clean up uploaded file on error
    if (req.file && req.file.key) {
      try {
        await s3.deleteObject({
          Bucket: process.env.S3_BUCKET_NAME,
          Key: req.file.key
        }).promise();
      } catch (deleteError) {
        logger.error('Error deleting uploaded file:', deleteError);
      }
    }
    next(error);
  }
});

// @route   GET /api/upload/signed-url
// @desc    Get signed URL for private file access
// @access  Private
router.get('/signed-url', [
  auth,
  requireVerification
], async (req, res, next) => {
  try {
    const { key } = req.query;

    if (!key) {
      return res.status(400).json({
        success: false,
        error: 'File key is required'
      });
    }

    // Verify user has access to this file
    const hasAccess = await verifyFileAccess(req.user.id, key, req.prisma);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Generate signed URL (expires in 1 hour)
    const signedUrl = s3.getSignedUrl('getObject', {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
      Expires: 3600 // 1 hour
    });

    res.json({
      success: true,
      data: {
        url: signedUrl,
        expiresIn: 3600
      }
    });

  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/upload/file
// @desc    Delete uploaded file
// @access  Private
router.delete('/file', [
  auth,
  requireVerification
], async (req, res, next) => {
  try {
    const { key } = req.body;

    if (!key) {
      return res.status(400).json({
        success: false,
        error: 'File key is required'
      });
    }

    // Verify user has access to delete this file
    const hasAccess = await verifyFileAccess(req.user.id, key, req.prisma);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Delete file from S3
    await s3.deleteObject({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key
    }).promise();

    // Remove file reference from database
    await removeFileReference(req.user.id, key, req.prisma);

    logger.info(`File deleted by user ${req.user.id}: ${key}`);

    res.json({
      success: true,
      message: 'File deleted successfully'
    });

  } catch (error) {
    next(error);
  }
});

// Helper function to verify file access
const verifyFileAccess = async (userId, fileKey, prisma) => {
  try {
    // Check if file belongs to user's profile
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId }
    });

    if (userProfile && userProfile.profilePhoto && userProfile.profilePhoto.includes(fileKey)) {
      return true;
    }

    // Check if file is in user's verification documents
    if (userProfile && userProfile.verificationDocs) {
      const hasDoc = userProfile.verificationDocs.some(doc => doc.includes(fileKey));
      if (hasDoc) return true;
    }

    // Check if file is in user's chat messages
    const chatMessage = await prisma.message.findFirst({
      where: {
        senderId: userId,
        mediaUrl: {
          contains: fileKey
        }
      }
    });

    if (chatMessage) return true;

    // Admin users can access any file
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (user && ['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return true;
    }

    return false;
  } catch (error) {
    logger.error('Error verifying file access:', error);
    return false;
  }
};

// Helper function to remove file reference from database
const removeFileReference = async (userId, fileKey, prisma) => {
  try {
    // Remove from user profile
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId }
    });

    if (userProfile) {
      // Remove profile photo if it matches
      if (userProfile.profilePhoto && userProfile.profilePhoto.includes(fileKey)) {
        await prisma.userProfile.update({
          where: { userId },
          data: { profilePhoto: null }
        });
      }

      // Remove from verification documents
      if (userProfile.verificationDocs) {
        const updatedDocs = userProfile.verificationDocs.filter(doc => !doc.includes(fileKey));
        await prisma.userProfile.update({
          where: { userId },
          data: { verificationDocs: updatedDocs }
        });
      }
    }

    // Remove from chat messages
    await prisma.message.updateMany({
      where: {
        senderId: userId,
        mediaUrl: {
          contains: fileKey
        }
      },
      data: {
        mediaUrl: null
      }
    });

  } catch (error) {
    logger.error('Error removing file reference:', error);
  }
};

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File size too large. Maximum size is 10MB.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'Too many files. Maximum 5 files per request.'
      });
    }
    return res.status(400).json({
      success: false,
      error: 'File upload error: ' + error.message
    });
  }
  next(error);
});

module.exports = router;