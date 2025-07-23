import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate, AuthRequest } from '../middleware/auth';
import { prisma } from '../utils/database';
import { logger } from '../utils/logger';
import { asyncHandler } from '../middleware/errorHandler';
import { auditLog } from '../services/auditService';

const router = express.Router();

// Get user profile
router.get('/profile', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: {
      profile: true,
      tokenWallet: {
        select: {
          balance: true,
          escrowBalance: true,
          totalPurchased: true,
          totalSpent: true
        }
      }
    }
  });

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({
    id: user.id,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isVerified: user.isVerified,
    verificationStatus: user.verificationStatus,
    profile: user.profile,
    tokenWallet: user.tokenWallet,
    createdAt: user.createdAt
  });
}));

// Update user profile
router.put('/profile', [
  authenticate,
  body('firstName').optional().trim().isLength({ min: 2 }),
  body('lastName').optional().trim().isLength({ min: 2 }),
  body('bio').optional().isLength({ max: 500 }),
  body('location').optional().isString(),
  body('services').optional().isArray(),
  body('hourlyRate').optional().isInt({ min: 1 }),
  body('availability').optional().isObject()
], asyncHandler(async (req: AuthRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    firstName,
    lastName,
    bio,
    location,
    services,
    hourlyRate,
    availability
  } = req.body;

  const updateData: any = {};
  
  if (firstName !== undefined) updateData.firstName = firstName;
  if (lastName !== undefined) updateData.lastName = lastName;
  if (bio !== undefined) updateData.bio = bio;
  if (location !== undefined) updateData.location = location;
  if (services !== undefined) updateData.services = services;
  if (hourlyRate !== undefined) updateData.hourlyRate = hourlyRate;
  if (availability !== undefined) updateData.availability = availability;

  const profile = await prisma.profile.update({
    where: { userId: req.user!.id },
    data: updateData
  });

  // Audit log
  await auditLog(
    req.user!.id,
    'PROFILE_UPDATED',
    'profile',
    profile.id,
    updateData,
    req.ip,
    req.get('User-Agent')
  );

  res.json({
    message: 'Profile updated successfully',
    profile
  });
}));

// Upload profile image
router.post('/upload-profile-image', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  // This would typically handle file upload to S3
  // For now, we'll just accept a URL
  const { imageUrl } = req.body;

  if (!imageUrl) {
    return res.status(400).json({ error: 'Image URL required' });
  }

  const profile = await prisma.profile.update({
    where: { userId: req.user!.id },
    data: { profileImageUrl: imageUrl }
  });

  await auditLog(
    req.user!.id,
    'PROFILE_IMAGE_UPDATED',
    'profile',
    profile.id,
    { imageUrl },
    req.ip,
    req.get('User-Agent')
  );

  res.json({
    message: 'Profile image updated successfully',
    imageUrl: profile.profileImageUrl
  });
}));

// Get verification status
router.get('/verification-status', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const verifications = await prisma.verification.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: 'desc' }
  });

  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      isVerified: true,
      verificationStatus: true
    }
  });

  res.json({
    isVerified: user?.isVerified,
    verificationStatus: user?.verificationStatus,
    verifications: verifications.map(v => ({
      id: v.id,
      type: v.type,
      status: v.status,
      notes: v.notes,
      createdAt: v.createdAt,
      reviewedAt: v.reviewedAt
    }))
  });
}));

// Submit verification documents
router.post('/submit-verification', [
  authenticate,
  body('type').isIn(['age', 'identity', 'provider_documents']),
  body('documentUrls').isArray().isLength({ min: 1 })
], asyncHandler(async (req: AuthRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { type, documentUrls } = req.body;

  // Check if verification already exists and is pending
  const existingVerification = await prisma.verification.findFirst({
    where: {
      userId: req.user!.id,
      type,
      status: 'PENDING'
    }
  });

  if (existingVerification) {
    return res.status(400).json({ error: 'Verification already pending for this type' });
  }

  const verification = await prisma.verification.create({
    data: {
      userId: req.user!.id,
      type,
      documentUrls,
      status: 'PENDING'
    }
  });

  // Assign to employee for review
  // This would trigger the round-robin assignment
  
  await auditLog(
    req.user!.id,
    'VERIFICATION_SUBMITTED',
    'verification',
    verification.id,
    { type, documentCount: documentUrls.length },
    req.ip,
    req.get('User-Agent')
  );

  res.status(201).json({
    message: 'Verification documents submitted successfully',
    verification: {
      id: verification.id,
      type: verification.type,
      status: verification.status,
      createdAt: verification.createdAt
    }
  });
}));

// Delete account
router.delete('/account', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;

  // Check for active bookings
  const activeBookings = await prisma.booking.count({
    where: {
      OR: [
        { seekerId: userId },
        { providerId: userId }
      ],
      status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] }
    }
  });

  if (activeBookings > 0) {
    return res.status(400).json({ 
      error: 'Cannot delete account with active bookings. Please complete or cancel all bookings first.' 
    });
  }

  // Soft delete - deactivate account
  await prisma.user.update({
    where: { id: userId },
    data: { isActive: false }
  });

  await auditLog(
    userId,
    'ACCOUNT_DELETED',
    'user',
    userId,
    {},
    req.ip,
    req.get('User-Agent')
  );

  logger.info(`User account deleted: ${userId}`);

  res.json({ message: 'Account deleted successfully' });
}));

export { router as userRoutes };