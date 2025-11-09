const { PrismaClient } = require('@prisma/client');
const { sendPhoneVerification } = require('./twilioService');
const logger = require('../utils/logger');

// Function to get the appropriate Prisma instance
const getPrismaClient = () => {
  return global.prisma || new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/chillconnect_test',
      },
    },
  });
};

// Generate 6-digit OTP
const generateOTPCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Generate OTP and store in database
const generateOTP = async (userId, type) => {
  try {
    const prisma = getPrismaClient();
    
    // Invalidate any existing OTPs of the same type for this user
    await prisma.oTP.updateMany({
      where: {
        userId,
        type,
        verified: false,
      },
      data: {
        verified: true, // Mark as verified to invalidate
      },
    });

    // Generate new OTP
    const code = generateOTPCode();
    const expiryMinutes = 10; // 10 minutes default
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    // Store OTP in database
    const otpRecord = await prisma.oTP.create({
      data: {
        userId,
        code,
        type,
        expiresAt,
        verified: false,
        attempts: 0,
      },
    });

    logger.info(`OTP generated for user ${userId}, type: ${type}`);

    return {
      success: true,
      otp: code,
      expiresAt,
      otpId: otpRecord.id,
    };

  } catch (error) {
    logger.error('Error generating OTP:', error);
    throw error;
  }
};

// Verify OTP
const verifyOTP = async (userId, code, type) => {
  try {
    const prisma = getPrismaClient();
    
    // Find the OTP record
    const otpRecord = await prisma.oTP.findFirst({
      where: {
        userId,
        code,
        type,
        verified: false,
        expiresAt: { gt: new Date() }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!otpRecord) {
      return {
        success: false,
        message: 'Invalid or expired OTP'
      };
    }

    // Check if max attempts exceeded (assuming max is 5)
    if (otpRecord.attempts >= 5) {
      return {
        success: false,
        message: 'Too many attempts. Please request a new OTP.'
      };
    }

    // Mark OTP as verified
    await prisma.oTP.update({
      where: { id: otpRecord.id },
      data: { 
        verified: true,
        attempts: otpRecord.attempts + 1
      }
    });

    logger.info(`OTP verified for user ${userId}, type: ${type}`);

    return {
      success: true,
      message: 'OTP verified successfully'
    };

  } catch (error) {
    logger.error('Error verifying OTP:', error);
    return {
      success: false,
      message: 'Error verifying OTP'
    };
  }
};

// Clean up expired OTPs
const cleanupExpiredOTPs = async () => {
  try {
    const prisma = getPrismaClient();
    
    const result = await prisma.oTP.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { verified: true, createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
        ]
      }
    });

    logger.info(`Cleaned up ${result.count} expired OTP records`);
    
    return {
      success: true,
      deletedCount: result.count
    };

  } catch (error) {
    logger.error('Error cleaning up expired OTPs:', error);
    throw error;
  }
};

// Get user OTPs
const getUserOTPs = async (userId, type = null) => {
  try {
    const prisma = getPrismaClient();
    
    const where = { userId };
    if (type) {
      where.type = type;
    }

    const otps = await prisma.oTP.findMany({
      where,
      select: {
        id: true,
        type: true,
        verified: true,
        attempts: true,
        expiresAt: true,
        createdAt: true,
        // Exclude code for security
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return {
      success: true,
      otps
    };

  } catch (error) {
    logger.error('Error getting user OTPs:', error);
    throw error;
  }
};

// Send OTP to phone number
const sendPhoneOTP = async (userId, phone) => {
  try {
    const result = await generateOTP(userId, 'PHONE_VERIFICATION');
    
    // Send OTP via Twilio Verify service 
    try {
      await sendPhoneVerification(phone);
      logger.info(`Twilio Verify OTP sent to ${phone} for user ${userId}`);
    } catch (twilioError) {
      logger.error('Failed to send Twilio Verify OTP:', twilioError);
      throw new Error('Failed to send verification code');
    }

    logger.info(`Phone OTP sent to ${phone} for user ${userId}`);

    return {
      success: true,
      otpId: result.otpId,
      expiresAt: result.expiresAt,
      // Only include OTP in development for testing
      ...(process.env.NODE_ENV === 'development' && { otp: result.otp })
    };

  } catch (error) {
    logger.error('Error sending phone OTP:', error);
    throw error;
  }
};

// Send OTP to email address
const sendEmailOTP = async (userId, email) => {
  try {
    const result = await generateOTP(userId, 'EMAIL_VERIFICATION');
    
    // Send OTP via email using Brevo
    const { sendTransactionalEmail } = require('./brevoService');
    
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">ChillConnect</h1>
          <p style="color: white; margin: 5px 0;">Login Verification Code</p>
        </div>
        
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333; margin-bottom: 20px;">Your Login Code</h2>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Use the following code to complete your login to ChillConnect:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <div style="background: #f1f5f9; border: 2px solid #dc2626; border-radius: 8px; 
                        padding: 20px; display: inline-block; font-size: 28px; font-weight: bold; 
                        color: #dc2626; letter-spacing: 4px; font-family: monospace;">
              ${result.otp}
            </div>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            This code will expire in 10 minutes for security reasons.
          </p>
          
          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            If you didn't request this login code, please ignore this email and your account will remain secure.
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
      'Login Verification Code - ChillConnect',
      emailContent
    );

    logger.info(`Email OTP sent to ${email} for user ${userId}`);

    return {
      success: true,
      otpId: result.otpId,
      expiresAt: result.expiresAt,
      // Only include OTP in development for testing
      ...(process.env.NODE_ENV === 'development' && { otp: result.otp })
    };

  } catch (error) {
    logger.error('Error sending email OTP:', error);
    throw error;
  }
};

// Simplified verify functions using the unified OTP model
const verifyPhoneOTP = async (userId, otp) => {
  return await verifyOTP(userId, otp, 'PHONE_VERIFICATION');
};

const verifyEmailOTP = async (userId, otp) => {
  return await verifyOTP(userId, otp, 'EMAIL_VERIFICATION');
};

// Simplified status functions
const getPhoneOTPStatus = async (userId) => {
  const result = await getUserOTPs(userId, 'PHONE_VERIFICATION');
  const activeOTPs = result.otps.filter(otp => !otp.verified && otp.expiresAt > new Date());
  
  return {
    hasActiveOTP: activeOTPs.length > 0,
    canSendOTP: true // Simplified for now
  };
};

const getEmailOTPStatus = async (userId) => {
  const result = await getUserOTPs(userId, 'EMAIL_VERIFICATION');
  const activeOTPs = result.otps.filter(otp => !otp.verified && otp.expiresAt > new Date());
  
  return {
    hasActiveOTP: activeOTPs.length > 0,
    canSendOTP: true // Simplified for now
  };
};

module.exports = {
  // Test-compatible interface
  generateOTP,
  verifyOTP,
  cleanupExpiredOTPs,
  getUserOTPs,
  
  // Original service functions (kept for backward compatibility)
  sendPhoneOTP,
  sendEmailOTP,
  verifyPhoneOTP,
  verifyEmailOTP,
  getPhoneOTPStatus,
  getEmailOTPStatus,
  
  // Legacy exports for backward compatibility
  sendOTP: sendPhoneOTP,
  getOTPStatus: getPhoneOTPStatus
};