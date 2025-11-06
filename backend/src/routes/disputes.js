const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { auth, authorize, requireVerification } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// @route   POST /api/disputes
// @desc    File a new dispute
// @access  Private
router.post('/', [
  auth,
  requireVerification,
  body('bookingId').isUUID().withMessage('Valid booking ID required'),
  body('disputeType').isIn(['NO_SHOW', 'SERVICE_QUALITY', 'PAYMENT_ISSUE', 'BEHAVIOR_ISSUE', 'TERMS_VIOLATION', 'OTHER'])
    .withMessage('Invalid dispute type'),
  body('description').trim().notEmpty().withMessage('Description is required')
    .isLength({ min: 20, max: 2000 }).withMessage('Description must be between 20 and 2000 characters'),
  body('evidence').optional().isArray().withMessage('Evidence must be an array of URLs')
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

    const { bookingId, disputeType, description, evidence = [] } = req.body;

    // Get booking and verify
    const booking = await req.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        disputes: true
      }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    // Verify user is part of this booking
    if (req.user.id !== booking.seekerId && req.user.id !== booking.providerId) {
      return res.status(403).json({
        success: false,
        error: 'You can only file disputes for your own bookings'
      });
    }

    // Check if there's already an open dispute
    const openDispute = booking.disputes.find(d => ['OPEN', 'INVESTIGATING'].includes(d.status));
    if (openDispute) {
      return res.status(400).json({
        success: false,
        error: 'There is already an open dispute for this booking'
      });
    }

    // Determine who the dispute is against
    const reportedAgainst = req.user.id === booking.seekerId
      ? booking.providerId
      : booking.seekerId;

    // Create dispute
    const dispute = await req.prisma.dispute.create({
      data: {
        bookingId,
        reportedBy: req.user.id,
        reportedAgainst,
        disputeType,
        description,
        evidence
      },
      include: {
        booking: {
          select: {
            id: true,
            scheduledAt: true,
            serviceType: true,
            tokenAmount: true
          }
        },
        reporter: {
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
        reportedUser: {
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
    });

    // Update booking status to DISPUTED
    await req.prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'DISPUTED' }
    });

    logger.info(`Dispute filed: ${dispute.id} by user ${req.user.id} for booking ${bookingId}`);

    res.status(201).json({
      success: true,
      data: { dispute },
      message: 'Dispute filed successfully. Our team will review it shortly.'
    });

  } catch (error) {
    next(error);
  }
});

// @route   GET /api/disputes/my-disputes
// @desc    Get user's disputes (both filed and received)
// @access  Private
router.get('/my-disputes', [
  auth,
  requireVerification,
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isString()
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

    const whereClause = {
      OR: [
        { reportedBy: req.user.id },
        { reportedAgainst: req.user.id }
      ]
    };

    if (status) {
      whereClause.status = status;
    }

    const [disputes, total] = await Promise.all([
      req.prisma.dispute.findMany({
        where: whereClause,
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          booking: {
            select: {
              id: true,
              scheduledAt: true,
              serviceType: true,
              tokenAmount: true
            }
          },
          reporter: {
            select: {
              id: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          },
          reportedUser: {
            select: {
              id: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          },
          assignedManager: {
            select: {
              id: true,
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
      req.prisma.dispute.count({ where: whereClause })
    ]);

    res.json({
      success: true,
      data: {
        disputes,
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

// @route   GET /api/disputes/:id
// @desc    Get dispute details
// @access  Private (Reporter, Reported User, or Admin)
router.get('/:id', [
  auth,
  requireVerification
], async (req, res, next) => {
  try {
    const { id } = req.params;

    const dispute = await req.prisma.dispute.findUnique({
      where: { id },
      include: {
        booking: {
          select: {
            id: true,
            scheduledAt: true,
            serviceType: true,
            tokenAmount: true,
            status: true
          }
        },
        reporter: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                profilePhoto: true
              }
            }
          }
        },
        reportedUser: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                profilePhoto: true
              }
            }
          }
        },
        assignedManager: {
          select: {
            id: true,
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

    if (!dispute) {
      return res.status(404).json({
        success: false,
        error: 'Dispute not found'
      });
    }

    // Check access permissions
    const isParty = req.user.id === dispute.reportedBy || req.user.id === dispute.reportedAgainst;
    const isAdmin = ['MANAGER', 'ADMIN', 'SUPER_ADMIN'].includes(req.user.role);
    const isAssigned = dispute.assignedTo === req.user.id;

    if (!isParty && !isAdmin && !isAssigned) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: { dispute }
    });

  } catch (error) {
    next(error);
  }
});

// ============================================================================
// ADMIN ENDPOINTS
// ============================================================================

// @route   GET /api/disputes/admin/all
// @desc    Get all disputes (Admin only)
// @access  Private (Manager+)
router.get('/admin/all', [
  auth,
  authorize('MANAGER', 'ADMIN', 'SUPER_ADMIN'),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isString(),
  query('type').optional().isString()
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

    const { page = 1, limit = 20, status, type } = req.query;
    const skip = (page - 1) * limit;

    const whereClause = {};

    if (status) {
      whereClause.status = status;
    }

    if (type) {
      whereClause.disputeType = type;
    }

    // Managers only see disputes assigned to them or unassigned
    if (req.user.role === 'MANAGER') {
      whereClause.OR = [
        { assignedTo: req.user.id },
        { assignedTo: null }
      ];
    }

    const [disputes, total] = await Promise.all([
      req.prisma.dispute.findMany({
        where: whereClause,
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          booking: {
            select: {
              id: true,
              scheduledAt: true,
              serviceType: true,
              tokenAmount: true
            }
          },
          reporter: {
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
          reportedUser: {
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
          assignedManager: {
            select: {
              id: true,
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
      req.prisma.dispute.count({ where: whereClause })
    ]);

    res.json({
      success: true,
      data: {
        disputes,
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

// @route   PUT /api/disputes/:id/assign
// @desc    Assign dispute to manager (Admin only)
// @access  Private (Admin+)
router.put('/:id/assign', [
  auth,
  authorize('ADMIN', 'SUPER_ADMIN'),
  body('managerId').isUUID().withMessage('Valid manager ID required')
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
    const { managerId } = req.body;

    // Verify manager exists and has appropriate role
    const manager = await req.prisma.user.findUnique({
      where: { id: managerId }
    });

    if (!manager || !['MANAGER', 'ADMIN', 'SUPER_ADMIN'].includes(manager.role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid manager ID or insufficient permissions'
      });
    }

    const dispute = await req.prisma.dispute.update({
      where: { id },
      data: {
        assignedTo: managerId,
        status: 'INVESTIGATING'
      }
    });

    logger.info(`Dispute ${id} assigned to ${managerId} by ${req.user.email}`);

    res.json({
      success: true,
      data: { dispute },
      message: 'Dispute assigned successfully'
    });

  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/disputes/:id/resolve
// @desc    Resolve a dispute (Manager+)
// @access  Private (Manager+)
router.put('/:id/resolve', [
  auth,
  authorize('MANAGER', 'ADMIN', 'SUPER_ADMIN'),
  body('resolution').trim().notEmpty().withMessage('Resolution is required'),
  body('refundIssued').optional().isBoolean(),
  body('refundAmount').optional().isInt({ min: 0 }),
  body('actionTaken').optional().trim()
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
    const { resolution, refundIssued = false, refundAmount, actionTaken } = req.body;

    // Get dispute
    const dispute = await req.prisma.dispute.findUnique({
      where: { id },
      include: { booking: true }
    });

    if (!dispute) {
      return res.status(404).json({
        success: false,
        error: 'Dispute not found'
      });
    }

    // Check permissions
    if (req.user.role === 'MANAGER' && dispute.assignedTo !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'You can only resolve disputes assigned to you'
      });
    }

    // Process refund if requested
    if (refundIssued && refundAmount > 0) {
      await req.prisma.$transaction(async (prisma) => {
        // Credit tokens back to seeker
        await prisma.tokenWallet.update({
          where: { userId: dispute.booking.seekerId },
          data: { balance: { increment: refundAmount } }
        });

        // Create refund transaction
        await prisma.tokenTransaction.create({
          data: {
            userId: dispute.booking.seekerId,
            type: 'BOOKING_REFUND',
            amount: refundAmount,
            description: `Refund for booking ${dispute.bookingId} - Dispute resolved`,
            bookingId: dispute.bookingId
          }
        });
      });
    }

    // Update dispute
    const updatedDispute = await req.prisma.dispute.update({
      where: { id },
      data: {
        status: 'RESOLVED',
        resolution,
        resolvedAt: new Date(),
        refundIssued,
        refundAmount,
        actionTaken: actionTaken || undefined
      }
    });

    logger.info(`Dispute ${id} resolved by ${req.user.email}${refundIssued ? ` with ${refundAmount} tokens refund` : ''}`);

    res.json({
      success: true,
      data: { dispute: updatedDispute },
      message: 'Dispute resolved successfully'
    });

  } catch (error) {
    next(error);
  }
});

// @route   POST /api/disputes/:id/appeal
// @desc    Appeal a dispute resolution
// @access  Private
router.post('/:id/appeal', [
  auth,
  requireVerification,
  body('appealNotes').trim().notEmpty().withMessage('Appeal notes are required')
    .isLength({ min: 20, max: 1000 }).withMessage('Appeal notes must be between 20 and 1000 characters')
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
    const { appealNotes } = req.body;

    const dispute = await req.prisma.dispute.findUnique({
      where: { id }
    });

    if (!dispute) {
      return res.status(404).json({
        success: false,
        error: 'Dispute not found'
      });
    }

    // Verify user can appeal
    if (req.user.id !== dispute.reportedBy && req.user.id !== dispute.reportedAgainst) {
      return res.status(403).json({
        success: false,
        error: 'You can only appeal disputes you are involved in'
      });
    }

    if (dispute.status !== 'RESOLVED') {
      return res.status(400).json({
        success: false,
        error: 'Only resolved disputes can be appealed'
      });
    }

    if (!dispute.canAppeal) {
      return res.status(400).json({
        success: false,
        error: 'This dispute cannot be appealed'
      });
    }

    if (dispute.appealed) {
      return res.status(400).json({
        success: false,
        error: 'This dispute has already been appealed'
      });
    }

    // Update dispute
    const updatedDispute = await req.prisma.dispute.update({
      where: { id },
      data: {
        appealed: true,
        appealNotes,
        status: 'ESCALATED'
      }
    });

    logger.info(`Dispute ${id} appealed by user ${req.user.id}`);

    res.json({
      success: true,
      data: { dispute: updatedDispute },
      message: 'Appeal submitted. An admin will review your case.'
    });

  } catch (error) {
    next(error);
  }
});

// @route   GET /api/disputes/admin/statistics
// @desc    Get dispute statistics (Admin only)
// @access  Private (Manager+)
router.get('/admin/statistics', [
  auth,
  authorize('MANAGER', 'ADMIN', 'SUPER_ADMIN')
], async (req, res, next) => {
  try {
    const [
      totalDisputes,
      openDisputes,
      resolvedDisputes,
      typeStats,
      recentDisputes
    ] = await Promise.all([
      req.prisma.dispute.count(),
      req.prisma.dispute.count({ where: { status: 'OPEN' } }),
      req.prisma.dispute.count({ where: { status: 'RESOLVED' } }),
      req.prisma.dispute.groupBy({
        by: ['disputeType'],
        _count: { disputeType: true }
      }),
      req.prisma.dispute.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          reporter: {
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

    res.json({
      success: true,
      data: {
        totalDisputes,
        openDisputes,
        resolvedDisputes,
        typeStats,
        recentDisputes
      }
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
