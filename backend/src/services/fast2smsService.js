const axios = require('axios');
const logger = require('../utils/logger');

// Fast2SMS Configuration
const FAST2SMS_BASE_URL = 'https://www.fast2sms.com/dev/bulkV2';

// Initialize Fast2SMS client
let isConfigured = false;

const initializeFast2SMS = () => {
  const apiKey = process.env.FAST2SMS_API_KEY;
  
  if (!apiKey) {
    logger.warn('Fast2SMS API key not configured. SMS services will not work.');
    return false;
  }
  
  isConfigured = true;
  logger.info('Fast2SMS service initialized successfully');
  return true;
};

/**
 * Send SMS using Fast2SMS
 */
const sendSMS = async (phoneNumber, message) => {
  try {
    if (!initializeFast2SMS()) {
      throw new Error('Fast2SMS not configured');
    }

    // Clean phone number (remove +91 prefix if present)
    const cleanNumber = phoneNumber.replace(/^\+91/, '');
    
    // Validate Indian mobile number (10 digits starting with 6,7,8,9)
    if (!/^[6-9]\d{9}$/.test(cleanNumber)) {
      throw new Error('Invalid Indian mobile number format');
    }

    const payload = {
      variables_values: message,
      route: 'otp',
      numbers: cleanNumber
    };

    logger.info(`Sending SMS to ${cleanNumber} via Fast2SMS`);

    const response = await axios.post(FAST2SMS_BASE_URL, payload, {
      headers: {
        'authorization': process.env.FAST2SMS_API_KEY,
        'Content-Type': 'application/json',
        'accept': '*/*',
        'cache-control': 'no-cache'
      },
      timeout: 30000 // 30 seconds timeout as per documentation
    });

    if (response.data && response.data.return === true) {
      logger.info(`SMS sent successfully via Fast2SMS to ${cleanNumber}`);
      
      return {
        success: true,
        messageId: response.data.request_id,
        status: 'sent',
        to: phoneNumber,
        provider: 'fast2sms'
      };
    } else {
      throw new Error(`Fast2SMS API error: ${response.data?.message || 'Unknown error'}`);
    }

  } catch (error) {
    logger.error('Fast2SMS SMS sending failed:', {
      error: error.message,
      phoneNumber,
      response: error.response?.data
    });
    
    // Handle specific Fast2SMS errors
    if (error.response?.status === 401) {
      throw new Error('Invalid Fast2SMS API key');
    } else if (error.response?.status === 400) {
      throw new Error('Invalid request parameters for Fast2SMS');
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('SMS service timeout. Please try again.');
    }
    
    throw new Error(`Failed to send SMS: ${error.message}`);
  }
};

/**
 * Generate OTP
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send OTP via Fast2SMS
 * Fast2SMS OTP route expects only numeric values and will send as "Your OTP: {otp}"
 */
const sendOTP = async (phoneNumber) => {
  try {
    const otp = generateOTP();
    
    // For Fast2SMS OTP route, we only pass the numeric OTP value
    // Fast2SMS will format it as "Your OTP: {otp}"
    const result = await sendSMS(phoneNumber, otp);
    
    return {
      ...result,
      otp: otp // In production, you might want to store this in Redis/database instead of returning it
    };
  } catch (error) {
    logger.error('Failed to send OTP via Fast2SMS:', error);
    throw error;
  }
};

/**
 * Send welcome SMS
 */
const sendWelcomeSMS = async (phoneNumber, firstName) => {
  try {
    const message = `Welcome to ChillConnect, ${firstName}! Your account has been created successfully. Start exploring our services now.`;
    return await sendSMS(phoneNumber, message);
  } catch (error) {
    logger.error('Failed to send welcome SMS via Fast2SMS:', error);
    throw error;
  }
};

/**
 * Send transactional SMS
 */
const sendTransactionalSMS = async (phoneNumber, message) => {
  try {
    return await sendSMS(phoneNumber, message);
  } catch (error) {
    logger.error('Failed to send transactional SMS via Fast2SMS:', error);
    throw error;
  }
};

module.exports = {
  sendSMS,
  generateOTP,
  sendOTP,
  sendWelcomeSMS,
  sendTransactionalSMS
};