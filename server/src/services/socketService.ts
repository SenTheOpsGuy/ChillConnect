import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/database';
import { logger } from '../utils/logger';
import { auditLog } from './auditService';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

export const initializeSocket = (io: Server) => {
  // Authentication middleware
  io.use(async (socket: any, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, role: true, isActive: true }
      });

      if (!user || !user.isActive) {
        return next(new Error('User not found or inactive'));
      }

      socket.userId = user.id;
      socket.userRole = user.role;
      
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    logger.info(`User ${socket.userId} connected to chat`);

    // Join booking rooms
    socket.on('join-booking', async (bookingId: string) => {
      try {
        // Verify user is part of this booking
        const booking = await prisma.booking.findFirst({
          where: {
            id: bookingId,
            OR: [
              { seekerId: socket.userId },
              { providerId: socket.userId },
              { employeeId: socket.userId }
            ]
          }
        });

        if (!booking) {
          socket.emit('error', { message: 'Unauthorized access to booking' });
          return;
        }

        socket.join(`booking-${bookingId}`);
        socket.emit('joined-booking', { bookingId });
        
        logger.info(`User ${socket.userId} joined booking room ${bookingId}`);
      } catch (error) {
        logger.error('Error joining booking room:', error);
        socket.emit('error', { message: 'Failed to join booking room' });
      }
    });

    // Send message
    socket.on('send-message', async (data: {
      bookingId: string;
      content: string;
      messageType?: string;
      mediaUrl?: string;
    }) => {
      try {
        const { bookingId, content, messageType = 'text', mediaUrl } = data;

        // Verify user is part of this booking
        const booking = await prisma.booking.findFirst({
          where: {
            id: bookingId,
            OR: [
              { seekerId: socket.userId },
              { providerId: socket.userId }
            ]
          }
        });

        if (!booking) {
          socket.emit('error', { message: 'Unauthorized access to booking' });
          return;
        }

        // Content moderation
        const isFlagged = await moderateContent(content);

        // Save message
        const message = await prisma.message.create({
          data: {
            bookingId,
            senderId: socket.userId!,
            content,
            messageType,
            mediaUrl,
            isFlagged
          },
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
          }
        });

        // Emit to booking room
        io.to(`booking-${bookingId}`).emit('new-message', {
          id: message.id,
          content: message.content,
          messageType: message.messageType,
          mediaUrl: message.mediaUrl,
          createdAt: message.createdAt,
          sender: {
            id: message.sender.id,
            name: `${message.sender.profile?.firstName} ${message.sender.profile?.lastName}`,
            profileImage: message.sender.profile?.profileImageUrl
          },
          isFlagged: message.isFlagged
        });

        // Notify monitoring employees if flagged
        if (isFlagged) {
          await notifyMonitoringEmployees(bookingId, message);
        }

        // Audit log
        await auditLog(
          socket.userId!,
          'MESSAGE_SENT',
          'message',
          message.id,
          { bookingId, messageType, isFlagged }
        );

      } catch (error) {
        logger.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Mark messages as read
    socket.on('mark-read', async (data: { bookingId: string; messageIds: string[] }) => {
      try {
        const { bookingId, messageIds } = data;

        await prisma.message.updateMany({
          where: {
            id: { in: messageIds },
            bookingId,
            senderId: { not: socket.userId }
          },
          data: { isRead: true }
        });

        socket.to(`booking-${bookingId}`).emit('messages-read', { messageIds });
      } catch (error) {
        logger.error('Error marking messages as read:', error);
      }
    });

    // Typing indicators
    socket.on('typing', (data: { bookingId: string; isTyping: boolean }) => {
      socket.to(`booking-${data.bookingId}`).emit('user-typing', {
        userId: socket.userId,
        isTyping: data.isTyping
      });
    });

    // Admin monitoring
    if (['EMPLOYEE', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'].includes(socket.userRole!)) {
      socket.on('monitor-booking', async (bookingId: string) => {
        try {
          // Verify employee is assigned to this booking or has higher privileges
          const canMonitor = await verifyMonitoringAccess(socket.userId!, bookingId, socket.userRole!);
          
          if (!canMonitor) {
            socket.emit('error', { message: 'Unauthorized monitoring access' });
            return;
          }

          socket.join(`booking-${bookingId}`);
          socket.emit('monitoring-booking', { bookingId });
          
        } catch (error) {
          logger.error('Error setting up monitoring:', error);
          socket.emit('error', { message: 'Failed to setup monitoring' });
        }
      });
    }

    socket.on('disconnect', () => {
      logger.info(`User ${socket.userId} disconnected from chat`);
    });
  });
};

const moderateContent = async (content: string): Promise<boolean> => {
  // Simple keyword-based moderation
  const flaggedKeywords = [
    'phone', 'number', 'whatsapp', 'telegram', 'email', '@',
    'outside', 'offline', 'cash', 'direct', 'personal',
    'contact', 'meet', 'elsewhere'
  ];

  const lowerContent = content.toLowerCase();
  return flaggedKeywords.some(keyword => lowerContent.includes(keyword));
};

const notifyMonitoringEmployees = async (bookingId: string, message: any) => {
  try {
    // Get assigned employee and managers
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { employeeId: true }
    });

    if (booking?.employeeId) {
      // Notify via socket if connected
      // In production, you might also send push notifications or emails
      logger.info(`Flagged message in booking ${bookingId} - notifying employee ${booking.employeeId}`);
    }
  } catch (error) {
    logger.error('Error notifying monitoring employees:', error);
  }
};

const verifyMonitoringAccess = async (userId: string, bookingId: string, userRole: string): Promise<boolean> => {
  if (['ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
    return true;
  }

  if (userRole === 'MANAGER') {
    // Managers can monitor all bookings in their region
    return true;
  }

  if (userRole === 'EMPLOYEE') {
    // Employees can only monitor assigned bookings
    const assignment = await prisma.assignment.findFirst({
      where: {
        employeeId: userId,
        itemId: bookingId,
        itemType: 'booking',
        status: 'active'
      }
    });
    return !!assignment;
  }

  return false;
};