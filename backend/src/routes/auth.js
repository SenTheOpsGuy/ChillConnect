const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const logger = require('../utils/logger');
const { sendPhoneOTP, sendEmailOTP, verifyPhoneOTP, verifyEmailOTP, getPhoneOTPStatus, getEmailOTPStatus } = require('../services/otpService');
const { 
  sendPhoneVerification, 
  verifyPhoneNumber,
  sendTransactionalSMS
} = require('../services/twilioService');
const {
  sendEmailVerification,
  generateEmailVerificationToken,
  verifyEmailVerificationToken,
  sendWelcomeEmail,
  sendTransactionalEmail
} = require('../services/brevoService');

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// @route   POST /api/auth/register
// @desc    Register new user
// @access  Public
router.post('/register', [
  body('email').isEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('role').isIn(['SEEKER', 'PROVIDER', 'EMPLOYEE', 'MANAGER', 'ADMIN', 'SUPER_ADMIN']).withMessage('Role must be SEEKER, PROVIDER, EMPLOYEE, MANAGER, ADMIN, or SUPER_ADMIN'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('dateOfBirth').isISO8601().withMessage('Valid date of birth is required'),
  body('phone').optional().isMobilePhone(),
  body('ageConfirmed').equals('true').withMessage('Age confirmation is required'),
  body('consentGiven').equals('true').withMessage('Consent is required')
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
      email, 
      password, 
      role, 
      firstName, 
      lastName, 
      dateOfBirth, 
      phone, 
      ageConfirmed, 
      consentGiven 
    } = req.body;

    // Check if user already exists
    const existingUser = await req.prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User already exists with this email'
      });
    }

    // Verify age (must be 18+)
    const birthDate = new Date(dateOfBirth);
    const age = Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    
    if (age < 18) {
      return res.status(400).json({
        success: false,
        error: 'You must be 18 or older to register'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user with profile in transaction
    const user = await req.prisma.$transaction(async (prisma) => {
      // Create user
      const newUser = await prisma.user.create({
        data: {
          email,
          phone,
          passwordHash,
          role,
          consentGiven: consentGiven === 'true',
          isAgeVerified: true // Since we verified age during registration
        }
      });

      // Create profile
      await prisma.userProfile.create({
        data: {
          userId: newUser.id,
          firstName,
          lastName,
          dateOfBirth: new Date(dateOfBirth)
        }
      });

      // Create token wallet
      await prisma.tokenWallet.create({
        data: {
          userId: newUser.id,
          balance: 0,
          escrowBalance: 0
        }
      });

      return newUser;
    });


    // Send verification email using Brevo
    const verificationToken = generateEmailVerificationToken(user.id, user.email);
    await sendEmailVerification(user.email, verificationToken);

    // Generate JWT token
    const token = generateToken(user.id);

    logger.info(`New user registered: ${email} (${role})`);

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
          isEmailVerified: user.isEmailVerified,
          isPhoneVerified: user.isPhoneVerified,
          isAgeVerified: user.isAgeVerified,
          consentGiven: user.consentGiven
        },
        token
      },
      message: 'Registration successful. Please check your email to verify your account.'
    });

  } catch (error) {
    next(error);
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('email').isEmail(),
  body('password').exists()
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

    const { email, password } = req.body;

    // Find user
    const user = await req.prisma.user.findUnique({
      where: { email },
      include: {
        profile: true,
        tokenWallet: true
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Update last login
    await req.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    // Generate JWT token
    const token = generateToken(user.id);

    logger.info(`User logged in: ${email}`);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
          isEmailVerified: user.isEmailVerified,
          isPhoneVerified: user.isPhoneVerified,
          isAgeVerified: user.isAgeVerified,
          consentGiven: user.consentGiven,
          profile: user.profile,
          tokenWallet: user.tokenWallet
        },
        token
      },
      message: 'Login successful'
    });

  } catch (error) {
    next(error);
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
  res.json({
    success: true,
    data: {
      user: {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role,
        isVerified: req.user.isVerified,
        isEmailVerified: req.user.isEmailVerified,
        isPhoneVerified: req.user.isPhoneVerified,
        isAgeVerified: req.user.isAgeVerified,
        consentGiven: req.user.consentGiven,
        profile: req.user.profile,
        tokenWallet: req.user.tokenWallet
      }
    }
  });
});

// @route   POST /api/auth/verify-email
// @desc    Verify email address
// @access  Public
router.post('/verify-email', [
  body('token').notEmpty().withMessage('Verification token is required')
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

    const { token } = req.body;

    // Verify email verification token using Brevo service
    const verificationResult = verifyEmailVerificationToken(token);
    
    if (!verificationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired verification token'
      });
    }
    
    // Update user email verification status
    const user = await req.prisma.user.update({
      where: { email: verificationResult.email },
      data: { isEmailVerified: true }
    });

    logger.info(`Email verified for user: ${user.email}`);

    res.json({
      success: true,
      message: 'Email verified successfully'
    });

  } catch (error) {
    if (error.message.includes('Verification token has expired') || 
        error.message.includes('Invalid verification token')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    next(error);
  }
});

// @route   POST /api/auth/send-phone-otp
// @desc    Send OTP to phone number (public for registration, private for updates)
// @access  Public/Private
router.post('/send-phone-otp', [
  body('phone').isMobilePhone().withMessage('Valid phone number is required')
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

    const { phone } = req.body;

    // Check if user is authenticated (for profile updates) or unauthenticated (for registration)
    const authHeader = req.headers.authorization;
    let userId = null;
    let isAuthenticated = false;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await req.prisma.user.findUnique({
          where: { id: decoded.id }
        });
        if (user) {
          userId = user.id;
          isAuthenticated = true;
        }
      } catch (authError) {
        // Continue as unauthenticated user for registration
      }
    }

    let result;
    
    if (isAuthenticated) {
      // For authenticated users (profile updates)
      const otpStatus = await getPhoneOTPStatus(userId, phone);
      
      if (otpStatus.hasActiveOTP && !otpStatus.canSendOTP) {
        return res.status(429).json({
          success: false,
          error: 'Please wait before requesting another OTP',
          cooldownRemaining: otpStatus.cooldownRemaining
        });
      }

      result = await sendPhoneOTP(userId, phone);
      logger.info(`OTP sent to phone: ${phone} for authenticated user: ${userId}`);
    } else {
      // For registration flow (unauthenticated)
      try {
        result = await sendPhoneVerification(phone);
        logger.info(`Registration OTP sent to phone: ${phone}`);
      } catch (error) {
        logger.error('Phone verification error:', error);
        
        // In development, return mock success
        if (process.env.NODE_ENV === 'development') {
          result = { otp: '123456' };
        } else {
          throw error;
        }
      }
    }

    res.json({
      success: true,
      message: 'OTP sent successfully to your phone',
      expiresAt: result.expiresAt || new Date(Date.now() + 10 * 60 * 1000),
      // In development, return OTP for testing
      ...(process.env.NODE_ENV === 'development' && { otp: result.otp || '123456' })
    });

  } catch (error) {
    if (error.message === 'Please wait before requesting another OTP') {
      return res.status(429).json({
        success: false,
        error: error.message
      });
    }
    next(error);
  }
});

// @route   POST /api/auth/verify-phone-otp
// @desc    Verify phone number with OTP (public for registration, private for updates)
// @access  Public/Private
router.post('/verify-phone-otp', [
  body('phone').isMobilePhone().withMessage('Valid phone number is required'),
  body('otp').isLength({ min: 4, max: 6 }).withMessage('OTP must be 4-6 digits')
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

    const { phone, otp } = req.body;

    // Check if user is authenticated (for profile updates) or unauthenticated (for registration)
    const authHeader = req.headers.authorization;
    let userId = null;
    let isAuthenticated = false;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await req.prisma.user.findUnique({
          where: { id: decoded.id }
        });
        if (user) {
          userId = user.id;
          isAuthenticated = true;
        }
      } catch (authError) {
        // Continue as unauthenticated user for registration
      }
    }

    if (isAuthenticated) {
      // For authenticated users (profile updates)
      const result = await verifyPhoneOTP(userId, phone, otp);
      logger.info(`Phone verified for authenticated user: ${userId}`);
    } else {
      // For registration flow (unauthenticated)
      try {
        await verifyPhoneNumber(phone, otp);
        logger.info(`Phone verified for registration: ${phone}`);
      } catch (error) {
        logger.error('Phone verification error:', error);
        
        // In development, accept any 4-6 digit OTP
        if (process.env.NODE_ENV === 'development' && /^\d{4,6}$/.test(otp)) {
          logger.info(`Phone verified for registration (development): ${phone}`);
        } else {
          if (error.message.includes('Invalid') || error.message.includes('expired')) {
            return res.status(400).json({
              success: false,
              error: error.message
            });
          }
          throw error;
        }
      }
    }

    res.json({
      success: true,
      message: 'Phone number verified successfully'
    });

  } catch (error) {
    if (error.message.includes('Invalid') || error.message.includes('expired') || error.message.includes('Maximum')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    next(error);
  }
});

// @route   POST /api/auth/verify-phone-update
// @desc    Verify phone number with OTP (for authenticated users)
// @access  Private
router.post('/verify-phone-update', [
  auth,
  body('phone').isMobilePhone().withMessage('Valid phone number is required'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
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

    const { phone, otp } = req.body;

    // Verify OTP
    const result = await verifyPhoneOTP(req.user.id, phone, otp);

    logger.info(`Phone verified for user: ${req.user.email}`);

    res.json({
      success: true,
      message: result.message
    });

  } catch (error) {
    if (error.message.includes('Invalid') || error.message.includes('expired') || error.message.includes('Maximum')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    next(error);
  }
});

// @route   GET /api/auth/otp-status
// @desc    Get OTP status for a phone number
// @access  Private
router.get('/otp-status', [
  auth,
  body('phone').isMobilePhone().withMessage('Valid phone number is required')
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

    const { phone } = req.query;

    if (!phone) {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required'
      });
    }

    const otpStatus = await getPhoneOTPStatus(req.user.id, phone);

    res.json({
      success: true,
      data: otpStatus
    });

  } catch (error) {
    next(error);
  }
});

// @route   POST /api/auth/send-email-otp
// @desc    Send OTP to email address (for signup verification)
// @access  Public
router.post('/send-email-otp', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email address is required'),
  body('userId').optional().isUUID().withMessage('Valid user ID required if provided')
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

    const { email, userId } = req.body;
    
    // For signup flow, we might not have a user ID yet, so we'll use a temp ID
    const targetUserId = userId || 'temp-' + Date.now();

    // Check email OTP status first
    const otpStatus = await getEmailOTPStatus(targetUserId, email);
    
    if (otpStatus.hasActiveOTP && !otpStatus.canSendOTP) {
      return res.status(429).json({
        success: false,
        error: 'Please wait before requesting another OTP',
        cooldownRemaining: otpStatus.cooldownRemaining
      });
    }

    // Send OTP
    const result = await sendEmailOTP(targetUserId, email);

    logger.info(`Email OTP sent to: ${email}`);

    res.json({
      success: true,
      message: 'OTP sent successfully to your email',
      expiresAt: result.expiresAt,
      // In development, return OTP for testing
      ...(process.env.NODE_ENV === 'development' && { otp: result.otp })
    });

  } catch (error) {
    if (error.message === 'Please wait before requesting another OTP') {
      return res.status(429).json({
        success: false,
        error: error.message
      });
    }
    next(error);
  }
});

// @route   POST /api/auth/verify-email-otp
// @desc    Verify email address with OTP (for signup verification)
// @access  Public
router.post('/verify-email-otp', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email address is required'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  body('userId').optional().isUUID().withMessage('Valid user ID required if provided')
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

    const { email, otp, userId } = req.body;
    
    // For signup flow, we might not have a user ID yet, so we'll use a temp ID
    const targetUserId = userId || 'temp-' + Date.now();

    // Verify OTP
    const result = await verifyEmailOTP(targetUserId, email, otp);

    logger.info(`Email OTP verified for: ${email}`);

    res.json({
      success: true,
      message: result.message
    });

  } catch (error) {
    if (error.message.includes('Invalid') || error.message.includes('expired') || error.message.includes('Maximum')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    next(error);
  }
});

// @route   POST /api/auth/login-otp-request
// @desc    Request OTP for login (phone or email)
// @access  Public
router.post('/login-otp-request', [
  body('identifier').notEmpty().withMessage('Phone number or email is required'),
  body('type').isIn(['phone', 'email']).withMessage('Type must be phone or email')
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

    let { identifier, type } = req.body;

    // Normalize phone number for India if needed
    if (type === 'phone') {
      // If phone number doesn't start with +, assume it's Indian and add +91
      if (!identifier.startsWith('+')) {
        // Remove any leading 0 and add +91 prefix
        identifier = '+91' + identifier.replace(/^0+/, '');
      }
    }

    // Find user by phone or email
    let user;
    if (type === 'phone') {
      user = await req.prisma.user.findFirst({
        where: { phone: identifier }
      });
    } else {
      user = await req.prisma.user.findUnique({
        where: { email: identifier }
      });
    }

    if (!user) {
      // Add debugging info in development
      if (process.env.NODE_ENV === 'development') {
        logger.warn(`OTP login attempt for non-existent user: ${identifier} (type: ${type})`);
      }
      return res.status(404).json({
        success: false,
        error: 'User not found with this phone number or email'
      });
    }

    // Send OTP
    let result;
    if (type === 'phone') {
      const otpStatus = await getPhoneOTPStatus(user.id, identifier);
      if (otpStatus.hasActiveOTP && !otpStatus.canSendOTP) {
        return res.status(429).json({
          success: false,
          error: 'Please wait before requesting another OTP',
          cooldownRemaining: otpStatus.cooldownRemaining
        });
      }
      result = await sendPhoneOTP(user.id, identifier);
    } else {
      const otpStatus = await getEmailOTPStatus(user.id, identifier);
      if (otpStatus.hasActiveOTP && !otpStatus.canSendOTP) {
        return res.status(429).json({
          success: false,
          error: 'Please wait before requesting another OTP',
          cooldownRemaining: otpStatus.cooldownRemaining
        });
      }
      result = await sendEmailOTP(user.id, identifier);
    }

    logger.info(`Login OTP sent to ${type}: ${identifier} for user: ${user.email}`);

    res.json({
      success: true,
      message: `OTP sent successfully to your ${type}`,
      expiresAt: result.expiresAt,
      userId: user.id,
      // In development, return OTP for testing
      ...(process.env.NODE_ENV === 'development' && { otp: result.otp })
    });

  } catch (error) {
    if (error.message === 'Please wait before requesting another OTP') {
      return res.status(429).json({
        success: false,
        error: error.message
      });
    }
    next(error);
  }
});

// @route   POST /api/auth/login-otp-verify
// @desc    Verify OTP and login user
// @access  Public
router.post('/login-otp-verify', [
  body('identifier').notEmpty().withMessage('Phone number or email is required'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  body('type').isIn(['phone', 'email']).withMessage('Type must be phone or email'),
  body('userId').isUUID().withMessage('Valid user ID is required')
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

    let { identifier, otp, type, userId } = req.body;

    // Normalize phone number for India if needed (same as in request endpoint)
    if (type === 'phone') {
      // If phone number doesn't start with +, assume it's Indian and add +91
      if (!identifier.startsWith('+')) {
        // Remove any leading 0 and add +91 prefix
        identifier = '+91' + identifier.replace(/^0+/, '');
      }
    }

    // Verify the user exists
    const user = await req.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        tokenWallet: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Verify OTP
    let verificationResult;
    if (type === 'phone') {
      // Verify the phone number matches
      if (user.phone !== identifier) {
        return res.status(400).json({
          success: false,
          error: 'Phone number does not match user account'
        });
      }
      verificationResult = await verifyPhoneOTP(userId, identifier, otp);
    } else {
      // Verify the email matches
      if (user.email !== identifier) {
        return res.status(400).json({
          success: false,
          error: 'Email does not match user account'
        });
      }
      verificationResult = await verifyEmailOTP(userId, identifier, otp);
    }

    // Update last login
    await req.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    // Generate JWT token
    const token = generateToken(user.id);

    logger.info(`User logged in via OTP (${type}): ${user.email}`);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
          isEmailVerified: user.isEmailVerified,
          isPhoneVerified: user.isPhoneVerified,
          isAgeVerified: user.isAgeVerified,
          consentGiven: user.consentGiven,
          profile: user.profile,
          tokenWallet: user.tokenWallet
        },
        token
      },
      message: 'OTP login successful'
    });

  } catch (error) {
    if (error.message.includes('Invalid') || error.message.includes('expired') || error.message.includes('Maximum')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    next(error);
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', auth, (req, res) => {
  // In a more sophisticated setup, you'd invalidate the token
  // For now, just send success response
  logger.info(`User logged out: ${req.user.email}`);
  
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

// =============================================================================
// TWILIO-BASED REGISTRATION FLOW ENDPOINTS
// =============================================================================

// @route   POST /api/auth/send-phone-verification
// @desc    Send phone verification via Twilio for registration
// @access  Public
router.post('/send-phone-verification', [
  body('phoneNumber')
    .isMobilePhone()
    .withMessage('Valid phone number is required')
    .custom((value) => {
      // Ensure it starts with +91 for Indian numbers
      if (!value.startsWith('+91')) {
        throw new Error('Phone number must include +91 country code');
      }
      return true;
    })
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

    const { phoneNumber } = req.body;

    // Check if phone number is already registered
    const existingUser = await req.prisma.user.findFirst({
      where: { phone: phoneNumber }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Phone number is already registered'
      });
    }

    // Send verification via Twilio
    const result = await sendPhoneVerification(phoneNumber);

    logger.info(`Twilio phone verification sent to: ${phoneNumber}`);

    res.json({
      success: true,
      message: 'Verification code sent to your phone',
      data: {
        to: result.to,
        channel: result.channel,
        status: result.status
      }
    });

  } catch (error) {
    logger.error('Twilio phone verification error:', error);
    
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to send verification code'
    });
  }
});

// @route   POST /api/auth/verify-phone
// @desc    Verify phone number via Twilio for registration
// @access  Public
router.post('/verify-phone', [
  body('phoneNumber')
    .isMobilePhone()
    .withMessage('Valid phone number is required'),
  body('otp')
    .isLength({ min: 4, max: 8 })
    .withMessage('Verification code must be 4-8 digits')
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

    const { phoneNumber, otp } = req.body;

    // Verify with Twilio
    const result = await verifyPhoneNumber(phoneNumber, otp);

    if (!result.success || !result.valid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid verification code'
      });
    }

    logger.info(`Twilio phone verification successful for: ${phoneNumber}`);

    res.json({
      success: true,
      message: 'Phone number verified successfully',
      data: {
        phoneNumber,
        verified: true
      }
    });

  } catch (error) {
    logger.error('Twilio phone verification error:', error);
    
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to verify phone number'
    });
  }
});

// @route   POST /api/auth/send-email-verification
// @desc    Send email verification for registration
// @access  Public
router.post('/send-email-verification', [
  body('email')
    .isEmail()
        .withMessage('Valid email address is required')
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

    const { email } = req.body;

    // Check if email is already registered
    const existingUser = await req.prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Email is already registered'
      });
    }

    // Generate verification token
    const verificationToken = generateEmailVerificationToken('temp-registration', email);

    // Send verification email
    await sendEmailVerification(email, verificationToken);

    logger.info(`Email verification sent to: ${email}`);

    res.json({
      success: true,
      message: 'Verification email sent successfully',
      data: {
        email,
        token: verificationToken // For development/testing
      }
    });

  } catch (error) {
    logger.error('Email verification error:', error);
    
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to send verification email'
    });
  }
});

// @route   POST /api/auth/twilio-register
// @desc    Complete Twilio-based registration
// @access  Public
router.post('/twilio-register', [
  body('email').isEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('role').isIn(['SEEKER', 'PROVIDER', 'EMPLOYEE', 'MANAGER', 'ADMIN', 'SUPER_ADMIN']).withMessage('Role must be SEEKER, PROVIDER, EMPLOYEE, MANAGER, ADMIN, or SUPER_ADMIN'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('phoneNumber')
    .isMobilePhone()
    .withMessage('Valid phone number is required')
    .custom((value) => {
      if (!value.startsWith('+91')) {
        throw new Error('Phone number must include +91 country code');
      }
      return true;
    }),
  body('ageConfirmed').equals('true').withMessage('Age confirmation is required'),
  body('consentGiven').equals('true').withMessage('Consent is required')
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
      email, 
      password, 
      role, 
      firstName, 
      lastName, 
      phoneNumber,
      ageConfirmed, 
      consentGiven 
    } = req.body;

    // Check if user already exists
    const existingUser = await req.prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { phone: phoneNumber }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User already exists with this email or phone number'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user with profile in transaction
    const user = await req.prisma.$transaction(async (prisma) => {
      // Create user
      const newUser = await prisma.user.create({
        data: {
          email,
          phone: phoneNumber,
          passwordHash,
          role,
          consentGiven: consentGiven === 'true',
          isAgeVerified: true,
          isPhoneVerified: true, // Since we verified via Twilio
          isEmailVerified: false // Will be verified via email link
        }
      });

      // Create profile
      await prisma.userProfile.create({
        data: {
          userId: newUser.id,
          firstName,
          lastName
        }
      });

      // Create token wallet
      await prisma.tokenWallet.create({
        data: {
          userId: newUser.id,
          balance: 0,
          escrowBalance: 0
        }
      });

      return newUser;
    });

    // Generate JWT token
    const token = generateToken(user.id);

    // Send welcome email
    try {
      await sendWelcomeEmail(user.email, firstName, user.role);
      logger.info(`Welcome email sent to new user: ${email}`);
    } catch (emailError) {
      logger.error('Failed to send welcome email:', emailError);
      // Don't fail registration if welcome email fails
    }

    // Send welcome SMS
    try {
      const welcomeSMS = `🎉 Welcome to ChillConnect, ${firstName}! Your ${role.toLowerCase()} account is ready. Start connecting today!`;
      await sendTransactionalSMS(phoneNumber, welcomeSMS);
      logger.info(`Welcome SMS sent to new user: ${phoneNumber}`);
    } catch (smsError) {
      logger.error('Failed to send welcome SMS:', smsError);
      // Don't fail registration if welcome SMS fails
    }

    logger.info(`New user registered via Twilio: ${email} (${role}), phone: ${phoneNumber}`);

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isVerified: user.isVerified,
          isEmailVerified: user.isEmailVerified,
          isPhoneVerified: user.isPhoneVerified,
          isAgeVerified: user.isAgeVerified,
          consentGiven: user.consentGiven
        },
        token
      },
      message: 'Registration successful! Welcome emails and SMS sent.'
    });

  } catch (error) {
    next(error);
  }
});

// =============================================================================
// TRANSACTIONAL COMMUNICATION ENDPOINTS
// =============================================================================

// @route   POST /api/auth/send-notification
// @desc    Send transactional email or SMS
// @access  Private
router.post('/send-notification', [
  auth,
  body('type').isIn(['email', 'sms', 'both']).withMessage('Type must be email, sms, or both'),
  body('subject').optional().notEmpty().withMessage('Subject required for email'),
  body('message').notEmpty().withMessage('Message is required'),
  body('recipient').optional().notEmpty().withMessage('Recipient required if not using user data')
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

    const { type, subject, message, recipient } = req.body;
    const user = req.user;

    const results = [];

    if (type === 'email' || type === 'both') {
      try {
        const emailResult = await sendTransactionalEmail(
          recipient || user.email,
          subject || 'ChillConnect Notification',
          message
        );
        results.push({ type: 'email', success: true, messageId: emailResult.messageId });
      } catch (error) {
        results.push({ type: 'email', success: false, error: error.message });
      }
    }

    if (type === 'sms' || type === 'both') {
      try {
        const smsResult = await sendTransactionalSMS(
          recipient || user.phone,
          message.replace(/<[^>]*>/g, '') // Strip HTML tags for SMS
        );
        results.push({ type: 'sms', success: true, messageId: smsResult.sid });
      } catch (error) {
        results.push({ type: 'sms', success: false, error: error.message });
      }
    }

    logger.info(`Transactional notifications sent to user: ${user.email}`);

    res.json({
      success: true,
      message: 'Notifications processed',
      results
    });

  } catch (error) {
    next(error);
  }
});

// @route   POST /api/auth/send-welcome
// @desc    Manually send welcome email (for testing)
// @access  Private
router.post('/send-welcome', auth, async (req, res, next) => {
  try {
    const user = req.user;
    
    if (!user.profile) {
      return res.status(400).json({
        success: false,
        error: 'User profile not found'
      });
    }

    await sendWelcomeEmail(user.email, user.profile.firstName, user.role);

    logger.info(`Welcome email manually sent to user: ${user.email}`);

    res.json({
      success: true,
      message: 'Welcome email sent successfully'
    });

  } catch (error) {
    next(error);
  }
});


// @route   GET /api/auth/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', auth, async (req, res, next) => {
  try {
    const user = await req.prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        phone: true,
        role: true,
        isVerified: true,
        isEmailVerified: true,
        isPhoneVerified: true,
        isAgeVerified: true,
        consentGiven: true,
        createdAt: true,
        profile: {
          select: {
            firstName: true,
            lastName: true,
            dateOfBirth: true,
            profilePhoto: true,
            services: true,
            hourlyRate: true,
            availability: true,
            rating: true,
            reviewCount: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });

  } catch (error) {
    next(error);
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Send password reset email
// @access  Public
router.post('/forgot-password', [
  body('email').isEmail().withMessage('Valid email address is required')
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

    const { email } = req.body;

    // Find user by email
    const user = await req.prisma.user.findUnique({
      where: { email }
    });

    // Don't reveal if user exists or not for security
    // Always return success to prevent user enumeration
    if (!user) {
      logger.warn(`Password reset requested for non-existent email: ${email}`);
      return res.json({
        success: true,
        message: 'If an account with that email exists, we have sent a password reset link.'
      });
    }

    // Generate password reset token (24 hour expiry)
    const resetToken = jwt.sign(
      { userId: user.id, email: user.email, type: 'password_reset' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Send password reset email
    const { sendTransactionalEmail } = require('../services/brevoService');
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    

    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">ChillConnect</h1>
          <p style="color: white; margin: 5px 0;">Password Reset Request</p>
        </div>
        
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333; margin-bottom: 20px;">Reset Your Password</h2>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            You requested a password reset for your ChillConnect account. Click the button below to reset your password.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background: #dc2626; color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 5px; font-weight: bold;
                      display: inline-block;">
              Reset Password
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            If the button doesn't work, copy and paste this link into your browser:
            <br>
            <a href="${resetUrl}" style="color: #dc2626; word-break: break-all;">
              ${resetUrl}
            </a>
          </p>
          
          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            This password reset link will expire in 24 hours. If you didn't request this reset, 
            please ignore this email and your password will remain unchanged.
          </p>
        </div>
        
        <div style="background: #333; color: white; text-align: center; padding: 20px;">
          <p style="margin: 0; font-size: 14px;">
            © 2024 ChillConnect. All rights reserved.
          </p>
        </div>
      </div>
    `;

    await sendTransactionalEmail(
      email,
      'Password Reset - ChillConnect',
      emailContent
    );

    logger.info(`Password reset email sent to: ${email}`);

    res.json({
      success: true,
      message: 'If an account with that email exists, we have sent a password reset link.'
    });

  } catch (error) {
    logger.error('Password reset error:', error);
    next(error);
  }
});

module.exports = router;