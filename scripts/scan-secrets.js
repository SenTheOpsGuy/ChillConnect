#!/usr/bin/env node

/**
 * Secret Scanner - Prevents credentials from being committed
 * Scans staged files for potential secrets, passwords, API keys
 */

const fs = require('fs')
const { execSync } = require('child_process')

// Patterns to detect secrets
const SECRET_PATTERNS = [
  // Generic passwords
  {
    pattern: /password\s*[:=]\s*['"](?!test-password|your-password|placeholder)[^'"]{6,}['"]/,
    description: 'Hard-coded password',
  },
  { pattern: /pwd\s*[:=]\s*['"][^'"]{6,}['"]/, description: 'Hard-coded password (pwd)' },

  // API Keys
  {
    pattern: /api_?key\s*[:=]\s*['"](?!your-api-key|placeholder|test)[^'"]{10,}['"]/,
    description: 'API Key',
  },
  {
    pattern: /secret_?key\s*[:=]\s*['"](?!your-secret|placeholder|test)[^'"]{10,}['"]/,
    description: 'Secret Key',
  },
  { pattern: /access_?token\s*[:=]\s*['"][^'"]{10,}['"]/, description: 'Access Token' },

  // Database URLs
  {
    pattern: /postgres:\/\/[^:]+:[^@]+@[^/]+\//,
    description: 'PostgreSQL connection string with credentials',
  },
  {
    pattern: /mysql:\/\/[^:]+:[^@]+@[^/]+\//,
    description: 'MySQL connection string with credentials',
  },
  {
    pattern: /mongodb:\/\/[^:]+:[^@]+@[^/]+\//,
    description: 'MongoDB connection string with credentials',
  },

  // JWT Secrets
  {
    pattern: /jwt_?secret\s*[:=]\s*['"](?!your-jwt-secret|test)[^'"]{10,}['"]/,
    description: 'JWT Secret',
  },

  // Cloud Provider Keys
  { pattern: /AKIA[0-9A-Z]{16}/, description: 'AWS Access Key ID' },
  {
    pattern: /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/,
    description: 'UUID/GUID (potential secret)',
  },

  // Private Keys
  { pattern: /-----BEGIN\s+(RSA\s+)?PRIVATE KEY-----/, description: 'Private Key' },
  { pattern: /-----BEGIN\s+OPENSSH PRIVATE KEY-----/, description: 'OpenSSH Private Key' },

  // GitHub Tokens
  { pattern: /gh[ps]_[A-Za-z0-9]{36}/, description: 'GitHub Token' },

  // Slack Tokens
  { pattern: /xox[baprs]-([0-9a-zA-Z]{10,48})/, description: 'Slack Token' },

  // Email with actual domain (not example.com)
  {
    pattern:
      /['"][a-zA-Z0-9._%+-]+@(?!example\.com|test\.com|localhost)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}['"]/,
    description: 'Real email address',
  },
]

// Files to ignore
const IGNORE_FILES = [
  'package-lock.json',
  'node_modules',
  '.git',
  'dist',
  'build',
  '.secrets.baseline',
  'scan-secrets.js', // Don't scan this file itself
  'SECURITY.md', // Contains example credentials for documentation
]

// File extensions to scan
const SCAN_EXTENSIONS = [
  '.js',
  '.jsx',
  '.ts',
  '.tsx',
  '.json',
  '.yaml',
  '.yml',
  '.md',
  '.env',
  '.txt',
]

function getStagedFiles() {
  try {
    const stagedFiles = execSync('git diff --cached --name-only', { encoding: 'utf8' })
      .split('\n')
      .filter(file => file.trim())
      .filter(file => !IGNORE_FILES.some(ignore => file.includes(ignore)))
      .filter(file => SCAN_EXTENSIONS.some(ext => file.endsWith(ext)))
    return stagedFiles
  } catch (error) {
    console.error('Error getting staged files:', error.message)
    return []
  }
}

function scanFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return []
  }

  const content = fs.readFileSync(filePath, 'utf8')
  const lines = content.split('\n')
  const findings = []

  lines.forEach((line, index) => {
    SECRET_PATTERNS.forEach(({ pattern, description }) => {
      if (pattern.test(line)) {
        findings.push({
          file: filePath,
          line: index + 1,
          content: line.trim(),
          description,
          severity: 'HIGH',
        })
      }
    })
  })

  return findings
}

function main() {
  // eslint-disable-next-line no-console
  console.log('🔍 Scanning for secrets and credentials...')

  const stagedFiles = getStagedFiles()

  if (stagedFiles.length === 0) {
    console.log('✅ No files to scan.')
    return
  }

  console.log(`📁 Scanning ${stagedFiles.length} staged files...`)

  const totalFindings = []

  stagedFiles.forEach(file => {
    const findings = scanFile(file)
    if (findings.length > 0) {
      totalFindings.push(...findings)
    }
  })

  if (totalFindings.length === 0) {
    console.log('✅ No secrets detected in staged files.')
    return
  }

  // Report findings
  console.log('\n🚨 SECURITY ALERT: Potential secrets detected!')
  console.log('═'.repeat(60))

  totalFindings.forEach(finding => {
    console.log(`\n📄 File: ${finding.file}:${finding.line}`)
    console.log(`🔍 Issue: ${finding.description}`)
    console.log(`📝 Content: ${finding.content}`)
    console.log(`⚠️  Severity: ${finding.severity}`)
  })

  console.log('\n🛡️  Security Recommendations:')
  console.log('   • Move credentials to environment variables')
  console.log('   • Use .env files (and ensure they are .gitignored)')
  console.log('   • Use process.env.VARIABLE_NAME in code')
  console.log('   • Review and remove any exposed secrets')

  console.log('\n❌ Commit blocked to prevent credential exposure!')
  process.exit(1)
}

if (require.main === module) {
  main()
}

module.exports = { scanFile, SECRET_PATTERNS }
