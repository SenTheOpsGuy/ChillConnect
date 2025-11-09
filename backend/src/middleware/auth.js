const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided, authorization denied'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await req.prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        profile: true,
        tokenWallet: true
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Token is not valid'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error('Auth middleware error:', error);
    res.status(401).json({
      success: false,
      error: 'Token is not valid'
    });
  }
};

// Role-based authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Insufficient permissions.'
      });
    }

    next();
  };
};

// Verification status middleware
const requireVerification = (req, res, next) => {
  if (!req.user.isVerified) {
    return res.status(403).json({
      success: false,
      error: 'Account verification required'
    });
  }
  next();
};

// Age verification middleware
const requireAgeVerification = (req, res, next) => {
  if (!req.user.isAgeVerified) {
    return res.status(403).json({
      success: false,
      error: 'Age verification required'
    });
  }
  next();
};

// Consent verification middleware
const requireConsent = (req, res, next) => {
  if (!req.user.consentGiven) {
    return res.status(403).json({
      success: false,
      error: 'Consent required'
    });
  }
  next();
};

module.exports = {
  auth,
  authorize,
  requireRole: authorize, // Alias for authorize
  requireVerification,
  requireAgeVerification,
  requireConsent,
};