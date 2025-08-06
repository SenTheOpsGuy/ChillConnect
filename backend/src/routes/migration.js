const express = require('express');
const { execSync } = require('child_process');
const logger = require('../utils/logger');

const router = express.Router();

// @route   POST /api/migrate/deploy
// @desc    Run database migrations (production only)
// @access  Public (but should be protected in real production)
router.post('/deploy', async (req, res) => {
  try {
    // Only allow in production environment
    if (process.env.NODE_ENV !== 'production') {
      return res.status(403).json({
        success: false,
        error: 'Migration endpoint only available in production'
      });
    }

    logger.info('Starting database migration deployment...');
    
    // Run prisma migrate deploy
    execSync('npx prisma migrate deploy', { 
      stdio: 'pipe',
      cwd: __dirname + '/../../' 
    });
    
    logger.info('Migrations completed successfully');
    
    // Also generate Prisma client
    execSync('npx prisma generate', { 
      stdio: 'pipe',
      cwd: __dirname + '/../../' 
    });
    
    logger.info('Prisma client generated successfully');

    res.json({
      success: true,
      message: 'Database migrations deployed successfully'
    });

  } catch (error) {
    logger.error('Migration deployment failed:', error);
    res.status(500).json({
      success: false,
      error: 'Migration deployment failed',
      details: error.message
    });
  }
});

module.exports = router;