#!/usr/bin/env node

/**
 * Database initialization script
 */

console.log('🔄 Initializing database...')

const { PrismaClient } = require('@prisma/client')

async function initializeDatabase() {
  const prisma = new PrismaClient()

  try {
    // Test database connection
    console.log('📡 Testing database connection...')
    await prisma.$connect()
    console.log('✅ Database connected successfully!')

    // Check if database has tables
    const userCount = await prisma.user.count()
    console.log(`👥 Found ${userCount} users in database`)

    if (userCount === 0) {
      console.log('🏗️ Database appears to be empty, creating admin user...')

      const bcrypt = require('bcryptjs')
      const adminEmail = 'sentheopsguy@gmail.com'
      const adminPassword = 'voltas-beko'
      const hashedPassword = await bcrypt.hash(adminPassword, 12)

      const adminUser = await prisma.user.create({
        data: {
          email: adminEmail,
          password: hashedPassword,
          role: 'SUPER_ADMIN',
          isEmailVerified: true,
          profile: {
            create: {
              firstName: 'Admin',
              lastName: 'User',
              dateOfBirth: new Date('1990-01-01'),
              phoneNumber: '+1234567890',
              gender: 'PREFER_NOT_TO_SAY',
              location: 'System',
              ageConfirmed: true,
            },
          },
        },
        include: {
          profile: true,
        },
      })

      console.log('✅ Admin user created:', adminUser.email)
    }

    console.log('🎉 Database initialization completed!')
  } catch (error) {
    console.error('❌ Database initialization failed:', error)
    console.error('Error details:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

initializeDatabase()
