const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { auth, authorize } = require('../middleware/auth');
const logger = require('../utils/logger');
const rosterService = require('../services/rosterService');

const router = express.Router();

// @route   POST /api/roster/shifts
// @desc    Create a new shift
// @access  Private (Manager, Admin, Super Admin)
router.post('/shifts', [
  auth,
  authorize('MANAGER', 'ADMIN', 'SUPER_ADMIN'),
  body('userId').notEmpty().isString().withMessage('User ID is required'),
  body('title').notEmpty().isString().withMessage('Shift title is required'),
  body('startTime').notEmpty().isISO8601().withMessage('Valid start time is required'),
  body('endTime').notEmpty().isISO8601().withMessage('Valid end time is required'),
  body('location').optional().isString(),
  body('department').optional().isString(),
  body('isRecurring').optional().isBoolean(),
  body('recurringPattern').optional().isObject(),
  body('color').optional().isString(),
  body('notes').optional().isString()
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

    const shift = await rosterService.createShift(req.body, req.user.id);

    res.status(201).json({
      success: true,
      data: shift,
      message: 'Shift created successfully'
    });

  } catch (error) {
    logger.error('Error creating shift:', error);

    if (error.message.includes('overlaps')) {
      return res.status(409).json({
        success: false,
        error: error.message
      });
    }

    next(error);
  }
});

// @route   GET /api/roster/shifts
// @desc    Get shifts for a date range
// @access  Private (All authenticated users can view)
router.get('/shifts', [
  auth,
  query('startDate').notEmpty().isISO8601().withMessage('Valid start date is required'),
  query('endDate').notEmpty().isISO8601().withMessage('Valid end date is required'),
  query('userId').optional().isString(),
  query('department').optional().isString(),
  query('location').optional().isString()
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

    const { startDate, endDate, userId, department, location } = req.query;

    const filters = {};
    if (userId) filters.userId = userId;
    if (department) filters.department = department;
    if (location) filters.location = location;

    const shifts = await rosterService.getShifts(startDate, endDate, filters);

    res.json({
      success: true,
      data: shifts
    });

  } catch (error) {
    logger.error('Error getting shifts:', error);
    next(error);
  }
});

// @route   GET /api/roster/shifts/:id
// @desc    Get a single shift by ID
// @access  Private
router.get('/shifts/:id', [
  auth
], async (req, res, next) => {
  try {
    const shift = await rosterService.getShiftById(req.params.id);

    if (!shift) {
      return res.status(404).json({
        success: false,
        error: 'Shift not found'
      });
    }

    res.json({
      success: true,
      data: shift
    });

  } catch (error) {
    logger.error('Error getting shift by ID:', error);
    next(error);
  }
});

// @route   PUT /api/roster/shifts/:id
// @desc    Update a shift
// @access  Private (Manager, Admin, Super Admin)
router.put('/shifts/:id', [
  auth,
  authorize('MANAGER', 'ADMIN', 'SUPER_ADMIN'),
  body('title').optional().isString(),
  body('startTime').optional().isISO8601(),
  body('endTime').optional().isISO8601(),
  body('location').optional().isString(),
  body('department').optional().isString(),
  body('isRecurring').optional().isBoolean(),
  body('recurringPattern').optional().isObject(),
  body('color').optional().isString(),
  body('notes').optional().isString()
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

    const updatedShift = await rosterService.updateShift(req.params.id, req.body);

    res.json({
      success: true,
      data: updatedShift,
      message: 'Shift updated successfully'
    });

  } catch (error) {
    logger.error('Error updating shift:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }

    if (error.message.includes('overlaps')) {
      return res.status(409).json({
        success: false,
        error: error.message
      });
    }

    next(error);
  }
});

// @route   DELETE /api/roster/shifts/:id
// @desc    Delete a shift
// @access  Private (Manager, Admin, Super Admin)
router.delete('/shifts/:id', [
  auth,
  authorize('MANAGER', 'ADMIN', 'SUPER_ADMIN')
], async (req, res, next) => {
  try {
    const result = await rosterService.deleteShift(req.params.id);

    res.json({
      success: true,
      message: result.message
    });

  } catch (error) {
    logger.error('Error deleting shift:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }

    next(error);
  }
});

// @route   GET /api/roster/my-shifts
// @desc    Get shifts for the authenticated user
// @access  Private
router.get('/my-shifts', [
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
    const shifts = await rosterService.getUserShifts(req.user.id, startDate, endDate);

    res.json({
      success: true,
      data: shifts
    });

  } catch (error) {
    logger.error('Error getting user shifts:', error);
    next(error);
  }
});

// @route   GET /api/roster/organization
// @desc    Get organization-wide roster
// @access  Private (Manager, Admin, Super Admin)
router.get('/organization', [
  auth,
  authorize('MANAGER', 'ADMIN', 'SUPER_ADMIN'),
  query('startDate').notEmpty().isISO8601().withMessage('Valid start date is required'),
  query('endDate').notEmpty().isISO8601().withMessage('Valid end date is required'),
  query('department').optional().isString(),
  query('location').optional().isString(),
  query('role').optional().isString()
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

    const { startDate, endDate, department, location, role } = req.query;

    const filters = {};
    if (department) filters.department = department;
    if (location) filters.location = location;
    if (role) filters.role = role;

    const roster = await rosterService.getOrganizationRoster(startDate, endDate, filters);

    res.json({
      success: true,
      data: roster
    });

  } catch (error) {
    logger.error('Error getting organization roster:', error);
    next(error);
  }
});

// @route   GET /api/roster/statistics
// @desc    Get roster statistics
// @access  Private (Manager, Admin, Super Admin)
router.get('/statistics', [
  auth,
  authorize('MANAGER', 'ADMIN', 'SUPER_ADMIN'),
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
    const statistics = await rosterService.getRosterStatistics(startDate, endDate);

    res.json({
      success: true,
      data: statistics
    });

  } catch (error) {
    logger.error('Error getting roster statistics:', error);
    next(error);
  }
});

// @route   GET /api/roster/available-employees
// @desc    Get available employees for a time period
// @access  Private (Manager, Admin, Super Admin)
router.get('/available-employees', [
  auth,
  authorize('MANAGER', 'ADMIN', 'SUPER_ADMIN'),
  query('startDate').notEmpty().isISO8601().withMessage('Valid start date is required'),
  query('endDate').notEmpty().isISO8601().withMessage('Valid end date is required'),
  query('role').optional().isString()
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

    const { startDate, endDate, role } = req.query;
    const availabilityData = await rosterService.getAvailableEmployees(startDate, endDate, role || null);

    res.json({
      success: true,
      data: availabilityData
    });

  } catch (error) {
    logger.error('Error getting available employees:', error);
    next(error);
  }
});

module.exports = router;
