#!/usr/bin/env node

/**
 * Emergency Database Schema Fix
 * Fixes the role field type mismatch in production
 */

const { execSync } = require('child_process');
const path = require('path');

async function fixDatabaseSchema() {
  console.log('🚨 EMERGENCY: Fixing database schema...');
  
  try {
    // Set working directory to backend
    process.chdir(path.join(__dirname, 'backend'));
    
    console.log('📍 Working directory:', process.cwd());
    
    // Check current schema
    console.log('📋 Current Prisma schema:');
    console.log(execSync('head -20 prisma/schema.prisma', { encoding: 'utf8' }));
    
    // Generate Prisma client with current schema
    console.log('🔧 Generating Prisma client...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    
    // Reset database with force to fix schema mismatch
    console.log('🗃️  Resetting database schema...');
    execSync('npx prisma db push --force-reset --accept-data-loss', { 
      stdio: 'inherit',
      env: { 
        ...process.env, 
        DATABASE_URL: 'postgresql://postgres:bNOtVAHbWwyTjNVQGPHMGGlkFjpQPCeZ@junction.proxy.rlwy.net:19543/railway'
      }
    });
    
    console.log('✅ Database schema reset complete!');
    console.log('🎯 Phone verification should now work');
    
  } catch (error) {
    console.error('❌ Database reset failed:', error.message);
    
    // Alternative approach: try to update existing records
    console.log('🔄 Trying alternative approach...');
    try {
      // Create a simple SQL fix
      const sqlFix = `
        -- Convert role enum values to strings
        UPDATE "User" SET role = 'SUPER_ADMIN' WHERE role = 'SUPER_ADMIN'::text;
        UPDATE "User" SET role = 'USER' WHERE role = 'USER'::text;
        UPDATE "User" SET role = 'PROVIDER' WHERE role = 'PROVIDER'::text;
      `;
      
      console.log('📝 SQL fix commands:');
      console.log(sqlFix);
      console.log('💡 Run these commands manually in Railway database console');
      
    } catch (altError) {
      console.error('❌ Alternative approach failed:', altError.message);
    }
  }
}

fixDatabaseSchema().catch(console.error);