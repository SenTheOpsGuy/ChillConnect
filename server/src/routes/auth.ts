import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { prisma } from '../utils/database';
import { logger } from '../utils/logger';
import { asyncHandler } from '../middleware/errorHandler';
import { sendVerificationEmail, sendSMSOTP } from '../services/notificationService';
import { auditLog } from '../services/auditService';

const router = express.Router();

// Register
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  body('firstName').trim().isLength({ min: 2 }),
  body('lastName').trim().isLength({ min: 2 }),
  body('dateOfBirth').isISO8601(),
  body('phone').isMobilePhone(),
  body('role').isIn(['SEEKER', 'PROVIDER']),
  body('isAdultConsent').equals('true'),
  body('termsAccepted').equals('true')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { 
    email, 
    password, 
    firstName, 
    lastName, 
    dateOfBirth, 
    phone, 
    role,
    isAdultConsent,
    termsAccepted 
  } = req.body;

  // Check age (must be 18+)
  const birthDate = new Date(dateOfBirth);
  const age = new Date().getFullYear() - birthDate.getFullYear();
  if (age < 18) {
    return res.status(400).json({ error: 'Must be 18 or older to register' });
  }

  // Check if user exists
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email },
        { phone }
      ]
    }
  });

  if (existingUser) {
    return res.status(400).json({ error: 'User already exists with this email or phone' });
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 12);

  // Create user and profile in transaction
  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        email,
        phone,
        passwordHash,
        role
      }
    });

    await tx.profile.create({
      data: {
        userId: newUser.id,
        firstName,
        lastName,
        dateOfBirth: birthDate,
        isAgeVerified: true // Since we verified age during registration
      }
    });

    await tx.tokenWallet.create({
      data: {
        userId: newUser.id
      }
    });

    return newUser;
  });

  // Send verification email
  await sendVerificationEmail(user.email, user.id);

  // Audit log
  await auditLog(user.id, 'USER_REGISTERED', 'user', user.id, {
    role,
    email,
    phone
  }, req.ip, req.get('User-Agent'));

  logger.info(`New user registered: ${email} (${role})`);

  res.status(201).json({
    message: 'Registration successful. Please verify your email.',
    userId: user.id
  });
}));

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      profile: true,
      tokenWallet: true
    }
  });

  if (!user || !user.isActive) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const isValidPassword = await bcrypt.compare(password, user.passwordHash);
  if (!isValidPassword) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() }
  });

  // Generate JWT
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );

  // Audit log
  await auditLog(user.id, 'USER_LOGIN', 'user', user.id, {}, req.ip, req.get('User-Agent'));

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      verificationStatus: user.verificationStatus,
      profile: user.profile,
      tokenBalance: user.tokenWallet?.balance || 0
    }
  });
}));

// Verify Email
router.post('/verify-email', [
  body('token').notEmpty()
], asyncHandler(async (req, res) => {
  const { token } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    const user = await prisma.user.update({
      where: { id: decoded.userId },
      data: { 
        isVerified: true,
        verificationStatus: 'APPROVED'
      }
    });

    await auditLog(user.id, 'EMAIL_VERIFIED', 'user', user.id, {}, req.ip, req.get('User-Agent'));

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    res.status(400).json({ error: 'Invalid or expired verification token' });
  }
}));

// Send SMS OTP
router.post('/send-otp', [
  body('phone').isMobilePhone()
], asyncHandler(async (req, res) => {
  const { phone } = req.body;

  const user = await prisma.user.findUnique({
    where: { phone }
  });

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  await sendSMSOTP(phone);

  res.json({ message: 'OTP sent successfully' });
}));

// Verify Phone
router.post('/verify-phone', [
  body('phone').isMobilePhone(),
  body('otp').isLength({ min: 6, max: 6 })
], asyncHandler(async (req, res) => {
  const { phone, otp } = req.body;

  // In a real implementation, you would verify the OTP against stored value
  // For now, we'll accept any 6-digit OTP
  if (!/^\d{6}$/.test(otp)) {
    return res.status(400).json({ error: 'Invalid OTP format' });
  }

  const user = await prisma.user.findUnique({
    where: { phone }
  });

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  await auditLog(user.id, 'PHONE_VERIFIED', 'user', user.id, { phone }, req.ip, req.get('User-Agent'));

  res.json({ message: 'Phone verified successfully' });
}));

export { router as authRoutes };