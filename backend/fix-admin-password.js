const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const prisma = new PrismaClient();

async function fixAdminPassword() {
  try {
    // Hash the correct password
    const hashedPassword = await bcrypt.hash('SuperSecurePassword123!', 12);
    
    // Update the admin user
    const updatedUser = await prisma.user.update({
      where: {
        email: 'admin@chillconnect.com'
      },
      data: {
        passwordHash: hashedPassword
      }
    });

    console.log('✅ Admin password updated successfully');
    console.log('Email:', updatedUser.email);
    console.log('Role:', updatedUser.role);
    
    // Verify the password works
    const passwordMatch = await bcrypt.compare('SuperSecurePassword123!', updatedUser.passwordHash);
    console.log('Password verification:', passwordMatch ? '✅ Correct' : '❌ Failed');

  } catch (error) {
    console.error('❌ Error updating password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAdminPassword();