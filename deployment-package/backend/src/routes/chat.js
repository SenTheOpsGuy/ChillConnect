const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { auth, authorize, requireVerification } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Content filtering keywords
const FLAGGED_KEYWORDS = [
  'phone', 'number', 'call', 'whatsapp', 'telegram', 'email', 'gmail', 'yahoo',
  'instagram', 'facebook', 'snapchat', 'twitter', 'contact', 'outside',
  'meet', 'offline', 'cash', 'payment', 'venmo', 'paypal', 'bank',
  'address', 'location', 'home', 'hotel', 'room'
];

// Check if message contains flagged content
const containsFlaggedContent = (message) => {
  const lowercaseMessage = message.toLowerCase();
  return FLAGGED_KEYWORDS.some(keyword => lowercaseMessage.includes(keyword));
};

// @route   GET /api/chat/conversations
// @desc    Get user's conversations
// @access  Private
router.get('/conversations', [
  auth,
  requireVerification
], async (req, res, next) => {
  try {
    // Get user's bookings that have chat capabilities
    const bookings = await req.prisma.booking.findMany({
      where: {
        OR: [
          { seekerId: req.user.id },
          { providerId: req.user.id }
        ],
        status: {
          in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED']
        }
      },
      include: {
        seeker: {
          select: {
            id: true,
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
            id: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                profilePhoto: true
              }
            }
          }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    const conversations = bookings.map(booking => {
      const isSeeker = req.user.id === booking.seekerId;
      const otherUser = isSeeker ? booking.provider : booking.seeker;
      const lastMessage = booking.messages[0];

      return {
        bookingId: booking.id,
        type: booking.type,
        status: booking.status,
        startTime: booking.startTime,
        otherUser: {
          id: otherUser.id,
          name: `${otherUser.profile.firstName} ${otherUser.profile.lastName}`,
          profilePhoto: otherUser.profile.profilePhoto
        },
        lastMessage: lastMessage ? {
          id: lastMessage.id,
          content: lastMessage.content,
          senderId: lastMessage.senderId,
          createdAt: lastMessage.createdAt,
          isSystemMessage: lastMessage.isSystemMessage
        } : null,
        unreadCount: 0 // TODO: Implement unread count
      };
    });

    res.json({
      success: true,
      data: { conversations }
    });

  } catch (error) {
    next(error);
  }
});

// @route   GET /api/chat/:bookingId/messages
// @desc    Get messages for a booking
// @access  Private
router.get('/:bookingId/messages', [
  auth,
  requireVerification,
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

    const { bookingId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    // Verify user has access to this booking
    const booking = await req.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        seeker: {
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
        provider: {
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

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    // Check access permissions
    const isSeeker = req.user.id === booking.seekerId;
    const isProvider = req.user.id === booking.providerId;
    const isAdmin = ['EMPLOYEE', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'].includes(req.user.role);

    if (!isSeeker && !isProvider && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Get messages
    const messages = await req.prisma.message.findMany({
      where: { bookingId },
      orderBy: { createdAt: 'desc' },
      skip: parseInt(skip),
      take: parseInt(limit),
      include: {
        sender: {
          select: {
            id: true,
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

    const totalMessages = await req.prisma.message.count({
      where: { bookingId }
    });

    res.json({
      success: true,
      data: {
        booking: {
          id: booking.id,
          type: booking.type,
          status: booking.status,
          startTime: booking.startTime,
          seeker: booking.seeker,
          provider: booking.provider
        },
        messages: messages.reverse().map(message => ({
          id: message.id,
          content: message.content,
          mediaUrl: message.mediaUrl,
          senderId: message.senderId,
          sender: message.sender,
          isSystemMessage: message.isSystemMessage,
          isFlagged: message.isFlagged,
          createdAt: message.createdAt
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalMessages,
          totalPages: Math.ceil(totalMessages / limit)
        }
      }
    });

  } catch (error) {
    next(error);
  }
});

// @route   POST /api/chat/:bookingId/messages
// @desc    Send a message
// @access  Private
router.post('/:bookingId/messages', [
  auth,
  requireVerification,
  body('content').notEmpty().withMessage('Message content is required'),
  body('mediaUrl').optional().isURL().withMessage('Media URL must be valid')
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

    const { bookingId } = req.params;
    const { content, mediaUrl } = req.body;

    // Verify user has access to this booking
    const booking = await req.prisma.booking.findUnique({
      where: { id: bookingId }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    // Check if user is part of this booking
    if (req.user.id !== booking.seekerId && req.user.id !== booking.providerId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Check if booking allows messaging
    if (!['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        error: 'Messaging not allowed for this booking status'
      });
    }

    // Check for flagged content
    const isFlagged = containsFlaggedContent(content);
    
    // Create message
    const message = await req.prisma.message.create({
      data: {
        bookingId,
        senderId: req.user.id,
        content,
        mediaUrl,
        isFlagged,
        ...(isFlagged && { flaggedReason: 'Automatic content filtering' })
      },
      include: {
        sender: {
          select: {
            id: true,
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

    // Update booking timestamp
    await req.prisma.booking.update({
      where: { id: bookingId },
      data: { updatedAt: new Date() }
    });

    // Emit socket event for real-time chat
    req.io.to(`booking_${bookingId}`).emit('new_message', {
      id: message.id,
      content: message.content,
      mediaUrl: message.mediaUrl,
      senderId: message.senderId,
      sender: message.sender,
      isSystemMessage: message.isSystemMessage,
      isFlagged: message.isFlagged,
      createdAt: message.createdAt
    });

    // If message is flagged, notify monitoring employee
    if (isFlagged) {
      const assignedEmployee = await req.prisma.assignment.findFirst({
        where: {
          itemId: bookingId,
          itemType: 'BOOKING_MONITORING',
          isActive: true
        }
      });

      if (assignedEmployee) {
        req.io.to(`user_${assignedEmployee.employeeId}`).emit('flagged_message', {
          bookingId,
          messageId: message.id,
          content: message.content,
          senderId: message.senderId,
          reason: 'Automatic content filtering'
        });
      }

      logger.warn(`Flagged message sent in booking ${bookingId} by user ${req.user.id}`);
    }

    logger.info(`Message sent in booking ${bookingId} by user ${req.user.id}`);

    res.status(201).json({
      success: true,
      data: {
        message: {
          id: message.id,
          content: message.content,
          mediaUrl: message.mediaUrl,
          senderId: message.senderId,
          sender: message.sender,
          isSystemMessage: message.isSystemMessage,
          isFlagged: message.isFlagged,
          createdAt: message.createdAt
        }
      }
    });

  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/chat/messages/:messageId/flag
// @desc    Flag a message (Admin only)
// @access  Private (Admin)
router.put('/messages/:messageId/flag', [
  auth,
  authorize('EMPLOYEE', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'),
  body('reason').notEmpty().withMessage('Reason is required')
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

    const { messageId } = req.params;
    const { reason } = req.body;

    const message = await req.prisma.message.update({
      where: { id: messageId },
      data: {
        isFlagged: true,
        flaggedReason: reason
      },
      include: {
        booking: {
          select: {
            id: true,
            seekerId: true,
            providerId: true
          }
        }
      }
    });

    // Notify users in the booking
    req.io.to(`booking_${message.bookingId}`).emit('message_flagged', {
      messageId: message.id,
      reason
    });

    logger.info(`Message ${messageId} flagged by ${req.user.email} for: ${reason}`);

    res.json({
      success: true,
      message: 'Message flagged successfully'
    });

  } catch (error) {
    next(error);
  }
});

// @route   GET /api/chat/admin/flagged-messages
// @desc    Get flagged messages (Admin only)
// @access  Private (Admin)
router.get('/admin/flagged-messages', [
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
    const skip = (page - 1) * limit;

    const flaggedMessages = await req.prisma.message.findMany({
      where: { isFlagged: true },
      orderBy: { createdAt: 'desc' },
      skip: parseInt(skip),
      take: parseInt(limit),
      include: {
        sender: {
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
        booking: {
          select: {
            id: true,
            type: true,
            status: true,
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
        }
      }
    });

    const totalFlagged = await req.prisma.message.count({
      where: { isFlagged: true }
    });

    res.json({
      success: true,
      data: {
        flaggedMessages,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalFlagged,
          totalPages: Math.ceil(totalFlagged / limit)
        }
      }
    });

  } catch (error) {
    next(error);
  }
});

// @route   POST /api/chat/:bookingId/system-message
// @desc    Send system message (Admin only)
// @access  Private (Admin)
router.post('/:bookingId/system-message', [
  auth,
  authorize('EMPLOYEE', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'),
  body('content').notEmpty().withMessage('Message content is required')
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

    const { bookingId } = req.params;
    const { content } = req.body;

    // Verify booking exists
    const booking = await req.prisma.booking.findUnique({
      where: { id: bookingId }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    // Create system message
    const message = await req.prisma.message.create({
      data: {
        bookingId,
        senderId: req.user.id,
        content,
        isSystemMessage: true,
        isFlagged: false
      },
      include: {
        sender: {
          select: {
            id: true,
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

    // Emit socket event
    req.io.to(`booking_${bookingId}`).emit('new_message', {
      id: message.id,
      content: message.content,
      senderId: message.senderId,
      sender: message.sender,
      isSystemMessage: true,
      isFlagged: false,
      createdAt: message.createdAt
    });

    logger.info(`System message sent to booking ${bookingId} by ${req.user.email}`);

    res.status(201).json({
      success: true,
      data: { message }
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;