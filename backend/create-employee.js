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

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      console.log('Employee user already exists, updating password...')
      await prisma.user.update({
        where: { email },
        data: {
          passwordHash: hashedPassword,
          role: 'EMPLOYEE',
          isEmailVerified: true,
        },
      })
    } else {
      console.log('Creating new employee user...')
      await prisma.user.create({
        data: {
          email,
          passwordHash: hashedPassword,
          role: 'EMPLOYEE',
          isEmailVerified: true,
          isAgeVerified: true,
          consentGiven: true,
        },
      })
    }

    console.log('Employee user ready for login!')
  } catch (error) {
    console.error('Error creating employee user:', error)
    console.log('Continuing with startup...')
  } finally {
    await prisma.$disconnect()
  }
}

createEmployee()
