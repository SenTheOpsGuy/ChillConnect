const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('Starting database seed...')

  // Create superadmin user with specified credentials
  const superAdminPasswordHash = await bcrypt.hash('SuperAdmin@2024', 12)
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@chillconnect.com' },
    update: {},
    create: {
      email: 'admin@chillconnect.com',
      phone: '+1234567890',
      passwordHash: superAdminPasswordHash,
      role: 'SUPER_ADMIN',
      isVerified: true,
      isEmailVerified: true,
      isPhoneVerified: true,
      isAgeVerified: true,
      consentGiven: true,
      profile: {
        create: {
          firstName: 'Super',
          lastName: 'Admin',
          dateOfBirth: new Date('1990-01-01'),
          bio: 'Platform Super Administrator',
          location: 'Platform'
        }
      },
      tokenWallet: {
        create: {
          balance: 50000,
          escrowBalance: 0,
          totalEarned: 0,
          totalSpent: 0
        }
      }
    }
  })

  // Create admin user
  const adminPasswordHash = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@chillconnect.com' },
    update: {},
    create: {
      email: 'admin@chillconnect.com',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      isVerified: true,
      isEmailVerified: true,
      isPhoneVerified: true,
      isAgeVerified: true,
      consentGiven: true,
      profile: {
        create: {
          firstName: 'Admin',
          lastName: 'User',
          dateOfBirth: new Date('1990-01-01'),
          bio: 'Platform administrator',
          location: 'Platform'
        }
      },
      tokenWallet: {
        create: {
          balance: 10000,
          escrowBalance: 0,
          totalEarned: 0,
          totalSpent: 0
        }
      }
    }
  })

  // Create manager user
  const managerPasswordHash = await bcrypt.hash('manager123', 10)
  const manager = await prisma.user.upsert({
    where: { email: 'manager@chillconnect.com' },
    update: {},
    create: {
      email: 'manager@chillconnect.com',
      passwordHash: managerPasswordHash,
      role: 'MANAGER',
      isVerified: true,
      isEmailVerified: true,
      isPhoneVerified: true,
      isAgeVerified: true,
      consentGiven: true,
      profile: {
        create: {
          firstName: 'Manager',
          lastName: 'User',
          dateOfBirth: new Date('1985-01-01'),
          bio: 'Platform manager',
          location: 'Platform'
        }
      },
      tokenWallet: {
        create: {
          balance: 5000,
          escrowBalance: 0,
          totalEarned: 0,
          totalSpent: 0
        }
      }
    }
  })

  // Create employees
  const employees = []
  for (let i = 1; i <= 3; i++) {
    const employeePasswordHash = await bcrypt.hash(`employee${i}123`, 10)
    const employee = await prisma.user.upsert({
      where: { email: `employee${i}@chillconnect.com` },
      update: {},
      create: {
        email: `employee${i}@chillconnect.com`,
        passwordHash: employeePasswordHash,
        role: 'EMPLOYEE',
        isVerified: true,
        isEmailVerified: true,
        isPhoneVerified: true,
        isAgeVerified: true,
        consentGiven: true,
        profile: {
          create: {
            firstName: `Employee${i}`,
            lastName: 'User',
            dateOfBirth: new Date('1992-01-01'),
            bio: `Employee ${i}`,
            location: 'Platform'
          }
        },
        tokenWallet: {
          create: {
            balance: 1000,
            escrowBalance: 0,
            totalEarned: 0,
            totalSpent: 0
          }
        }
      }
    })
    employees.push(employee)
  }

  // Create sample providers
  const providers = []
  for (let i = 1; i <= 5; i++) {
    const providerPasswordHash = await bcrypt.hash(`provider${i}123`, 10)
    const provider = await prisma.user.upsert({
      where: { email: `provider${i}@chillconnect.com` },
      update: {},
      create: {
        email: `provider${i}@chillconnect.com`,
        phone: `+91900000000${i}`,
        passwordHash: providerPasswordHash,
        role: 'PROVIDER',
        isVerified: i <= 3, // First 3 providers are verified
        isEmailVerified: true,
        isPhoneVerified: i <= 3,
        isAgeVerified: i <= 3,
        consentGiven: true,
        profile: {
          create: {
            firstName: `Provider${i}`,
            lastName: 'User',
            dateOfBirth: new Date('1995-01-01'),
            bio: `Professional companion with ${i + 2} years of experience. Offering quality services with discretion and professionalism.`,
            location: `Mumbai, India`,
            services: ['Companionship', 'Dinner dates', 'Travel companion'],
            hourlyRate: 100 + (i * 50), // 150, 200, 250, 300, 350 tokens per hour
            availability: {
              monday: { available: true, hours: '18:00-23:00' },
              tuesday: { available: true, hours: '18:00-23:00' },
              wednesday: { available: true, hours: '18:00-23:00' },
              thursday: { available: true, hours: '18:00-23:00' },
              friday: { available: true, hours: '18:00-02:00' },
              saturday: { available: true, hours: '20:00-02:00' },
              sunday: { available: i % 2 === 0, hours: '20:00-23:00' }
            },
            rating: 4.0 + (i * 0.2), // 4.2, 4.4, 4.6, 4.8, 5.0
            reviewCount: i * 10 + 5
          }
        },
        tokenWallet: {
          create: {
            balance: 500 + (i * 100),
            escrowBalance: 0,
            totalEarned: i * 1000,
            totalSpent: 0
          }
        }
      }
    })
    providers.push(provider)
  }

  // Create sample seekers
  const seekers = []
  for (let i = 1; i <= 10; i++) {
    const seekerPasswordHash = await bcrypt.hash(`seeker${i}123`, 10)
    const seeker = await prisma.user.upsert({
      where: { email: `seeker${i}@chillconnect.com` },
      update: {},
      create: {
        email: `seeker${i}@chillconnect.com`,
        phone: `+91800000000${i}`,
        passwordHash: seekerPasswordHash,
        role: 'SEEKER',
        isVerified: i <= 7, // First 7 seekers are verified
        isEmailVerified: true,
        isPhoneVerified: i <= 7,
        isAgeVerified: i <= 7,
        consentGiven: true,
        profile: {
          create: {
            firstName: `Seeker${i}`,
            lastName: 'User',
            dateOfBirth: new Date('1988-01-01'),
            bio: `Looking for quality companionship services.`,
            location: `Mumbai, India`
          }
        },
        tokenWallet: {
          create: {
            balance: 1000 + (i * 200),
            escrowBalance: 0,
            totalEarned: 0,
            totalSpent: i * 300
          }
        }
      }
    })
    seekers.push(seeker)
  }

  // Create sample bookings
  const bookings = []
  for (let i = 0; i < 15; i++) {
    const seekerIndex = i % seekers.length
    const providerIndex = i % providers.length
    const startTime = new Date()
    startTime.setDate(startTime.getDate() + (i - 7)) // Some past, some future
    startTime.setHours(20, 0, 0, 0)
    
    const endTime = new Date(startTime)
    endTime.setHours(startTime.getHours() + 2) // 2 hour bookings
    
    const statuses = ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']
    const status = statuses[i % statuses.length]
    
    const booking = await prisma.booking.create({
      data: {
        seekerId: seekers[seekerIndex].id,
        providerId: providers[providerIndex].id,
        type: i % 2 === 0 ? 'OUTCALL' : 'INCALL',
        status,
        startTime,
        endTime,
        duration: 120, // 2 hours
        tokenAmount: 200 + (i * 10),
        location: i % 2 === 0 ? 'Hotel Taj, Mumbai' : null,
        notes: i % 3 === 0 ? 'Special dinner date request' : null,
        assignedEmployeeId: status === 'IN_PROGRESS' ? employees[i % employees.length].id : null,
        completedAt: status === 'COMPLETED' ? new Date() : null
      }
    })
    bookings.push(booking)
  }

  // Create sample messages for bookings
  for (let i = 0; i < bookings.length; i++) {
    const booking = bookings[i]
    const messageCount = Math.floor(Math.random() * 10) + 5 // 5-15 messages per booking
    
    for (let j = 0; j < messageCount; j++) {
      const isFromSeeker = j % 2 === 0
      const senderId = isFromSeeker ? booking.seekerId : booking.providerId
      const messages = [
        'Hi, looking forward to our meeting!',
        'Thank you for booking with me.',
        'What time works best for you?',
        'I can be flexible with the timing.',
        'Great! See you soon.',
        'The location looks perfect.',
        'I\'ll be there on time.',
        'Thank you for the wonderful evening!',
        'Hope to see you again soon.',
        'You were amazing, thank you!'
      ]
      
      await prisma.message.create({
        data: {
          bookingId: booking.id,
          senderId,
          content: messages[j % messages.length],
          isSystemMessage: false,
          isFlagged: Math.random() < 0.05, // 5% chance of being flagged
          flaggedReason: Math.random() < 0.05 ? 'Inappropriate content detected' : null,
          readAt: Math.random() < 0.8 ? new Date() : null,
          createdAt: new Date(Date.now() - (messageCount - j) * 3600000) // Spread over hours
        }
      })
    }
  }

  // Create sample token transactions
  for (let i = 0; i < 30; i++) {
    const user = [...seekers, ...providers][i % (seekers.length + providers.length)]
    const wallet = await prisma.tokenWallet.findUnique({
      where: { userId: user.id }
    })
    
    const transactionTypes = ['PURCHASE', 'BOOKING_PAYMENT', 'BOOKING_REFUND', 'WITHDRAWAL']
    const type = transactionTypes[i % transactionTypes.length]
    const amount = Math.floor(Math.random() * 500) + 100
    
    await prisma.tokenTransaction.create({
      data: {
        userId: user.id,
        walletId: wallet.id,
        type,
        amount,
        previousBalance: wallet.balance,
        newBalance: wallet.balance + (type === 'PURCHASE' ? amount : -amount),
        description: `${type.replace('_', ' ').toLowerCase()} transaction`,
        paypalOrderId: type === 'PURCHASE' ? `PAY-${Date.now()}-${i}` : null,
        bookingId: type.includes('BOOKING') ? bookings[i % bookings.length].id : null
      }
    })
  }

  // Create sample verifications
  for (let i = 0; i < providers.length + 3; i++) {
    const user = i < providers.length ? providers[i] : seekers[i - providers.length]
    const statuses = ['PENDING', 'IN_PROGRESS', 'APPROVED', 'REJECTED']
    const status = statuses[i % statuses.length]
    
    await prisma.verification.create({
      data: {
        userId: user.id,
        employeeId: status !== 'PENDING' ? employees[i % employees.length].id : null,
        status,
        documentType: i % 2 === 0 ? 'Government ID' : 'Passport',
        documentUrl: `https://example.com/documents/doc_${i}.pdf`,
        notes: status === 'REJECTED' ? 'Document unclear, please resubmit' : null,
        reviewedAt: status !== 'PENDING' ? new Date() : null,
        assignedAt: status !== 'PENDING' ? new Date() : null
      }
    })
  }

  // Create round robin counters
  await prisma.roundRobinCounter.upsert({
    where: { type: 'verification' },
    update: {},
    create: {
      type: 'verification',
      lastAssignedId: employees[0].id
    }
  })

  await prisma.roundRobinCounter.upsert({
    where: { type: 'booking_monitoring' },
    update: {},
    create: {
      type: 'booking_monitoring',
      lastAssignedId: employees[1].id
    }
  })

  console.log('Database seed completed successfully!')
  console.log(`Created:`)
  console.log(`- 1 Super Admin`)
  console.log(`- 1 Admin`)
  console.log(`- 1 Manager`)
  console.log(`- 3 Employees`)
  console.log(`- 5 Providers`)
  console.log(`- 10 Seekers`)
  console.log(`- 15 Bookings`)
  console.log(`- Multiple Messages, Transactions, and Verifications`)
  console.log(`\nTest accounts:`)
  console.log(`SuperAdmin: admin@chillconnect.com / SuperAdmin@2024 / +1234567890`)
  console.log(`Admin: admin@chillconnect.com / admin123`)
  console.log(`Manager: manager@chillconnect.com / manager123`)
  console.log(`Employee1: employee1@chillconnect.com / employee1123`)
  console.log(`Provider1: provider1@chillconnect.com / provider1123`)
  console.log(`Seeker1: seeker1@chillconnect.com / seeker1123`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })