const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { auth, requireVerification } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Helper function to update provider rating statistics
const updateProviderRating = async (prisma, providerId) => {
  // Get all ratings for this provider
  const ratings = await prisma.rating.findMany({
    where: { providerId },
    select: { rating: true }
  });

  if (ratings.length === 0) {
    // Reset to 0 if no ratings
    await prisma.userProfile.update({
      where: { userId: providerId },
      data: {
        averageRating: 0,
        totalRatings: 0,
        ratingBreakdown: JSON.stringify({})
      }
    });
    return;
  }

  // Calculate statistics
  const totalRatings = ratings.length;
  const sumRatings = ratings.reduce((sum, r) => sum + r.rating, 0);
  const averageRating = sumRatings / totalRatings;

  // Calculate breakdown
  const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  ratings.forEach(r => {
    breakdown[r.rating]++;
  });

  // Update provider profile
  await prisma.userProfile.update({
    where: { userId: providerId },
    data: {
      averageRating: parseFloat(averageRating.toFixed(2)),
      totalRatings,
      ratingBreakdown: JSON.stringify(breakdown)
    }
  });
};

// @route   POST /api/ratings
// @desc    Submit a rating for a completed booking
// @access  Private (Seeker only)
router.post('/', [
  auth,
  requireVerification,
  body('bookingId').isUUID().withMessage('Valid booking ID required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('review').optional().trim().isLength({ max: 500 }).withMessage('Review must be 500 characters or less'),
  body('anonymous').optional().isBoolean()
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

    const { bookingId, rating, review, anonymous = false } = req.body;

    // Get booking and verify
    const booking = await req.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        rating: true,
        provider: {
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
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    // Verify user is the seeker
    if (booking.seekerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Only the seeker can rate this booking'
      });
    }

    // Check booking is completed
    if (booking.status !== 'COMPLETED') {
      return res.status(400).json({
        success: false,
        error: 'Can only rate completed bookings'
      });
    }

    // Check if already rated
    if (booking.rating) {
      return res.status(400).json({
        success: false,
        error: 'This booking has already been rated'
      });
    }

    // Create rating
    const newRating = await req.prisma.$transaction(async (prisma) => {
      const created = await prisma.rating.create({
        data: {
          bookingId,
          seekerId: req.user.id,
          providerId: booking.providerId,
          rating,
          review: review || null,
          anonymous
        },
        include: {
          provider: {
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
      });

      // Update provider rating statistics
      await updateProviderRating(prisma, booking.providerId);

      return created;
    });

    logger.info(`Rating created for booking ${bookingId} by user ${req.user.id}: ${rating} stars`);

    res.status(201).json({
      success: true,
      data: { rating: newRating },
      message: 'Rating submitted successfully'
    });

  } catch (error) {
    next(error);
  }
});

// @route   GET /api/ratings/provider/:providerId
// @desc    Get ratings for a specific provider
// @access  Public (for verified users)
router.get('/provider/:providerId', [
  auth,
  requireVerification,
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('rating').optional().isInt({ min: 1, max: 5 })
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

    const { providerId } = req.params;
    const { page = 1, limit = 20, rating: ratingFilter } = req.query;
    const skip = (page - 1) * limit;

    const whereClause = {
      providerId,
      isFlagged: false
    };

    if (ratingFilter) {
      whereClause.rating = parseInt(ratingFilter);
    }

    const [ratings, total, providerProfile] = await Promise.all([
      req.prisma.rating.findMany({
        where: whereClause,
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          rating: true,
          review: true,
          anonymous: true,
          response: true,
          respondedAt: true,
          createdAt: true,
          seeker: {
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
      req.prisma.rating.count({ where: whereClause }),
      req.prisma.userProfile.findUnique({
        where: { userId: providerId },
        select: {
          averageRating: true,
          totalRatings: true,
          ratingBreakdown: true
        }
      })
    ]);

    // Hide seeker identity for anonymous ratings
    const processedRatings = ratings.map(r => ({
      ...r,
      seeker: r.anonymous ? null : r.seeker
    }));

    res.json({
      success: true,
      data: {
        ratings: processedRatings,
        statistics: {
          averageRating: providerProfile?.averageRating || 0,
          totalRatings: providerProfile?.totalRatings || 0,
          breakdown: providerProfile?.ratingBreakdown
            ? JSON.parse(providerProfile.ratingBreakdown)
            : {}
        },
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

// @route   PUT /api/ratings/:id/response
// @desc    Provider responds to a rating
// @access  Private (Provider only)
router.put('/:id/response', [
  auth,
  requireVerification,
  body('response').trim().notEmpty().withMessage('Response is required')
    .isLength({ max: 500 }).withMessage('Response must be 500 characters or less')
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
    const { response } = req.body;

    // Get rating
    const rating = await req.prisma.rating.findUnique({
      where: { id }
    });

    if (!rating) {
      return res.status(404).json({
        success: false,
        error: 'Rating not found'
      });
    }

    // Verify user is the provider
    if (rating.providerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Only the provider can respond to this rating'
      });
    }

    // Update rating with response
    const updatedRating = await req.prisma.rating.update({
      where: { id },
      data: {
        response,
        respondedAt: new Date()
      }
    });

    logger.info(`Provider ${req.user.id} responded to rating ${id}`);

    res.json({
      success: true,
      data: { rating: updatedRating },
      message: 'Response added successfully'
    });

  } catch (error) {
    next(error);
  }
});

// @route   GET /api/ratings/my-ratings
// @desc    Get ratings given by the current user
// @access  Private
router.get('/my-ratings', [
  auth,
  requireVerification,
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

    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const [ratings, total] = await Promise.all([
      req.prisma.rating.findMany({
        where: { seekerId: req.user.id },
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          provider: {
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
          booking: {
            select: {
              id: true,
              scheduledAt: true,
              serviceType: true
            }
          }
        }
      }),
      req.prisma.rating.count({ where: { seekerId: req.user.id } })
    ]);

    res.json({
      success: true,
      data: {
        ratings,
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

// @route   GET /api/ratings/my-received
// @desc    Get ratings received by the current provider
// @access  Private (Provider only)
router.get('/my-received', [
  auth,
  requireVerification,
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

    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const [ratings, total, profile] = await Promise.all([
      req.prisma.rating.findMany({
        where: { providerId: req.user.id },
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          seeker: {
            select: {
              id: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          },
          booking: {
            select: {
              id: true,
              scheduledAt: true,
              serviceType: true
            }
          }
        }
      }),
      req.prisma.rating.count({ where: { providerId: req.user.id } }),
      req.prisma.userProfile.findUnique({
        where: { userId: req.user.id },
        select: {
          averageRating: true,
          totalRatings: true,
          ratingBreakdown: true
        }
      })
    ]);

    // Hide seeker identity for anonymous ratings
    const processedRatings = ratings.map(r => ({
      ...r,
      seeker: r.anonymous ? null : r.seeker
    }));

    res.json({
      success: true,
      data: {
        ratings: processedRatings,
        statistics: {
          averageRating: profile?.averageRating || 0,
          totalRatings: profile?.totalRatings || 0,
          breakdown: profile?.ratingBreakdown
            ? JSON.parse(profile.ratingBreakdown)
            : {}
        },
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

// @route   DELETE /api/ratings/:id
// @desc    Delete a rating (Seeker can delete their own within 24 hours)
// @access  Private
router.delete('/:id', [
  auth,
  requireVerification
], async (req, res, next) => {
  try {
    const { id } = req.params;

    const rating = await req.prisma.rating.findUnique({
      where: { id }
    });

    if (!rating) {
      return res.status(404).json({
        success: false,
        error: 'Rating not found'
      });
    }

    // Verify user is the seeker
    if (rating.seekerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'You can only delete your own ratings'
      });
    }

    // Check if rating is within 24 hours
    const hoursElapsed = (Date.now() - rating.createdAt.getTime()) / (1000 * 60 * 60);
    if (hoursElapsed > 24) {
      return res.status(400).json({
        success: false,
        error: 'Ratings can only be deleted within 24 hours of submission'
      });
    }

    // Delete rating and update provider statistics
    await req.prisma.$transaction(async (prisma) => {
      await prisma.rating.delete({ where: { id } });
      await updateProviderRating(prisma, rating.providerId);
    });

    logger.info(`Rating ${id} deleted by user ${req.user.id}`);

    res.json({
      success: true,
      message: 'Rating deleted successfully'
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
