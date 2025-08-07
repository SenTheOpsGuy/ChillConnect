const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const tokenRoutes = require('./routes/tokens');
const bookingRoutes = require('./routes/bookings');
const chatRoutes = require('./routes/chat');
const adminRoutes = require('./routes/admin');
const uploadRoutes = require('./routes/upload');

const app = express();

// Trust proxy for Railway (fixes rate limiting behind proxy)
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'development'
      ? true
      : [
          process.env.FRONTEND_URL || "http://localhost:3001",
          "https://chillconnect.in",
          "https://www.chillconnect.in"
        ],
    methods: ["GET", "POST"]
  }
});

// Initialize Prisma
const prisma = new PrismaClient();

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.'
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'development' 
    ? true // Allow all origins in development
    : [
        process.env.FRONTEND_URL || "http://localhost:3001",
        "https://chillconnect.in",
        "https://www.chillconnect.in"
      ],
  credentials: true
}));
app.use(compression());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Make Prisma available in request context
app.use((req, res, next) => {
  req.prisma = prisma;
  req.io = io;
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tokens', tokenRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);

// Change user role endpoint (temporary for testing)
app.post('/api/change-user-role', async (req, res) => {
  try {
    const { email, newRole, adminPassword } = req.body;
    
    // Security check
    if (!adminPassword || adminPassword !== 'ChillConnect2024Admin') {
      logger.warn('Unauthorized role change attempt');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    logger.info(`🔧 Changing user role for ${email} to ${newRole}...`);

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { role: newRole }
    });

    logger.info('✅ User role updated successfully:', { 
      email: updatedUser.email, 
      newRole: updatedUser.role 
    });

    res.json({
      success: true,
      message: `User ${email} role changed to ${newRole}`,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('❌ Role change failed:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use(errorHandler);

// Socket.IO connection handling
const socketAuth = require('./middleware/socketAuth');
const chatService = require('./services/chatService');

io.use(socketAuth);

io.on('connection', (socket) => {
  logger.info(`User connected: ${socket.userId}`);
  
  // Join user to their personal room
  socket.join(`user_${socket.userId}`);
  
  // Join booking rooms based on user's active bookings
  chatService.joinUserBookingRooms(socket, socket.userId);
  
  // Handle chat messages
  socket.on('send_message', async (data) => {
    try {
      await chatService.handleMessage(socket, data);
    } catch (error) {
      logger.error('Socket message error:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });
  
  // Handle typing indicators
  socket.on('typing_start', (data) => {
    socket.to(`booking_${data.bookingId}`).emit('user_typing', {
      userId: socket.userId,
      bookingId: data.bookingId
    });
  });
  
  socket.on('typing_stop', (data) => {
    socket.to(`booking_${data.bookingId}`).emit('user_stopped_typing', {
      userId: socket.userId,
      bookingId: data.bookingId
    });
  });
  
  socket.on('disconnect', () => {
    logger.info(`User disconnected: ${socket.userId}`);
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
  });
  await prisma.$disconnect();
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
  });
  await prisma.$disconnect();
});

const PORT = process.env.PORT || 5000;

// Only start server if not in test environment
if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    logger.info(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
    logger.info(`📊 Health check available at http://localhost:${PORT}/health`);
  });
}

module.exports = { app, server, io };