const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { auth, requireVerification } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get current user's profile
// @access  Private
router.get('/profile', auth, async (req, res, next) => {
  try {
    const user = await req.prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        profile: true,
        tokenWallet: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isVerified: user.isVerified,
          isEmailVerified: user.isEmailVerified,
          isPhoneVerified: user.isPhoneVerified,
          isAgeVerified: user.isAgeVerified,
          consentGiven: user.consentGiven,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
          profile: user.profile,
          tokenWallet: user.tokenWallet
        }
      }
    });

  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', [
  auth,
  body('firstName').optional().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().notEmpty().withMessage('Last name cannot be empty'),
  body('bio').optional().isLength({ max: 500 }).withMessage('Bio must be less than 500 characters'),
  body('location').optional().notEmpty().withMessage('Location cannot be empty'),
  body('services').optional().isArray().withMessage('Services must be an array'),
  body('hourlyRate').optional().isInt({ min: 1 }).withMessage('Hourly rate must be a positive integer'),
  body('availability').optional().isObject().withMessage('Availability must be an object')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const allowedFields = [
      'firstName', 'lastName', 'bio', 'location', 'services', 'hourlyRate', 'availability'
    ];

    const updateData = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid fields to update'
      });
    }

    const updatedProfile = await req.prisma.userProfile.update({
      where: { userId: req.user.id },
      data: updateData
    });

    logger.info(`Profile updated by user ${req.user.email}`);

    res.json({
      success: true,
      data: { profile: updatedProfile },
      message: 'Profile updated successfully'
    });

  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/users/password
// @desc    Change user password
// @access  Private
router.put('/password', [
  auth,
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.newPassword) {
      throw new Error('Password confirmation does not match');
    }
    return true;
  })
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;

    // Get user with password hash
    const user = await req.prisma.user.findUnique({
      where: { id: req.user.id }
    });

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 12);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    // Update password
    await req.prisma.user.update({
      where: { id: req.user.id },
      data: { passwordHash: newPasswordHash }
    });

    logger.info(`Password changed by user ${req.user.email}`);

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/users/email
// @desc    Change user email
// @access  Private
router.put('/email', [
  auth,
  body('newEmail').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { newEmail, password } = req.body;

    // Get user with password hash
    const user = await req.prisma.user.findUnique({
      where: { id: req.user.id }
    });

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        error: 'Password is incorrect'
      });
    }

    // Check if email already exists
    const existingUser = await req.prisma.user.findUnique({
      where: { email: newEmail }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Email already in use'
      });
    }

    // Update email and reset email verification
    await req.prisma.user.update({
      where: { id: req.user.id },
      data: {
        email: newEmail,
        isEmailVerified: false
      }
    });

    // Send verification email
    const { sendVerificationEmail } = require('../services/notificationService');
    await sendVerificationEmail(newEmail, req.user.id);

    logger.info(`Email changed by user ${req.user.id} from ${user.email} to ${newEmail}`);

    res.json({
      success: true,
      message: 'Email updated successfully. Please check your email to verify your new address.'
    });

  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/users/phone
// @desc    Change user phone number
// @access  Private
router.put('/phone', [
  auth,
  body('newPhone').isMobilePhone().withMessage('Valid phone number is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { newPhone, password } = req.body;

    // Get user with password hash
    const user = await req.prisma.user.findUnique({
      where: { id: req.user.id }
    });

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        error: 'Password is incorrect'
      });
    }

    // Check if phone already exists
    const existingUser = await req.prisma.user.findUnique({
      where: { phone: newPhone }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Phone number already in use'
      });
    }

    // Update phone and reset phone verification
    await req.prisma.user.update({
      where: { id: req.user.id },
      data: {
        phone: newPhone,
        isPhoneVerified: false
      }
    });

    logger.info(`Phone changed by user ${req.user.email} to ${newPhone}`);

    res.json({
      success: true,
      message: 'Phone number updated successfully. Please verify your new phone number.'
    });

  } catch (error) {
    next(error);
  }
});

// @route   GET /api/users/verification-status
// @desc    Get user's verification status
// @access  Private
router.get('/verification-status', auth, async (req, res, next) => {
  try {
    const verifications = await req.prisma.verification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        employee: {
          select: {
            profile: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    });

    res.json({
      success: true,
      data: {
        verifications: verifications.map(v => ({
          id: v.id,
          documentType: v.documentType,
          status: v.status,
          notes: v.notes,
          reviewedAt: v.reviewedAt,
          assignedAt: v.assignedAt,
          createdAt: v.createdAt,
          employee: v.employee?.profile ? 
            `${v.employee.profile.firstName} ${v.employee.profile.lastName}` : 
            null
        }))
      }
    });

  } catch (error) {
    next(error);
  }
});

// @route   GET /api/users/stats
// @desc    Get user's statistics
// @access  Private
router.get('/stats', [
  auth,
  requireVerification
], async (req, res, next) => {
  try {
    const stats = {};

    if (req.user.role === 'SEEKER') {
      // Seeker statistics
      const [totalBookings, completedBookings, tokensSpent] = await Promise.all([
        req.prisma.booking.count({
          where: { seekerId: req.user.id }
        }),
        req.prisma.booking.count({
          where: { 
            seekerId: req.user.id,
            status: 'COMPLETED'
          }
        }),
        req.prisma.tokenTransaction.aggregate({
          where: {
            userId: req.user.id,
            type: 'ESCROW_HOLD'
          },
          _sum: { amount: true }
        })
      ]);

      stats.totalBookings = totalBookings;
      stats.completedBookings = completedBookings;
      stats.tokensSpent = tokensSpent._sum.amount || 0;
      stats.completionRate = totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0;

    } else if (req.user.role === 'PROVIDER') {
      // Provider statistics
      const [totalBookings, completedBookings, tokensEarned, averageRating] = await Promise.all([
        req.prisma.booking.count({
          where: { providerId: req.user.id }
        }),
        req.prisma.booking.count({
          where: { 
            providerId: req.user.id,
            status: 'COMPLETED'
          }
        }),
        req.prisma.tokenTransaction.aggregate({
          where: {
            userId: req.user.id,
            type: 'ESCROW_RELEASE'
          },
          _sum: { amount: true }
        }),
        req.prisma.userProfile.findUnique({
          where: { userId: req.user.id },
          select: { rating: true, reviewCount: true }
        })
      ]);

      stats.totalBookings = totalBookings;
      stats.completedBookings = completedBookings;
      stats.tokensEarned = tokensEarned._sum.amount || 0;
      stats.averageRating = averageRating?.rating || 0;
      stats.reviewCount = averageRating?.reviewCount || 0;
      stats.completionRate = totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0;
    }

    res.json({
      success: true,
      data: { stats }
    });

  } catch (error) {
    next(error);
  }
});

// @route   GET /api/users/provider/:id
// @desc    Get provider profile (public)
// @access  Private
router.get('/provider/:id', [
  auth,
  requireVerification
], async (req, res, next) => {
  try {
    const { id } = req.params;

    const provider = await req.prisma.user.findUnique({
      where: { 
        id,
        role: 'PROVIDER',
        isVerified: true
      },
      include: {
        profile: {
          select: {
            firstName: true,
            lastName: true,
            bio: true,
            location: true,
            services: true,
            hourlyRate: true,
            profilePhoto: true,
            rating: true,
            reviewCount: true,
            availability: true
          }
        }
      }
    });

    if (!provider) {
      return res.status(404).json({
        success: false,
        error: 'Provider not found'
      });
    }

    // Get provider's completed bookings count
    const completedBookings = await req.prisma.booking.count({
      where: {
        providerId: id,
        status: 'COMPLETED'
      }
    });

    res.json({
      success: true,
      data: {
        provider: {
          id: provider.id,
          firstName: provider.profile.firstName,
          lastName: provider.profile.lastName,
          bio: provider.profile.bio,
          location: provider.profile.location,
          services: provider.profile.services,
          hourlyRate: provider.profile.hourlyRate,
          profilePhoto: provider.profile.profilePhoto,
          rating: provider.profile.rating,
          reviewCount: provider.profile.reviewCount,
          availability: provider.profile.availability,
          completedBookings
        }
      }
    });

  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/users/account
// @desc    Delete user account
// @access  Private
router.delete('/account', [
  auth,
  body('password').notEmpty().withMessage('Password is required'),
  body('confirmDelete').equals('DELETE').withMessage('Type DELETE to confirm')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { password } = req.body;

    // Get user with password hash
    const user = await req.prisma.user.findUnique({
      where: { id: req.user.id }
    });

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        error: 'Password is incorrect'
      });
    }

    // Check for active bookings
    const activeBookings = await req.prisma.booking.count({
      where: {
        OR: [
          { seekerId: req.user.id },
          { providerId: req.user.id }
        ],
        status: {
          in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS']
        }
      }
    });

    if (activeBookings > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete account with active bookings'
      });
    }

    // Delete user account and all related data
    await req.prisma.$transaction(async (prisma) => {
      // Delete related records
      await prisma.message.deleteMany({
        where: { senderId: req.user.id }
      });

      await prisma.tokenTransaction.deleteMany({
        where: { userId: req.user.id }
      });

      await prisma.tokenWallet.delete({
        where: { userId: req.user.id }
      });

      await prisma.verification.deleteMany({
        where: { userId: req.user.id }
      });

      await prisma.userProfile.delete({
        where: { userId: req.user.id }
      });

      await prisma.user.delete({
        where: { id: req.user.id }
      });
    });

    logger.info(`Account deleted by user ${req.user.email}`);

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });

  } catch (error) {
    next(error);
  }
});

// @route   GET /api/users/providers
// @desc    Get list of providers
// @access  Private
router.get('/providers', auth, async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, location, services } = req.query;
    const offset = (page - 1) * limit;

    const where = {
      role: 'PROVIDER',
      isVerified: true
    };

    if (search) {
      where.OR = [
        { profile: { firstName: { contains: search, mode: 'insensitive' } } },
        { profile: { lastName: { contains: search, mode: 'insensitive' } } },
        { profile: { bio: { contains: search, mode: 'insensitive' } } }
      ];
    }

    if (location) {
      where.profile = {
        ...where.profile,
        location: { contains: location, mode: 'insensitive' }
      };
    }

    if (services) {
      where.profile = {
        ...where.profile,
        services: { hasSome: services.split(',') }
      };
    }

    const [providers, total] = await Promise.all([
      req.prisma.user.findMany({
        where,
        skip: offset,
        take: parseInt(limit),
        include: {
          profile: {
            select: {
              firstName: true,
              lastName: true,
              bio: true,
              location: true,
              services: true,
              hourlyRate: true,
              rating: true,
              reviewCount: true,
              profilePhoto: true,
              availability: true
            }
          }
        },
        orderBy: { profile: { rating: 'desc' } }
      }),
      req.prisma.user.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        providers,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;