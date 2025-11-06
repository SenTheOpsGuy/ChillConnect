const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { auth, requireRole } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// @route   GET /api/help/articles
// @desc    Get published help articles
// @access  Public (but requires auth)
router.get('/articles', [
  auth,
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('category').optional().isIn([
    'GETTING_STARTED', 'ACCOUNT', 'BOOKINGS', 'PAYMENTS', 'SAFETY', 'PROVIDERS', 'FAQ'
  ]),
  query('search').optional().trim()
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

    const { page = 1, limit = 20, category, search } = req.query;
    const skip = (page - 1) * limit;

    const whereClause = { published: true };

    if (category) {
      whereClause.category = category;
    }

    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } },
        { tags: { has: search.toLowerCase() } }
      ];
    }

    const [articles, total] = await Promise.all([
      req.prisma.helpArticle.findMany({
        where: whereClause,
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: [
          { featured: 'desc' },
          { viewCount: 'desc' },
          { createdAt: 'desc' }
        ],
        select: {
          id: true,
          slug: true,
          title: true,
          excerpt: true,
          category: true,
          featured: true,
          viewCount: true,
          helpfulCount: true,
          tags: true,
          publishedAt: true,
          updatedAt: true
        }
      }),
      req.prisma.helpArticle.count({ where: whereClause })
    ]);

    res.json({
      success: true,
      data: {
        articles,
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

// @route   GET /api/help/articles/featured
// @desc    Get featured articles
// @access  Public (but requires auth)
router.get('/articles/featured', [
  auth
], async (req, res, next) => {
  try {
    const articles = await req.prisma.helpArticle.findMany({
      where: {
        published: true,
        featured: true
      },
      take: 6,
      orderBy: { viewCount: 'desc' },
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        category: true,
        viewCount: true,
        helpfulCount: true
      }
    });

    res.json({
      success: true,
      data: { articles }
    });

  } catch (error) {
    next(error);
  }
});

// @route   GET /api/help/articles/categories
// @desc    Get articles grouped by category
// @access  Public (but requires auth)
router.get('/articles/categories', [
  auth
], async (req, res, next) => {
  try {
    const categories = [
      'GETTING_STARTED',
      'ACCOUNT',
      'BOOKINGS',
      'PAYMENTS',
      'SAFETY',
      'PROVIDERS',
      'FAQ'
    ];

    const categoryData = await Promise.all(
      categories.map(async (category) => {
        const articles = await req.prisma.helpArticle.findMany({
          where: {
            published: true,
            category
          },
          take: 5,
          orderBy: { viewCount: 'desc' },
          select: {
            id: true,
            slug: true,
            title: true,
            excerpt: true
          }
        });

        const count = await req.prisma.helpArticle.count({
          where: {
            published: true,
            category
          }
        });

        return {
          category,
          count,
          articles
        };
      })
    );

    res.json({
      success: true,
      data: { categories: categoryData }
    });

  } catch (error) {
    next(error);
  }
});

// @route   GET /api/help/articles/:slug
// @desc    Get single article by slug
// @access  Public (but requires auth)
router.get('/articles/:slug', [
  auth
], async (req, res, next) => {
  try {
    const { slug } = req.params;

    // Increment view count and get article
    const article = await req.prisma.helpArticle.update({
      where: { slug },
      data: {
        viewCount: { increment: 1 }
      },
      include: {
        author: {
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

    if (!article || !article.published) {
      return res.status(404).json({
        success: false,
        error: 'Article not found'
      });
    }

    // Get related articles
    let relatedArticles = [];
    if (article.relatedArticles && article.relatedArticles.length > 0) {
      relatedArticles = await req.prisma.helpArticle.findMany({
        where: {
          id: { in: article.relatedArticles },
          published: true
        },
        select: {
          id: true,
          slug: true,
          title: true,
          excerpt: true,
          category: true
        }
      });
    } else {
      // If no related articles specified, get articles from same category
      relatedArticles = await req.prisma.helpArticle.findMany({
        where: {
          category: article.category,
          published: true,
          id: { not: article.id }
        },
        take: 3,
        orderBy: { viewCount: 'desc' },
        select: {
          id: true,
          slug: true,
          title: true,
          excerpt: true,
          category: true
        }
      });
    }

    res.json({
      success: true,
      data: {
        article,
        relatedArticles
      }
    });

  } catch (error) {
    next(error);
  }
});

// @route   POST /api/help/articles/:id/helpful
// @desc    Mark article as helpful
// @access  Private
router.post('/articles/:id/helpful', [
  auth
], async (req, res, next) => {
  try {
    const { id } = req.params;

    const article = await req.prisma.helpArticle.update({
      where: { id },
      data: {
        helpfulCount: { increment: 1 }
      },
      select: {
        id: true,
        helpfulCount: true
      }
    });

    res.json({
      success: true,
      data: { article },
      message: 'Thank you for your feedback!'
    });

  } catch (error) {
    next(error);
  }
});

// ============================================
// ADMIN ENDPOINTS
// ============================================

// @route   GET /api/help/admin/articles
// @desc    Get all articles (including unpublished)
// @access  Private (Admin only)
router.get('/admin/articles', [
  auth,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('published').optional().isBoolean()
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

    const { page = 1, limit = 20, published } = req.query;
    const skip = (page - 1) * limit;

    const whereClause = {};
    if (published !== undefined) {
      whereClause.published = published === 'true';
    }

    const [articles, total] = await Promise.all([
      req.prisma.helpArticle.findMany({
        where: whereClause,
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
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
      req.prisma.helpArticle.count({ where: whereClause })
    ]);

    res.json({
      success: true,
      data: {
        articles,
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

// @route   POST /api/help/admin/articles
// @desc    Create a new help article
// @access  Private (Admin only)
router.post('/admin/articles', [
  auth,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  body('title').trim().notEmpty().withMessage('Title is required')
    .isLength({ max: 200 }).withMessage('Title must be 200 characters or less'),
  body('slug').trim().notEmpty().withMessage('Slug is required')
    .matches(/^[a-z0-9-]+$/).withMessage('Slug must contain only lowercase letters, numbers, and hyphens'),
  body('content').trim().notEmpty().withMessage('Content is required'),
  body('excerpt').optional().trim().isLength({ max: 500 }),
  body('category').isIn([
    'GETTING_STARTED', 'ACCOUNT', 'BOOKINGS', 'PAYMENTS', 'SAFETY', 'PROVIDERS', 'FAQ'
  ]).withMessage('Invalid category'),
  body('featured').optional().isBoolean(),
  body('published').optional().isBoolean(),
  body('tags').optional().isArray(),
  body('relatedArticles').optional().isArray()
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
      title,
      slug,
      content,
      excerpt,
      category,
      featured = false,
      published = false,
      tags = [],
      searchTerms,
      relatedArticles = []
    } = req.body;

    // Check if slug already exists
    const existingArticle = await req.prisma.helpArticle.findUnique({
      where: { slug }
    });

    if (existingArticle) {
      return res.status(400).json({
        success: false,
        error: 'An article with this slug already exists'
      });
    }

    const article = await req.prisma.helpArticle.create({
      data: {
        title,
        slug,
        content,
        excerpt,
        category,
        featured,
        published,
        tags: tags.map(t => t.toLowerCase()),
        searchTerms,
        relatedArticles,
        authorId: req.user.id,
        publishedAt: published ? new Date() : null
      },
      include: {
        author: {
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

    logger.info(`Help article created: ${slug} by user ${req.user.id}`);

    res.status(201).json({
      success: true,
      data: { article },
      message: 'Article created successfully'
    });

  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/help/admin/articles/:id
// @desc    Update a help article
// @access  Private (Admin only)
router.put('/admin/articles/:id', [
  auth,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  body('title').optional().trim().isLength({ max: 200 }),
  body('slug').optional().trim().matches(/^[a-z0-9-]+$/),
  body('content').optional().trim(),
  body('excerpt').optional().trim().isLength({ max: 500 }),
  body('category').optional().isIn([
    'GETTING_STARTED', 'ACCOUNT', 'BOOKINGS', 'PAYMENTS', 'SAFETY', 'PROVIDERS', 'FAQ'
  ]),
  body('featured').optional().isBoolean(),
  body('published').optional().isBoolean(),
  body('tags').optional().isArray(),
  body('relatedArticles').optional().isArray()
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
    const updateData = { ...req.body };

    // If publishing for the first time, set publishedAt
    if (updateData.published === true) {
      const existingArticle = await req.prisma.helpArticle.findUnique({
        where: { id },
        select: { published: true, publishedAt: true }
      });

      if (!existingArticle.published && !existingArticle.publishedAt) {
        updateData.publishedAt = new Date();
      }
    }

    // Normalize tags to lowercase
    if (updateData.tags) {
      updateData.tags = updateData.tags.map(t => t.toLowerCase());
    }

    const article = await req.prisma.helpArticle.update({
      where: { id },
      data: updateData,
      include: {
        author: {
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

    logger.info(`Help article updated: ${article.slug} by user ${req.user.id}`);

    res.json({
      success: true,
      data: { article },
      message: 'Article updated successfully'
    });

  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/help/admin/articles/:id
// @desc    Delete a help article
// @access  Private (Admin only)
router.delete('/admin/articles/:id', [
  auth,
  requireRole(['ADMIN', 'SUPER_ADMIN'])
], async (req, res, next) => {
  try {
    const { id } = req.params;

    await req.prisma.helpArticle.delete({
      where: { id }
    });

    logger.info(`Help article deleted: ${id} by user ${req.user.id}`);

    res.json({
      success: true,
      message: 'Article deleted successfully'
    });

  } catch (error) {
    next(error);
  }
});

// @route   GET /api/help/admin/statistics
// @desc    Get help article statistics
// @access  Private (Admin only)
router.get('/admin/statistics', [
  auth,
  requireRole(['ADMIN', 'SUPER_ADMIN'])
], async (req, res, next) => {
  try {
    const [
      total,
      published,
      byCategory,
      topViewed,
      mostHelpful
    ] = await Promise.all([
      req.prisma.helpArticle.count(),
      req.prisma.helpArticle.count({ where: { published: true } }),
      req.prisma.helpArticle.groupBy({
        by: ['category'],
        _count: true,
        where: { published: true }
      }),
      req.prisma.helpArticle.findMany({
        where: { published: true },
        take: 10,
        orderBy: { viewCount: 'desc' },
        select: {
          id: true,
          slug: true,
          title: true,
          viewCount: true
        }
      }),
      req.prisma.helpArticle.findMany({
        where: { published: true },
        take: 10,
        orderBy: { helpfulCount: 'desc' },
        select: {
          id: true,
          slug: true,
          title: true,
          helpfulCount: true
        }
      })
    ]);

    const formatGroupBy = (data) => {
      return data.reduce((acc, item) => {
        acc[item.category] = item._count;
        return acc;
      }, {});
    };

    res.json({
      success: true,
      data: {
        statistics: {
          total,
          published,
          unpublished: total - published,
          byCategory: formatGroupBy(byCategory),
          topViewed,
          mostHelpful
        }
      }
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
