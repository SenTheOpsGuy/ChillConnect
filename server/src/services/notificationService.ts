import AWS from 'aws-sdk';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

// Configure AWS
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

const ses = new AWS.SES();
const sns = new AWS.SNS();

export const sendVerificationEmail = async (email: string, userId: string) => {
  try {
    const verificationToken = jwt.sign(
      { userId },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;

    const params = {
      Destination: {
        ToAddresses: [email]
      },
      Message: {
        Body: {
          Html: {
            Data: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Welcome to Booking Platform</h2>
                <p>Thank you for registering with us. Please verify your email address by clicking the link below:</p>
                <a href="${verificationUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                  Verify Email Address
                </a>
                <p>This link will expire in 24 hours.</p>
                <p>If you didn't create an account, please ignore this email.</p>
              </div>
            `
          },
          Text: {
            Data: `Welcome to Booking Platform! Please verify your email by visiting: ${verificationUrl}`
          }
        },
        Subject: {
          Data: 'Verify Your Email Address'
        }
      },
      Source: process.env.FROM_EMAIL || 'noreply@bookingplatform.com'
    };

    await ses.sendEmail(params).promise();
    logger.info(`Verification email sent to ${email}`);
  } catch (error) {
    logger.error('Failed to send verification email:', error);
    throw error;
  }
};

export const sendSMSOTP = async (phoneNumber: string) => {
  try {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // In production, store OTP in Redis or database with expiration
    // For now, we'll just log it
    logger.info(`OTP for ${phoneNumber}: ${otp}`);

    const params = {
      Message: `Your Booking Platform verification code is: ${otp}. This code expires in 10 minutes.`,
      PhoneNumber: phoneNumber,
      MessageAttributes: {
        'AWS.SNS.SMS.SMSType': {
          DataType: 'String',
          StringValue: 'Transactional'
        }
      }
    };

    await sns.publish(params).promise();
    logger.info(`OTP SMS sent to ${phoneNumber}`);
    
    return otp; // In production, don't return OTP
  } catch (error) {
    logger.error('Failed to send SMS OTP:', error);
    throw error;
  }
};

export const sendBookingConfirmation = async (email: string, bookingDetails: any) => {
  try {
    const params = {
      Destination: {
        ToAddresses: [email]
      },
      Message: {
        Body: {
          Html: {
            Data: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Booking Confirmation</h2>
                <p>Your booking has been confirmed!</p>
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3>Booking Details:</h3>
                  <p><strong>Booking ID:</strong> ${bookingDetails.id}</p>
                  <p><strong>Date & Time:</strong> ${new Date(bookingDetails.scheduledAt).toLocaleString()}</p>
                  <p><strong>Duration:</strong> ${bookingDetails.duration} hour(s)</p>
                  <p><strong>Type:</strong> ${bookingDetails.type}</p>
                  <p><strong>Amount:</strong> ${bookingDetails.tokenAmount} tokens</p>
                </div>
                <p>You can view your booking details and chat with your provider through the platform.</p>
              </div>
            `
          }
        },
        Subject: {
          Data: 'Booking Confirmation - Booking Platform'
        }
      },
      Source: process.env.FROM_EMAIL || 'noreply@bookingplatform.com'
    };

    await ses.sendEmail(params).promise();
    logger.info(`Booking confirmation sent to ${email}`);
  } catch (error) {
    logger.error('Failed to send booking confirmation:', error);
    throw error;
  }
};