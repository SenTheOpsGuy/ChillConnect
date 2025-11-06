const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { auth, requireRole } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// @route   GET /api/withdrawals/payment-methods
// @desc    Get user's payment methods
// @access  Private
router.get('/payment-methods', [
  auth
], async (req, res, next) => {
  try {
    const paymentMethods = await req.prisma.paymentMethod.findMany({
      where: { userId: req.user.id },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    res.json({
      success: true,
      data: { paymentMethods }
    });

  } catch (error) {
    next(error);
  }
});

// @route   POST /api/withdrawals/payment-methods
// @desc    Add a payment method
// @access  Private (Providers only)
router.post('/payment-methods', [
  auth,
  requireRole(['PROVIDER', 'ADMIN', 'SUPER_ADMIN']),
  body('type').isIn(['PAYPAL', 'BANK_TRANSFER', 'UPI']).withMessage('Invalid payment method type'),
  body('nickname').optional().trim().isLength({ max: 100 }),
  body('paypalEmail').optional().isEmail(),
  body('accountHolderName').optional().trim().isLength({ min: 2, max: 100 }),
  body('accountNumber').optional().trim().isLength({ min: 5, max: 30 }),
  body('ifscCode').optional().trim().isLength({ min: 11, max: 11 }),
  body('bankName').optional().trim().isLength({ max: 100 }),
  body('branchName').optional().trim().isLength({ max: 100 }),
  body('upiId').optional().trim().matches(/^[\w.-]+@[\w.-]+$/)
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

    const {
      type,
      nickname,
      paypalEmail,
      accountHolderName,
      accountNumber,
      ifscCode,
      bankName,
      branchName,
      upiId
    } = req.body;

    // Validate required fields based on type
    if (type === 'PAYPAL' && !paypalEmail) {
      return res.status(400).json({
        success: false,
        error: 'PayPal email is required for PayPal payment method'
      });
    }

    if (type === 'BANK_TRANSFER') {
      if (!accountHolderName || !accountNumber || !ifscCode || !bankName) {
        return res.status(400).json({
          success: false,
          error: 'Account holder name, account number, IFSC code, and bank name are required for bank transfer'
        });
      }
    }

    if (type === 'UPI' && !upiId) {
      return res.status(400).json({
        success: false,
        error: 'UPI ID is required for UPI payment method'
      });
    }

    // Check if this is the first payment method
    const existingMethods = await req.prisma.paymentMethod.count({
      where: { userId: req.user.id }
    });

    const isDefault = existingMethods === 0;

    const paymentMethod = await req.prisma.paymentMethod.create({
      data: {
        userId: req.user.id,
        type,
        nickname,
        isDefault,
        paypalEmail,
        accountHolderName,
        accountNumber,
        ifscCode,
        bankName,
        branchName,
        upiId
      }
    });

    logger.info(`Payment method added by user ${req.user.id}: ${type}`);

    res.status(201).json({
      success: true,
      data: { paymentMethod },
      message: 'Payment method added successfully'
    });

  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/withdrawals/payment-methods/:id
// @desc    Update payment method
// @access  Private
router.put('/payment-methods/:id', [
  auth,
  body('nickname').optional().trim().isLength({ max: 100 })
], async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nickname } = req.body;

    // Verify ownership
    const existingMethod = await req.prisma.paymentMethod.findUnique({
      where: { id }
    });

    if (!existingMethod) {
      return res.status(404).json({
        success: false,
        error: 'Payment method not found'
      });
    }

    if (existingMethod.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to update this payment method'
      });
    }

    const paymentMethod = await req.prisma.paymentMethod.update({
      where: { id },
      data: { nickname }
    });

    res.json({
      success: true,
      data: { paymentMethod },
      message: 'Payment method updated successfully'
    });

  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/withdrawals/payment-methods/:id/set-default
// @desc    Set payment method as default
// @access  Private
router.put('/payment-methods/:id/set-default', [
  auth
], async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verify ownership
    const existingMethod = await req.prisma.paymentMethod.findUnique({
      where: { id }
    });

    if (!existingMethod) {
      return res.status(404).json({
        success: false,
        error: 'Payment method not found'
      });
    }

    if (existingMethod.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to modify this payment method'
      });
    }

    // Unset all other default methods and set this one as default
    await req.prisma.$transaction([
      req.prisma.paymentMethod.updateMany({
        where: { userId: req.user.id },
        data: { isDefault: false }
      }),
      req.prisma.paymentMethod.update({
        where: { id },
        data: { isDefault: true }
      })
    ]);

    const paymentMethod = await req.prisma.paymentMethod.findUnique({
      where: { id }
    });

    res.json({
      success: true,
      data: { paymentMethod },
      message: 'Default payment method updated'
    });

  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/withdrawals/payment-methods/:id
// @desc    Delete payment method
// @access  Private
router.delete('/payment-methods/:id', [
  auth
], async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verify ownership
    const existingMethod = await req.prisma.paymentMethod.findUnique({
      where: { id }
    });

    if (!existingMethod) {
      return res.status(404).json({
        success: false,
        error: 'Payment method not found'
      });
    }

    if (existingMethod.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to delete this payment method'
      });
    }

    // Check if there are pending withdrawals using this method
    const pendingWithdrawals = await req.prisma.withdrawalRequest.count({
      where: {
        paymentMethodId: id,
        status: { in: ['PENDING', 'APPROVED', 'PROCESSING'] }
      }
    });

    if (pendingWithdrawals > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete payment method with pending withdrawals'
      });
    }

    await req.prisma.paymentMethod.delete({
      where: { id }
    });

    logger.info(`Payment method deleted by user ${req.user.id}: ${id}`);

    res.json({
      success: true,
      message: 'Payment method deleted successfully'
    });

  } catch (error) {
    next(error);
  }
});

// @route   POST /api/withdrawals/request
// @desc    Request a withdrawal
// @access  Private (Providers only)
router.post('/request', [
  auth,
  requireRole(['PROVIDER', 'ADMIN', 'SUPER_ADMIN']),
  body('amountTokens').isInt({ min: 100 }).withMessage('Minimum withdrawal is 100 tokens'),
  body('paymentMethodId').isUUID().withMessage('Valid payment method required'),
  body('providerNotes').optional().trim().isLength({ max: 500 })
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

    const { amountTokens, paymentMethodId, providerNotes } = req.body;

    // Verify payment method ownership
    const paymentMethod = await req.prisma.paymentMethod.findUnique({
      where: { id: paymentMethodId }
    });

    if (!paymentMethod || paymentMethod.userId !== req.user.id) {
      return res.status(400).json({
        success: false,
        error: 'Invalid payment method'
      });
    }

    // Get user's wallet
    const wallet = await req.prisma.tokenWallet.findUnique({
      where: { userId: req.user.id }
    });

    if (!wallet || wallet.balance < amountTokens) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient token balance'
      });
    }

    // Calculate amounts (1 token = 100 INR, 5% platform fee)
    const amountInr = amountTokens * 100;
    const processingFee = Math.floor(amountInr * 0.05); // 5% fee
    const netAmount = amountInr - processingFee;

    // Create withdrawal request and hold tokens in transaction
    const [withdrawalRequest] = await req.prisma.$transaction([
      req.prisma.withdrawalRequest.create({
        data: {
          userId: req.user.id,
          amountTokens,
          amountInr,
          processingFee,
          netAmount,
          paymentMethodId,
          providerNotes
        },
        include: {
          paymentMethod: true
        }
      }),
      // Deduct tokens from wallet
      req.prisma.tokenWallet.update({
        where: { userId: req.user.id },
        data: {
          balance: { decrement: amountTokens }
        }
      }),
      // Create token transaction record
      req.prisma.tokenTransaction.create({
        data: {
          userId: req.user.id,
          type: 'WITHDRAWAL',
          amount: amountTokens,
          valueInr: amountInr,
          status: 'PENDING'
        }
      })
    ]);

    logger.info(`Withdrawal request #${withdrawalRequest.requestNumber} created by user ${req.user.id}: ${amountTokens} tokens`);

    res.status(201).json({
      success: true,
      data: { withdrawalRequest },
      message: `Withdrawal request #${withdrawalRequest.requestNumber} submitted successfully. Tokens have been deducted and will be processed within 3-5 business days.`
    });

  } catch (error) {
    next(error);
  }
});

// @route   GET /api/withdrawals/my-requests
// @desc    Get user's withdrawal requests
// @access  Private
router.get('/my-requests', [
  auth,
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['PENDING', 'APPROVED', 'PROCESSING', 'COMPLETED', 'REJECTED', 'CANCELLED'])
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

    const { page = 1, limit = 20, status } = req.query;
    const skip = (page - 1) * limit;

    const whereClause = { userId: req.user.id };
    if (status) {
      whereClause.status = status;
    }

    const [requests, total] = await Promise.all([
      req.prisma.withdrawalRequest.findMany({
        where: whereClause,
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          paymentMethod: {
            select: {
              type: true,
              nickname: true,
              paypalEmail: true,
              accountNumber: true,
              bankName: true,
              upiId: true
            }
          },
          approvedByUser: {
            select: {
              id: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        }
      }),
      req.prisma.withdrawalRequest.count({ where: whereClause })
    ]);

    res.json({
      success: true,
      data: {
        requests,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/withdrawals/:id/cancel
// @desc    Cancel a pending withdrawal request
// @access  Private
router.put('/:id/cancel', [
  auth
], async (req, res, next) => {
  try {
    const { id } = req.params;

    const withdrawalRequest = await req.prisma.withdrawalRequest.findUnique({
      where: { id }
    });

    if (!withdrawalRequest) {
      return res.status(404).json({
        success: false,
        error: 'Withdrawal request not found'
      });
    }

    if (withdrawalRequest.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to cancel this request'
      });
    }

    if (withdrawalRequest.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        error: 'Only pending requests can be cancelled'
      });
    }

    // Refund tokens and update status
    await req.prisma.$transaction([
      req.prisma.withdrawalRequest.update({
        where: { id },
        data: { status: 'CANCELLED' }
      }),
      req.prisma.tokenWallet.update({
        where: { userId: req.user.id },
        data: {
          balance: { increment: withdrawalRequest.amountTokens }
        }
      }),
      req.prisma.tokenTransaction.create({
        data: {
          userId: req.user.id,
          type: 'REFUND',
          amount: withdrawalRequest.amountTokens,
          valueInr: withdrawalRequest.amountInr,
          status: 'COMPLETED'
        }
      })
    ]);

    logger.info(`Withdrawal request #${withdrawalRequest.requestNumber} cancelled by user ${req.user.id}`);

    res.json({
      success: true,
      message: 'Withdrawal request cancelled and tokens refunded'
    });

  } catch (error) {
    next(error);
  }
});

// ============================================
// ADMIN ENDPOINTS
// ============================================

// @route   GET /api/withdrawals/admin/all
// @desc    Get all withdrawal requests (Admin)
// @access  Private (Admin only)
router.get('/admin/all', [
  auth,
  requireRole(['MANAGER', 'ADMIN', 'SUPER_ADMIN']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['PENDING', 'APPROVED', 'PROCESSING', 'COMPLETED', 'REJECTED', 'CANCELLED'])
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

    const { page = 1, limit = 20, status } = req.query;
    const skip = (page - 1) * limit;

    const whereClause = {};
    if (status) {
      whereClause.status = status;
    }

    const [requests, total] = await Promise.all([
      req.prisma.withdrawalRequest.findMany({
        where: whereClause,
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          },
          paymentMethod: {
            select: {
              type: true,
              nickname: true,
              paypalEmail: true,
              accountHolderName: true,
              accountNumber: true,
              ifscCode: true,
              bankName: true,
              branchName: true,
              upiId: true
            }
          },
          approvedByUser: {
            select: {
              id: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        }
      }),
      req.prisma.withdrawalRequest.count({ where: whereClause })
    ]);

    res.json({
      success: true,
      data: {
        requests,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/withdrawals/admin/:id/approve
// @desc    Approve a withdrawal request
// @access  Private (Admin only)
router.put('/admin/:id/approve', [
  auth,
  requireRole(['MANAGER', 'ADMIN', 'SUPER_ADMIN']),
  body('adminNotes').optional().trim().isLength({ max: 1000 })
], async (req, res, next) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;

    const withdrawalRequest = await req.prisma.withdrawalRequest.findUnique({
      where: { id }
    });

    if (!withdrawalRequest) {
      return res.status(404).json({
        success: false,
        error: 'Withdrawal request not found'
      });
    }

    if (withdrawalRequest.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        error: 'Only pending requests can be approved'
      });
    }

    const updatedRequest = await req.prisma.withdrawalRequest.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedBy: req.user.id,
        approvedAt: new Date(),
        adminNotes
      },
      include: {
        user: {
          select: {
            email: true,
            profile: { select: { firstName: true } }
          }
        },
        paymentMethod: true
      }
    });

    logger.info(`Withdrawal request #${updatedRequest.requestNumber} approved by ${req.user.id}`);

    res.json({
      success: true,
      data: { withdrawalRequest: updatedRequest },
      message: 'Withdrawal request approved'
    });

  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/withdrawals/admin/:id/reject
// @desc    Reject a withdrawal request
// @access  Private (Admin only)
router.put('/admin/:id/reject', [
  auth,
  requireRole(['MANAGER', 'ADMIN', 'SUPER_ADMIN']),
  body('rejectionReason').trim().notEmpty().withMessage('Rejection reason is required')
    .isLength({ max: 1000 }),
  body('adminNotes').optional().trim().isLength({ max: 1000 })
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

    const { id } = req.params;
    const { rejectionReason, adminNotes } = req.body;

    const withdrawalRequest = await req.prisma.withdrawalRequest.findUnique({
      where: { id }
    });

    if (!withdrawalRequest) {
      return res.status(404).json({
        success: false,
        error: 'Withdrawal request not found'
      });
    }

    if (withdrawalRequest.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        error: 'Only pending requests can be rejected'
      });
    }

    // Refund tokens and reject
    await req.prisma.$transaction([
      req.prisma.withdrawalRequest.update({
        where: { id },
        data: {
          status: 'REJECTED',
          rejectionReason,
          adminNotes,
          approvedBy: req.user.id,
          approvedAt: new Date()
        }
      }),
      req.prisma.tokenWallet.update({
        where: { userId: withdrawalRequest.userId },
        data: {
          balance: { increment: withdrawalRequest.amountTokens }
        }
      }),
      req.prisma.tokenTransaction.create({
        data: {
          userId: withdrawalRequest.userId,
          type: 'REFUND',
          amount: withdrawalRequest.amountTokens,
          valueInr: withdrawalRequest.amountInr,
          status: 'COMPLETED'
        }
      })
    ]);

    logger.info(`Withdrawal request #${withdrawalRequest.requestNumber} rejected by ${req.user.id}: ${rejectionReason}`);

    res.json({
      success: true,
      message: 'Withdrawal request rejected and tokens refunded'
    });

  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/withdrawals/admin/:id/complete
// @desc    Mark withdrawal as completed
// @access  Private (Admin only)
router.put('/admin/:id/complete', [
  auth,
  requireRole(['MANAGER', 'ADMIN', 'SUPER_ADMIN']),
  body('transactionId').trim().notEmpty().withMessage('Transaction ID is required'),
  body('adminNotes').optional().trim().isLength({ max: 1000 })
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

    const { id } = req.params;
    const { transactionId, adminNotes } = req.body;

    const withdrawalRequest = await req.prisma.withdrawalRequest.findUnique({
      where: { id }
    });

    if (!withdrawalRequest) {
      return res.status(404).json({
        success: false,
        error: 'Withdrawal request not found'
      });
    }

    if (withdrawalRequest.status !== 'APPROVED') {
      return res.status(400).json({
        success: false,
        error: 'Only approved requests can be marked as completed'
      });
    }

    const updatedRequest = await req.prisma.withdrawalRequest.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        transactionId,
        processedAt: new Date(),
        adminNotes: adminNotes || withdrawalRequest.adminNotes
      }
    });

    logger.info(`Withdrawal request #${updatedRequest.requestNumber} completed by ${req.user.id}`);

    res.json({
      success: true,
      data: { withdrawalRequest: updatedRequest },
      message: 'Withdrawal marked as completed'
    });

  } catch (error) {
    next(error);
  }
});

// @route   GET /api/withdrawals/admin/statistics
// @desc    Get withdrawal statistics
// @access  Private (Admin only)
router.get('/admin/statistics', [
  auth,
  requireRole(['MANAGER', 'ADMIN', 'SUPER_ADMIN'])
], async (req, res, next) => {
  try {
    const [
      total,
      byStatus,
      totalTokensWithdrawn,
      totalFeesCollected,
      pendingAmount
    ] = await Promise.all([
      req.prisma.withdrawalRequest.count(),
      req.prisma.withdrawalRequest.groupBy({
        by: ['status'],
        _count: true,
        _sum: {
          amountTokens: true,
          processingFee: true
        }
      }),
      req.prisma.withdrawalRequest.aggregate({
        where: { status: 'COMPLETED' },
        _sum: {
          amountTokens: true,
          amountInr: true
        }
      }),
      req.prisma.withdrawalRequest.aggregate({
        where: { status: 'COMPLETED' },
        _sum: {
          processingFee: true
        }
      }),
      req.prisma.withdrawalRequest.aggregate({
        where: { status: { in: ['PENDING', 'APPROVED', 'PROCESSING'] } },
        _sum: {
          netAmount: true
        }
      })
    ]);

    const formatGroupBy = (data) => {
      return data.reduce((acc, item) => {
        acc[item.status] = {
          count: item._count,
          totalTokens: item._sum.amountTokens || 0,
          totalFees: item._sum.processingFee || 0
        };
        return acc;
      }, {});
    };

    res.json({
      success: true,
      data: {
        statistics: {
          total,
          byStatus: formatGroupBy(byStatus),
          totalTokensWithdrawn: totalTokensWithdrawn._sum.amountTokens || 0,
          totalAmountPaidInr: totalTokensWithdrawn._sum.amountInr || 0,
          totalFeesCollected: totalFeesCollected._sum.processingFee || 0,
          pendingAmountInr: pendingAmount._sum.netAmount || 0
        }
      }
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
