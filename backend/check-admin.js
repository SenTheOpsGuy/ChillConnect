const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const prisma = new PrismaClient();

async function checkAdmin() {
  try {
    const user = await prisma.user.findUnique({
      where: {
        email: 'admin@chillconnect.com'
      }
    });

    if (user) {
      console.log('✅ User found:');
      console.log('Email:', user.email);
      console.log('Role:', user.role);
      console.log('ID:', user.id);
      console.log('Verified:', user.isVerified);
      console.log('Email Verified:', user.isEmailVerified);
      console.log('Phone Verified:', user.isPhoneVerified);
      
      // Test password
      const passwordMatch = await bcrypt.compare('SuperSecurePassword123!', user.passwordHash);
      console.log('Password match:', passwordMatch ? '✅' : '❌');
      
    } else {
      console.log('❌ User not found');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdmin();