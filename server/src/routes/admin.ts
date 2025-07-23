import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { authenticate, AuthRequest, authorize } from '../middleware/auth';
import { prisma } from '../utils/database';
import { logger } from '../utils/logger';
import { asyncHandler } from '../middleware/errorHandler';
import { auditLog, getAuditLogs } from '../services/auditService';
import { assignToEmployee, reassignItem, getEmployeeWorkload } from '../services/assignmentService';

const router = express.Router();

// Get verification queue
router.get('/verification-queue', [
  authenticate,
  authorize(['EMPLOYEE', 'MANAGER', 'ADMIN', 'SUPER_ADMIN']),
  query('status').optional().isIn(['PENDING', 'APPROVED', 'REJECTED', 'REQUIRES_REVIEW']),
  query('type').optional().isString(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], asyncHandler(async (req: AuthRequest, res) => {
  const { status, type, page = 1, limit = 20 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  const where: any = {};
  if (status) where.status = status;
  if (type) where.type = type;

  // Employees can only see their assigned verifications
  if (req.user!.role === 'EMPLOYEE') {
    where.employeeId = req.user!.id;
  }

  const [verifications, total] = await Promise.all([
    prisma.verification.findMany({
      where,
      include: {
        user: {
          include: {
            profile: {
              select: {
                firstName: true,
                lastName: true,
                profileImageUrl: true
              }
            }
          }
        },
        employee: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'asc' },
      take: Number(limit),
      skip: offset
    }),
    prisma.verification.count({ where })
  ]);

  res.json({
    verifications,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  });
}));

// Process verification
router.put('/verification/:id', [
  authenticate,
  authorize(['EMPLOYEE', 'MANAGER', 'ADMIN', 'SUPER_ADMIN']),
  body('status').isIn(['APPROVED', 'REJECTED', 'REQUIRES_REVIEW']),
  body('notes').optional().isString().isLength({ max: 500 })
], asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;

  const verification = await prisma.verification.findUnique({
    where: { id },
    include: { user: true }
  });

  if (!verification) {
    return res.status(404).json({ error: 'Verification not found' });
  }

  // Check if employee can process this verification
  if (req.user!.role === 'EMPLOYEE' && verification.employeeId !== req.user!.id) {
    return res.status(403).json({ error: 'Not authorized to process this verification' });
  }

  const updatedVerification = await prisma.$transaction(async (tx) => {
    const updated = await tx.verification.update({
      where: { id },
      data: {
        status,
        notes,
        employeeId: req.user!.id,
        reviewedAt: new Date()
      }
    });

    // Update user verification status if approved
    if (status === 'APPROVED') {
      await tx.user.update({
        where: { id: verification.userId },
        data: {
          isVerified: true,
          verificationStatus: 'APPROVED'
        }
      });
    }

    return updated;
  });

  await auditLog(
    req.user!.id,
    'VERIFICATION_PROCESSED',
    'verification',
    id,
    { status, notes, userId: verification.userId },
    req.ip,
    req.get('User-Agent')
  );

  res.json({
    message: 'Verification processed successfully',
    verification: updatedVerification
  });
}));

// Get booking monitoring queue
router.get('/booking-queue', [
  authenticate,
  authorize(['EMPLOYEE', 'MANAGER', 'ADMIN', 'SUPER_ADMIN']),
  query('status').optional().isString(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], asyncHandler(async (req: AuthRequest, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  const where: any = {};
  if (status) where.status = status;

  // Employees can only see their assigned bookings
  if (req.user!.role === 'EMPLOYEE') {
    where.employeeId = req.user!.id;
  }

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        seeker: {
          include: {
            profile: {
              select: {
                firstName: true,
                lastName: true,
                profileImageUrl: true
              }
            }
          }
        },
        provider: {
          include: {
            profile: {
              select: {
                firstName: true,
                lastName: true,
                profileImageUrl: true
              }
            }
          }
        },
        employee: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        },
        _count: {
          select: {
            messages: {
              where: { isFlagged: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
      skip: offset
    }),
    prisma.booking.count({ where })
  ]);

  res.json({
    bookings: bookings.map(booking => ({
      ...booking,
      flaggedMessagesCount: booking._count.messages
    })),
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  });
}));

// Get user management
router.get('/users', [
  authenticate,
  authorize(['MANAGER', 'ADMIN', 'SUPER_ADMIN']),
  query('role').optional().isString(),
  query('status').optional().isString(),
  query('search').optional().isString(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], asyncHandler(async (req: AuthRequest, res) => {
  const { role, status, search, page = 1, limit = 20 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  const where: any = {};
  
  if (role) where.role = role;
  if (status === 'active') where.isActive = true;
  if (status === 'inactive') where.isActive = false;
  
  if (search) {
    where.OR = [
      { email: { contains: search as string, mode: 'insensitive' } },
      { profile: { firstName: { contains: search as string, mode: 'insensitive' } } },
      { profile: { lastName: { contains: search as string, mode: 'insensitive' } } }
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: {
        profile: {
          select: {
            firstName: true,
            lastName: true,
            profileImageUrl: true,
            rating: true,
            reviewCount: true
          }
        },
        tokenWallet: {
          select: {
            balance: true,
            totalPurchased: true,
            totalSpent: true
          }
        },
        _count: {
          select: {
            seekerBookings: true,
            providerBookings: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
      skip: offset
    }),
    prisma.user.count({ where })
  ]);

  res.json({
    users,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  });
}));

// Update user status
router.put('/users/:id/status', [
  authenticate,
  authorize(['MANAGER', 'ADMIN', 'SUPER_ADMIN']),
  body('isActive').isBoolean(),
  body('reason').optional().isString()
], asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { isActive, reason } = req.body;

  const user = await prisma.user.update({
    where: { id },
    data: { isActive }
  });

  await auditLog(
    req.user!.id,
    isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
    'user',
    id,
    { reason },
    req.ip,
    req.get('User-Agent')
  );

  res.json({
    message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
    user
  });
}));

// Get analytics dashboard
router.get('/analytics', [
  authenticate,
  authorize(['MANAGER', 'ADMIN', 'SUPER_ADMIN'])
], asyncHandler(async (req: AuthRequest, res) => {
  const [
    totalUsers,
    totalBookings,
    totalRevenue,
    activeBookings,
    pendingVerifications,
    flaggedMessages
  ] = await Promise.all([
    prisma.user.count({ where: { isActive: true } }),
    prisma.booking.count(),
    prisma.transaction.aggregate({
      where: { type: 'PURCHASE' },
      _sum: { amount: true }
    }),
    prisma.booking.count({
      where: { status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] } }
    }),
    prisma.verification.count({ where: { status: 'PENDING' } }),
    prisma.message.count({ where: { isFlagged: true } })
  ]);

  // Get user registration trend (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const registrationTrend = await prisma.user.groupBy({
    by: ['createdAt'],
    where: {
      createdAt: { gte: thirtyDaysAgo }
    },
    _count: { id: true }
  });

  res.json({
    overview: {
      totalUsers,
      totalBookings,
      totalRevenue: totalRevenue._sum.amount || 0,
      activeBookings,
      pendingVerifications,
      flaggedMessages
    },
    registrationTrend
  });
}));

// Get employee workload
router.get('/employee-workload', [
  authenticate,
  authorize(['MANAGER', 'ADMIN', 'SUPER_ADMIN'])
], asyncHandler(async (req: AuthRequest, res) => {
  const workload = await getEmployeeWorkload();
  res.json({ workload });
}));

// Reassign task
router.post('/reassign', [
  authenticate,
  authorize(['MANAGER', 'ADMIN', 'SUPER_ADMIN']),
  body('assignmentId').isUUID(),
  body('newEmployeeId').isUUID()
], asyncHandler(async (req: AuthRequest, res) => {
  const { assignmentId, newEmployeeId } = req.body;

  const assignment = await reassignItem(assignmentId, newEmployeeId);

  await auditLog(
    req.user!.id,
    'TASK_REASSIGNED',
    'assignment',
    assignmentId,
    { newEmployeeId },
    req.ip,
    req.get('User-Agent')
  );

  res.json({
    message: 'Task reassigned successfully',
    assignment
  });
}));

// Get audit logs
router.get('/audit-logs', [
  authenticate,
  authorize(['ADMIN', 'SUPER_ADMIN']),
  query('userId').optional().isUUID(),
  query('action').optional().isString(),
  query('resource').optional().isString(),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], asyncHandler(async (req: AuthRequest, res) => {
  const {
    userId,
    action,
    resource,
    startDate,
    endDate,
    page = 1,
    limit = 50
  } = req.query;

  const offset = (Number(page) - 1) * Number(limit);

  const logs = await getAuditLogs({
    userId: userId as string,
    action: action as string,
    resource: resource as string,
    startDate: startDate ? new Date(startDate as string) : undefined,
    endDate: endDate ? new Date(endDate as string) : undefined,
    limit: Number(limit),
    offset
  });

  res.json({
    logs,
    pagination: {
      page: Number(page),
      limit: Number(limit)
    }
  });
}));

export { router as adminRoutes };