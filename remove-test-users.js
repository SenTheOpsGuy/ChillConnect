#!/usr/bin/env node

/**
 * Remove specific test user records from database
 */

const { PrismaClient } = require('@prisma/client');
const path = require('path');

async function removeTestUsers() {
  console.log('🗑️  Removing test user records from database...');
  
  // Set working directory to backend
  process.chdir(path.join(__dirname, 'backend'));
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL || 'postgresql://postgres:bNOtVAHbWwyTjNVQGPHMGGlkFjpQPCeZ@junction.proxy.rlwy.net:19543/railway'
      }
    }
  });

  try {
    console.log('🔍 Searching for users to remove...');
    
    // Find users to delete
    const usersToDelete = await prisma.$queryRaw`
      SELECT id, email, phone FROM "User" 
      WHERE phone = '+919258221177' 
      OR email = 'mountainsagegiri@gmail.com'
      OR phone = '9258221177'
    `;
    
    console.log(`📋 Found ${usersToDelete.length} users to delete:`);
    usersToDelete.forEach(user => {
      console.log(`   • ID: ${user.id}, Email: ${user.email}, Phone: ${user.phone}`);
    });
    
    if (usersToDelete.length === 0) {
      console.log('✅ No matching users found to delete');
      return;
    }
    
    // Delete related records first (due to foreign key constraints)
    console.log('🔄 Deleting related records...');
    
    for (const user of usersToDelete) {
      const userId = user.id;
      
      // Delete OTP records
      await prisma.$queryRaw`DELETE FROM "OTPVerification" WHERE "userId" = ${userId}`;
      await prisma.$queryRaw`DELETE FROM "EmailOTPVerification" WHERE "userId" = ${userId}`;
      
      // Delete profile
      await prisma.$queryRaw`DELETE FROM "UserProfile" WHERE "userId" = ${userId}`;
      
      // Delete token wallet
      await prisma.$queryRaw`DELETE FROM "TokenWallet" WHERE "userId" = ${userId}`;
      
      console.log(`   ✅ Cleaned up related records for user ${userId}`);
    }
    
    // Delete the users
    console.log('🗑️  Deleting users...');
    const deleteResult = await prisma.$queryRaw`
      DELETE FROM "User" 
      WHERE phone = '+919258221177' 
      OR email = 'mountainsagegiri@gmail.com'
      OR phone = '9258221177'
    `;
    
    console.log(`✅ Successfully deleted users`);
    console.log('🎯 Phone number 9258221177 and email mountainsagegiri@gmail.com removed');
    console.log('📞 Phone verification should now work for fresh registration');
    
  } catch (error) {
    console.error('❌ Error removing users:', error.message);
    
    if (error.message.includes('connect')) {
      console.log('💡 Database connection failed. Trying alternative approach...');
      console.log('🔧 You may need to run these SQL commands manually in Railway console:');
      console.log(`
DELETE FROM "OTPVerification" WHERE "userId" IN (
  SELECT id FROM "User" WHERE phone IN ('+919258221177', '9258221177') OR email = 'mountainsagegiri@gmail.com'
);

DELETE FROM "EmailOTPVerification" WHERE "userId" IN (
  SELECT id FROM "User" WHERE phone IN ('+919258221177', '9258221177') OR email = 'mountainsagegiri@gmail.com'
);

DELETE FROM "UserProfile" WHERE "userId" IN (
  SELECT id FROM "User" WHERE phone IN ('+919258221177', '9258221177') OR email = 'mountainsagegiri@gmail.com'
);

DELETE FROM "TokenWallet" WHERE "userId" IN (
  SELECT id FROM "User" WHERE phone IN ('+919258221177', '9258221177') OR email = 'mountainsagegiri@gmail.com'
);

DELETE FROM "User" WHERE phone IN ('+919258221177', '9258221177') OR email = 'mountainsagegiri@gmail.com';
      `);
    }
  } finally {
    await prisma.$disconnect();
  }
}

removeTestUsers().catch(console.error);