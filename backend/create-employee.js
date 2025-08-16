#!/usr/bin/env node

// Simple script to create employee user directly via SQL
const { PrismaClient } = require('@prisma/client')

async function createEmployee() {
  const prisma = new PrismaClient()

  try {
    console.log('Creating employee user...')

    const bcrypt = require('bcryptjs')
    const email = 'sentheopsguy@gmail.com'
    const password = 'voltas-beko'
    const hashedPassword = await bcrypt.hash(password, 12)

    // Delete existing user if any
    await prisma.$executeRaw`DELETE FROM users WHERE email = ${email}`

    // Create the user with raw SQL
    await prisma.$executeRaw`
      INSERT INTO users (id, email, "passwordHash", role, "isEmailVerified", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), ${email}, ${hashedPassword}, 'EMPLOYEE'::UserRole, true, NOW(), NOW())
    `

    console.log('Employee user created successfully!')

    // Test the query that login uses
    const users = await prisma.$queryRaw`
      SELECT id, email, "passwordHash" FROM users WHERE email = ${email} LIMIT 1
    `

    console.log('User found:', users)
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createEmployee()
