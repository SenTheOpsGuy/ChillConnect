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
          // Change to backend directory and push schema
          const result = await execAsync('cd backend && npx prisma db push --accept-data-loss');
          console.log('✅ Database schema created successfully');
          console.log(result.stdout);
        } catch (pushError) {
          console.error('❌ Failed to create database schema:', pushError.message);
          throw pushError;
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