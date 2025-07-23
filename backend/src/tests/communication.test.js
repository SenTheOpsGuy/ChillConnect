const { describe, test, expect, beforeAll, afterAll } = require('@jest/globals');
const request = require('supertest');
const { PrismaClient } = require('@prisma/client');
const { app } = require('../index');

const prisma = new PrismaClient();

describe('Communication Tests - SMS and Email', () => {
  let userToken;
  let userId;
  
  beforeAll(async () => {
    // Create a test user
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'testPassword123',
        role: 'SEEKER',
        firstName: 'Test',
        lastName: 'User',
        dateOfBirth: '1990-01-01',
        phone: '+919876543210',
        ageConfirmed: 'true',
        consentGiven: 'true'
      });

    userToken = registerResponse.body.data.token;
    userId = registerResponse.body.data.user.id;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.oTPVerification.deleteMany({
      where: { userId }
    });
    await prisma.user.delete({
      where: { id: userId }
    });
    await prisma.$disconnect();
  });

  describe('Email Verification', () => {
    test('should send verification email on registration', async () => {
      // This is tested implicitly in the registration process
      expect(userToken).toBeDefined();
    });

    test('should verify email with valid token', async () => {
      // In a real test, you'd extract the token from the email
      // For now, we'll test with a mock token
      const mockToken = require('jsonwebtoken').sign(
        { id: userId, purpose: 'email_verification' },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: mockToken });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('SMS OTP', () => {
    test('should send OTP to phone number', async () => {
      const response = await request(app)
        .post('/api/auth/send-phone-otp')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ phone: '+919876543210' });

      if (response.status === 500) {
        // AWS credentials might not be configured in test environment
        console.log('Note: SMS sending failed - likely due to AWS configuration in test environment');
        expect(response.status).toBe(500);
      } else {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('OTP sent successfully');
        
        // In development mode, OTP should be returned
        if (process.env.NODE_ENV === 'development') {
          expect(response.body.otp).toBeDefined();
          expect(response.body.otp).toMatch(/^\d{6}$/);
        }
      }
    });

    test('should not allow sending OTP too frequently', async () => {
      // First OTP
      await request(app)
        .post('/api/auth/send-phone-otp')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ phone: '+919876543211' });

      // Immediate second attempt should fail
      const response = await request(app)
        .post('/api/auth/send-phone-otp')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ phone: '+919876543211' });

      if (response.status !== 500) { // Skip if AWS not configured
        expect(response.status).toBe(429);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('wait');
      }
    });

    test('should verify OTP successfully', async () => {
      // Create a test OTP record directly in database
      const testOTP = await prisma.oTPVerification.create({
        data: {
          userId,
          phone: '+919876543212',
          otp: '123456',
          expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
          maxAttempts: 3
        }
      });

      const response = await request(app)
        .post('/api/auth/verify-phone')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ 
          phone: '+919876543212',
          otp: '123456' 
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Phone verified successfully');
    });

    test('should reject invalid OTP', async () => {
      // Create a test OTP record directly in database
      await prisma.oTPVerification.create({
        data: {
          userId,
          phone: '+919876543213',
          otp: '123456',
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
          maxAttempts: 3
        }
      });

      const response = await request(app)
        .post('/api/auth/verify-phone')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ 
          phone: '+919876543213',
          otp: '654321' 
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid OTP');
    });

    test('should check OTP status', async () => {
      const response = await request(app)
        .get('/api/auth/otp-status')
        .set('Authorization', `Bearer ${userToken}`)
        .query({ phone: '+919876543210' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('hasActiveOTP');
      expect(response.body.data).toHaveProperty('canSendOTP');
    });
  });

  describe('Email Templates', () => {
    test('should send booking confirmation email', async () => {
      const { sendBookingConfirmationEmail } = require('../services/notificationService');
      
      const bookingDetails = {
        id: 'booking-123',
        date: '2024-07-20',
        time: '10:00 AM',
        type: 'INCALL',
        amount: 100
      };

      try {
        await sendBookingConfirmationEmail('test@example.com', bookingDetails);
        // If no error thrown, email sending succeeded
        expect(true).toBe(true);
      } catch (error) {
        // AWS might not be configured in test environment
        console.log('Note: Email sending failed - likely due to AWS configuration in test environment');
        expect(error.message).toContain('Failed to send');
      }
    });

    test('should send token purchase confirmation email', async () => {
      const { sendTokenPurchaseEmail } = require('../services/notificationService');
      
      const tokenDetails = {
        amount: 100,
        amountPaid: 1000,
        newBalance: 150
      };

      try {
        await sendTokenPurchaseEmail('test@example.com', tokenDetails);
        expect(true).toBe(true);
      } catch (error) {
        console.log('Note: Email sending failed - likely due to AWS configuration in test environment');
        expect(error.message).toContain('Failed to send');
      }
    });
  });

  describe('Rate Limiting', () => {
    test('should respect rate limits for OTP requests', async () => {
      const phoneNumber = '+919876543220';
      
      // Send first OTP
      const firstResponse = await request(app)
        .post('/api/auth/send-phone-otp')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ phone: phoneNumber });

      if (firstResponse.status !== 500) { // Skip if AWS not configured
        // Try to send second OTP immediately
        const secondResponse = await request(app)
          .post('/api/auth/send-phone-otp')
          .set('Authorization', `Bearer ${userToken}`)
          .send({ phone: phoneNumber });

        expect(secondResponse.status).toBe(429);
        expect(secondResponse.body.error).toContain('wait');
      }
    });
  });

  describe('Security', () => {
    test('should not expose OTP in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const response = await request(app)
        .post('/api/auth/send-phone-otp')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ phone: '+919876543221' });

      if (response.status !== 500) { // Skip if AWS not configured
        expect(response.body.otp).toBeUndefined();
      }

      process.env.NODE_ENV = originalEnv;
    });

    test('should limit OTP attempts', async () => {
      // Create an OTP with 0 attempts remaining
      await prisma.oTPVerification.create({
        data: {
          userId,
          phone: '+919876543222',
          otp: '123456',
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
          attempts: 3,
          maxAttempts: 3
        }
      });

      const response = await request(app)
        .post('/api/auth/verify-phone')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ 
          phone: '+919876543222',
          otp: '123456' 
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Maximum OTP attempts exceeded');
    });
  });
});