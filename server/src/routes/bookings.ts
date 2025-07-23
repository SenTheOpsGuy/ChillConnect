import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { authenticate, AuthRequest, requireVerification } from '../middleware/auth';
import { prisma } from '../utils/database';
import { logger } from '../utils/logger';
import { asyncHandler } from '../middleware/errorHandler';
import { auditLog } from '../services/auditService';
import { assignToEmployee } from '../services/assignmentService';
import { sendBookingConfirmation } from '../services/notificationService';

const router = express.Router();

// Search providers
router.get('/search', [
  authenticate,
  query('location').optional().isString(),
  query('service').optional().isString(),
  query('date').optional().isISO8601(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 })
], asyncHandler(async (req: AuthRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { location, service, date, page = 1, limit = 20 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  const where: any = {
    role: 'PROVIDER',
    isVerified: true,
    verificationStatus: 'APPROVED',
    isActive: true
  };

  const profileWhere: any = {};
  
  if (location) {
    profileWhere.location = {
      contains: location as string,
      mode: 'insensitive'
    };
  }

  if (service) {
    profileWhere.services = {
      has: service as string
    };
  }

  const [providers, total] = await Promise.all([
    prisma.user.findMany({
      where: {
        ...where,
        profile: profileWhere
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
            rating: true,
            reviewCount: true,
            profileImageUrl: true,
            availability: true
          }
        }
      },
      take: Number(limit),
      skip: offset,
      orderBy: [
        { profile: { rating: 'desc' } },
        { profile: { reviewCount: 'desc' } }
      ]
    }),
    prisma.user.count({
      where: {
        ...where,
        profile: profileWhere
      }
    })
  ]);

  res.json({
    providers: providers.map(provider => ({
      id: provider.id,
      profile: provider.profile,
      isOnline: true // TODO: Implement real-time status
    })),
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  });
}));

// Create booking
router.post('/create', [
  authenticate,
  requireVerification,
  body('providerId').isUUID(),
  body('type').isIn(['INCALL', 'OUTCALL']),
  body('scheduledAt').isISO8601(),
  body('duration').isInt({ min: 1, max: 8 }),
  body('location').optional().isString(),
  body('notes').optional().isString().isLength({ max: 500 })
], asyncHandler(async (req: AuthRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { providerId, type, scheduledAt, duration, location, notes } = req.body;
  const seekerId = req.user!.id;

  // Validate provider
  const provider = await prisma.user.findFirst({
    where: {
      id: providerId,
      role: 'PROVIDER',
      isVerified: true,
      verificationStatus: 'APPROVED',
      isActive: true
    },
    include: {
      profile: {
        select: {
          hourlyRate: true,
          firstName: true,
          lastName: true
        }
      }
    }
  });

  if (!provider || !provider.profile?.hourlyRate) {
    return res.status(404).json({ error: 'Provider not found or not available' });
  }

  // Calculate token amount
  const tokenAmount = provider.profile.hourlyRate * duration;

  // Check seeker's token balance
  const seekerWallet = await prisma.tokenWallet.findUnique({
    where: { userId: seekerId }
  });

  if (!seekerWallet || seekerWallet.balance < tokenAmount) {
    return res.status(400).json({ 
      error: 'Insufficient token balance',
      required: tokenAmount,
      available: seekerWallet?.balance || 0
    });
  }

  // Check for scheduling conflicts
  const scheduledDate = new Date(scheduledAt);
  const endTime = new Date(scheduledDate.getTime() + duration * 60 * 60 * 1000);

  const conflictingBooking = await prisma.booking.findFirst({
    where: {
      providerId,
      status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] },
      OR: [
        {
          AND: [
            { scheduledAt: { lte: scheduledDate } },
            { scheduledAt: { gte: new Date(scheduledDate.getTime() - 8 * 60 * 60 * 1000) } }
          ]
        }
      ]
    }
  });

  if (conflictingBooking) {
    return res.status(400).json({ error: 'Provider is not available at this time' });
  }

  // Create booking and handle payment
  const booking = await prisma.$transaction(async (tx) => {
    // Hold tokens in escrow
    await tx.tokenWallet.update({
      where: { userId: seekerId },
      data: {
        balance: { decrement: tokenAmount },
        escrowBalance: { increment: tokenAmount }
      }
    });

    // Create escrow transaction
    await tx.transaction.create({
      data: {
        walletId: seekerWallet.id,
        type: 'ESCROW_HOLD',
        amount: -tokenAmount,
        description: `Escrow hold for booking`,
        status: 'pending'
      }
    });

    // Create booking
    const newBooking = await tx.booking.create({
      data: {
        seekerId,
        providerId,
        type,
        scheduledAt: scheduledDate,
        duration,
        tokenAmount,
        location,
        notes,
        status: 'PENDING'
      },
      include: {
        seeker: {
          include: { profile: true }
        },
        provider: {
          include: { profile: true }
        }
      }
    });

    return newBooking;
  });

  // Assign employee for monitoring
  await assignToEmployee(booking.id, 'booking');

  // Send confirmation emails
  await Promise.all([
    sendBookingConfirmation(booking.seeker.email, booking),
    sendBookingConfirmation(booking.provider.email, booking)
  ]);

  // Audit log
  await auditLog(
    seekerId,
    'BOOKING_CREATED',
    'booking',
    booking.id,
    { providerId, type, tokenAmount, scheduledAt },
    req.ip,
    req.get('User-Agent')
  );

  logger.info(`Booking created: ${booking.id} by ${seekerId} for ${providerId}`);

  res.status(201).json({
    message: 'Booking created successfully',
    booking: {
      id: booking.id,
      type: booking.type,
      scheduledAt: booking.scheduledAt,
      duration: booking.duration,
      tokenAmount: booking.tokenAmount,
      status: booking.status,
      provider: {
        name: `${booking.provider.profile?.firstName} ${booking.provider.profile?.lastName}`,
        profileImage: booking.provider.profile?.profileImageUrl
      }
    }
  });
}));

// Get user's bookings
router.get('/my-bookings', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const offset = (Number(page) - 1) * Number(limit);
  const userId = req.user!.id;

  const where: any = {
    OR: [
      { seekerId: userId },
      { providerId: userId }
    ]
  };

  if (status) {
    where.status = status;
  }

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        seeker: {
          include: { profile: true }
        },
        provider: {
          include: { profile: true }
        }
      },
      orderBy: { scheduledAt: 'desc' },
      take: Number(limit),
      skip: offset
    }),
    prisma.booking.count({ where })
  ]);

  const formattedBookings = bookings.map(booking => ({
    id: booking.id,
    type: booking.type,
    status: booking.status,
    scheduledAt: booking.scheduledAt,
    duration: booking.duration,
    tokenAmount: booking.tokenAmount,
    location: booking.location,
    notes: booking.notes,
    createdAt: booking.createdAt,
    isSeeker: booking.seekerId === userId,
    counterpart: booking.seekerId === userId ? {
      id: booking.provider.id,
      name: `${booking.provider.profile?.firstName} ${booking.provider.profile?.lastName}`,
      profileImage: booking.provider.profile?.profileImageUrl
    } : {
      id: booking.seeker.id,
      name: `${booking.seeker.profile?.firstName} ${booking.seeker.profile?.lastName}`,
      profileImage: booking.seeker.profile?.profileImageUrl
    }
  }));

  res.json({
    bookings: formattedBookings,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  });
}));

// Update booking status
router.put('/:id/status', [
  authenticate,
  body('status').isIn(['CONFIRMED', 'CANCELLED', 'IN_PROGRESS', 'COMPLETED'])
], asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const userId = req.user!.id;

  const booking = await prisma.booking.findFirst({
    where: {
      id,
      OR: [
        { seekerId: userId },
        { providerId: userId }
      ]
    },
    include: {
      seeker: { include: { tokenWallet: true } },
      provider: { include: { tokenWallet: true } }
    }
  });

  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  // Handle status-specific logic
  let updatedBooking;

  if (status === 'COMPLETED') {
    // Release escrow to provider
    updatedBooking = await prisma.$transaction(async (tx) => {
      // Update booking status
      const updated = await tx.booking.update({
        where: { id },
        data: { 
          status,
          completedAt: new Date()
        }
      });

      // Release escrow
      await tx.tokenWallet.update({
        where: { userId: booking.seekerId },
        data: {
          escrowBalance: { decrement: booking.tokenAmount }
        }
      });

      await tx.tokenWallet.update({
        where: { userId: booking.providerId },
        data: {
          balance: { increment: booking.tokenAmount }
        }
      });

      // Create transactions
      await tx.transaction.createMany({
        data: [
          {
            walletId: booking.seeker.tokenWallet!.id,
            type: 'ESCROW_RELEASE',
            amount: -booking.tokenAmount,
            description: `Payment for completed booking ${id}`,
            bookingId: id
          },
          {
            walletId: booking.provider.tokenWallet!.id,
            type: 'BOOKING_PAYMENT',
            amount: booking.tokenAmount,
            description: `Payment received for booking ${id}`,
            bookingId: id
          }
        ]
      });

      return updated;
    });
  } else if (status === 'CANCELLED') {
    // Refund tokens to seeker
    updatedBooking = await prisma.$transaction(async (tx) => {
      const updated = await tx.booking.update({
        where: { id },
        data: { status }
      });

      // Refund from escrow
      await tx.tokenWallet.update({
        where: { userId: booking.seekerId },
        data: {
          balance: { increment: booking.tokenAmount },
          escrowBalance: { decrement: booking.tokenAmount }
        }
      });

      await tx.transaction.create({
        data: {
          walletId: booking.seeker.tokenWallet!.id,
          type: 'BOOKING_REFUND',
          amount: booking.tokenAmount,
          description: `Refund for cancelled booking ${id}`,
          bookingId: id
        }
      });

      return updated;
    });
  } else {
    updatedBooking = await prisma.booking.update({
      where: { id },
      data: { status }
    });
  }

  // Audit log
  await auditLog(
    userId,
    'BOOKING_STATUS_UPDATED',
    'booking',
    id,
    { oldStatus: booking.status, newStatus: status },
    req.ip,
    req.get('User-Agent')
  );

  res.json({
    message: 'Booking status updated successfully',
    booking: updatedBooking
  });
}));

export { router as bookingRoutes };