const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const logger = require('../utils/logger');

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// @route   POST /api/auth/register
// @desc    Register new user (simplified)
// @access  Public
router.post('/register', [
  body('email').isEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('role').isIn(['SEEKER', 'PROVIDER']).withMessage('Role must be SEEKER or PROVIDER'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('dateOfBirth').isISO8601().withMessage('Valid date of birth is required'),
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
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user with profile in transaction
    const user = await req.prisma.$transaction(async (prisma) => {
      // Create user
      const newUser = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          role,
          isVerified: false
        }
      });

      // Create profile
      await prisma.profile.create({
        data: {
          userId: newUser.id,
          firstName,
          lastName,
          age: age,
          isProvider: role === 'PROVIDER',
          verificationStatus: 'PENDING'
        }
      });

      return newUser;
    });

    // Generate JWT token
    const token = generateToken(user.id);

    logger.info(`New user registered: ${email} (${role})`);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified
      },
      message: 'User registered successfully'
    });

  } catch (error) {
    logger.error(`Registration error: ${error.message}`);
    next(error);
  }
});

// @route   POST /api/auth/login
// @desc    Login user (simplified)
// @access  Public
router.post('/login', [
  body('email').isEmail(),
  body('password').notEmpty().withMessage('Password is required')
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
        profile: true
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = generateToken(user.id);

    logger.info(`User logged in: ${email}`);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        profile: user.profile
      },
      message: 'Login successful'
    });

  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    next(error);
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await req.prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        profile: true
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
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        profile: user.profile
      }
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }
    logger.error(`Get user error: ${error.message}`);
    next(error);
  }
});

// @route   POST /api/auth/send-phone-otp
// @desc    Send phone OTP for verification
// @access  Public  
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
    
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    // Store OTP in memory for demo (in production, use Redis or database)
    global.otpStore = global.otpStore || {};
    global.otpStore[phone] = { otp, expiresAt };
    
    logger.info(`Phone OTP generated for ${phone}: ${otp}`);
    
    res.json({
      success: true,
      message: 'OTP sent to your phone',
      expiresAt,
      // In development, return OTP for testing
      ...(process.env.NODE_ENV === 'development' && { otp })
    });
    
  } catch (error) {
    logger.error(`Send phone OTP error: ${error.message}`);
    next(error);
  }
});

// @route   POST /api/auth/verify-phone-otp
// @desc    Verify phone OTP
// @access  Public
router.post('/verify-phone-otp', [
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
    
    // Check OTP from memory store
    const storedOTP = global.otpStore?.[phone];
    
    if (!storedOTP) {
      return res.status(400).json({
        success: false,
        error: 'No OTP found for this phone number'
      });
    }
    
    if (new Date() > storedOTP.expiresAt) {
      delete global.otpStore[phone];
      return res.status(400).json({
        success: false,
        error: 'OTP has expired'
      });
    }
    
    if (otp !== storedOTP.otp) {
      return res.status(400).json({
        success: false,
        error: 'Invalid OTP'
      });
    }
    
    // OTP verified, clean up
    delete global.otpStore[phone];
    
    // Update user phone verification status if authenticated
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        await req.prisma.user.update({
          where: { id: decoded.id },
          data: { 
            phone: phone,
            // Add phone verification field when we have it in schema
          }
        });
      } catch (err) {
        logger.warn('Could not update user phone verification:', err.message);
      }
    }
    
    logger.info(`Phone OTP verified for ${phone}`);
    
    res.json({
      success: true,
      message: 'Phone verified successfully'
    });
    
  } catch (error) {
    logger.error(`Verify phone OTP error: ${error.message}`);
    next(error);
  }
});

// @route   POST /api/auth/send-email-otp
// @desc    Send email OTP for verification
// @access  Public
router.post('/send-email-otp', [
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
    
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    // Store OTP in memory for demo (in production, use Redis or database)
    global.otpStore = global.otpStore || {};
    global.otpStore[email] = { otp, expiresAt };
    
    logger.info(`Email OTP generated for ${email}: ${otp}`);
    
    res.json({
      success: true,
      message: 'OTP sent to your email',
      expiresAt,
      // In development, return OTP for testing
      ...(process.env.NODE_ENV === 'development' && { otp })
    });
    
  } catch (error) {
    logger.error(`Send email OTP error: ${error.message}`);
    next(error);
  }
});

// @route   POST /api/auth/verify-email-otp
// @desc    Verify email OTP
// @access  Public
router.post('/verify-email-otp', [
  body('email').isEmail().withMessage('Valid email address is required'),
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

    const { email, otp } = req.body;
    
    // Check OTP from memory store
    const storedOTP = global.otpStore?.[email];
    
    if (!storedOTP) {
      return res.status(400).json({
        success: false,
        error: 'No OTP found for this email'
      });
    }
    
    if (new Date() > storedOTP.expiresAt) {
      delete global.otpStore[email];
      return res.status(400).json({
        success: false,
        error: 'OTP has expired'
      });
    }
    
    if (otp !== storedOTP.otp) {
      return res.status(400).json({
        success: false,
        error: 'Invalid OTP'
      });
    }
    
    // OTP verified, clean up
    delete global.otpStore[email];
    
    // Update user email verification status if authenticated
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        await req.prisma.user.update({
          where: { id: decoded.id },
          data: { 
            isVerified: true,
            // Add email verification field when we have it in schema
          }
        });
      } catch (err) {
        logger.warn('Could not update user email verification:', err.message);
      }
    }
    
    logger.info(`Email OTP verified for ${email}`);
    
    res.json({
      success: true,
      message: 'Email verified successfully'
    });
    
  } catch (error) {
    logger.error(`Verify email OTP error: ${error.message}`);
    next(error);
  }
});

// @route   POST /api/auth/verify-document
// @desc    Submit document for verification
// @access  Private
router.post('/verify-document', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // For now, just acknowledge the document upload
    // In production, you'd handle file upload and store it
    logger.info(`Document verification submitted for user: ${decoded.id}`);
    
    res.json({
      success: true,
      message: 'Document submitted successfully. Review may take 1-2 business days.'
    });
    
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }
    logger.error(`Document verification error: ${error.message}`);
    next(error);
  }
});

// @route   GET /api/auth/verification-status
// @desc    Get verification status
// @access  Private
router.get('/verification-status', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await req.prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        profile: true
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
      data: {
        isEmailVerified: user.isVerified || false,
        isPhoneVerified: !!user.phone,
        isAgeVerified: true, // Age verified during registration
        isVerified: user.isVerified || false
      }
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }
    logger.error(`Get verification status error: ${error.message}`);
    next(error);
  }
});

module.exports = router;