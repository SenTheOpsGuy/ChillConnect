const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { auth, authorize, requireVerification } = require('../middleware/auth');
const logger = require('../utils/logger');
const { sendBookingConfirmationEmail } = require('../services/notificationService');
const assignmentService = require('../services/assignmentService');

const router = express.Router();

// @route   GET /api/bookings/search
// @desc    Search for providers
// @access  Private (Seekers only)
router.get('/search', [
  auth,
  authorize('SEEKER'),
  requireVerification,
  query('location').optional().isString(),
  query('service').optional().isString(),
  query('date').optional().isISO8601(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 })
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

    const { location, service, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    // Build search filters
    const whereClause = {
      role: 'PROVIDER',
      isVerified: true,
      profile: {
        isNot: null
      }
    };

    // Add location filter if provided
    if (location) {
      whereClause.profile.location = {
        contains: location,
        mode: 'insensitive'
      };
    }

    // Add service filter if provided
    if (service) {
      whereClause.profile.services = {
        has: service
      };
    }

    // Search providers
    const providers = await req.prisma.user.findMany({
      where: whereClause,
      skip: parseInt(skip),
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
            profilePhoto: true,
            rating: true,
            reviewCount: true,
            availability: true
          }
        }
      },
      orderBy: {
        profile: {
          rating: 'desc'
        }
      }
    });

    const totalProviders = await req.prisma.user.count({
      where: whereClause
    });

    // Format response
    const formattedProviders = providers.map(provider => ({
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
      availability: provider.profile.availability
    }));

    res.json({
      success: true,
      data: {
        providers: formattedProviders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalProviders,
          totalPages: Math.ceil(totalProviders / limit)
        }
      }
    });

  } catch (error) {
    next(error);
  }
});

// @route   GET /api/bookings/provider/:id
// @desc    Get provider details
// @access  Private (Seekers only)
router.get('/provider/:id', [
  auth,
  authorize('SEEKER'),
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

    // Get provider's recent reviews (optional feature)
    const recentBookings = await req.prisma.booking.findMany({
      where: {
        providerId: id,
        status: 'COMPLETED'
      },
      take: 5,
      orderBy: { completedAt: 'desc' },
      include: {
        seeker: {
          select: {
            profile: {
              select: {
                firstName: true
              }
            }
          }
        }
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
          availability: provider.profile.availability
        },
        recentBookings: recentBookings.map(booking => ({
          id: booking.id,
          date: booking.startTime,
          seekerName: booking.seeker.profile.firstName
        }))
      }
    });

  } catch (error) {
    next(error);
  }
});

// @route   POST /api/bookings/create
// @desc    Create new booking
// @access  Private (Seekers only)
router.post('/create', [
  auth,
  authorize('SEEKER'),
  requireVerification,
  body('providerId').isUUID().withMessage('Valid provider ID is required'),
  body('type').isIn(['INCALL', 'OUTCALL']).withMessage('Type must be INCALL or OUTCALL'),
  body('startTime').isISO8601().withMessage('Valid start time is required'),
  body('duration').isInt({ min: 30 }).withMessage('Duration must be at least 30 minutes'),
  body('location').optional().isString().withMessage('Location must be a string'),
  body('notes').optional().isString().withMessage('Notes must be a string')
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

    const { providerId, type, startTime, duration, location, notes } = req.body;

    // Validate start time is in the future
    const bookingStart = new Date(startTime);
    if (bookingStart <= new Date()) {
      return res.status(400).json({
        success: false,
        error: 'Booking time must be in the future'
      });
    }

    // Get provider details
    const provider = await req.prisma.user.findUnique({
      where: { 
        id: providerId,
        role: 'PROVIDER',
        isVerified: true
      },
      include: {
        profile: true
      }
    });

    if (!provider) {
      return res.status(404).json({
        success: false,
        error: 'Provider not found'
      });
    }

    // Calculate end time and cost
    const endTime = new Date(bookingStart.getTime() + duration * 60000);
    const tokenAmount = Math.ceil((duration / 60) * provider.profile.hourlyRate);

    // Check if seeker has enough tokens
    const seekerWallet = await req.prisma.tokenWallet.findUnique({
      where: { userId: req.user.id }
    });

    if (seekerWallet.balance < tokenAmount) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient tokens',
        required: tokenAmount,
        available: seekerWallet.balance
      });
    }

    // Check for conflicting bookings
    const conflictingBooking = await req.prisma.booking.findFirst({
      where: {
        providerId,
        status: {
          in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS']
        },
        OR: [
          {
            startTime: {
              lte: bookingStart
            },
            endTime: {
              gt: bookingStart
            }
          },
          {
            startTime: {
              lt: endTime
            },
            endTime: {
              gte: endTime
            }
          }
        ]
      }
    });

    if (conflictingBooking) {
      return res.status(400).json({
        success: false,
        error: 'Provider is not available at this time'
      });
    }

    // Create booking and handle token escrow in transaction
    const booking = await req.prisma.$transaction(async (prisma) => {
      // Create booking
      const newBooking = await prisma.booking.create({
        data: {
          seekerId: req.user.id,
          providerId,
          type,
          startTime: bookingStart,
          endTime,
          duration,
          tokenAmount,
          location: type === 'OUTCALL' ? location : null,
          notes,
          status: 'PENDING'
        },
        include: {
          seeker: {
            include: {
              profile: true
            }
          },
          provider: {
            include: {
              profile: true
            }
          }
        }
      });

      // Move tokens to escrow
      await prisma.tokenWallet.update({
        where: { userId: req.user.id },
        data: {
          balance: {
            decrement: tokenAmount
          },
          escrowBalance: {
            increment: tokenAmount
          },
          totalSpent: {
            increment: tokenAmount
          }
        }
      });

      // Create transaction record
      await prisma.tokenTransaction.create({
        data: {
          userId: req.user.id,
          walletId: seekerWallet.id,
          type: 'ESCROW_HOLD',
          amount: tokenAmount,
          previousBalance: seekerWallet.balance,
          newBalance: seekerWallet.balance - tokenAmount,
          description: `Escrow hold for booking ${newBooking.id}`,
          bookingId: newBooking.id
        }
      });

      return newBooking;
    });

    // Assign employee for monitoring using round-robin
    await assignmentService.assignBookingMonitoring(booking.id);

    // Send confirmation emails
    await sendBookingConfirmationEmail(req.user.email, {
      id: booking.id,
      date: bookingStart.toDateString(),
      time: bookingStart.toTimeString(),
      type: type.toLowerCase(),
      amount: tokenAmount
    });

    logger.info(`Booking created: ${booking.id} by ${req.user.email}`);

    res.status(201).json({
      success: true,
      data: {
        booking: {
          id: booking.id,
          providerId: booking.providerId,
          providerName: `${booking.provider.profile.firstName} ${booking.provider.profile.lastName}`,
          type: booking.type,
          startTime: booking.startTime,
          endTime: booking.endTime,
          duration: booking.duration,
          tokenAmount: booking.tokenAmount,
          location: booking.location,
          notes: booking.notes,
          status: booking.status
        }
      },
      message: 'Booking created successfully'
    });

  } catch (error) {
    next(error);
  }
});

// @route   GET /api/bookings/my-bookings
// @desc    Get user's bookings
// @access  Private
router.get('/my-bookings', [
  auth,
  requireVerification,
  query('status').optional().isIn(['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DISPUTED']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 })
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

    const { status, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    // Build where clause based on user role
    const whereClause = {
      ...(req.user.role === 'SEEKER' ? { seekerId: req.user.id } : { providerId: req.user.id }),
      ...(status && { status })
    };

    const bookings = await req.prisma.booking.findMany({
      where: whereClause,
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        seeker: {
          select: {
            profile: {
              select: {
                firstName: true,
                lastName: true,
                profilePhoto: true
              }
            }
          }
        },
        provider: {
          select: {
            profile: {
              select: {
                firstName: true,
                lastName: true,
                profilePhoto: true
              }
            }
          }
        }
      }
    });

    const totalBookings = await req.prisma.booking.count({
      where: whereClause
    });

    res.json({
      success: true,
      data: {
        bookings: bookings.map(booking => ({
          id: booking.id,
          type: booking.type,
          startTime: booking.startTime,
          endTime: booking.endTime,
          duration: booking.duration,
          tokenAmount: booking.tokenAmount,
          location: booking.location,
          notes: booking.notes,
          status: booking.status,
          createdAt: booking.createdAt,
          seeker: booking.seeker.profile,
          provider: booking.provider.profile
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalBookings,
          totalPages: Math.ceil(totalBookings / limit)
        }
      }
    });

  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/bookings/:id/status
// @desc    Update booking status
// @access  Private
router.put('/:id/status', [
  auth,
  requireVerification,
  body('status').isIn(['CONFIRMED', 'CANCELLED', 'IN_PROGRESS', 'COMPLETED']).withMessage('Invalid status'),
  body('reason').optional().isString().withMessage('Reason must be a string')
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

    const { id } = req.params;
    const { status } = req.body;

    // Get booking
    const booking = await req.prisma.booking.findUnique({
      where: { id },
      include: {
        seeker: {
          include: {
            profile: true,
            tokenWallet: true
          }
        },
        provider: {
          include: {
            profile: true,
            tokenWallet: true
          }
        }
      }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    // Check permissions
    const isSeeker = req.user.id === booking.seekerId;
    const isProvider = req.user.id === booking.providerId;
    const isAdmin = ['EMPLOYEE', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'].includes(req.user.role);

    if (!isSeeker && !isProvider && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Validate status transitions
    const validTransitions = {
      PENDING: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['IN_PROGRESS', 'CANCELLED'],
      IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
      COMPLETED: [],
      CANCELLED: [],
      DISPUTED: []
    };

    if (!validTransitions[booking.status].includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Cannot change status from ${booking.status} to ${status}`
      });
    }

    // Update booking status
    const updatedBooking = await req.prisma.$transaction(async (prisma) => {
      const updated = await prisma.booking.update({
        where: { id },
        data: {
          status,
          ...(status === 'COMPLETED' && { completedAt: new Date() })
        }
      });

      // Handle token escrow release for completed bookings
      if (status === 'COMPLETED') {
        // Release tokens to provider
        await prisma.tokenWallet.update({
          where: { userId: booking.providerId },
          data: {
            balance: {
              increment: booking.tokenAmount
            },
            totalEarned: {
              increment: booking.tokenAmount
            }
          }
        });

        // Remove from seeker's escrow
        await prisma.tokenWallet.update({
          where: { userId: booking.seekerId },
          data: {
            escrowBalance: {
              decrement: booking.tokenAmount
            }
          }
        });

        // Create transaction records
        await prisma.tokenTransaction.create({
          data: {
            userId: booking.providerId,
            walletId: booking.provider.tokenWallet.id,
            type: 'ESCROW_RELEASE',
            amount: booking.tokenAmount,
            previousBalance: booking.provider.tokenWallet.balance,
            newBalance: booking.provider.tokenWallet.balance + booking.tokenAmount,
            description: `Payment for completed booking ${booking.id}`,
            bookingId: booking.id
          }
        });
      }

      // Handle token refund for cancelled bookings
      if (status === 'CANCELLED') {
        // Refund tokens to seeker
        await prisma.tokenWallet.update({
          where: { userId: booking.seekerId },
          data: {
            balance: {
              increment: booking.tokenAmount
            },
            escrowBalance: {
              decrement: booking.tokenAmount
            },
            totalSpent: {
              decrement: booking.tokenAmount
            }
          }
        });

        // Create transaction record
        await prisma.tokenTransaction.create({
          data: {
            userId: booking.seekerId,
            walletId: booking.seeker.tokenWallet.id,
            type: 'BOOKING_REFUND',
            amount: booking.tokenAmount,
            previousBalance: booking.seeker.tokenWallet.balance,
            newBalance: booking.seeker.tokenWallet.balance + booking.tokenAmount,
            description: `Refund for cancelled booking ${booking.id}`,
            bookingId: booking.id
          }
        });
      }

      return updated;
    });

    logger.info(`Booking ${id} status updated to ${status} by ${req.user.email}`);

    res.json({
      success: true,
      data: {
        booking: {
          id: updatedBooking.id,
          status: updatedBooking.status,
          completedAt: updatedBooking.completedAt
        }
      },
      message: `Booking ${status.toLowerCase()} successfully`
    });

  } catch (error) {
    next(error);
  }
});

// @route   GET /api/bookings/:id
// @desc    Get booking details
// @access  Private
router.get('/:id', [
  auth,
  requireVerification
], async (req, res, next) => {
  try {
    const { id } = req.params;

    const booking = await req.prisma.booking.findUnique({
      where: { id },
      include: {
        seeker: {
          select: {
            profile: {
              select: {
                firstName: true,
                lastName: true,
                profilePhoto: true
              }
            }
          }
        },
        provider: {
          select: {
            profile: {
              select: {
                firstName: true,
                lastName: true,
                profilePhoto: true
              }
            }
          }
        }
      }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    // Check permissions
    const isSeeker = req.user.id === booking.seekerId;
    const isProvider = req.user.id === booking.providerId;
    const isAdmin = ['EMPLOYEE', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'].includes(req.user.role);

    if (!isSeeker && !isProvider && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: {
        booking: {
          id: booking.id,
          type: booking.type,
          startTime: booking.startTime,
          endTime: booking.endTime,
          duration: booking.duration,
          tokenAmount: booking.tokenAmount,
          location: booking.location,
          notes: booking.notes,
          status: booking.status,
          createdAt: booking.createdAt,
          completedAt: booking.completedAt,
          seeker: booking.seeker.profile,
          provider: booking.provider.profile
        }
      }
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;