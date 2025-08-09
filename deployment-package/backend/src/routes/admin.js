const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { auth, authorize } = require('../middleware/auth');
const requireAuth = auth;
const requireRole = authorize;
const logger = require('../utils/logger');
const assignmentService = require('../services/assignmentService');
const chatService = require('../services/chatService');

const router = express.Router();

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard data
// @access  Private (Admin)
router.get('/dashboard', [
  auth,
  authorize('EMPLOYEE', 'MANAGER', 'ADMIN', 'SUPER_ADMIN')
], async (req, res, next) => {
  try {
    const { timeframe = '24h' } = req.query;
    
    // Get basic statistics
    const [
      totalUsers,
      totalBookings,
      pendingVerifications,
      activeBookings,
      chatStats,
      tokenStats
    ] = await Promise.all([
      req.prisma.user.count(),
      req.prisma.booking.count(),
      req.prisma.verification.count({
        where: { status: 'PENDING' }
      }),
      req.prisma.booking.count({
        where: {
          status: {
            in: ['CONFIRMED', 'IN_PROGRESS']
          }
        }
      }),
      chatService.getChatStatistics(timeframe),
      getTokenStatistics(req.prisma, timeframe)
    ]);

    // Get user role distribution
    const userRoleStats = await req.prisma.user.groupBy({
      by: ['role'],
      _count: {
        role: true
      }
    });

    // Get booking status distribution
    const bookingStatusStats = await req.prisma.booking.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    });

    // Get recent activities
    const recentActivities = await getRecentActivities(req.prisma);

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalBookings,
          pendingVerifications,
          activeBookings,
          ...chatStats,
          ...tokenStats
        },
        userRoleStats,
        bookingStatusStats,
        recentActivities
      }
    });

  } catch (error) {
    next(error);
  }
});

// @route   GET /api/admin/users
// @desc    Get users with filtering and pagination
// @access  Private (Admin)
router.get('/users', [
  auth,
  authorize('EMPLOYEE', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('role').optional().isIn(['SEEKER', 'PROVIDER', 'EMPLOYEE', 'MANAGER', 'ADMIN', 'SUPER_ADMIN']),
  query('verified').optional().isBoolean(),
  query('search').optional().isString()
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

    const { page = 1, limit = 20, role, verified, search } = req.query;
    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause = {};
    
    if (role) {
      whereClause.role = role;
    }
    
    if (verified !== undefined) {
      whereClause.isVerified = verified === 'true';
    }
    
    if (search) {
      whereClause.OR = [
        {
          email: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          profile: {
            firstName: {
              contains: search,
              mode: 'insensitive'
            }
          }
        },
        {
          profile: {
            lastName: {
              contains: search,
              mode: 'insensitive'
            }
          }
        }
      ];
    }

    const [users, total] = await Promise.all([
      req.prisma.user.findMany({
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
              profilePhoto: true,
              rating: true,
              reviewCount: true
            }
          },
          tokenWallet: {
            select: {
              balance: true,
              totalEarned: true,
              totalSpent: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      req.prisma.user.count({ where: whereClause })
    ]);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    next(error);
  }
});

// @route   GET /api/admin/verification-queue
// @desc    Get verification queue
// @access  Private (Employee+)
router.get('/verification-queue', [
  auth,
  authorize('EMPLOYEE', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['PENDING', 'IN_PROGRESS', 'APPROVED', 'REJECTED'])
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

    const { page = 1, limit = 20, status = 'PENDING' } = req.query;
    const skip = (page - 1) * limit;

    // For employees, only show their assigned verifications
    const whereClause = { status };
    if (req.user.role === 'EMPLOYEE') {
      whereClause.employeeId = req.user.id;
    }

    const [verifications, total] = await Promise.all([
      req.prisma.verification.findMany({
        where: whereClause,
        skip: parseInt(skip),
        take: parseInt(limit),
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                  dateOfBirth: true
                }
              }
            }
          },
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
        },
        orderBy: { createdAt: 'asc' }
      }),
      req.prisma.verification.count({ where: whereClause })
    ]);

    res.json({
      success: true,
      data: {
        verifications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/admin/verification/:id
// @desc    Update verification status
// @access  Private (Employee+)
router.put('/verification/:id', [
  auth,
  authorize('EMPLOYEE', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'),
  body('status').isIn(['APPROVED', 'REJECTED']).withMessage('Status must be APPROVED or REJECTED'),
  body('notes').optional().isString()
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
    const { status, notes } = req.body;

    // Get verification
    const verification = await req.prisma.verification.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true
          }
        }
      }
    });

    if (!verification) {
      return res.status(404).json({
        success: false,
        error: 'Verification not found'
      });
    }

    // Check if employee can update this verification
    if (req.user.role === 'EMPLOYEE' && verification.employeeId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Update verification
    const updatedVerification = await req.prisma.$transaction(async (prisma) => {
      // Update verification record
      const updated = await prisma.verification.update({
        where: { id },
        data: {
          status,
          notes,
          reviewedAt: new Date()
        }
      });

      // Update user verification status if approved
      if (status === 'APPROVED') {
        await prisma.user.update({
          where: { id: verification.userId },
          data: { isVerified: true }
        });
      }

      // Complete assignment
      const assignment = await prisma.assignment.findFirst({
        where: {
          itemId: id,
          itemType: 'VERIFICATION',
          isActive: true
        }
      });

      if (assignment) {
        await prisma.assignment.update({
          where: { id: assignment.id },
          data: {
            isActive: false,
            completedAt: new Date()
          }
        });
      }

      return updated;
    });

    logger.info(`Verification ${id} ${status.toLowerCase()} by ${req.user.email}`);

    res.json({
      success: true,
      data: { verification: updatedVerification },
      message: `Verification ${status.toLowerCase()} successfully`
    });

  } catch (error) {
    next(error);
  }
});

// @route   GET /api/admin/booking-monitoring
// @desc    Get booking monitoring queue
// @access  Private (Employee+)
router.get('/booking-monitoring', [
  auth,
  authorize('EMPLOYEE', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED'])
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

    const { page = 1, limit = 20, status } = req.query;
    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause = {};
    
    if (status) {
      whereClause.status = status;
    }

    // For employees, only show their assigned bookings
    if (req.user.role === 'EMPLOYEE') {
      whereClause.assignedEmployeeId = req.user.id;
    }

    const [bookings, total] = await Promise.all([
      req.prisma.booking.findMany({
        where: whereClause,
        skip: parseInt(skip),
        take: parseInt(limit),
        include: {
          seeker: {
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
          provider: {
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
          assignedEmployee: {
            select: {
              profile: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          },
          messages: {
            where: { isFlagged: true },
            select: {
              id: true,
              content: true,
              createdAt: true,
              flaggedReason: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      req.prisma.booking.count({ where: whereClause })
    ]);

    res.json({
      success: true,
      data: {
        bookings,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    next(error);
  }
});

// @route   GET /api/admin/flagged-messages
// @desc    Get flagged messages
// @access  Private (Employee+)
router.get('/flagged-messages', [
  auth,
  authorize('EMPLOYEE', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
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

    const { page = 1, limit = 20 } = req.query;
    
    // For employees, only show messages from their assigned bookings
    const employeeId = req.user.role === 'EMPLOYEE' ? req.user.id : null;
    
    const result = await chatService.getFlaggedMessages(
      parseInt(page),
      parseInt(limit),
      employeeId
    );

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    next(error);
  }
});

// @route   GET /api/admin/assignments
// @desc    Get employee assignments
// @access  Private (Manager+)
router.get('/assignments', [
  auth,
  authorize('MANAGER', 'ADMIN', 'SUPER_ADMIN')
], async (req, res, next) => {
  try {
    const workloads = await assignmentService.getAllEmployeeWorkloads();
    
    res.json({
      success: true,
      data: { workloads }
    });

  } catch (error) {
    next(error);
  }
});

// @route   POST /api/admin/assignments/reassign
// @desc    Reassign task to different employee
// @access  Private (Manager+)
router.post('/assignments/reassign', [
  auth,
  authorize('MANAGER', 'ADMIN', 'SUPER_ADMIN'),
  body('assignmentId').isUUID().withMessage('Valid assignment ID required'),
  body('newEmployeeId').isUUID().withMessage('Valid employee ID required')
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

    const { assignmentId, newEmployeeId } = req.body;

    // Verify new employee exists and has appropriate role
    const newEmployee = await req.prisma.user.findUnique({
      where: { 
        id: newEmployeeId,
        role: {
          in: ['EMPLOYEE', 'MANAGER', 'ADMIN']
        }
      }
    });

    if (!newEmployee) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found'
      });
    }

    await assignmentService.reassignTask(assignmentId, newEmployeeId);

    logger.info(`Task reassigned by ${req.user.email} to employee ${newEmployeeId}`);

    res.json({
      success: true,
      message: 'Task reassigned successfully'
    });

  } catch (error) {
    next(error);
  }
});

// @route   GET /api/admin/my-queue
// @desc    Get current user's assignment queue
// @access  Private (Employee+)
router.get('/my-queue', [
  auth,
  authorize('EMPLOYEE', 'MANAGER', 'ADMIN', 'SUPER_ADMIN')
], async (req, res, next) => {
  try {
    const queue = await assignmentService.getAssignmentQueue(req.user.id);
    
    res.json({
      success: true,
      data: { queue }
    });

  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/admin/users/:id/role
// @desc    Update user role (Super Admin only)
// @access  Private (Super Admin)
router.put('/users/:id/role', [
  auth,
  authorize('SUPER_ADMIN'),
  body('role').isIn(['SEEKER', 'PROVIDER', 'EMPLOYEE', 'MANAGER', 'ADMIN']).withMessage('Invalid role')
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
    const { role } = req.body;

    const user = await req.prisma.user.update({
      where: { id },
      data: { role },
      include: {
        profile: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    logger.info(`User ${id} role updated to ${role} by ${req.user.email}`);

    res.json({
      success: true,
      data: { user },
      message: 'User role updated successfully'
    });

  } catch (error) {
    next(error);
  }
});

// @route   POST /api/admin/users/:id/suspend
// @desc    Suspend/unsuspend user (Admin+)
// @access  Private (Admin+)
router.post('/users/:id/suspend', [
  auth,
  authorize('ADMIN', 'SUPER_ADMIN'),
  body('suspended').isBoolean().withMessage('Suspended must be boolean'),
  body('reason').optional().isString()
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
    const { suspended, reason } = req.body;

    // TODO: Add suspension logic to user model
    // For now, we'll use isVerified as a simple suspension mechanism
    const user = await req.prisma.user.update({
      where: { id },
      data: { isVerified: !suspended }
    });

    logger.info(`User ${id} ${suspended ? 'suspended' : 'unsuspended'} by ${req.user.email}${reason ? ` - Reason: ${reason}` : ''}`);

    res.json({
      success: true,
      message: `User ${suspended ? 'suspended' : 'unsuspended'} successfully`
    });

  } catch (error) {
    next(error);
  }
});

// @route   GET /api/admin/bookings
// @desc    Get bookings for monitoring
// @access  Private (Admin)
router.get('/bookings', [
  auth,
  authorize('ADMIN')
], async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { seeker: { profile: { firstName: { contains: search, mode: 'insensitive' } } } },
        { seeker: { profile: { lastName: { contains: search, mode: 'insensitive' } } } },
        { provider: { profile: { firstName: { contains: search, mode: 'insensitive' } } } },
        { provider: { profile: { lastName: { contains: search, mode: 'insensitive' } } } }
      ];
    }

    const [bookings, total] = await Promise.all([
      req.prisma.booking.findMany({
        where,
        skip: offset,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          seeker: {
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
          provider: {
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
        }
      }),
      req.prisma.booking.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        bookings,
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

// Helper function to get token statistics
const getTokenStatistics = async (prisma, timeframe) => {
  const timeAgo = new Date();
  
  switch (timeframe) {
    case '1h':
      timeAgo.setHours(timeAgo.getHours() - 1);
      break;
    case '24h':
      timeAgo.setHours(timeAgo.getHours() - 24);
      break;
    case '7d':
      timeAgo.setDate(timeAgo.getDate() - 7);
      break;
    case '30d':
      timeAgo.setDate(timeAgo.getDate() - 30);
      break;
    default:
      timeAgo.setHours(timeAgo.getHours() - 24);
  }

  const [tokensPurchased, tokensSpent, revenue] = await Promise.all([
    prisma.tokenTransaction.aggregate({
      where: {
        type: 'PURCHASE',
        createdAt: { gte: timeAgo }
      },
      _sum: { amount: true }
    }),
    prisma.tokenTransaction.aggregate({
      where: {
        type: 'ESCROW_HOLD',
        createdAt: { gte: timeAgo }
      },
      _sum: { amount: true }
    }),
    prisma.tokenTransaction.count({
      where: {
        type: 'PURCHASE',
        createdAt: { gte: timeAgo }
      }
    })
  ]);

  return {
    tokensPurchased: tokensPurchased._sum.amount || 0,
    tokensSpent: tokensSpent._sum.amount || 0,
    revenue: revenue * 100 // Assuming 1 token = 100 INR
  };
};

// Helper function to get recent activities
const getRecentActivities = async (prisma) => {
  const [recentUsers, recentBookings, recentTransactions] = await Promise.all([
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        profile: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    }),
    prisma.booking.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        seeker: {
          select: {
            profile: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        },
        provider: {
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
    }),
    prisma.tokenTransaction.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
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
    })
  ]);

  return {
    users: recentUsers.map(user => ({
      id: user.id,
      name: user.profile ? `${user.profile.firstName} ${user.profile.lastName}` : 'Unknown User',
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    })),
    bookings: recentBookings.map(booking => ({
      id: booking.id,
      type: booking.type,
      status: booking.status,
      seeker: booking.seeker.profile,
      provider: booking.provider.profile,
      createdAt: booking.createdAt
    })),
    transactions: recentTransactions.map(transaction => ({
      id: transaction.id,
      type: transaction.type,
      amount: transaction.amount,
      user: transaction.user.profile,
      createdAt: transaction.createdAt
    }))
  };
};

module.exports = router;