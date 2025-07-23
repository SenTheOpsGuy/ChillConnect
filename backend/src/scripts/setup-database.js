const { exec } = require('child_process')
const path = require('path')
const fs = require('fs')

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
}

function log(message, color = 'reset') {
  console.log(colors[color] + message + colors.reset)
}

function execCommand(command, description) {
  return new Promise((resolve, reject) => {
    log(`\n${description}...`, 'blue')
    log(`Running: ${command}`, 'cyan')
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        log(`Error: ${error.message}`, 'red')
        reject(error)
        return
      }
      
      if (stderr) {
        log(`Warning: ${stderr}`, 'yellow')
      }
      
      if (stdout) {
        log(stdout, 'green')
      }
      
      log(`✓ ${description} completed`, 'green')
      resolve()
    })
  })
}

async function setupDatabase() {
  try {
    log('='.repeat(50), 'magenta')
    log('ChillConnect Database Setup', 'magenta')
    log('='.repeat(50), 'magenta')

    // Check if .env file exists
    const envPath = path.join(__dirname, '../../.env')
    if (!fs.existsSync(envPath)) {
      log('⚠️  .env file not found!', 'red')
      log('Please copy .env.example to .env and configure your database settings', 'yellow')
      log('cp .env.example .env', 'cyan')
      process.exit(1)
    }

    // Load environment variables
    require('dotenv').config({ path: envPath })

    if (!process.env.DATABASE_URL) {
      log('⚠️  DATABASE_URL not configured in .env file!', 'red')
      log('Please set your DATABASE_URL in the .env file', 'yellow')
      process.exit(1)
    }

    log('Environment variables loaded ✓', 'green')
    log(`Database URL: ${process.env.DATABASE_URL.replace(/:[^:@]+@/, ':***@')}`, 'cyan')

    // Generate Prisma client
    await execCommand('npx prisma generate', 'Generating Prisma client')

    // Push database schema (creates tables)
    await execCommand('npx prisma db push', 'Pushing database schema')

    // Run migrations (if any)
    try {
      await execCommand('npx prisma migrate dev --name init', 'Running database migrations')
    } catch (error) {
      log('Migration might already exist, continuing...', 'yellow')
    }

    // Seed the database
    await execCommand('node src/scripts/seed.js', 'Seeding database with initial data')

    log('\n' + '='.repeat(50), 'green')
    log('DATABASE SETUP COMPLETED SUCCESSFULLY!', 'green')
    log('='.repeat(50), 'green')
    
    log('\nTest accounts created:', 'magenta')
    log('Super Admin: admin@chillconnect.com / admin123', 'cyan')
    log('Manager: manager@chillconnect.com / manager123', 'cyan')
    log('Employee: employee1@chillconnect.com / employee1123', 'cyan')
    log('Provider: provider1@chillconnect.com / provider1123', 'cyan')
    log('Seeker: seeker1@chillconnect.com / seeker1123', 'cyan')
    
    log('\nNext steps:', 'magenta')
    log('1. Start the backend server: npm run dev', 'cyan')
    log('2. Start the frontend: cd ../frontend && npm run dev', 'cyan')
    log('3. Test the login with any of the accounts above', 'cyan')
    
  } catch (error) {
    log('\n' + '='.repeat(50), 'red')
    log('DATABASE SETUP FAILED!', 'red')
    log('='.repeat(50), 'red')
    log(`Error: ${error.message}`, 'red')
    process.exit(1)
  }
}

// Check if we're in the correct directory
const currentDir = process.cwd()
const backendDir = path.join(currentDir, 'backend')
const packageJsonPath = path.join(currentDir, 'package.json')

if (currentDir.includes('backend')) {
  // We're already in the backend directory
  setupDatabase()
} else if (fs.existsSync(packageJsonPath)) {
  // We're in the root directory, check if backend exists
  if (fs.existsSync(backendDir)) {
    log('Changing to backend directory...', 'blue')
    process.chdir(backendDir)
    setupDatabase()
  } else {
    log('Backend directory not found!', 'red')
    process.exit(1)
  }
} else {
  log('Please run this script from the project root or backend directory', 'red')
  process.exit(1)
}