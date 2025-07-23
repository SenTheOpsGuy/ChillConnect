import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate, AuthRequest } from '../middleware/auth';
import { prisma } from '../utils/database';
import { logger } from '../utils/logger';
import { asyncHandler } from '../middleware/errorHandler';
import { auditLog } from '../services/auditService';
import { createPayPalOrder, capturePayPalOrder } from '../services/paypalService';

const router = express.Router();

// Get token balance
router.get('/balance', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const wallet = await prisma.tokenWallet.findUnique({
    where: { userId: req.user!.id },
    include: {
      transactions: {
        orderBy: { createdAt: 'desc' },
        take: 10
      }
    }
  });

  if (!wallet) {
    return res.status(404).json({ error: 'Wallet not found' });
  }

  res.json({
    balance: wallet.balance,
    escrowBalance: wallet.escrowBalance,
    totalPurchased: wallet.totalPurchased,
    totalSpent: wallet.totalSpent,
    recentTransactions: wallet.transactions
  });
}));

// Purchase tokens
router.post('/purchase', [
  authenticate,
  body('tokenAmount').isInt({ min: 10, max: 500 }),
  body('paypalOrderId').notEmpty()
], asyncHandler(async (req: AuthRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { tokenAmount, paypalOrderId } = req.body;
  const userId = req.user!.id;

  // Verify PayPal payment
  const paypalCapture = await capturePayPalOrder(paypalOrderId);
  
  if (!paypalCapture.success) {
    return res.status(400).json({ error: 'Payment verification failed' });
  }

  // Calculate expected amount (1 token = 100 INR)
  const expectedAmount = tokenAmount * 100;
  const paidAmount = parseFloat(paypalCapture.amount);

  if (Math.abs(paidAmount - expectedAmount) > 1) { // Allow 1 INR tolerance
    return res.status(400).json({ error: 'Payment amount mismatch' });
  }

  // Add tokens to wallet
  const wallet = await prisma.$transaction(async (tx) => {
    const updatedWallet = await tx.tokenWallet.update({
      where: { userId },
      data: {
        balance: { increment: tokenAmount },
        totalPurchased: { increment: tokenAmount }
      }
    });

    await tx.transaction.create({
      data: {
        walletId: updatedWallet.id,
        type: 'PURCHASE',
        amount: tokenAmount,
        description: `Purchased ${tokenAmount} tokens via PayPal`,
        paypalOrderId,
        metadata: {
          paypalCaptureId: paypalCapture.captureId,
          amountPaid: paidAmount,
          currency: paypalCapture.currency
        }
      }
    });

    return updatedWallet;
  });

  // Audit log
  await auditLog(
    userId,
    'TOKENS_PURCHASED',
    'token_wallet',
    wallet.id,
    { tokenAmount, paypalOrderId, amountPaid: paidAmount },
    req.ip,
    req.get('User-Agent')
  );

  logger.info(`User ${userId} purchased ${tokenAmount} tokens for ${paidAmount} INR`);

  res.json({
    message: 'Tokens purchased successfully',
    newBalance: wallet.balance,
    tokensPurchased: tokenAmount
  });
}));

// Create PayPal order
router.post('/create-paypal-order', [
  authenticate,
  body('tokenAmount').isInt({ min: 10, max: 500 })
], asyncHandler(async (req: AuthRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { tokenAmount } = req.body;
  const amountINR = tokenAmount * 100; // 1 token = 100 INR

  const order = await createPayPalOrder(amountINR, 'INR');

  if (!order.success) {
    return res.status(500).json({ error: 'Failed to create PayPal order' });
  }

  res.json({
    orderId: order.orderId,
    approvalUrl: order.approvalUrl
  });
}));

// Get transaction history
router.get('/transactions', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const { page = 1, limit = 20, type } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  const wallet = await prisma.tokenWallet.findUnique({
    where: { userId: req.user!.id }
  });

  if (!wallet) {
    return res.status(404).json({ error: 'Wallet not found' });
  }

  const where: any = { walletId: wallet.id };
  if (type) where.type = type;

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
      skip: offset,
      include: {
        booking: {
          select: {
            id: true,
            type: true,
            scheduledAt: true
          }
        }
      }
    }),
    prisma.transaction.count({ where })
  ]);

  res.json({
    transactions,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  });
}));

export { router as tokenRoutes };