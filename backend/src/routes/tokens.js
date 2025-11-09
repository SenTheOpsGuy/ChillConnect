const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const logger = require('../utils/logger');
const paypalService = require('../services/paypalService');
const { sendTokenPurchaseEmail } = require('../services/notificationService');

const router = express.Router();

// @route   GET /api/tokens/packages
// @desc    Get available token packages
// @access  Public
router.get('/packages', (req, res) => {
  try {
    const packages = paypalService.getTokenPackages();
    
    res.json({
      success: true,
      data: packages
    });
  } catch (error) {
    logger.error('Error getting token packages:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get token packages'
    });
  }
});

// @route   GET /api/tokens/balance
// @desc    Get user's token balance
// @access  Private
router.get('/balance', auth, async (req, res, next) => {
  try {
    const wallet = await req.prisma.tokenWallet.findUnique({
      where: { userId: req.user.id }
    });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        error: 'Wallet not found'
      });
    }

    res.json({
      success: true,
      data: {
        balance: wallet.balance,
        escrowBalance: wallet.escrowBalance,
        totalEarned: wallet.totalEarned,
        totalSpent: wallet.totalSpent
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/tokens/purchase
// @desc    Create PayPal payment for token purchase
// @access  Private
router.post('/purchase', [
  auth,
  body('tokenAmount').isInt({ min: 10 }).withMessage('Minimum 10 tokens required')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { tokenAmount } = req.body;
    
    // Check minimum purchase amount
    const minTokens = parseInt(process.env.MIN_TOKEN_PURCHASE) || 10;
    if (tokenAmount < minTokens) {
      return res.status(400).json({
        success: false,
        error: `Minimum purchase is ${minTokens} tokens`
      });
    }

    // Create PayPal payment
    const payment = await paypalService.createPayment(tokenAmount, req.user.id);

    // Find approval URL
    const approvalUrl = payment.links.find(link => link.rel === 'approval_url');
    
    if (!approvalUrl) {
      return res.status(500).json({
        success: false,
        error: 'Failed to create payment'
      });
    }

    // Store payment details in database
    await req.prisma.tokenTransaction.create({
      data: {
        userId: req.user.id,
        walletId: req.user.tokenWallet.id,
        type: 'PURCHASE',
        amount: tokenAmount,
        previousBalance: req.user.tokenWallet.balance,
        newBalance: req.user.tokenWallet.balance, // Will be updated after payment
        description: `Token purchase via PayPal - ${tokenAmount} tokens`,
        paypalOrderId: payment.id,
        metadata: {
          paymentStatus: 'pending',
          paypalPaymentId: payment.id
        }
      }
    });

    logger.info(`Token purchase initiated: ${tokenAmount} tokens for user: ${req.user.email}`);

    res.json({
      success: true,
      data: {
        paymentId: payment.id,
        approvalUrl: approvalUrl.href,
        tokenAmount,
        amountINR: tokenAmount * paypalService.TOKEN_VALUE_INR
      }
    });

  } catch (error) {
    next(error);
  }
});

// @route   POST /api/tokens/execute-payment
// @desc    Execute PayPal payment and add tokens to wallet
// @access  Private
router.post('/execute-payment', [
  auth,
  body('paymentId').notEmpty().withMessage('Payment ID is required'),
  body('payerId').notEmpty().withMessage('Payer ID is required')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { paymentId, payerId } = req.body;

    // Execute PayPal payment
    const executedPayment = await paypalService.executePayment(paymentId, payerId);

    if (executedPayment.state !== 'approved') {
      return res.status(400).json({
        success: false,
        error: 'Payment not approved'
      });
    }

    // Extract token amount from payment
    const customData = JSON.parse(executedPayment.transactions[0].custom);
    const tokenAmount = customData.tokenAmount;

    // Update wallet and transaction in database transaction
    const result = await req.prisma.$transaction(async (prisma) => {
      // Get current wallet
      const wallet = await prisma.tokenWallet.findUnique({
        where: { userId: req.user.id }
      });

      const newBalance = wallet.balance + tokenAmount;

      // Update wallet
      const updatedWallet = await prisma.tokenWallet.update({
        where: { userId: req.user.id },
        data: { balance: newBalance }
      });

      // Update transaction record
      await prisma.tokenTransaction.updateMany({
        where: {
          userId: req.user.id,
          paypalOrderId: paymentId
        },
        data: {
          newBalance,
          metadata: {
            paymentStatus: 'completed',
            paypalPaymentId: paymentId,
            executedAt: new Date().toISOString()
          }
        }
      });

      return { updatedWallet, newBalance, tokenAmount };
    });

    // Send confirmation email
    await sendTokenPurchaseEmail(req.user.email, {
      amount: tokenAmount,
      amountPaid: tokenAmount * paypalService.TOKEN_VALUE_INR,
      newBalance: result.newBalance
    });

    logger.info(`Token purchase completed: ${tokenAmount} tokens for user: ${req.user.email}`);

    res.json({
      success: true,
      data: {
        tokenAmount,
        newBalance: result.newBalance,
        amountPaid: tokenAmount * paypalService.TOKEN_VALUE_INR
      },
      message: 'Tokens added to your wallet successfully'
    });

  } catch (error) {
    next(error);
  }
});

// @route   GET /api/tokens/transactions
// @desc    Get user's token transaction history
// @access  Private
router.get('/transactions', auth, async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const transactions = await req.prisma.tokenTransaction.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      skip: parseInt(skip),
      take: parseInt(limit),
      include: {
        booking: {
          select: {
            id: true,
            type: true,
            startTime: true,
            provider: {
              select: {
                profile: {
                  select: {
                    firstName: true,
                    lastName: true
                  }
                }
              }
            }
          }
        }
      }
    });

    const totalTransactions = await req.prisma.tokenTransaction.count({
      where: { userId: req.user.id }
    });

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalTransactions,
          totalPages: Math.ceil(totalTransactions / limit)
        }
      }
    });

  } catch (error) {
    next(error);
  }
});

// @route   POST /api/tokens/webhook
// @desc    Handle PayPal webhook notifications
// @access  Public (but validated)
router.post('/webhook', async (req, res) => {
  try {
    // Validate webhook signature
    const isValid = paypalService.validateWebhook(req.headers, req.body);
    
    if (!isValid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid webhook signature'
      });
    }

    const { event_type, resource } = req.body;

    logger.info(`PayPal webhook received: ${event_type}`);

    // Handle different webhook events
    switch (event_type) {
    case 'PAYMENT.SALE.COMPLETED':
      // Payment completed successfully
      await handlePaymentCompleted(resource);
      break;
      
    case 'PAYMENT.SALE.DENIED':
      // Payment denied
      await handlePaymentDenied(resource);
      break;
      
    case 'PAYMENT.SALE.REFUNDED':
      // Payment refunded
      await handlePaymentRefunded(resource);
      break;
      
    default:
      logger.info(`Unhandled webhook event: ${event_type}`);
    }

    res.json({ success: true });

  } catch (error) {
    logger.error('Webhook processing error:', error);
    res.status(500).json({
      success: false,
      error: 'Webhook processing failed'
    });
  }
});

// Helper function to handle payment completion
const handlePaymentCompleted = async (resource) => {
  try {
    // Additional processing if needed
    logger.info(`Payment completed: ${resource.id}`);
  } catch (error) {
    logger.error('Error handling payment completion:', error);
  }
};

// Helper function to handle payment denial
const handlePaymentDenied = async (resource) => {
  try {
    // Handle payment denial
    logger.info(`Payment denied: ${resource.id}`);
  } catch (error) {
    logger.error('Error handling payment denial:', error);
  }
};

// Helper function to handle payment refund
const handlePaymentRefunded = async (resource) => {
  try {
    // Handle refund processing
    logger.info(`Payment refunded: ${resource.id}`);
  } catch (error) {
    logger.error('Error handling payment refund:', error);
  }
};

module.exports = router;