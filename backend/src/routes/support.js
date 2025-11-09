const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { auth, requireRole } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// @route   POST /api/support/tickets
// @desc    Create a new support ticket
// @access  Private
router.post('/tickets', [
  auth,
  body('subject').trim().notEmpty().withMessage('Subject is required')
    .isLength({ max: 200 }).withMessage('Subject must be 200 characters or less'),
  body('description').trim().notEmpty().withMessage('Description is required')
    .isLength({ max: 5000 }).withMessage('Description must be 5000 characters or less'),
  body('category').isIn([
    'ACCOUNT', 'BOOKING', 'PAYMENT', 'TECHNICAL', 'VERIFICATION', 'SAFETY', 'OTHER'
  ]).withMessage('Invalid category'),
  body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  body('bookingId').optional().isUUID(),
  body('attachments').optional().isArray()
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

    const {
      subject,
      description,
      category,
      priority = 'MEDIUM',
      bookingId,
      attachments = []
    } = req.body;

    // Get user's current email and phone for reference
    const user = await req.prisma.user.findUnique({
      where: { id: req.user.id },
      include: { profile: true }
    });

    // Create ticket
    const ticket = await req.prisma.supportTicket.create({
      data: {
        userId: req.user.id,
        subject,
        description,
        category,
        priority,
        bookingId,
        attachments,
        userEmail: user.email,
        userPhone: user.profile?.phoneNumber
      },
      include: {
        user: {
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

    logger.info(`Support ticket #${ticket.ticketNumber} created by user ${req.user.id}`);

    res.status(201).json({
      success: true,
      data: { ticket },
      message: `Ticket #${ticket.ticketNumber} created successfully. Our team will respond soon.`
    });

  } catch (error) {
    next(error);
  }
});

// @route   GET /api/support/tickets
// @desc    Get user's support tickets
// @access  Private
router.get('/tickets', [
  auth,
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['OPEN', 'IN_PROGRESS', 'WAITING_USER', 'RESOLVED', 'CLOSED'])
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

    const whereClause = { userId: req.user.id };
    if (status) {
      whereClause.status = status;
    }

    const [tickets, total] = await Promise.all([
      req.prisma.supportTicket.findMany({
        where: whereClause,
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          assignedUser: {
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
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            select: {
              message: true,
              createdAt: true,
              isStaff: true
            }
          }
        }
      }),
      req.prisma.supportTicket.count({ where: whereClause })
    ]);

    res.json({
      success: true,
      data: {
        tickets,
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

// @route   GET /api/support/tickets/:id
// @desc    Get ticket details with messages
// @access  Private
router.get('/tickets/:id', [
  auth
], async (req, res, next) => {
  try {
    const { id } = req.params;

    const ticket = await req.prisma.supportTicket.findUnique({
      where: { id },
      include: {
        user: {
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
        assignedUser: {
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
        messages: {
          orderBy: { createdAt: 'asc' },
          where: {
            OR: [
              { isInternal: false },
              { senderId: req.user.id }
            ]
          },
          include: {
            sender: {
              select: {
                id: true,
                role: true,
                profile: {
                  select: {
                    firstName: true,
                    lastName: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket not found'
      });
    }

    // Verify user owns this ticket or is staff
    const isStaff = ['EMPLOYEE', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'].includes(req.user.role);
    if (ticket.userId !== req.user.id && !isStaff) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to view this ticket'
      });
    }

    res.json({
      success: true,
      data: { ticket }
    });

  } catch (error) {
    next(error);
  }
});

// @route   POST /api/support/tickets/:id/messages
// @desc    Reply to a ticket
// @access  Private
router.post('/tickets/:id/messages', [
  auth,
  body('message').trim().notEmpty().withMessage('Message is required')
    .isLength({ max: 5000 }).withMessage('Message must be 5000 characters or less'),
  body('attachments').optional().isArray()
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
    const { message, attachments = [] } = req.body;

    // Get ticket
    const ticket = await req.prisma.supportTicket.findUnique({
      where: { id }
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket not found'
      });
    }

    // Verify user owns this ticket or is staff
    const isStaff = ['EMPLOYEE', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'].includes(req.user.role);
    if (ticket.userId !== req.user.id && !isStaff) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to reply to this ticket'
      });
    }

    // Check if ticket is closed
    if (ticket.status === 'CLOSED') {
      return res.status(400).json({
        success: false,
        error: 'Cannot reply to a closed ticket'
      });
    }

    // Create message and update ticket status
    const [ticketMessage] = await req.prisma.$transaction([
      req.prisma.ticketMessage.create({
        data: {
          ticketId: id,
          senderId: req.user.id,
          message,
          attachments,
          isStaff
        },
        include: {
          sender: {
            select: {
              id: true,
              role: true,
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
      req.prisma.supportTicket.update({
        where: { id },
        data: {
          status: isStaff ? 'WAITING_USER' : 'IN_PROGRESS',
          updatedAt: new Date()
        }
      })
    ]);

    logger.info(`Message added to ticket #${ticket.ticketNumber} by user ${req.user.id}`);

    res.status(201).json({
      success: true,
      data: { message: ticketMessage },
      message: 'Reply sent successfully'
    });

  } catch (error) {
    next(error);
  }
});

// ============================================
// ADMIN/STAFF ENDPOINTS
// ============================================

// @route   GET /api/support/admin/tickets
// @desc    Get all tickets (for staff)
// @access  Private (Staff only)
router.get('/admin/tickets', [
  auth,
  requireRole(['EMPLOYEE', 'MANAGER', 'ADMIN', 'SUPER_ADMIN']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['OPEN', 'IN_PROGRESS', 'WAITING_USER', 'RESOLVED', 'CLOSED']),
  query('category').optional().isIn([
    'ACCOUNT', 'BOOKING', 'PAYMENT', 'TECHNICAL', 'VERIFICATION', 'SAFETY', 'OTHER'
  ]),
  query('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
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

    const { page = 1, limit = 20, status, category, priority } = req.query;
    const skip = (page - 1) * limit;

    const whereClause = {};
    if (status) whereClause.status = status;
    if (category) whereClause.category = category;
    if (priority) whereClause.priority = priority;

    const [tickets, total] = await Promise.all([
      req.prisma.supportTicket.findMany({
        where: whereClause,
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' }
        ],
        include: {
          user: {
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
          assignedUser: {
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
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' }
          }
        }
      }),
      req.prisma.supportTicket.count({ where: whereClause })
    ]);

    res.json({
      success: true,
      data: {
        tickets,
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

// @route   PUT /api/support/admin/tickets/:id/assign
// @desc    Assign ticket to staff member
// @access  Private (Manager/Admin only)
router.put('/admin/tickets/:id/assign', [
  auth,
  requireRole(['MANAGER', 'ADMIN', 'SUPER_ADMIN']),
  body('assignedTo').isUUID().withMessage('Valid user ID required')
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
    const { assignedTo } = req.body;

    // Verify assigned user is staff
    const assignedUser = await req.prisma.user.findUnique({
      where: { id: assignedTo }
    });

    if (!assignedUser || !['EMPLOYEE', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'].includes(assignedUser.role)) {
      return res.status(400).json({
        success: false,
        error: 'Can only assign to staff members'
      });
    }

    const ticket = await req.prisma.supportTicket.update({
      where: { id },
      data: {
        assignedTo,
        assignedAt: new Date(),
        status: 'IN_PROGRESS'
      },
      include: {
        user: {
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
        assignedUser: {
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

    logger.info(`Ticket #${ticket.ticketNumber} assigned to ${assignedTo} by ${req.user.id}`);

    res.json({
      success: true,
      data: { ticket },
      message: 'Ticket assigned successfully'
    });

  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/support/admin/tickets/:id/resolve
// @desc    Mark ticket as resolved
// @access  Private (Staff only)
router.put('/admin/tickets/:id/resolve', [
  auth,
  requireRole(['EMPLOYEE', 'MANAGER', 'ADMIN', 'SUPER_ADMIN']),
  body('resolution').trim().notEmpty().withMessage('Resolution summary is required')
    .isLength({ max: 2000 }).withMessage('Resolution must be 2000 characters or less')
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
    const { resolution } = req.body;

    const ticket = await req.prisma.supportTicket.update({
      where: { id },
      data: {
        status: 'RESOLVED',
        resolution,
        resolvedAt: new Date()
      }
    });

    logger.info(`Ticket #${ticket.ticketNumber} resolved by ${req.user.id}`);

    res.json({
      success: true,
      data: { ticket },
      message: 'Ticket marked as resolved'
    });

  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/support/admin/tickets/:id/close
// @desc    Close a ticket
// @access  Private (Staff only)
router.put('/admin/tickets/:id/close', [
  auth,
  requireRole(['EMPLOYEE', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'])
], async (req, res, next) => {
  try {
    const { id } = req.params;

    const ticket = await req.prisma.supportTicket.update({
      where: { id },
      data: {
        status: 'CLOSED',
        closedAt: new Date()
      }
    });

    logger.info(`Ticket #${ticket.ticketNumber} closed by ${req.user.id}`);

    res.json({
      success: true,
      data: { ticket },
      message: 'Ticket closed successfully'
    });

  } catch (error) {
    next(error);
  }
});

// @route   GET /api/support/admin/statistics
// @desc    Get support ticket statistics
// @access  Private (Staff only)
router.get('/admin/statistics', [
  auth,
  requireRole(['EMPLOYEE', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'])
], async (req, res, next) => {
  try {
    const [
      total,
      byStatus,
      byCategory,
      byPriority,
      avgResponseTime
    ] = await Promise.all([
      req.prisma.supportTicket.count(),
      req.prisma.supportTicket.groupBy({
        by: ['status'],
        _count: true
      }),
      req.prisma.supportTicket.groupBy({
        by: ['category'],
        _count: true
      }),
      req.prisma.supportTicket.groupBy({
        by: ['priority'],
        _count: true
      }),
      // Calculate average response time (first staff reply)
      req.prisma.$queryRaw`
        SELECT AVG(EXTRACT(EPOCH FROM (tm.created_at - st.created_at)) / 3600) as avg_hours
        FROM support_tickets st
        INNER JOIN ticket_messages tm ON tm.ticket_id = st.id
        WHERE tm.is_staff = true
        AND tm.created_at = (
          SELECT MIN(created_at)
          FROM ticket_messages
          WHERE ticket_id = st.id AND is_staff = true
        )
      `
    ]);

    const formatGroupBy = (data) => {
      return data.reduce((acc, item) => {
        acc[item.status || item.category || item.priority] = item._count;
        return acc;
      }, {});
    };

    res.json({
      success: true,
      data: {
        statistics: {
          total,
          byStatus: formatGroupBy(byStatus),
          byCategory: formatGroupBy(byCategory),
          byPriority: formatGroupBy(byPriority),
          avgResponseTimeHours: avgResponseTime[0]?.avg_hours
            ? parseFloat(avgResponseTime[0].avg_hours).toFixed(2)
            : null
        }
      }
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
