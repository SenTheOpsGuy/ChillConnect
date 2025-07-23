import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { authenticate, AuthRequest, authorize } from '../middleware/auth';
import { prisma } from '../utils/database';
import { logger } from '../utils/logger';
import { asyncHandler } from '../middleware/errorHandler';
import { auditLog } from '../services/auditService';

const router = express.Router();

// Get booking messages
router.get('/:bookingId/messages', [
  authenticate,
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], asyncHandler(async (req: AuthRequest, res) => {
  const { bookingId } = req.params;
  const { page = 1, limit = 50 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  // Verify user access to booking
  const booking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      OR: [
        { seekerId: req.user!.id },
        { providerId: req.user!.id },
        { employeeId: req.user!.id }
      ]
    }
  });

  if (!booking && !['MANAGER', 'ADMIN', 'SUPER_ADMIN'].includes(req.user!.role)) {
    return res.status(403).json({ error: 'Access denied to this conversation' });
  }

  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      where: { bookingId },
      include: {
        sender: {
          select: {
            id: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                profileImageUrl: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
      skip: offset
    }),
    prisma.message.count({ where: { bookingId } })
  ]);

  const formattedMessages = messages.reverse().map(message => ({
    id: message.id,
    content: message.content,
    messageType: message.messageType,
    mediaUrl: message.mediaUrl,
    createdAt: message.createdAt,
    isRead: message.isRead,
    isFlagged: message.isFlagged,
    sender: {
      id: message.sender.id,
      name: `${message.sender.profile?.firstName} ${message.sender.profile?.lastName}`,
      profileImage: message.sender.profile?.profileImageUrl
    }
  }));

  res.json({
    messages: formattedMessages,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  });
}));

// Get user's conversations
router.get('/conversations', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;

  const bookings = await prisma.booking.findMany({
    where: {
      OR: [
        { seekerId: userId },
        { providerId: userId }
      ],
      messages: {
        some: {}
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
              profileImageUrl: true
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
              profileImageUrl: true
            }
          }
        }
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: {
          content: true,
          createdAt: true,
          senderId: true,
          messageType: true
        }
      },
      _count: {
        select: {
          messages: {
            where: {
              senderId: { not: userId },
              isRead: false
            }
          }
        }
      }
    },
    orderBy: {
      messages: {
        _count: 'desc'
      }
    }
  });

  const conversations = bookings.map(booking => {
    const isSeeker = booking.seekerId === userId;
    const counterpart = isSeeker ? booking.provider : booking.seeker;
    const lastMessage = booking.messages[0];

    return {
      bookingId: booking.id,
      counterpart: {
        id: counterpart.id,
        name: `${counterpart.profile?.firstName} ${counterpart.profile?.lastName}`,
        profileImage: counterpart.profile?.profileImageUrl
      },
      lastMessage: lastMessage ? {
        content: lastMessage.content,
        createdAt: lastMessage.createdAt,
        isFromMe: lastMessage.senderId === userId,
        messageType: lastMessage.messageType
      } : null,
      unreadCount: booking._count.messages,
      bookingStatus: booking.status,
      scheduledAt: booking.scheduledAt
    };
  });

  res.json({ conversations });
}));

// Flag message
router.post('/flag-message', [
  authenticate,
  authorize(['EMPLOYEE', 'MANAGER', 'ADMIN', 'SUPER_ADMIN']),
  body('messageId').isUUID(),
  body('reason').isString().isLength({ min: 5, max: 200 })
], asyncHandler(async (req: AuthRequest, res) => {
  const { messageId, reason } = req.body;

  const message = await prisma.message.update({
    where: { id: messageId },
    data: {
      isFlagged: true,
      flagReason: reason
    }
  });

  // Audit log
  await auditLog(
    req.user!.id,
    'MESSAGE_FLAGGED',
    'message',
    messageId,
    { reason },
    req.ip,
    req.get('User-Agent')
  );

  logger.info(`Message ${messageId} flagged by ${req.user!.id}: ${reason}`);

  res.json({ message: 'Message flagged successfully' });
}));

// Get flagged messages (admin only)
router.get('/flagged-messages', [
  authenticate,
  authorize(['MANAGER', 'ADMIN', 'SUPER_ADMIN']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], asyncHandler(async (req: AuthRequest, res) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      where: { isFlagged: true },
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
        }
      },
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
      skip: offset
    }),
    prisma.message.count({ where: { isFlagged: true } })
  ]);

  res.json({
    messages,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  });
}));

export { router as chatRoutes };