const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');

// Test database setup
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/chillconnect_test';

// Mock external services
jest.mock('../services/brevoService', () => ({
  sendWelcomeEmail: jest.fn().mockResolvedValue({ success: true }),
  sendOTPEmail: jest.fn().mockResolvedValue({ success: true }),
  sendPasswordResetEmail: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock('../services/twilioService', () => ({
  sendOTP: jest.fn().mockResolvedValue({ success: true, sid: 'mock-sid' }),
  verifyOTP: jest.fn().mockResolvedValue({ success: true, valid: true }),
}));

jest.mock('../services/paypalService', () => ({
  createPayment: jest.fn().mockResolvedValue({
    id: 'mock-payment-id',
    approval_url: 'https://paypal.com/mock-approval',
  }),
  executePayment: jest.fn().mockResolvedValue({
    id: 'mock-payment-id',
    state: 'approved',
  }),
}));

jest.mock('aws-sdk', () => ({
  S3: jest.fn(() => ({
    upload: jest.fn().mockImplementation(() => ({
      promise: jest.fn().mockResolvedValue({
        Location: 'https://mock-s3-url.com/file.jpg',
        Key: 'mock-key',
      }),
    })),
    deleteObject: jest.fn().mockImplementation(() => ({
      promise: jest.fn().mockResolvedValue({}),
    })),
  })),
  SES: jest.fn(() => ({
    sendEmail: jest.fn().mockImplementation(() => ({
      promise: jest.fn().mockResolvedValue({
        MessageId: 'mock-message-id',
      }),
    })),
  })),
  SNS: jest.fn(() => ({
    publish: jest.fn().mockImplementation(() => ({
      promise: jest.fn().mockResolvedValue({
        MessageId: 'mock-message-id',
      }),
    })),
  })),
}));

// Mock winston logger
jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

// Mock socket.io
jest.mock('socket.io', () => ({
  Server: jest.fn(() => ({
    on: jest.fn(),
    emit: jest.fn(),
    to: jest.fn(() => ({
      emit: jest.fn(),
    })),
    use: jest.fn(),
  })),
}));

// Global test database instance
let prisma;

// Setup before all tests
beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = DATABASE_URL;
  process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
  process.env.ADMIN_CHANGE_PASSWORD = 'test-admin-password-123';

  // Reset database
  try {
    execSync('npx prisma migrate reset --force --skip-generate', {
      env: { ...process.env, DATABASE_URL },
      stdio: 'inherit',
    });
  } catch (error) {
    // Error resetting database
  }

  // Initialize Prisma client
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: DATABASE_URL,
      },
    },
  });

  // Make prisma available globally for tests
  global.prisma = prisma;
});

// Cleanup after each test
afterEach(async () => {
  if (prisma) {
    // Clean up test data
    const tablenames = await prisma.$queryRaw`SELECT tablename FROM pg_tables WHERE schemaname='public'`;
    
    for (const { tablename } of tablenames) {
      if (tablename !== '_prisma_migrations') {
        try {
          await prisma.$executeRawUnsafe(`TRUNCATE TABLE "public"."${tablename}" CASCADE;`);
        } catch (error) {
          // Error truncating table
        }
      }
    }
  }
});

// Cleanup after all tests
afterAll(async () => {
  if (prisma) {
    await prisma.$disconnect();
  }
});

// Test utilities
global.testUser = {
  email: 'test@example.com',
  passwordHash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewD8o2VTLzxQEe.K', // "password123"
  role: 'SEEKER',
  isVerified: true,
  isEmailVerified: true,
  isPhoneVerified: false,
  isAgeVerified: true,
  consentGiven: true,
};

global.testProvider = {
  email: 'provider@example.com',
  passwordHash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewD8o2VTLzxQEe.K',
  role: 'PROVIDER',
  isVerified: true,
  isEmailVerified: true,
  isPhoneVerified: true,
  isAgeVerified: true,
  consentGiven: true,
};

global.testAdmin = {
  email: 'admin@example.com',
  passwordHash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewD8o2VTLzxQEe.K',
  role: 'ADMIN',
  isVerified: true,
  isEmailVerified: true,
  isPhoneVerified: true,
  isAgeVerified: true,
  consentGiven: true,
};

// Helper functions
global.createTestUser = async (userData = {}) => {
  const user = await prisma.user.create({
    data: {
      ...global.testUser,
      ...userData,
    },
  });

  await prisma.userProfile.create({
    data: {
      userId: user.id,
      firstName: 'Test',
      lastName: 'User',
      ...userData.profile,
    },
  });

  await prisma.tokenWallet.create({
    data: {
      userId: user.id,
      balance: 1000,
      totalEarned: 2000,
      totalSpent: 1000,
    },
  });

  return user;
};

global.createTestProvider = async (providerData = {}) => {
  const provider = await prisma.user.create({
    data: {
      ...global.testProvider,
      ...providerData,
    },
  });

  await prisma.userProfile.create({
    data: {
      userId: provider.id,
      firstName: 'Test',
      lastName: 'Provider',
      hourlyRate: 500,
      ...providerData.profile,
    },
  });

  await prisma.tokenWallet.create({
    data: {
      userId: provider.id,
      balance: 500,
      totalEarned: 5000,
      totalSpent: 4500,
    },
  });

  return provider;
};

global.createTestBooking = async (seekerId, providerId, bookingData = {}) => {
  return await prisma.booking.create({
    data: {
      seekerId,
      providerId,
      serviceType: 'INCALL',
      status: 'PENDING',
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      duration: 60,
      tokenAmount: 500,
      ...bookingData,
    },
  });
};

global.generateJWT = (userId, role = 'SEEKER') => {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};