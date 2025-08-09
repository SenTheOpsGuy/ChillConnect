#!/usr/bin/env node

/**
 * Minimal ChillConnect Production Server
 * Includes essential auth and OTP verification endpoints
 */

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

const app = express();
const PORT = process.env.PORT || 5001;

// Basic middleware
app.use(cors({
  origin: [
    'https://chillconnect.in',
    'https://www.chillconnect.in', 
    'https://chillconnect.netlify.app',
    'http://localhost:3000'
  ],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Basic logging
const log = (message) => {
  console.log(`[${new Date().toISOString()}] ${message}`);
};

// In-memory storage (for demo - in production use Redis/Database)
const users = new Map();
const otpStore = new Map();

// JWT helper
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'minimal-jwt-secret-2024',
    { expiresIn: '7d' }
  );
};

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0-minimal-otp'
  });
});

// Basic registration endpoint
app.post('/api/auth/register', [
  body('email').isEmail(),
  body('password').isLength({ min: 8 }),
  body('role').isIn(['SEEKER', 'PROVIDER']),
  body('firstName').notEmpty(),
  body('lastName').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email, password, role, firstName, lastName, phone } = req.body;

    // Check if user exists
    if (users.has(email)) {
      return res.status(400).json({
        success: false,
        error: 'User already exists with this email'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const user = {
      id: userId,
      email,
      password: hashedPassword,
      role,
      firstName,
      lastName,
      phone: phone || '',
      isVerified: false,
      createdAt: new Date().toISOString()
    };

    users.set(email, user);
    users.set(userId, user); // Store by ID as well

    // Generate token
    const token = generateToken(userId);

    log(`User registered: ${email} (${role})`);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified
      },
      message: 'Registration successful'
    });

  } catch (error) {
    log(`Registration error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Registration failed'
    });
  }
});

// Login endpoint
app.post('/api/auth/login', [
  body('email').isEmail(),
  body('password').notEmpty()
], async (req, res) => {
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
    const user = users.get(email);
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

    // Generate token
    const token = generateToken(user.id);

    log(`User logged in: ${email}`);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified
      },
      message: 'Login successful'
    });

  } catch (error) {
    log(`Login error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
});

// ====== OTP VERIFICATION ENDPOINTS ======

// Send Phone OTP
app.post('/api/auth/send-phone-otp', [
  body('phone').notEmpty().withMessage('Phone number is required')
], (req, res) => {
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
    
    // Store OTP
    otpStore.set(`phone_${phone}`, { otp, expiresAt });
    
    log(`Phone OTP generated for ${phone}: ${otp}`);
    
    res.json({
      success: true,
      message: 'OTP sent to your phone',
      expiresAt,
      // In development, return OTP for testing
      ...(process.env.NODE_ENV !== 'production' && { otp })
    });
    
  } catch (error) {
    log(`Send phone OTP error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to send OTP'
    });
  }
});

// Verify Phone OTP
app.post('/api/auth/verify-phone-otp', [
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
], (req, res) => {
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
    
    // Check OTP
    const storedOTP = otpStore.get(`phone_${phone}`);
    
    if (!storedOTP) {
      return res.status(400).json({
        success: false,
        error: 'No OTP found for this phone number'
      });
    }
    
    if (new Date() > storedOTP.expiresAt) {
      otpStore.delete(`phone_${phone}`);
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
    otpStore.delete(`phone_${phone}`);
    
    log(`Phone OTP verified for ${phone}`);
    
    res.json({
      success: true,
      message: 'Phone verified successfully'
    });
    
  } catch (error) {
    log(`Verify phone OTP error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'OTP verification failed'
    });
  }
});

// Send Email OTP
app.post('/api/auth/send-email-otp', [
  body('email').isEmail().withMessage('Valid email address is required')
], (req, res) => {
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
    
    // Store OTP
    otpStore.set(`email_${email}`, { otp, expiresAt });
    
    log(`Email OTP generated for ${email}: ${otp}`);
    
    res.json({
      success: true,
      message: 'OTP sent to your email',
      expiresAt,
      // In development, return OTP for testing
      ...(process.env.NODE_ENV !== 'production' && { otp })
    });
    
  } catch (error) {
    log(`Send email OTP error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to send OTP'
    });
  }
});

// Verify Email OTP
app.post('/api/auth/verify-email-otp', [
  body('email').isEmail().withMessage('Valid email address is required'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
], (req, res) => {
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
    
    // Check OTP
    const storedOTP = otpStore.get(`email_${email}`);
    
    if (!storedOTP) {
      return res.status(400).json({
        success: false,
        error: 'No OTP found for this email'
      });
    }
    
    if (new Date() > storedOTP.expiresAt) {
      otpStore.delete(`email_${email}`);
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
    otpStore.delete(`email_${email}`);
    
    log(`Email OTP verified for ${email}`);
    
    res.json({
      success: true,
      message: 'Email verified successfully'
    });
    
  } catch (error) {
    log(`Verify email OTP error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'OTP verification failed'
    });
  }
});

// Catch-all 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  log(`🚀 ChillConnect Minimal Server running on port ${PORT}`);
  log(`📊 Health check: http://localhost:${PORT}/health`);
  log(`🔧 OTP endpoints ready for phone verification`);
  log(`✅ Ready for provider registration!`);
});

module.exports = app;