const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { auth, authorize, requireVerification } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Template variable replacement helper
const replaceTemplateVariables = (templateText, variables) => {
  let processedText = templateText;

  if (variables && typeof variables === 'object') {
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      processedText = processedText.replace(regex, variables[key] || '');
    });
  }

  return processedText;
};

// @route   GET /api/templates
// @desc    Get all active chat templates
// @access  Private
router.get('/', [
  auth,
  requireVerification,
  query('category').optional().isIn(['BOOKING_COORDINATION', 'SERVICE_DISCUSSION', 'LOGISTICS', 'SUPPORT', 'SYSTEM'])
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

    const { category } = req.query;

    const whereClause = {
      isActive: true,
      // Don't show SYSTEM templates to regular users
      category: category || { not: 'SYSTEM' }
    };

    const templates = await req.prisma.chatTemplate.findMany({
      where: whereClause,
      select: {
        id: true,
        category: true,
        templateText: true,
        description: true,
        variables: true,
        usageCount: true
      },
      orderBy: [
        { category: 'asc' },
        { usageCount: 'desc' }
      ]
    });

    res.json({
      success: true,
      data: { templates }
    });

  } catch (error) {
    next(error);
  }
});

// @route   GET /api/templates/categories
// @desc    Get templates grouped by category
// @access  Private
router.get('/categories', [
  auth,
  requireVerification
], async (req, res, next) => {
  try {
    const templates = await req.prisma.chatTemplate.findMany({
      where: {
        isActive: true,
        category: { not: 'SYSTEM' }
      },
      select: {
        id: true,
        category: true,
        templateText: true,
        description: true,
        variables: true,
        usageCount: true
      },
      orderBy: [
        { category: 'asc' },
        { usageCount: 'desc' }
      ]
    });

    // Group by category
    const grouped = templates.reduce((acc, template) => {
      if (!acc[template.category]) {
        acc[template.category] = [];
      }
      acc[template.category].push(template);
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        categories: grouped,
        totalTemplates: templates.length
      }
    });

  } catch (error) {
    next(error);
  }
});

// @route   POST /api/templates/send
// @desc    Send a template message in a booking chat
// @access  Private
router.post('/send', [
  auth,
  requireVerification,
  body('bookingId').isUUID().withMessage('Valid booking ID required'),
  body('templateId').isUUID().withMessage('Valid template ID required'),
  body('variables').optional().isObject().withMessage('Variables must be an object')
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

    const { bookingId, templateId, variables } = req.body;

    // Verify booking exists and user has access
    const booking = await req.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        seeker: true,
        provider: true
      }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    // Check if user is part of this booking
    if (req.user.id !== booking.seekerId && req.user.id !== booking.providerId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Get template
    const template = await req.prisma.chatTemplate.findUnique({
      where: { id: templateId }
    });

    if (!template || !template.isActive) {
      return res.status(404).json({
        success: false,
        error: 'Template not found or inactive'
      });
    }

    // Validate required variables
    if (template.variables && template.variables.length > 0) {
      const missingVars = template.variables.filter(varName => !variables || !variables[varName]);
      if (missingVars.length > 0) {
        return res.status(400).json({
          success: false,
          error: `Missing required variables: ${missingVars.join(', ')}`
        });
      }
    }

    // Process template with variables
    const processedMessage = replaceTemplateVariables(template.templateText, variables);

    // Determine receiver
    const receiverId = req.user.id === booking.seekerId ? booking.providerId : booking.seekerId;

    // Create message
    const message = await req.prisma.$transaction(async (prisma) => {
      // Increment template usage count
      await prisma.chatTemplate.update({
        where: { id: templateId },
        data: { usageCount: { increment: 1 } }
      });

      // Create message
      const newMessage = await prisma.message.create({
        data: {
          bookingId,
          senderId: req.user.id,
          receiverId,
          content: processedMessage,
          type: 'TEMPLATE',
          templateId,
          templateVariables: variables ? JSON.stringify(variables) : null
        },
        include: {
          sender: {
            select: {
              id: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                  profilePhoto: true
                }
              }
            }
          },
          template: {
            select: {
              category: true,
              description: true
            }
          }
        }
      });

      // Update booking timestamp
      await prisma.booking.update({
        where: { id: bookingId },
        data: { updatedAt: new Date() }
      });

      return newMessage;
    });

    // Emit socket event for real-time delivery
    if (req.io) {
      req.io.to(`booking_${bookingId}`).emit('new_message', {
        id: message.id,
        content: message.content,
        senderId: message.senderId,
        sender: message.sender,
        type: 'TEMPLATE',
        template: message.template,
        createdAt: message.createdAt
      });
    }

    logger.info(`Template message sent in booking ${bookingId} by user ${req.user.id}`);

    res.status(201).json({
      success: true,
      data: {
        message: {
          id: message.id,
          content: message.content,
          senderId: message.senderId,
          sender: message.sender,
          type: 'TEMPLATE',
          template: message.template,
          createdAt: message.createdAt
        }
      }
    });

  } catch (error) {
    next(error);
  }
});

// ============================================================================
// ADMIN ENDPOINTS
// ============================================================================

// @route   GET /api/templates/admin/all
// @desc    Get all templates (including inactive) - Admin only
// @access  Private (Admin)
router.get('/admin/all', [
  auth,
  authorize('MANAGER', 'ADMIN', 'SUPER_ADMIN'),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('category').optional().isString()
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

    const { page = 1, limit = 50, category } = req.query;
    const skip = (page - 1) * limit;

    const whereClause = category ? { category } : {};

    const [templates, total] = await Promise.all([
      req.prisma.chatTemplate.findMany({
        where: whereClause,
        skip: parseInt(skip),
        take: parseInt(limit),
        include: {
          creator: {
            select: {
              profile: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        },
        orderBy: [
          { category: 'asc' },
          { usageCount: 'desc' }
        ]
      }),
      req.prisma.chatTemplate.count({ where: whereClause })
    ]);

    res.json({
      success: true,
      data: {
        templates,
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

// @route   POST /api/templates/admin
// @desc    Create new template - Admin only
// @access  Private (Admin)
router.post('/admin', [
  auth,
  authorize('ADMIN', 'SUPER_ADMIN'),
  body('category').isIn(['BOOKING_COORDINATION', 'SERVICE_DISCUSSION', 'LOGISTICS', 'SUPPORT', 'SYSTEM'])
    .withMessage('Invalid category'),
  body('templateText').trim().notEmpty().withMessage('Template text is required'),
  body('description').optional().trim(),
  body('variables').optional().isArray().withMessage('Variables must be an array')
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

    const { category, templateText, description, variables } = req.body;

    // Validate template variables format
    if (variables && variables.length > 0) {
      const invalidVars = variables.filter(v => typeof v !== 'string' || !/^[a-zA-Z0-9_]+$/.test(v));
      if (invalidVars.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Variable names must be alphanumeric with underscores only'
        });
      }

      // Check if template text contains all declared variables
      variables.forEach(varName => {
        if (!templateText.includes(`{{${varName}}}`)) {
          logger.warn(`Template variable {{${varName}}} declared but not found in template text`);
        }
      });
    }

    const template = await req.prisma.chatTemplate.create({
      data: {
        category,
        templateText,
        description,
        variables: variables || [],
        createdBy: req.user.id
      },
      include: {
        creator: {
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
    });

    logger.info(`Template created by ${req.user.email}: ${template.id}`);

    res.status(201).json({
      success: true,
      data: { template },
      message: 'Template created successfully'
    });

  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/templates/admin/:id
// @desc    Update template - Admin only
// @access  Private (Admin)
router.put('/admin/:id', [
  auth,
  authorize('ADMIN', 'SUPER_ADMIN'),
  body('category').optional().isIn(['BOOKING_COORDINATION', 'SERVICE_DISCUSSION', 'LOGISTICS', 'SUPPORT', 'SYSTEM']),
  body('templateText').optional().trim().notEmpty(),
  body('description').optional().trim(),
  body('variables').optional().isArray(),
  body('isActive').optional().isBoolean()
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
    const { category, templateText, description, variables, isActive } = req.body;

    // Check template exists
    const existingTemplate = await req.prisma.chatTemplate.findUnique({
      where: { id }
    });

    if (!existingTemplate) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }

    const updateData = {};
    if (category !== undefined) updateData.category = category;
    if (templateText !== undefined) updateData.templateText = templateText;
    if (description !== undefined) updateData.description = description;
    if (variables !== undefined) updateData.variables = variables;
    if (isActive !== undefined) updateData.isActive = isActive;

    const template = await req.prisma.chatTemplate.update({
      where: { id },
      data: updateData,
      include: {
        creator: {
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
    });

    logger.info(`Template ${id} updated by ${req.user.email}`);

    res.json({
      success: true,
      data: { template },
      message: 'Template updated successfully'
    });

  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/templates/admin/:id
// @desc    Deactivate template (soft delete) - Admin only
// @access  Private (Admin)
router.delete('/admin/:id', [
  auth,
  authorize('ADMIN', 'SUPER_ADMIN')
], async (req, res, next) => {
  try {
    const { id } = req.params;

    await req.prisma.chatTemplate.update({
      where: { id },
      data: { isActive: false }
    });

    logger.info(`Template ${id} deactivated by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Template deactivated successfully'
    });

  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }
    next(error);
  }
});

// @route   GET /api/templates/admin/stats
// @desc    Get template usage statistics - Admin only
// @access  Private (Admin)
router.get('/admin/stats', [
  auth,
  authorize('MANAGER', 'ADMIN', 'SUPER_ADMIN')
], async (req, res, next) => {
  try {
    const [
      totalTemplates,
      activeTemplates,
      categoryStats,
      topUsed
    ] = await Promise.all([
      req.prisma.chatTemplate.count(),
      req.prisma.chatTemplate.count({ where: { isActive: true } }),
      req.prisma.chatTemplate.groupBy({
        by: ['category'],
        _count: { category: true },
        where: { isActive: true }
      }),
      req.prisma.chatTemplate.findMany({
        where: { isActive: true },
        select: {
          id: true,
          category: true,
          templateText: true,
          usageCount: true
        },
        orderBy: { usageCount: 'desc' },
        take: 10
      })
    ]);

    res.json({
      success: true,
      data: {
        totalTemplates,
        activeTemplates,
        inactiveTemplates: totalTemplates - activeTemplates,
        categoryStats,
        topUsed
      }
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
