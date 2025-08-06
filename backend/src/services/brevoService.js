const brevo = require('@getbrevo/brevo');
const logger = require('../utils/logger');

// Brevo client initialization
let isInitialized = false;
let initAttempted = false;
let apiInstance;

const initializeBrevoClient = () => {
  if (initAttempted) {
    return isInitialized;
  }
  
  initAttempted = true;
  
  try {
    const apiKey = process.env.BREVO_API_KEY;
    
    logger.info('Attempting Brevo initialization with API key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'MISSING');
    
    if (!apiKey) {
      logger.warn('Brevo API key not configured. Email services will not work.');
      return false;
    }
    
    // Create TransactionalEmailsApi instance
    apiInstance = new brevo.TransactionalEmailsApi();
    
    // Set the API key
    apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, apiKey);
    
    isInitialized = true;
    logger.info('Brevo client initialized successfully');
    return true;
    
  } catch (error) {
    logger.error('Failed to initialize Brevo client:', error.message);
    logger.error('Error stack:', error.stack);
    return false;
  }
};

/**
 * Send email verification using Brevo
 */
const sendEmailVerification = async (email, verificationToken) => {
  try {
    if (!initializeBrevoClient()) {
      throw new Error('Brevo client not initialized');
    }

    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    const emailData = {
      to: [{ email, name: email.split('@')[0] }],
      sender: {
        email: process.env.EMAIL_FROM || 'noreply@chillconnect.in',
        name: 'ChillConnect'
      },
      subject: 'Verify Your Email - ChillConnect',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">ChillConnect</h1>
            <p style="color: white; margin: 5px 0;">Welcome to our community!</p>
          </div>
          
          <div style="padding: 30px; background: #f9f9f9;">
            <h2 style="color: #333; margin-bottom: 20px;">Verify Your Email Address</h2>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              Thank you for signing up with ChillConnect! To complete your registration, 
              please click the button below to verify your email address.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background: #667eea; color: white; padding: 12px 30px; 
                        text-decoration: none; border-radius: 5px; font-weight: bold;
                        display: inline-block;">
                Verify Email Address
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              If the button doesn't work, copy and paste this link into your browser:
              <br>
              <a href="${verificationUrl}" style="color: #667eea; word-break: break-all;">
                ${verificationUrl}
              </a>
            </p>
            
            <p style="color: #999; font-size: 12px; margin-top: 30px;">
              This verification link will expire in 24 hours. If you didn't create an account 
              with ChillConnect, please ignore this email.
            </p>
          </div>
          
          <div style="background: #333; color: white; text-align: center; padding: 20px;">
            <p style="margin: 0; font-size: 14px;">
              © 2024 ChillConnect. All rights reserved.
            </p>
          </div>
        </div>
      `,
      tags: ['email-verification', 'chillconnect']
    };

    const result = await apiInstance.sendTransacEmail(emailData);
    
    const messageId = result.body?.messageId || result.messageId;
    logger.info(`Email verification sent via Brevo to ${email}, Message ID: ${messageId}`);
    
    return {
      success: true,
      messageId: messageId
    };
  } catch (error) {
    logger.error('Failed to send email verification via Brevo:', error);
    throw new Error(`Failed to send verification email: ${error.message}`);
  }
};

/**
 * Send welcome email after account creation
 */
const sendWelcomeEmail = async (email, firstName, userRole) => {
  try {
    if (!initializeBrevoClient()) {
      throw new Error('Brevo client not initialized');
    }

    const roleMessage = userRole === 'SEEKER' 
      ? 'Ready to find amazing connections and experiences!'
      : 'Ready to offer your services and connect with seekers!';

    const emailData = {
      to: [{ email, name: firstName }],
      sender: {
        email: process.env.EMAIL_FROM || 'noreply@chillconnect.in',
        name: 'ChillConnect Team'
      },
      subject: `Welcome to ChillConnect, ${firstName}! 🎉`,
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to ChillConnect!</h1>
            <p style="color: white; margin: 10px 0; font-size: 18px;">Hi ${firstName}! 👋</p>
          </div>
          
          <div style="padding: 40px 30px; background: #f9f9f9;">
            <h2 style="color: #333; margin-bottom: 20px;">Your Account is Ready!</h2>
            
            <p style="color: #666; font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
              🎉 Congratulations! Your ${userRole.toLowerCase()} account has been successfully created and verified.
            </p>
            
            <p style="color: #666; font-size: 16px; line-height: 1.8; margin-bottom: 30px;">
              ${roleMessage}
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
              <h3 style="color: #333; margin: 0 0 15px 0;">Next Steps:</h3>
              <ul style="color: #666; line-height: 1.6; margin: 0; padding-left: 20px;">
                <li>Complete your profile for better matches</li>
                <li>Add profile photos and verification documents</li>
                <li>${userRole === 'SEEKER' ? 'Browse available providers in your area' : 'Set up your services and availability'}</li>
                <li>Start connecting with the ChillConnect community</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}/dashboard" 
                 style="background: #667eea; color: white; padding: 14px 28px; 
                        text-decoration: none; border-radius: 6px; font-weight: bold;
                        display: inline-block; font-size: 16px;">
                Go to Dashboard
              </a>
            </div>
            
            <div style="background: #e8f2ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="color: #0066cc; margin: 0; font-size: 14px; text-align: center;">
                💡 <strong>Pro Tip:</strong> Complete your profile to get 3x more matches!
              </p>
            </div>
          </div>
          
          <div style="background: #333; color: white; text-align: center; padding: 30px;">
            <p style="margin: 0 0 10px 0; font-size: 16px;">
              Need help getting started?
            </p>
            <p style="margin: 0; font-size: 14px; opacity: 0.8;">
              Contact us at support@chillconnect.in
            </p>
            <hr style="border: none; border-top: 1px solid #555; margin: 20px 0;">
            <p style="margin: 0; font-size: 12px; opacity: 0.7;">
              © 2024 ChillConnect. All rights reserved.
            </p>
          </div>
        </div>
      `,
      tags: ['welcome-email', 'chillconnect', userRole.toLowerCase()]
    };

    const result = await apiInstance.sendTransacEmail(emailData);
    
    const messageId = result.body?.messageId || result.messageId;
    logger.info(`Welcome email sent via Brevo to ${email} (${firstName}), Message ID: ${messageId}`);
    
    return {
      success: true,
      messageId: messageId
    };
  } catch (error) {
    logger.error('Failed to send welcome email via Brevo:', error);
    throw new Error(`Failed to send welcome email: ${error.message}`);
  }
};

/**
 * Send transactional email
 */
const sendTransactionalEmail = async (to, subject, htmlContent, templateData = {}) => {
  try {
    if (!initializeBrevoClient()) {
      throw new Error('Brevo client not initialized');
    }

    const emailData = {
      to: [{ email: to, name: to.split('@')[0] }],
      sender: {
        email: process.env.EMAIL_FROM || 'noreply@chillconnect.in',
        name: 'ChillConnect'
      },
      subject,
      htmlContent,
      tags: ['transactional', 'chillconnect']
    };

    // Add template parameters if provided
    if (Object.keys(templateData).length > 0) {
      emailData.params = templateData;
    }

    const result = await apiInstance.sendTransacEmail(emailData);
    
    const messageId = result.body?.messageId || result.messageId;
    logger.info(`Transactional email sent via Brevo to ${to}, Subject: ${subject}, Message ID: ${messageId}`);
    
    return {
      success: true,
      messageId: messageId
    };
  } catch (error) {
    logger.error('Failed to send transactional email via Brevo:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
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

module.exports = {
  sendEmailVerification,
  generateEmailVerificationToken,
  verifyEmailVerificationToken,
  sendWelcomeEmail,
  sendTransactionalEmail
};