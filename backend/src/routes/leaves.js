const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { auth, authorize } = require('../middleware/auth');
const logger = require('../utils/logger');
const leaveService = require('../services/leaveService');

const router = express.Router();

// @route   GET /api/leaves/types
// @desc    Get all active leave types
// @access  Private
router.get('/types', [
  auth
], async (req, res, next) => {
  try {
    const leaveTypes = await leaveService.getLeaveTypes();

    res.json({
      success: true,
      data: leaveTypes
    });

  } catch (error) {
    logger.error('Error getting leave types:', error);
    next(error);
  }
});

// @route   POST /api/leaves/requests
// @desc    Create a new leave request
// @access  Private (Employee, Manager, Admin)
router.post('/requests', [
  auth,
  authorize('EMPLOYEE', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'),
  body('leaveTypeId').notEmpty().isString().withMessage('Leave type is required'),
  body('startDate').notEmpty().isISO8601().withMessage('Valid start date is required'),
  body('endDate').notEmpty().isISO8601().withMessage('Valid end date is required'),
  body('reason').notEmpty().isString().withMessage('Reason is required'),
  body('notes').optional().isString(),
  body('attachments').optional().isArray()
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

    const leaveRequest = await leaveService.createLeaveRequest(req.user.id, req.body);

    res.status(201).json({
      success: true,
      data: leaveRequest,
      message: 'Leave request submitted successfully'
    });

  } catch (error) {
    logger.error('Error creating leave request:', error);

    if (error.message.includes('overlapping') || error.message.includes('already have')) {
      return res.status(409).json({
        success: false,
        error: error.message
      });
    }

    if (error.message.includes('before')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    next(error);
  }
});

// @route   GET /api/leaves/my-requests
// @desc    Get leave requests for authenticated user
// @access  Private
router.get('/my-requests', [
  auth,
  query('status').optional().isString()
], async (req, res, next) => {
  try {
    const { status } = req.query;
    const leaveRequests = await leaveService.getUserLeaveRequests(req.user.id, status || null);

    res.json({
      success: true,
      data: leaveRequests
    });

  } catch (error) {
    logger.error('Error getting user leave requests:', error);
    next(error);
  }
});

// @route   GET /api/leaves/requests
// @desc    Get all leave requests (for managers/admins)
// @access  Private (Manager, Admin, Super Admin)
router.get('/requests', [
  auth,
  authorize('MANAGER', 'ADMIN', 'SUPER_ADMIN'),
  query('status').optional().isString(),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('userId').optional().isString(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
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

    const filters = {
      status: req.query.status,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      userId: req.query.userId,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20
    };

    const result = await leaveService.getAllLeaveRequests(filters);

    res.json({
      success: true,
      data: result.leaveRequests,
      pagination: result.pagination
    });

  } catch (error) {
    logger.error('Error getting all leave requests:', error);
    next(error);
  }
});

// @route   GET /api/leaves/requests/:id
// @desc    Get a single leave request by ID
// @access  Private
router.get('/requests/:id', [
  auth
], async (req, res, next) => {
  try {
    const leaveRequest = await leaveService.getLeaveRequestById(req.params.id);

    if (!leaveRequest) {
      return res.status(404).json({
        success: false,
        error: 'Leave request not found'
      });
    }

    // Check if user has access to this leave request
    const isOwner = leaveRequest.userId === req.user.id;
    const isManagerOrAdmin = ['MANAGER', 'ADMIN', 'SUPER_ADMIN'].includes(req.user.role);

    if (!isOwner && !isManagerOrAdmin) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to view this leave request'
      });
    }

    res.json({
      success: true,
      data: leaveRequest
    });

  } catch (error) {
    logger.error('Error getting leave request by ID:', error);
    next(error);
  }
});

// @route   PUT /api/leaves/requests/:id/approve
// @desc    Approve a leave request
// @access  Private (Manager, Admin, Super Admin)
router.put('/requests/:id/approve', [
  auth,
  authorize('MANAGER', 'ADMIN', 'SUPER_ADMIN'),
  body('adminNotes').optional().isString()
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

    const { adminNotes } = req.body;
    const leaveRequest = await leaveService.approveLeaveRequest(
      req.params.id,
      req.user.id,
      adminNotes
    );

    res.json({
      success: true,
      data: leaveRequest,
      message: 'Leave request approved successfully'
    });

  } catch (error) {
    logger.error('Error approving leave request:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }

    if (error.message.includes('pending')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    next(error);
  }
});

// @route   PUT /api/leaves/requests/:id/reject
// @desc    Reject a leave request
// @access  Private (Manager, Admin, Super Admin)
router.put('/requests/:id/reject', [
  auth,
  authorize('MANAGER', 'ADMIN', 'SUPER_ADMIN'),
  body('rejectionReason').notEmpty().isString().withMessage('Rejection reason is required'),
  body('adminNotes').optional().isString()
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

    const { rejectionReason, adminNotes } = req.body;
    const leaveRequest = await leaveService.rejectLeaveRequest(
      req.params.id,
      req.user.id,
      rejectionReason,
      adminNotes
    );

    res.json({
      success: true,
      data: leaveRequest,
      message: 'Leave request rejected'
    });

  } catch (error) {
    logger.error('Error rejecting leave request:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }

    if (error.message.includes('pending')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    next(error);
  }
});

// @route   PUT /api/leaves/requests/:id/cancel
// @desc    Cancel a leave request (by employee)
// @access  Private
router.put('/requests/:id/cancel', [
  auth
], async (req, res, next) => {
  try {
    const leaveRequest = await leaveService.cancelLeaveRequest(req.params.id, req.user.id);

    res.json({
      success: true,
      data: leaveRequest,
      message: 'Leave request cancelled successfully'
    });

  } catch (error) {
    logger.error('Error cancelling leave request:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }

    if (error.message.includes('only') || error.message.includes('cannot')) {
      return res.status(403).json({
        success: false,
        error: error.message
      });
    }

    next(error);
  }
});

// @route   GET /api/leaves/my-statistics
// @desc    Get leave statistics for authenticated user
// @access  Private
router.get('/my-statistics', [
  auth,
  query('year').optional().isInt({ min: 2020, max: 2100 })
], async (req, res, next) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const statistics = await leaveService.getUserLeaveStatistics(req.user.id, year);

    res.json({
      success: true,
      data: statistics
    });

  } catch (error) {
    logger.error('Error getting user leave statistics:', error);
    next(error);
  }
});

// @route   GET /api/leaves/calendar
// @desc    Get organization-wide leave calendar
// @access  Private (All authenticated users can view)
router.get('/calendar', [
  auth,
  query('startDate').notEmpty().isISO8601().withMessage('Valid start date is required'),
  query('endDate').notEmpty().isISO8601().withMessage('Valid end date is required')
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

    const { startDate, endDate } = req.query;
    const leaveCalendar = await leaveService.getOrganizationLeaveCalendar(startDate, endDate);

    res.json({
      success: true,
      data: leaveCalendar
    });

  } catch (error) {
    logger.error('Error getting organization leave calendar:', error);
    next(error);
  }
});

module.exports = router;
