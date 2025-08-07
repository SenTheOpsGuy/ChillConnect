const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function checkAdminUser() {
  try {
    console.log('🔍 Checking for admin user...');
    
    const adminUser = await prisma.user.findUnique({
      where: {
        email: 'admin@chillconnect.com'
      }
    });
    
    if (adminUser) {
      console.log('✅ Admin user found:');
      console.log(`  Email: ${adminUser.email}`);
      console.log(`  Role: ${adminUser.role}`);
      console.log(`  Verified: ${adminUser.isVerified}`);
      console.log(`  Email Verified: ${adminUser.isEmailVerified}`);
      
      // Test password
      const passwordMatch = await bcrypt.compare('SuperSecurePassword123!', adminUser.passwordHash);
      console.log(`  Password Match: ${passwordMatch ? '✅' : '❌'}`);
      
      if (!passwordMatch) {
        console.log('🔧 Updating admin password...');
        const hashedPassword = await bcrypt.hash('SuperSecurePassword123!', 12);
        await prisma.user.update({
          where: { email: 'admin@chillconnect.com' },
          data: { passwordHash: hashedPassword }
        });
        console.log('✅ Admin password updated');
      }
      
    } else {
      console.log('❌ Admin user not found. Creating admin user...');
      
      const hashedPassword = await bcrypt.hash('SuperSecurePassword123!', 12);
      
      const newAdmin = await prisma.user.create({
        data: {
          email: 'admin@chillconnect.com',
          passwordHash: hashedPassword,
          role: 'SUPER_ADMIN',
          isVerified: true,
          isEmailVerified: true,
          isPhoneVerified: false,
          profile: {
            create: {
              firstName: 'System',
              lastName: 'Administrator'
            }
          }
        }
      });
      
      console.log('✅ Admin user created successfully');
      console.log(`  ID: ${newAdmin.id}`);
      console.log(`  Email: ${newAdmin.email}`);
      console.log(`  Role: ${newAdmin.role}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminUser();