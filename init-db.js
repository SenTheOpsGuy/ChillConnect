#!/usr/bin/env node

/**
 * Railway Database Initialization Script
 * Automatically creates database schema on startup
 */

const { PrismaClient } = require('@prisma/client');

async function initializeDatabase() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔄 Initializing database...');
    
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected');
    
    // Try to create a simple test query
    try {
      await prisma.user.findFirst();
      console.log('✅ Database schema exists and is ready');
    } catch (error) {
      if (error.message.includes('does not exist')) {
        console.log('🔧 Database schema missing, creating tables...');
        
        // Push schema to database
        const { exec } = require('child_process');
        const { promisify } = require('util');
        const execAsync = promisify(exec);
        
        try {
          // Force reset and push schema
          console.log('🔄 Resetting database schema...');
          const resetResult = await execAsync('cd backend && npx prisma db push --force-reset --accept-data-loss');
          console.log('✅ Database schema reset and created successfully');
          console.log(resetResult.stdout);
        } catch (pushError) {
          console.error('❌ Failed to reset database schema, trying regular push...');
          try {
            // Fallback to regular push
            const result = await execAsync('cd backend && npx prisma db push --accept-data-loss');
            console.log('✅ Database schema updated successfully');
            console.log(result.stdout);
          } catch (fallbackError) {
            console.error('❌ Failed to update database schema:', fallbackError.message);
            throw fallbackError;
          }
        }
      } else {
        throw error;
      }
    }
    
    console.log('🎉 Database initialization complete!');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  initializeDatabase().catch((error) => {
    console.error('Database initialization failed:', error);
    process.exit(1);
  });
}

module.exports = initializeDatabase;