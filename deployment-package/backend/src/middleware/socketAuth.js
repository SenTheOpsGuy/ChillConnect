const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

const socketAuth = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return next(new Error('No token provided'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        profile: true
      }
    });

    if (!user) {
      return next(new Error('User not found'));
    }

    // Attach user info to socket
    socket.userId = user.id;
    socket.userRole = user.role;
    socket.user = user;
    
    next();
  } catch (error) {
    logger.error('Socket auth error:', error);
    next(new Error('Authentication failed'));
  }
};

module.exports = socketAuth;