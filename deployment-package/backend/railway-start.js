#!/usr/bin/env node

/**
 * Railway startup script that ensures required environment variables
 * and provides fallbacks for missing optional configurations
 */

console.log('🚂 Starting ChillConnect Backend on Railway...');

// Set required environment variable defaults
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
process.env.PORT = process.env.PORT || '5001';

// Warn about missing optional configurations
const warnings = [];

if (!process.env.JWT_SECRET) {
  warnings.push('JWT_SECRET not set - using temporary secret (INSECURE)');
  process.env.JWT_SECRET = 'temporary-jwt-secret-' + Date.now();
}

if (!process.env.FRONTEND_URL) {
  warnings.push('FRONTEND_URL not set - CORS may not work properly');
  process.env.FRONTEND_URL = 'https://*.netlify.app';
}

if (!process.env.AWS_S3_BUCKET) {
  warnings.push('S3 configuration missing - using local file storage');
}

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is required but not set');
  console.error('Add PostgreSQL service to your Railway project');
  process.exit(1);
}

// Display warnings
if (warnings.length > 0) {
  console.log('⚠️  Configuration Warnings:');
  warnings.forEach(warning => console.log(`   - ${warning}`));
  console.log('');
}

console.log('✅ Environment configured, starting application...');
console.log(`📊 Node.js ${process.version}`);
console.log(`🌐 Port: ${process.env.PORT}`);
console.log(`🔒 Environment: ${process.env.NODE_ENV}`);
console.log('');

// Start the actual application
require('./src/index.js');