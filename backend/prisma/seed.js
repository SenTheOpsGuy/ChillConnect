const { PrismaClient } = require('@prisma/client');
const { chatTemplates } = require('./seeds/chatTemplates');

const prisma = new PrismaClient();

async function seedUsers() {
  console.log('👥 Seeding test users...');
  const bcrypt = require('bcryptjs');

  // Test accounts with different roles
  const testAccounts = [
    // Super Admin
    {
      email: 'admin@chillconnect.com',
      password: 'Admin@123!',
      role: 'SUPER_ADMIN',
      profile: { firstName: 'Super', lastName: 'Admin' },
      tokens: 10000,
    },
    // Regular Admin
    {
      email: 'support@chillconnect.com',
      password: 'Support@123!',
      role: 'ADMIN',
      profile: { firstName: 'Support', lastName: 'Staff' },
      tokens: 5000,
    },
    // Employee/Manager
    {
      email: 'manager@chillconnect.com',
      password: 'Manager@123!',
      role: 'EMPLOYEE',
      profile: { firstName: 'Team', lastName: 'Manager' },
      tokens: 1000,
    },
    // Provider 1 - Verified
    {
      email: 'provider1@test.com',
      password: 'Provider@123!',
      role: 'PROVIDER',
      profile: {
        firstName: 'Sarah',
        lastName: 'Anderson',
        bio: 'Professional companion with 3 years of experience. Specializing in dinner dates and social events.',
        location: 'Mumbai, Maharashtra',
        services: ['DINNER_DATE', 'SOCIAL_EVENT', 'MOVIE_COMPANION'],
        hourlyRate: 2000,
        rating: 4.8,
        reviewCount: 45,
      },
      tokens: 5000,
      isVerified: true,
      isPhoneVerified: true,
    },
    // Provider 2 - Verified
    {
      email: 'provider2@test.com',
      password: 'Provider@123!',
      role: 'PROVIDER',
      profile: {
        firstName: 'Priya',
        lastName: 'Sharma',
        bio: 'Friendly and outgoing companion. Love exploring new places and trying new cuisines.',
        location: 'Delhi NCR',
        services: ['COFFEE_MEET', 'SHOPPING', 'CITY_TOUR'],
        hourlyRate: 1500,
        rating: 4.9,
        reviewCount: 67,
      },
      tokens: 3000,
      isVerified: true,
      isPhoneVerified: true,
    },
    // Provider 3 - Pending Verification
    {
      email: 'provider3@test.com',
      password: 'Provider@123!',
      role: 'PROVIDER',
      profile: {
        firstName: 'Anjali',
        lastName: 'Patel',
        bio: 'New to the platform. Available for casual meetups and social events.',
        location: 'Bangalore, Karnataka',
        services: ['COFFEE_MEET', 'LUNCH', 'DINNER_DATE'],
        hourlyRate: 1200,
        rating: 0,
        reviewCount: 0,
      },
      tokens: 1000,
      isVerified: false,
      isPhoneVerified: false,
    },
    // Seeker 1 - Active
    {
      email: 'seeker1@test.com',
      password: 'Seeker@123!',
      role: 'SEEKER',
      profile: {
        firstName: 'Rahul',
        lastName: 'Verma',
        bio: 'Looking for good company for social events and dinners.',
        location: 'Mumbai, Maharashtra',
      },
      tokens: 10000,
    },
    // Seeker 2 - Active
    {
      email: 'seeker2@test.com',
      password: 'Seeker@123!',
      role: 'SEEKER',
      profile: {
        firstName: 'Arjun',
        lastName: 'Kumar',
        bio: 'Travel enthusiast looking for companions for city exploration.',
        location: 'Bangalore, Karnataka',
      },
      tokens: 7500,
    },
    // Seeker 3 - New User
    {
      email: 'seeker3@test.com',
      password: 'Seeker@123!',
      role: 'SEEKER',
      profile: {
        firstName: 'Vikram',
        lastName: 'Singh',
        bio: 'New to the platform. Interested in casual meetups.',
        location: 'Delhi NCR',
      },
      tokens: 5000,
    },
  ];

  let createdCount = 0;
  for (const account of testAccounts) {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: account.email },
    });

    if (existingUser) {
      console.log(`   ⏭️  Skipping ${account.email} (already exists)`);
      continue;
    }

    const hashedPassword = await bcrypt.hash(account.password, 10);

    await prisma.user.create({
      data: {
        email: account.email,
        passwordHash: hashedPassword,
        role: account.role,
        isVerified: account.isVerified !== false,
        isEmailVerified: true,
        isPhoneVerified: account.isPhoneVerified || false,
        isAgeVerified: true,
        consentGiven: true,
        profile: {
          create: account.profile,
        },
        tokenWallet: {
          create: {
            balance: account.tokens,
          },
        },
      },
    });
    createdCount++;
    console.log(`   ✓ Created ${account.email}`);
  }

  console.log(`✅ Created ${createdCount} test users`);
}

async function seedChatTemplates() {
  console.log('💬 Seeding chat templates...');

  // Find or create a system admin user for template creation
  let systemAdmin = await prisma.user.findFirst({
    where: { role: 'SUPER_ADMIN' },
  });

  if (!systemAdmin) {
    console.log('⚠️  No super admin found, skipping templates...');
    return;
  }

  // Delete existing templates (for re-seeding)
  const deletedCount = await prisma.chatTemplate.deleteMany({});
  console.log(`   🗑️  Deleted ${deletedCount.count} existing templates`);

  // Create new templates
  let createdCount = 0;
  for (const template of chatTemplates) {
    await prisma.chatTemplate.create({
      data: {
        ...template,
        createdBy: systemAdmin.id,
      },
    });
    createdCount++;
  }

  console.log(`✅ Created ${createdCount} chat templates`);
}

async function main() {
  try {
    console.log('🚀 Starting database seeding...\n');

    await seedUsers();
    await seedChatTemplates();

    console.log('\n✨ Database seeding completed successfully!');
    console.log('\n📋 Test Account Credentials:');
    console.log('   Super Admin: admin@chillconnect.com / Admin@123!');
    console.log('   Admin:       support@chillconnect.com / Support@123!');
    console.log('   Manager:     manager@chillconnect.com / Manager@123!');
    console.log('   Provider 1:  provider1@test.com / Provider@123!');
    console.log('   Provider 2:  provider2@test.com / Provider@123!');
    console.log('   Provider 3:  provider3@test.com / Provider@123! (Unverified)');
    console.log('   Seeker 1:    seeker1@test.com / Seeker@123!');
    console.log('   Seeker 2:    seeker2@test.com / Seeker@123!');
    console.log('   Seeker 3:    seeker3@test.com / Seeker@123!');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
