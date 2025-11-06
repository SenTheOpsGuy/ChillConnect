const { PrismaClient } = require('@prisma/client');
const { chatTemplates } = require('./seeds/chatTemplates');

const prisma = new PrismaClient();

async function seedChatTemplates() {
  console.log('🌱 Seeding chat templates...');

  // Find or create a system admin user for template creation
  let systemAdmin = await prisma.user.findFirst({
    where: { role: 'SUPER_ADMIN' },
  });

  if (!systemAdmin) {
    console.log('⚠️  No super admin found. Creating system admin...');
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('Admin@123!', 12);

    systemAdmin = await prisma.user.create({
      data: {
        email: 'system@chillconnect.com',
        passwordHash: hashedPassword,
        role: 'SUPER_ADMIN',
        isVerified: true,
        isEmailVerified: true,
        isAgeVerified: true,
        consentGiven: true,
        profile: {
          create: {
            firstName: 'System',
            lastName: 'Admin',
          },
        },
        tokenWallet: {
          create: {
            balance: 0,
          },
        },
      },
    });
    console.log('✅ System admin created');
  }

  // Delete existing templates (for re-seeding)
  const deletedCount = await prisma.chatTemplate.deleteMany({});
  console.log(`🗑️  Deleted ${deletedCount.count} existing templates`);

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

    await seedChatTemplates();

    console.log('\n✨ Database seeding completed successfully!');
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
