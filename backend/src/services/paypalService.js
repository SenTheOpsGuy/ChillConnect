const paypal = require('paypal-rest-sdk');
const logger = require('../utils/logger');

// Configure PayPal SDK
paypal.configure({
  mode: process.env.PAYPAL_MODE || 'sandbox', // sandbox or live
  client_id: process.env.PAYPAL_CLIENT_ID,
  client_secret: process.env.PAYPAL_CLIENT_SECRET
});

// Token value in INR (1 token = 100 INR)
const TOKEN_VALUE_INR = parseInt(process.env.TOKEN_VALUE_INR) || 100;

// Create PayPal payment
const createPayment = async (tokenAmount, userId) => {
  try {
    const amountInINR = tokenAmount * TOKEN_VALUE_INR;
    
    const createPaymentJson = {
      intent: 'sale',
      payer: {
        payment_method: 'paypal'
      },
      redirect_urls: {
        return_url: `${process.env.FRONTEND_URL}/payment/success`,
        cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`
      },
      transactions: [{
        item_list: {
          items: [{
            name: 'ChillConnect Tokens',
            sku: 'TOKENS',
            price: amountInINR.toString(),
            currency: 'INR',
            quantity: 1
          }]
        },
        amount: {
          currency: 'INR',
          total: amountInINR.toString()
        },
        description: `Purchase of ${tokenAmount} tokens for ChillConnect`,
        custom: JSON.stringify({
          userId,
          tokenAmount,
          timestamp: new Date().toISOString()
        })
      }]
    };

    return new Promise((resolve, reject) => {
      paypal.payment.create(createPaymentJson, (error, payment) => {
        if (error) {
          logger.error('PayPal payment creation error:', error);
          reject(new Error('Failed to create PayPal payment'));
        } else {
          logger.info(`PayPal payment created: ${payment.id} for user: ${userId}`);
          resolve(payment);
        }
      });
    });
  } catch (error) {
    logger.error('Error creating PayPal payment:', error);
    throw new Error('Failed to create payment');
  }
};

// Execute PayPal payment
const executePayment = async (paymentId, payerId) => {
  try {
    const executePaymentJson = {
      payer_id: payerId
    };

    return new Promise((resolve, reject) => {
      paypal.payment.execute(paymentId, executePaymentJson, (error, payment) => {
        if (error) {
          logger.error('PayPal payment execution error:', error);
          reject(new Error('Failed to execute PayPal payment'));
        } else {
          logger.info(`PayPal payment executed: ${payment.id}`);
          resolve(payment);
        }
      });
    });
  } catch (error) {
    logger.error('Error executing PayPal payment:', error);
    throw new Error('Failed to execute payment');
  }
};

// Get payment details
const getPaymentDetails = async (paymentId) => {
  try {
    return new Promise((resolve, reject) => {
      paypal.payment.get(paymentId, (error, payment) => {
        if (error) {
          logger.error('PayPal get payment error:', error);
          reject(new Error('Failed to get payment details'));
        } else {
          resolve(payment);
        }
      });
    });
  } catch (error) {
    logger.error('Error getting payment details:', error);
    throw new Error('Failed to get payment details');
  }
};

// Process refund
const processRefund = async (saleId, refundAmount) => {
  try {
    const refundJson = {
      amount: {
        currency: 'INR',
        total: refundAmount.toString()
      },
      reason: 'Booking cancellation or dispute resolution'
    };

    return new Promise((resolve, reject) => {
      paypal.sale.refund(saleId, refundJson, (error, refund) => {
        if (error) {
          logger.error('PayPal refund error:', error);
          reject(new Error('Failed to process refund'));
        } else {
          logger.info(`PayPal refund processed: ${refund.id}`);
          resolve(refund);
        }
      });
    });
  } catch (error) {
    logger.error('Error processing refund:', error);
    throw new Error('Failed to process refund');
  }
};

// Validate webhook signature (for production use)
const validateWebhook = () => {
  try {
    // PayPal webhook validation logic
    // This would involve verifying the signature using PayPal's webhook validation API
    // For now, we'll return true in development
    if (process.env.NODE_ENV === 'development') {
      return true;
    }
    
    // In production, implement proper webhook validation
    return true;
  } catch (error) {
    logger.error('Error validating webhook:', error);
    return false;
  }
};

// Get token packages
const getTokenPackages = () => {
  return [
    {
      tokens: 10,
      priceINR: 10 * TOKEN_VALUE_INR,
      popular: false,
      description: 'Starter package'
    },
    {
      tokens: 25,
      priceINR: 25 * TOKEN_VALUE_INR,
      popular: false,
      description: 'Basic package'
    },
    {
      tokens: 50,
      priceINR: 50 * TOKEN_VALUE_INR,
      popular: true,
      description: 'Most popular'
    },
    {
      tokens: 100,
      priceINR: 100 * TOKEN_VALUE_INR,
      popular: false,
      description: 'Value package'
    },
    {
      tokens: 250,
      priceINR: 250 * TOKEN_VALUE_INR,
      popular: false,
      description: 'Premium package'
    },
    {
      tokens: 500,
      priceINR: 500 * TOKEN_VALUE_INR,
      popular: false,
      description: 'Ultimate package'
    }
  ];
};

module.exports = {
  createPayment,
  executePayment,
  getPaymentDetails,
  processRefund,
  validateWebhook,
  getTokenPackages,
  TOKEN_VALUE_INR
};