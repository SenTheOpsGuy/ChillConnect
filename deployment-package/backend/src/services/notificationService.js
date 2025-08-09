const AWS = require('aws-sdk');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

// Configure AWS services

const ses = new AWS.SES({
  region: process.env.AWS_REGION || process.env.SES_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const sns = new AWS.SNS({
  region: process.env.AWS_REGION || process.env.SNS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

// Email templates
const emailTemplates = {
  verification: {
    subject: 'ChillConnect - Verify Your Email Address',
    html: (verificationUrl) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #007bff; margin: 0;">ChillConnect</h1>
            <p style="color: #666; margin: 5px 0;">Your connection platform</p>
          </div>
          
          <h2 style="color: #333; margin-bottom: 20px;">Welcome to ChillConnect!</h2>
          <p style="color: #555; line-height: 1.6;">Thank you for joining our platform. To complete your registration and ensure the security of your account, please verify your email address.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; box-shadow: 0 2px 5px rgba(0,123,255,0.3);">
              Verify Email Address
            </a>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; color: #666; font-size: 14px;"><strong>Security Note:</strong> If you didn't create an account with ChillConnect, please ignore this email. Your email address will not be used for any future communications.</p>
          </div>
          
          <p style="color: #666; font-size: 14px; margin-top: 20px;">This verification link will expire in 24 hours for security purposes.</p>
          
          <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; text-align: center;">
            <p style="color: #999; font-size: 12px; margin: 0;">© 2024 ChillConnect. All rights reserved.</p>
            <p style="color: #999; font-size: 12px; margin: 5px 0;">Visit us at <a href="https://chillconnect.in" style="color: #007bff;">chillconnect.in</a></p>
          </div>
        </div>
      </div>
    `
  },
  phoneVerification: {
    subject: 'ChillConnect - Phone Verification Code',
    html: (otp) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #007bff; margin: 0;">ChillConnect</h1>
            <p style="color: #666; margin: 5px 0;">Phone Verification</p>
          </div>
          
          <h2 style="color: #333; margin-bottom: 20px;">Verify Your Phone Number</h2>
          <p style="color: #555; line-height: 1.6;">Enter the following verification code to confirm your phone number:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <div style="background-color: #f8f9fa; border: 2px dashed #007bff; padding: 20px; border-radius: 8px; display: inline-block;">
              <span style="font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 8px;">${otp}</span>
            </div>
          </div>
          
          <p style="color: #666; text-align: center; margin: 20px 0;">This code will expire in 10 minutes.</p>
          
          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; color: #856404; font-size: 14px;"><strong>Security:</strong> Never share this code with anyone. ChillConnect support will never ask for this code.</p>
          </div>
        </div>
      </div>
    `
  },
  bookingConfirmation: {
    subject: 'ChillConnect - Booking Confirmed',
    html: (bookingDetails) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Booking Confirmed</h2>
        <p>Your booking has been confirmed:</p>
        <div style="background-color: #f8f9fa; padding: 16px; border-radius: 4px;">
          <p><strong>Booking ID:</strong> ${bookingDetails.id}</p>
          <p><strong>Date:</strong> ${bookingDetails.date}</p>
          <p><strong>Time:</strong> ${bookingDetails.time}</p>
          <p><strong>Type:</strong> ${bookingDetails.type}</p>
          <p><strong>Amount:</strong> ${bookingDetails.amount} tokens</p>
        </div>
        <p>You can chat with your provider through the platform.</p>
      </div>
    `
  },
  tokenPurchase: {
    subject: 'ChillConnect - Token Purchase Confirmed',
    html: (tokenDetails) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Token Purchase Confirmed</h2>
        <p>Your token purchase has been processed:</p>
        <div style="background-color: #f8f9fa; padding: 16px; border-radius: 4px;">
          <p><strong>Tokens Purchased:</strong> ${tokenDetails.amount}</p>
          <p><strong>Amount Paid:</strong> ₹${tokenDetails.amountPaid}</p>
          <p><strong>New Balance:</strong> ${tokenDetails.newBalance} tokens</p>
        </div>
        <p>Your tokens are now available for booking services.</p>
      </div>
    `
  }
};

// Send verification email
const sendVerificationEmail = async (email, userId) => {
  try {
    const verificationToken = jwt.sign(
      { id: userId, purpose: 'email_verification' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    const params = {
      Source: process.env.FROM_EMAIL,
      Destination: {
        ToAddresses: [email]
      },
      Message: {
        Subject: {
          Data: emailTemplates.verification.subject
        },
        Body: {
          Html: {
            Data: emailTemplates.verification.html(verificationUrl)
          }
        }
      }
    };

    await ses.sendEmail(params).promise();
    logger.info(`Verification email sent to: ${email}`);
  } catch (error) {
    logger.error('Error sending verification email:', error);
    throw new Error('Failed to send verification email');
  }
};

// Send booking confirmation email
const sendBookingConfirmationEmail = async (email, bookingDetails) => {
  try {
    const params = {
      Source: process.env.FROM_EMAIL,
      Destination: {
        ToAddresses: [email]
      },
      Message: {
        Subject: {
          Data: emailTemplates.bookingConfirmation.subject
        },
        Body: {
          Html: {
            Data: emailTemplates.bookingConfirmation.html(bookingDetails)
          }
        }
      }
    };

    await ses.sendEmail(params).promise();
    logger.info(`Booking confirmation email sent to: ${email}`);
  } catch (error) {
    logger.error('Error sending booking confirmation email:', error);
    throw new Error('Failed to send booking confirmation email');
  }
};

// Send token purchase confirmation email
const sendTokenPurchaseEmail = async (email, tokenDetails) => {
  try {
    const params = {
      Source: process.env.FROM_EMAIL,
      Destination: {
        ToAddresses: [email]
      },
      Message: {
        Subject: {
          Data: emailTemplates.tokenPurchase.subject
        },
        Body: {
          Html: {
            Data: emailTemplates.tokenPurchase.html(tokenDetails)
          }
        }
      }
    };

    await ses.sendEmail(params).promise();
    logger.info(`Token purchase confirmation email sent to: ${email}`);
  } catch (error) {
    logger.error('Error sending token purchase email:', error);
    throw new Error('Failed to send token purchase confirmation email');
  }
};

// Send SMS OTP
const sendSMSOTP = async (phoneNumber, otp) => {
  try {
    const message = `Your ChillConnect verification code is: ${otp}. This code will expire in 10 minutes.`;

    const params = {
      PhoneNumber: phoneNumber,
      Message: message,
      MessageAttributes: {
        'AWS.SNS.SMS.SMSType': {
          DataType: 'String',
          StringValue: 'Transactional'
        }
      }
    };

    await sns.publish(params).promise();
    logger.info(`SMS OTP sent to: ${phoneNumber}`);
  } catch (error) {
    logger.error('Error sending SMS OTP:', error);
    throw new Error('Failed to send SMS OTP');
  }
};

// Send general notification email
const sendNotificationEmail = async (email, subject, content) => {
  try {
    const params = {
      Source: process.env.FROM_EMAIL,
      Destination: {
        ToAddresses: [email]
      },
      Message: {
        Subject: {
          Data: subject
        },
        Body: {
          Html: {
            Data: content
          }
        }
      }
    };

    await ses.sendEmail(params).promise();
    logger.info(`Notification email sent to: ${email}`);
  } catch (error) {
    logger.error('Error sending notification email:', error);
    throw new Error('Failed to send notification email');
  }
};

// Send phone verification email (alternative to SMS)
const sendPhoneVerificationEmail = async (email, otp) => {
  try {
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
              ${otp}
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
    
    logger.info(`Email OTP sent to: ${email}`);
  } catch (error) {
    logger.error('Error sending email OTP:', error);
    throw new Error('Failed to send verification email');
  }
};

module.exports = {
  sendVerificationEmail,
  sendPhoneVerificationEmail,
  sendBookingConfirmationEmail,
  sendTokenPurchaseEmail,
  sendSMSOTP,
  sendNotificationEmail
};