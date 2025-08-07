#!/usr/bin/env node

/**
 * Automated Test and Fix Loop for ChillConnect Issues
 * 
 * This script will:
 * 1. Test forgot password functionality
 * 2. Test admin login functionality  
 * 3. Identify issues automatically
 * 4. Deploy fixes when needed
 * 5. Continue loop until both issues are resolved
 */

const puppeteer = require('puppeteer');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  FRONTEND_URL: 'https://chillconnect.in',
  TEST_EMAIL: 'mountainsagegiri@gmail.com',
  ADMIN_EMAIL: 'admin@chillconnect.com', 
  ADMIN_PASSWORD: 'SuperSecurePassword123!',
  MAX_ITERATIONS: 10,
  WAIT_BETWEEN_TESTS: 30000, // 30 seconds
  DEPLOYMENT_WAIT: 120000,   // 2 minutes
};

class ChillConnectTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.iteration = 0;
    this.issues = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '🔍',
      success: '✅', 
      error: '❌',
      warning: '⚠️',
      deploy: '🚀'
    }[type] || '📝';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async initialize() {
    this.log('Initializing browser and page');
    this.browser = await puppeteer.launch({
      headless: false, // Set to true for headless mode
      defaultViewport: { width: 1280, height: 720 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    this.page = await this.browser.newPage();
    
    // Listen to console logs from the page
    this.page.on('console', msg => {
      if (msg.text().includes('🔍') || msg.text().includes('❌') || msg.text().includes('✅')) {
        this.log(`Browser Console: ${msg.text()}`);
      }
    });
    
    // Listen to network requests
    this.page.on('response', response => {
      if (response.url().includes('/api/')) {
        this.log(`API Call: ${response.request().method()} ${response.url()} - Status: ${response.status()}`);
      }
    });
  }

  async testForgotPassword() {
    this.log('Testing forgot password functionality');
    
    try {
      // Navigate to forgot password page
      await this.page.goto(`${CONFIG.FRONTEND_URL}/forgot-password`, { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });
      
      // Check if page loaded
      const title = await this.page.title();
      this.log(`Page title: ${title}`);
      
      // Fill email field
      await this.page.waitForSelector('input[type="email"]', { timeout: 10000 });
      await this.page.type('input[type="email"]', CONFIG.TEST_EMAIL);
      
      // Click send button
      await this.page.click('button[type="submit"]');
      
      // Wait for response and check for success/error
      await this.page.waitForTimeout(5000);
      
      // Check for success message or error
      const pageContent = await this.page.content();
      
      if (pageContent.includes('Check Your Email') || pageContent.includes('Password reset email sent')) {
        this.log('Forgot password test PASSED', 'success');
        return { success: true, issue: null };
      } else if (pageContent.includes('Failed to send reset email')) {
        this.log('Forgot password test FAILED - Failed to send reset email', 'error');
        return { success: false, issue: 'FORGOT_PASSWORD_API_ERROR' };
      } else {
        this.log('Forgot password test FAILED - Unknown error', 'error');
        return { success: false, issue: 'FORGOT_PASSWORD_UNKNOWN' };
      }
      
    } catch (error) {
      this.log(`Forgot password test ERROR: ${error.message}`, 'error');
      return { success: false, issue: 'FORGOT_PASSWORD_EXCEPTION', details: error.message };
    }
  }

  async testAdminLogin() {
    this.log('Testing admin login functionality');
    
    try {
      // Navigate to employee login page
      await this.page.goto(`${CONFIG.FRONTEND_URL}/employee-login`, { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });
      
      // Fill login form
      await this.page.waitForSelector('input[name="email"]', { timeout: 10000 });
      await this.page.type('input[name="email"]', CONFIG.ADMIN_EMAIL);
      await this.page.type('input[name="password"]', CONFIG.ADMIN_PASSWORD);
      
      // Click login button
      await this.page.click('button[type="submit"]');
      
      // Wait for navigation or error
      await this.page.waitForTimeout(8000);
      
      const currentUrl = this.page.url();
      this.log(`After login, current URL: ${currentUrl}`);
      
      if (currentUrl.includes('/admin/dashboard')) {
        this.log('Admin login test PASSED - Redirected to admin dashboard', 'success');
        return { success: true, issue: null };
      } else if (currentUrl.includes('/employee-login')) {
        this.log('Admin login test FAILED - Redirected back to employee login', 'error');
        return { success: false, issue: 'ADMIN_LOGIN_REDIRECT_LOOP' };
      } else if (currentUrl.includes('/dashboard')) {
        this.log('Admin login test FAILED - Redirected to regular dashboard instead of admin', 'error');
        return { success: false, issue: 'ADMIN_LOGIN_WRONG_REDIRECT' };
      } else {
        this.log(`Admin login test FAILED - Unexpected URL: ${currentUrl}`, 'error');
        return { success: false, issue: 'ADMIN_LOGIN_UNKNOWN' };
      }
      
    } catch (error) {
      this.log(`Admin login test ERROR: ${error.message}`, 'error');
      return { success: false, issue: 'ADMIN_LOGIN_EXCEPTION', details: error.message };
    }
  }

  async deployFix(issues) {
    this.log('Analyzing issues and deploying fixes', 'deploy');
    
    let fixApplied = false;
    
    for (const issue of issues) {
      switch (issue) {
        case 'FORGOT_PASSWORD_API_ERROR':
          this.log('Applying fix for forgot password API error', 'deploy');
          await this.fixForgotPasswordAPI();
          fixApplied = true;
          break;
          
        case 'ADMIN_LOGIN_REDIRECT_LOOP':
        case 'ADMIN_LOGIN_WRONG_REDIRECT':
          this.log('Applying fix for admin login redirect issue', 'deploy');
          await this.fixAdminLoginRedirect();
          fixApplied = true;
          break;
          
        default:
          this.log(`Unknown issue: ${issue}`, 'warning');
      }
    }
    
    if (fixApplied) {
      this.log('Committing and pushing fixes', 'deploy');
      this.gitCommitAndPush(`Automated fix deployment - iteration ${this.iteration}`);
      
      this.log(`Waiting ${CONFIG.DEPLOYMENT_WAIT/1000} seconds for deployment`, 'deploy');
      await new Promise(resolve => setTimeout(resolve, CONFIG.DEPLOYMENT_WAIT));
    }
    
    return fixApplied;
  }

  async fixForgotPasswordAPI() {
    // Check current API endpoints and fix if needed
    const authServicePath = '/Users/rishovsen/ChillConnect/frontend/src/services/authService.js';
    let content = fs.readFileSync(authServicePath, 'utf8');
    
    // Fix forgot password endpoint
    if (content.includes("'/forgot-password'")) {
      content = content.replace("'/forgot-password'", "'/auth/forgot-password'");
      this.log('Fixed forgot password API endpoint path');
    }
    
    // Fix reset password endpoint  
    if (content.includes("'/reset-password'")) {
      content = content.replace("'/reset-password'", "'/auth/reset-password'");
      this.log('Fixed reset password API endpoint path');
    }
    
    // Add cache-busting version
    const version = Date.now();
    content = content.replace(
      /console\.log\('🔍 AuthService - Making API call to \/auth\/forgot-password for:'.*?\)/,
      `console.log('🔍 AuthService - Making API call to /auth/forgot-password for:', email, '(v${version})')`
    );
    
    fs.writeFileSync(authServicePath, content, 'utf8');
  }

  async fixAdminLoginRedirect() {
    // Fix routing issues in App.jsx
    const appPath = '/Users/rishovsen/ChillConnect/frontend/src/App.jsx';
    let content = fs.readFileSync(appPath, 'utf8');
    
    // Ensure all authenticated redirects check for admin roles
    const adminRoleCheck = `user && ['EMPLOYEE', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'].includes(user.role) ? (
                  <Navigate to="/admin/dashboard" replace />
                ) : (
                  <Navigate to="/dashboard" replace />
                )`;
    
    // Replace simple dashboard redirects with role-based ones
    content = content.replace(
      /<Navigate to="\/dashboard" replace \/>/g,
      adminRoleCheck
    );
    
    fs.writeFileSync(appPath, content, 'utf8');
  }

  gitCommitAndPush(message) {
    try {
      execSync('git add .', { cwd: '/Users/rishovsen/ChillConnect', stdio: 'pipe' });
      execSync(`git commit -m "${message}"`, { cwd: '/Users/rishovsen/ChillConnect', stdio: 'pipe' });
      execSync('git push origin main', { cwd: '/Users/rishovsen/ChillConnect', stdio: 'pipe' });
      this.log('Successfully pushed changes to GitHub');
    } catch (error) {
      this.log(`Git operation failed: ${error.message}`, 'error');
    }
  }

  async runTestLoop() {
    this.log(`Starting automated test and fix loop (max ${CONFIG.MAX_ITERATIONS} iterations)`);
    
    await this.initialize();
    
    for (this.iteration = 1; this.iteration <= CONFIG.MAX_ITERATIONS; this.iteration++) {
      this.log(`\n=== ITERATION ${this.iteration} ===`);
      
      // Test both functionalities
      const forgotPasswordResult = await this.testForgotPassword();
      const adminLoginResult = await this.testAdminLogin();
      
      // Collect issues
      const currentIssues = [];
      if (!forgotPasswordResult.success) currentIssues.push(forgotPasswordResult.issue);
      if (!adminLoginResult.success) currentIssues.push(adminLoginResult.issue);
      
      // Check if all tests passed
      if (forgotPasswordResult.success && adminLoginResult.success) {
        this.log('🎉 ALL TESTS PASSED! Both forgot password and admin login are working correctly.', 'success');
        break;
      }
      
      // Apply fixes if issues found
      if (currentIssues.length > 0) {
        this.log(`Found ${currentIssues.length} issue(s): ${currentIssues.join(', ')}`);
        
        const fixApplied = await this.deployFix(currentIssues);
        
        if (!fixApplied) {
          this.log('No automated fix available for current issues', 'warning');
          break;
        }
      }
      
      // Wait before next iteration
      if (this.iteration < CONFIG.MAX_ITERATIONS) {
        this.log(`Waiting ${CONFIG.WAIT_BETWEEN_TESTS/1000} seconds before next test`);
        await new Promise(resolve => setTimeout(resolve, CONFIG.WAIT_BETWEEN_TESTS));
      }
    }
    
    if (this.iteration > CONFIG.MAX_ITERATIONS) {
      this.log('Maximum iterations reached. Some issues may still exist.', 'warning');
    }
    
    await this.cleanup();
  }

  async cleanup() {
    this.log('Cleaning up browser resources');
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Main execution
async function main() {
  const tester = new ChillConnectTester();
  
  try {
    await tester.runTestLoop();
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = ChillConnectTester;