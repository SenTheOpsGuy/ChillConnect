#!/usr/bin/env node

/**
 * Database migration script for Railway deployment
 */

console.log('🔄 Running database migrations...')

const { execSync } = require('child_process')

try {
  // Generate Prisma client
  console.log('📦 Generating Prisma client...')
  execSync('npx prisma generate', { stdio: 'inherit' })

  // Deploy migrations
  console.log('🚀 Deploying migrations...')
  execSync('npx prisma migrate deploy', { stdio: 'inherit' })

  console.log('✅ Migrations completed successfully!')
} catch (error) {
  console.error('❌ Migration failed:', error.message)
  process.exit(1)
}
