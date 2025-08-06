const twilio = require('twilio');
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
 * Send phone verification using Twilio Verify
 */
const sendPhoneVerification = async (phoneNumber) => {
  if (!twilioClient) {
    throw new Error('Twilio client not initialized');
  }

  try {
    const verification = await twilioClient.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verifications
      .create({
        to: phoneNumber,
        channel: 'sms'
      });

    logger.info(`Phone verification sent to ${phoneNumber}, SID: ${verification.sid}`);

    return {
      success: true,
      sid: verification.sid,
      status: verification.status,
      channel: verification.channel,
      to: verification.to
    };
  } catch (error) {
    logger.error('Failed to send phone verification:', {
      error: error.message,
      code: error.code,
      status: error.status,
      phoneNumber
    });
    
    if (error.code === 60200) {
      throw new Error('Invalid phone number format');
    } else if (error.code === 60203) {
      throw new Error('Phone number is not supported in this region');
    } else if (error.code === 60212) {
      throw new Error('Too many verification attempts. Please try again later.');
    } else if (error.code === 21211) {
      throw new Error('Invalid phone number format for SMS');
    } else if (error.code === 21612) {
      throw new Error('SMS is not supported for this phone number');
    }
    
    throw new Error(`Failed to send verification code: ${error.message}`);
  }
};

/**
 * Verify phone number using Twilio Verify
 */
const verifyPhoneNumber = async (phoneNumber, code) => {
  if (!twilioClient) {
    throw new Error('Twilio client not initialized');
  }

  try {
    const verificationCheck = await twilioClient.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verificationChecks
      .create({
        to: phoneNumber,
        code: code
      });

    logger.info(`Phone verification check for ${phoneNumber}: ${verificationCheck.status}`);

    if (verificationCheck.status === 'approved') {
      return {
        success: true,
        status: verificationCheck.status,
        valid: true
      };
    } else {
      return {
        success: false,
        status: verificationCheck.status,
        valid: false
      };
    }
  } catch (error) {
    logger.error('Failed to verify phone number:', error);
    
    if (error.code === 20404) {
      throw new Error('Verification code has expired or is invalid');
    } else if (error.code === 60202) {
      throw new Error('Invalid verification code');
    } else if (error.code === 60203) {
      throw new Error('Phone number is not supported in this region');
    }
    
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
 * Send transactional SMS
 */
const sendTransactionalSMS = async (phoneNumber, message) => {
  if (!twilioClient) {
    throw new Error('Twilio client not initialized');
  }

  try {
    const sms = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER || 'ChillConnect',
      to: phoneNumber
    });

    logger.info(`Transactional SMS sent to ${phoneNumber}, SID: ${sms.sid}`);

    return {
      success: true,
      sid: sms.sid,
      status: sms.status,
      to: sms.to
    };
  } catch (error) {
    logger.error('Failed to send transactional SMS:', {
      error: error.message,
      code: error.code,
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