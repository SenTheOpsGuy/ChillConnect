const twilio = require('twilio');
const { sendOTP, sendTransactionalSMS: fast2smsSendSMS } = require('./fast2smsService');
const logger = require('../utils/logger');

// Initialize Twilio client
let twilioClient;

try {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const verifySid = process.env.TWILIO_VERIFY_SERVICE_SID;

  if (!accountSid || !authToken || !verifySid) {
    logger.warn('Twilio credentials not configured. SMS verification will not work.');
  } else {
    twilioClient = twilio(accountSid, authToken);
    logger.info('Twilio client initialized successfully');
  }
} catch (error) {
  logger.error('Failed to initialize Twilio client:', error);
}

/**
 * Send phone verification using Fast2SMS
 */
const sendPhoneVerification = async (phoneNumber) => {
  try {
    logger.info(`Sending phone verification to ${phoneNumber} via Fast2SMS`);
    
    const result = await sendOTP(phoneNumber);
    
    logger.info(`Phone verification sent to ${phoneNumber} via Fast2SMS`);

    return {
      success: true,
      messageId: result.messageId,
      status: 'sent',
      channel: 'sms',
      to: phoneNumber,
      otp: result.otp, // For development/testing - remove in production
      provider: 'fast2sms'
    };
  } catch (error) {
    logger.error('Failed to send phone verification via Fast2SMS:', {
      error: error.message,
      phoneNumber
    });
    
    // Handle Fast2SMS specific errors
    if (error.message.includes('Invalid Indian mobile number')) {
      throw new Error('Please enter a valid Indian mobile number (10 digits)');
    } else if (error.message.includes('Invalid Fast2SMS API key')) {
      throw new Error('SMS service configuration error. Please contact support.');
    } else if (error.message.includes('timeout')) {
      throw new Error('SMS service is currently slow. Please try again in a moment.');
    }
    
    throw new Error(`Failed to send verification code: ${error.message}`);
  }
};

/**
 * Verify phone number using OTP (stored in session/database)
 * Note: In production, OTPs should be stored in Redis or database with expiration
 */
const verifyPhoneNumber = async (phoneNumber, code, storedOTP = null) => {
  try {
    logger.info(`Verifying phone number ${phoneNumber} with code ${code}`);
    
    // For now, we'll accept the OTP that was returned during sendPhoneVerification
    // In production, you should store OTPs in Redis or database with expiration
    if (!storedOTP) {
      // For demo purposes, we'll assume verification is successful if code has 6 digits
      if (!/^\d{6}$/.test(code)) {
        return {
          success: false,
          status: 'invalid',
          valid: false,
          message: 'Invalid OTP format. Please enter a 6-digit code.'
        };
      }
      
      // In production, check against stored OTP
      return {
        success: true,
        status: 'verified',
        valid: true,
        message: 'Phone number verified successfully'
      };
    }

    // Check if provided OTP matches stored OTP
    if (code === storedOTP) {
      return {
        success: true,
        status: 'verified', 
        valid: true,
        message: 'Phone number verified successfully'
      };
    } else {
      return {
        success: false,
        status: 'invalid',
        valid: false,
        message: 'Invalid verification code'
      };
    }
  } catch (error) {
    logger.error('Failed to verify phone number:', error);
    throw new Error('Failed to verify phone number');
  }
};

/**
 * Send email verification using Brevo (delegated to brevoService)
 */
const sendEmailVerification = async (email, verificationToken) => {
  const { sendEmailVerification: brevoSendEmailVerification } = require('./brevoService');
  return await brevoSendEmailVerification(email, verificationToken);
};

/**
 * Generate email verification token
 */
const generateEmailVerificationToken = (userId, email) => {
  const jwt = require('jsonwebtoken');
  
  return jwt.sign(
    { userId, email, type: 'email_verification' },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

/**
 * Verify email verification token
 */
const verifyEmailVerificationToken = (token) => {
  const jwt = require('jsonwebtoken');
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.type !== 'email_verification') {
      throw new Error('Invalid token type');
    }
    
    return {
      success: true,
      userId: decoded.userId,
      email: decoded.email
    };
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Verification token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid verification token');
    }
    throw error;
  }
};

/**
 * Send welcome email after account creation using Brevo
 */
const sendWelcomeEmail = async (email, firstName, userRole) => {
  const { sendWelcomeEmail: brevoSendWelcomeEmail } = require('./brevoService');
  return await brevoSendWelcomeEmail(email, firstName, userRole);
};

/**
 * Send transactional email using Brevo (delegated to brevoService)
 */
const sendTransactionalEmail = async (to, subject, htmlContent, templateData = {}) => {
  const { sendTransactionalEmail: brevoSendTransactionalEmail } = require('./brevoService');
  return await brevoSendTransactionalEmail(to, subject, htmlContent, templateData);
};

/**
 * Send transactional SMS using Fast2SMS
 */
const sendTransactionalSMS = async (phoneNumber, message) => {
  try {
    logger.info(`Sending transactional SMS to ${phoneNumber} via Fast2SMS`);
    
    const result = await fast2smsSendSMS(phoneNumber, message);
    
    logger.info(`Transactional SMS sent to ${phoneNumber} via Fast2SMS`);

    return {
      success: true,
      messageId: result.messageId,
      status: result.status,
      to: phoneNumber,
      provider: 'fast2sms'
    };
  } catch (error) {
    logger.error('Failed to send transactional SMS via Fast2SMS:', {
      error: error.message,
      phoneNumber
    });
    
    throw new Error(`Failed to send SMS: ${error.message}`);
  }
};

module.exports = {
  sendPhoneVerification,
  verifyPhoneNumber,
  sendEmailVerification,
  generateEmailVerificationToken,
  verifyEmailVerificationToken,
  sendWelcomeEmail,
  sendTransactionalEmail,
  sendTransactionalSMS
};