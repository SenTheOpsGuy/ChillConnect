const { PrismaClient } = require('@prisma/client');
const { sendPhoneVerificationEmail } = require('./notificationService');
const { sendPhoneVerification, verifyPhoneNumber } = require('./twilioService');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP to phone number
const sendPhoneOTP = async (userId, phone) => {
  try {
    // Clean up expired OTPs for this user
    await prisma.oTPVerification.deleteMany({
      where: {
        userId,
        phone,
        OR: [
          { expiresAt: { lt: new Date() } },
          { isUsed: true }
        ]
      }
    });

    // Check if there's already an active OTP
    const existingOTP = await prisma.oTPVerification.findFirst({
      where: {
        userId,
        phone,
        isUsed: false,
        expiresAt: { gt: new Date() }
      }
    });

    if (existingOTP) {
      // If OTP was sent less than 1 minute ago, don't send again
      const timeDiff = Date.now() - existingOTP.createdAt.getTime();
      if (timeDiff < 60000) { // 1 minute
        throw new Error('Please wait before requesting another OTP');
      }
    }

    // Generate new OTP
    const otp = generateOTP();
    const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES) || 10;
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    // Store OTP in database
    const otpRecord = await prisma.oTPVerification.create({
      data: {
        userId,
        phone,
        otp,
        maxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS) || 3,
        expiresAt
      }
    });

    // Send OTP via Twilio Verify service (no custom OTP needed)
    try {
      await sendPhoneVerification(phone);
      logger.info(`Twilio Verify OTP sent to ${phone} for user ${userId}`);
      
      // Update database record with Twilio Verify status
      await prisma.oTPVerification.update({
        where: { id: otpRecord.id },
        data: { otp: 'TWILIO_VERIFY' } // Special marker for Twilio Verify
      });
    } catch (twilioError) {
      logger.error('Failed to send Twilio Verify OTP:', twilioError);
      // Delete the OTP record since sending failed
      await prisma.oTPVerification.delete({ where: { id: otpRecord.id } });
      throw new Error('Failed to send verification code');
    }

    logger.info(`Phone OTP sent to ${phone} for user ${userId}`);

    return {
      success: true,
      otpId: otpRecord.id,
      expiresAt,
      // Only include OTP in development for testing
      ...(process.env.NODE_ENV === 'development' && { otp })
    };

  } catch (error) {
    logger.error('Error sending phone OTP:', error);
    throw error;
  }
};

// Send OTP to email address
const sendEmailOTP = async (userId, email) => {
  try {
    // For anonymous signup flows, clean up based on email only
    if (userId.startsWith('temp-')) {
      await prisma.emailOTPVerification.deleteMany({
        where: {
          email,
          OR: [
            { expiresAt: { lt: new Date() } },
            { isUsed: true }
          ]
        }
      });
    } else {
      // Clean up expired email OTPs for this user
      await prisma.emailOTPVerification.deleteMany({
        where: {
          userId,
          email,
          OR: [
            { expiresAt: { lt: new Date() } },
            { isUsed: true }
          ]
        }
      });
    }

    // Check if there's already an active email OTP
    const existingOTP = await prisma.emailOTPVerification.findFirst({
      where: {
        ...(userId.startsWith('temp-') ? { email } : { userId, email }),
        isUsed: false,
        expiresAt: { gt: new Date() }
      }
    });

    if (existingOTP) {
      // If OTP was sent less than 1 minute ago, don't send again
      const timeDiff = Date.now() - existingOTP.createdAt.getTime();
      if (timeDiff < 60000) { // 1 minute
        throw new Error('Please wait before requesting another OTP');
      }
    }

    // Generate new OTP
    const otp = generateOTP();
    const expiryMinutes = parseInt(process.env.EMAIL_OTP_EXPIRY_MINUTES) || 10;
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    // Store OTP in database
    const otpRecord = await prisma.emailOTPVerification.create({
      data: {
        userId,
        email,
        otp,
        maxAttempts: parseInt(process.env.EMAIL_OTP_MAX_ATTEMPTS) || 3,
        expiresAt
      }
    });

    // Send OTP via email
    await sendPhoneVerificationEmail(email, otp);

    logger.info(`Email OTP sent to ${email} for user ${userId}`);

    return {
      success: true,
      otpId: otpRecord.id,
      expiresAt,
      // Only include OTP in development for testing
      ...(process.env.NODE_ENV === 'development' && { otp })
    };

  } catch (error) {
    logger.error('Error sending email OTP:', error);
    throw error;
  }
};

// Verify phone OTP
const verifyPhoneOTP = async (userId, phone, otp) => {
  try {
    // Find the OTP record
    const otpRecord = await prisma.oTPVerification.findFirst({
      where: {
        userId,
        phone,
        isUsed: false,
        expiresAt: { gt: new Date() }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!otpRecord) {
      throw new Error('Invalid or expired OTP');
    }

    // Check if max attempts exceeded
    if (otpRecord.attempts >= otpRecord.maxAttempts) {
      // Mark as used to prevent further attempts
      await prisma.oTPVerification.update({
        where: { id: otpRecord.id },
        data: { isUsed: true }
      });
      throw new Error('Maximum OTP attempts exceeded');
    }

    // Increment attempts
    await prisma.oTPVerification.update({
      where: { id: otpRecord.id },
      data: { attempts: otpRecord.attempts + 1 }
    });

    // Verify OTP - handle both custom OTP and Twilio Verify
    if (otpRecord.otp === 'TWILIO_VERIFY') {
      // Use Twilio Verify service
      try {
        const verificationResult = await verifyPhoneNumber(phone, otp);
        if (!verificationResult.success || !verificationResult.valid) {
          throw new Error('Invalid verification code');
        }
      } catch (twilioError) {
        logger.error('Twilio Verify verification failed:', twilioError);
        throw new Error('Invalid verification code');
      }
    } else {
      // Standard OTP verification
      if (otpRecord.otp !== otp) {
        throw new Error('Invalid OTP');
      }
    }

    // Mark OTP as used
    await prisma.oTPVerification.update({
      where: { id: otpRecord.id },
      data: { isUsed: true }
    });

    // Update user phone verification status
    await prisma.user.update({
      where: { id: userId },
      data: { 
        phone,
        isPhoneVerified: true 
      }
    });

    logger.info(`Phone ${phone} verified for user ${userId}`);

    return {
      success: true,
      message: 'Phone verified successfully'
    };

  } catch (error) {
    logger.error('Error verifying phone OTP:', error);
    throw error;
  }
};

// Verify email OTP
const verifyEmailOTP = async (userId, email, otp) => {
  try {
    // Find the email OTP record
    const otpRecord = await prisma.emailOTPVerification.findFirst({
      where: {
        ...(userId.startsWith('temp-') ? { email } : { userId, email }),
        isUsed: false,
        expiresAt: { gt: new Date() }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!otpRecord) {
      throw new Error('Invalid or expired OTP');
    }

    // Check if max attempts exceeded
    if (otpRecord.attempts >= otpRecord.maxAttempts) {
      // Mark as used to prevent further attempts
      await prisma.emailOTPVerification.update({
        where: { id: otpRecord.id },
        data: { isUsed: true }
      });
      throw new Error('Maximum OTP attempts exceeded');
    }

    // Increment attempts
    await prisma.emailOTPVerification.update({
      where: { id: otpRecord.id },
      data: { attempts: otpRecord.attempts + 1 }
    });

    // Verify OTP
    if (otpRecord.otp !== otp) {
      throw new Error('Invalid OTP');
    }

    // Mark OTP as used
    await prisma.emailOTPVerification.update({
      where: { id: otpRecord.id },
      data: { isUsed: true }
    });

    // Update user email verification status (only if not a temp user)
    if (!userId.startsWith('temp-')) {
      await prisma.user.update({
        where: { id: userId },
        data: { 
          isEmailVerified: true 
        }
      });
    }

    logger.info(`Email ${email} verified for user ${userId}`);

    return {
      success: true,
      message: 'Email verified successfully'
    };

  } catch (error) {
    logger.error('Error verifying email OTP:', error);
    throw error;
  }
};

// Clean up expired OTPs (can be called periodically)
const cleanupExpiredOTPs = async () => {
  try {
    // Clean up phone OTPs
    const phoneResult = await prisma.oTPVerification.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { isUsed: true, createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } } // Remove used OTPs older than 24 hours
        ]
      }
    });

    // Clean up email OTPs
    const emailResult = await prisma.emailOTPVerification.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { isUsed: true, createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } } // Remove used OTPs older than 24 hours
        ]
      }
    });

    const totalCleaned = phoneResult.count + emailResult.count;
    logger.info(`Cleaned up ${totalCleaned} expired OTP records (${phoneResult.count} phone, ${emailResult.count} email)`);
    return totalCleaned;

  } catch (error) {
    logger.error('Error cleaning up expired OTPs:', error);
    throw error;
  }
};

// Get phone OTP status for a user
const getPhoneOTPStatus = async (userId, phone) => {
  try {
    const otpRecord = await prisma.oTPVerification.findFirst({
      where: {
        userId,
        phone,
        isUsed: false,
        expiresAt: { gt: new Date() }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!otpRecord) {
      return {
        hasActiveOTP: false,
        canSendOTP: true
      };
    }

    const timeSinceCreated = Date.now() - otpRecord.createdAt.getTime();
    const canSendOTP = timeSinceCreated >= 60000; // 1 minute cooldown

    return {
      hasActiveOTP: true,
      canSendOTP,
      attemptsRemaining: otpRecord.maxAttempts - otpRecord.attempts,
      expiresAt: otpRecord.expiresAt,
      cooldownRemaining: canSendOTP ? 0 : Math.ceil((60000 - timeSinceCreated) / 1000)
    };

  } catch (error) {
    logger.error('Error getting phone OTP status:', error);
    throw error;
  }
};

// Get email OTP status for a user
const getEmailOTPStatus = async (userId, email) => {
  try {
    const otpRecord = await prisma.emailOTPVerification.findFirst({
      where: {
        ...(userId.startsWith('temp-') ? { email } : { userId, email }),
        isUsed: false,
        expiresAt: { gt: new Date() }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!otpRecord) {
      return {
        hasActiveOTP: false,
        canSendOTP: true
      };
    }

    const timeSinceCreated = Date.now() - otpRecord.createdAt.getTime();
    const canSendOTP = timeSinceCreated >= 60000; // 1 minute cooldown

    return {
      hasActiveOTP: true,
      canSendOTP,
      attemptsRemaining: otpRecord.maxAttempts - otpRecord.attempts,
      expiresAt: otpRecord.expiresAt,
      cooldownRemaining: canSendOTP ? 0 : Math.ceil((60000 - timeSinceCreated) / 1000)
    };

  } catch (error) {
    logger.error('Error getting email OTP status:', error);
    throw error;
  }
};

module.exports = {
  sendPhoneOTP,
  sendEmailOTP,
  verifyPhoneOTP,
  verifyEmailOTP,
  cleanupExpiredOTPs,
  getPhoneOTPStatus,
  getEmailOTPStatus,
  // Legacy exports for backward compatibility
  sendOTP: sendPhoneOTP,
  verifyOTP: verifyPhoneOTP,
  getOTPStatus: getPhoneOTPStatus
};