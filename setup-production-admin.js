const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

// Use production database URL
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://postgres:kKwJPSEEeJxYlpBmIatkmYMzQaJPuGZB@postgres.railway.internal:5432/railway"
    }
  }
});

async function setupProductionAdmin() {
  console.log('🏭 Setting up production admin user...');
  
  try {
    // First check if admin user exists
    const existingAdmin = await prisma.user.findUnique({
      where: {
        email: 'admin@chillconnect.com'
      }
    });
    
    if (existingAdmin) {
      console.log('✅ Admin user found, updating password...');
      
      // Hash the password
      const hashedPassword = await bcrypt.hash('SuperSecurePassword123!', 12);
      
      // Update the admin user
      await prisma.user.update({
        where: { email: 'admin@chillconnect.com' },
        data: { 
          passwordHash: hashedPassword,
          role: 'SUPER_ADMIN',
          isVerified: true,
          isEmailVerified: true,
          isPhoneVerified: false
        }
      });
      
      console.log('✅ Admin user updated successfully');
      
    } else {
      console.log('❌ Admin user not found, creating new admin user...');
      
      // Hash the password
      const hashedPassword = await bcrypt.hash('SuperSecurePassword123!', 12);
      
      // Create new admin user with profile
      const newAdmin = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: 'admin@chillconnect.com',
            passwordHash: hashedPassword,
            role: 'SUPER_ADMIN',
            isVerified: true,
            isEmailVerified: true,
            isPhoneVerified: false,
            consentGiven: true,
            isAgeVerified: true
          }
        });
        
        await tx.userProfile.create({
          data: {
            userId: user.id,
            firstName: 'System',
            lastName: 'Administrator'
          }
        });
        
        await tx.tokenWallet.create({
          data: {
            userId: user.id,
            balance: 0,
            escrowBalance: 0
          }
        });
        
        return user;
      });
      
      console.log('✅ Admin user created successfully');
      console.log(`  ID: ${newAdmin.id}`);
      console.log(`  Email: ${newAdmin.email}`);
      console.log(`  Role: ${newAdmin.role}`);
    }
    
    // Test the password
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@chillconnect.com' }
    });
    
    const passwordMatch = await bcrypt.compare('SuperSecurePassword123!', adminUser.passwordHash);
    console.log(`🔑 Password test: ${passwordMatch ? '✅ PASS' : '❌ FAIL'}`);
    
    if (!passwordMatch) {
      console.log('❌ Password test failed! Something went wrong.');
    } else {
      console.log('🎉 Production admin setup completed successfully!');
      console.log('📧 Email: admin@chillconnect.com');
      console.log('🔑 Password: SuperSecurePassword123!');
    }
    
  } catch (error) {
    console.error('❌ Error setting up production admin:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

setupProductionAdmin();