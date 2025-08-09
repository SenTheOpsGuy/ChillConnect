const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

// Content filtering keywords
const FLAGGED_KEYWORDS = [
  'phone', 'number', 'call', 'whatsapp', 'telegram', 'email', 'gmail', 'yahoo',
  'instagram', 'facebook', 'snapchat', 'twitter', 'tiktok', 'contact', 'outside',
  'meet', 'offline', 'cash', 'payment', 'venmo', 'paypal', 'bank', 'transfer',
  'address', 'location', 'home', 'hotel', 'room', 'apartment', 'house'
];

// Suspicious patterns
const SUSPICIOUS_PATTERNS = [
  /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, // Phone numbers
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email addresses
  /\b(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}\b/g, // URLs
  /\b[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g, // Social media handles
];

// Check if message contains flagged content
const containsFlaggedContent = (message) => {
  const lowercaseMessage = message.toLowerCase();
  
  // Check for flagged keywords
  const hasKeywords = FLAGGED_KEYWORDS.some(keyword => 
    lowercaseMessage.includes(keyword)
  );
  
  // Check for suspicious patterns
  const hasPatterns = SUSPICIOUS_PATTERNS.some(pattern => 
    pattern.test(message)
  );
  
  return hasKeywords || hasPatterns;
};

// Calculate risk score for a message
const calculateRiskScore = (message, senderHistory) => {
  let score = 0;
  
  // Base score for flagged content
  if (containsFlaggedContent(message)) {
    score += 50;
  }
  
  // Check for urgent/pressure language
  const urgentWords = ['urgent', 'hurry', 'quick', 'fast', 'now', 'asap'];
  if (urgentWords.some(word => message.toLowerCase().includes(word))) {
    score += 20;
  }
  
  // Check sender's flagging history
  if (senderHistory.flaggedCount > 0) {
    score += Math.min(senderHistory.flaggedCount * 10, 30);
  }
  
  // Check message length (very short messages can be suspicious)
  if (message.trim().length < 10) {
    score += 10;
  }
  
  return Math.min(score, 100);
};

// Join user to their booking rooms
const joinUserBookingRooms = async (socket, userId) => {
  try {
    // Get user's active bookings
    const bookings = await prisma.booking.findMany({
      where: {
        OR: [
          { seekerId: userId },
          { providerId: userId }
        ],
        status: {
          in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED']
        }
      },
      select: { id: true }
    });
    
    // Join each booking room
    bookings.forEach(booking => {
      socket.join(`booking_${booking.id}`);
    });
    
    logger.info(`User ${userId} joined ${bookings.length} booking rooms`);
  } catch (error) {
    logger.error(`Error joining user ${userId} to booking rooms:`, error);
  }
};

// Handle incoming message
const handleMessage = async (socket, data) => {
  try {
    const { bookingId, content, mediaUrl } = data;
    const senderId = socket.userId;
    
    // Validate booking access
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        seeker: {
          select: { id: true }
        },
        provider: {
          select: { id: true }
        }
      }
    });
    
    if (!booking) {
      socket.emit('error', { message: 'Booking not found' });
      return;
    }
    
    // Check if user is part of this booking
    if (senderId !== booking.seekerId && senderId !== booking.providerId) {
      socket.emit('error', { message: 'Access denied' });
      return;
    }
    
    // Check if booking allows messaging
    if (!['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED'].includes(booking.status)) {
      socket.emit('error', { message: 'Messaging not allowed for this booking status' });
      return;
    }
    
    // Get sender's message history for risk calculation
    const senderHistory = await prisma.message.findMany({
      where: {
        senderId,
        isFlagged: true
      },
      select: { id: true }
    });
    
    // Calculate risk score
    const riskScore = calculateRiskScore(content, { flaggedCount: senderHistory.length });
    const isFlagged = riskScore >= 50;
    
    // Create message
    const message = await prisma.message.create({
      data: {
        bookingId,
        senderId,
        content,
        mediaUrl,
        isFlagged,
        flaggedReason: isFlagged ? 'Automatic content filtering' : null
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
    await prisma.booking.update({
      where: { id: bookingId },
      data: { updatedAt: new Date() }
    });
    
    // Broadcast message to booking room
    socket.to(`booking_${bookingId}`).emit('new_message', {
      id: message.id,
      content: message.content,
      mediaUrl: message.mediaUrl,
      senderId: message.senderId,
      sender: message.sender,
      isSystemMessage: false,
      isFlagged: message.isFlagged,
      createdAt: message.createdAt
    });
    
    // Acknowledge to sender
    socket.emit('message_sent', {
      id: message.id,
      tempId: data.tempId, // For client-side message management
      createdAt: message.createdAt
    });
    
    // If message is flagged, notify monitoring system
    if (isFlagged) {
      await notifyMonitoringSystem(bookingId, message, riskScore);
    }
    
    logger.info(`Message sent in booking ${bookingId} by user ${senderId} (risk score: ${riskScore})`);
    
  } catch (error) {
    logger.error('Error handling message:', error);
    socket.emit('error', { message: 'Failed to send message' });
  }
};

// Notify monitoring system of flagged content
const notifyMonitoringSystem = async (bookingId, message, riskScore) => {
  try {
    // Get assigned monitoring employee
    const assignment = await prisma.assignment.findFirst({
      where: {
        itemId: bookingId,
        itemType: 'BOOKING_MONITORING',
        isActive: true
      },
      include: {
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
      }
    });
    
    if (assignment) {
      // Create monitoring alert
      await prisma.monitoringAlert.create({
        data: {
          bookingId,
          messageId: message.id,
          employeeId: assignment.employeeId,
          alertType: 'FLAGGED_MESSAGE',
          riskScore,
          description: `Message flagged with risk score ${riskScore}`,
          isResolved: false
        }
      });
      
      // Notify employee via socket
      global.io.to(`user_${assignment.employeeId}`).emit('monitoring_alert', {
        type: 'flagged_message',
        bookingId,
        messageId: message.id,
        riskScore,
        message: {
          content: message.content,
          senderId: message.senderId,
          createdAt: message.createdAt
        }
      });
      
      logger.info(`Monitoring alert sent to employee ${assignment.employeeId} for booking ${bookingId}`);
    }
  } catch (error) {
    logger.error('Error notifying monitoring system:', error);
  }
};

// Get chat statistics for admin dashboard
const getChatStatistics = async (timeframe = '24h') => {
  try {
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
    
    const [totalMessages, flaggedMessages, activeChats] = await Promise.all([
      prisma.message.count({
        where: {
          createdAt: {
            gte: timeAgo
          }
        }
      }),
      prisma.message.count({
        where: {
          createdAt: {
            gte: timeAgo
          },
          isFlagged: true
        }
      }),
      prisma.booking.count({
        where: {
          status: {
            in: ['CONFIRMED', 'IN_PROGRESS']
          },
          messages: {
            some: {
              createdAt: {
                gte: timeAgo
              }
            }
          }
        }
      })
    ]);
    
    return {
      totalMessages,
      flaggedMessages,
      activeChats,
      flaggedPercentage: totalMessages > 0 ? (flaggedMessages / totalMessages) * 100 : 0
    };
  } catch (error) {
    logger.error('Error getting chat statistics:', error);
    throw error;
  }
};

// Get flagged messages for monitoring
const getFlaggedMessages = async (page = 1, limit = 20, employeeId = null) => {
  try {
    const skip = (page - 1) * limit;
    
    const whereClause = {
      isFlagged: true,
      ...(employeeId && {
        booking: {
          assignedEmployeeId: employeeId
        }
      })
    };
    
    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
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
      }),
      prisma.message.count({ where: whereClause })
    ]);
    
    return {
      messages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    logger.error('Error getting flagged messages:', error);
    throw error;
  }
};

// Send system message to booking
const sendSystemMessage = async (bookingId, content, senderId) => {
  try {
    const message = await prisma.message.create({
      data: {
        bookingId,
        senderId,
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
    
    // Broadcast to booking room
    global.io.to(`booking_${bookingId}`).emit('new_message', {
      id: message.id,
      content: message.content,
      senderId: message.senderId,
      sender: message.sender,
      isSystemMessage: true,
      isFlagged: false,
      createdAt: message.createdAt
    });
    
    logger.info(`System message sent to booking ${bookingId}`);
    
    return message;
  } catch (error) {
    logger.error('Error sending system message:', error);
    throw error;
  }
};

module.exports = {
  joinUserBookingRooms,
  handleMessage,
  getChatStatistics,
  getFlaggedMessages,
  sendSystemMessage,
  containsFlaggedContent,
  calculateRiskScore
};