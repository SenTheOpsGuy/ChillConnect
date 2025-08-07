#!/usr/bin/env node

/**
 * Simple Automated Test and Fix Loop for ChillConnect Issues
 * Uses curl and direct API testing instead of browser automation
 */

const { execSync } = require('child_process');
const fs = require('fs');

// Configuration
const CONFIG = {
  FRONTEND_URL: 'https://chillconnect.in',
  API_URL: 'https://chillconnect-production.up.railway.app/api',
  TEST_EMAIL: 'mountainsagegiri@gmail.com',
  ADMIN_EMAIL: 'admin@chillconnect.com',
  ADMIN_PASSWORD: 'SuperSecurePassword123!',
  MAX_ITERATIONS: 5,
  DEPLOYMENT_WAIT: 90000, // 90 seconds
};

class SimpleChillConnectTester {
  constructor() {
    this.iteration = 0;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString().slice(11, 19);
    const prefix = {
      info: '🔍',
      success: '✅', 
      error: '❌',
      warning: '⚠️',
      deploy: '🚀'
    }[type] || '📝';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async testForgotPasswordAPI() {
    this.log('Testing forgot password API endpoint');
    
    try {
      // Test the API endpoint directly
      const response = execSync(`curl -s -w "%{http_code}" -X POST "${CONFIG.API_URL}/auth/forgot-password" \\
        -H "Content-Type: application/json" \\
        -H "Origin: ${CONFIG.FRONTEND_URL}" \\
        -d '{"email":"${CONFIG.TEST_EMAIL}"}'`, { encoding: 'utf8' });
      
      const httpCode = response.slice(-3);
      const body = response.slice(0, -3);
      
      this.log(`API Response: HTTP ${httpCode}, Body: ${body}`);
      
      if (httpCode === '200') {
        try {
          const jsonResponse = JSON.parse(body);
          if (jsonResponse.success) {
            this.log('Forgot password API test PASSED', 'success');
            return { success: true, issue: null };
          }
        } catch (e) {
          // JSON parse failed, but 200 status might still be success
        }
        this.log('Forgot password API test PASSED (200 status)', 'success');
        return { success: true, issue: null };
      } else if (httpCode === '404') {
        this.log('Forgot password API test FAILED - 404 Not Found', 'error');
        return { success: false, issue: 'FORGOT_PASSWORD_404' };
      } else {
        this.log(`Forgot password API test FAILED - HTTP ${httpCode}`, 'error');
        return { success: false, issue: 'FORGOT_PASSWORD_API_ERROR' };
      }
      
    } catch (error) {
      this.log(`Forgot password API test ERROR: ${error.message}`, 'error');
      return { success: false, issue: 'FORGOT_PASSWORD_NETWORK_ERROR' };
    }
  }

  async testAdminLoginAPI() {
    this.log('Testing admin login API endpoint');
    
    try {
      // Test the login API endpoint
      const response = execSync(`curl -s -w "%{http_code}" -X POST "${CONFIG.API_URL}/auth/login" \\
        -H "Content-Type: application/json" \\
        -H "Origin: ${CONFIG.FRONTEND_URL}" \\
        -d '{"email":"${CONFIG.ADMIN_EMAIL}","password":"${CONFIG.ADMIN_PASSWORD}"}'`, { encoding: 'utf8' });
      
      const httpCode = response.slice(-3);
      const body = response.slice(0, -3);
      
      this.log(`Login API Response: HTTP ${httpCode}, Body: ${body.slice(0, 200)}...`);
      
      if (httpCode === '200') {
        try {
          const jsonResponse = JSON.parse(body);
          if (jsonResponse.success && jsonResponse.data?.user?.role === 'SUPER_ADMIN') {
            this.log('Admin login API test PASSED', 'success');
            return { success: true, issue: null };
          } else if (jsonResponse.success) {
            this.log('Admin login API partially works but user role issue', 'warning');
            return { success: false, issue: 'ADMIN_LOGIN_ROLE_ISSUE' };
          }
        } catch (e) {
          this.log('Failed to parse login response', 'warning');
        }
        this.log('Admin login API test FAILED - Invalid response', 'error');
        return { success: false, issue: 'ADMIN_LOGIN_RESPONSE_ERROR' };
      } else if (httpCode === '401') {
        this.log('Admin login API test FAILED - Unauthorized (wrong credentials)', 'error');
        return { success: false, issue: 'ADMIN_LOGIN_CREDENTIALS' };
      } else if (httpCode === '400') {
        this.log('Admin login API test FAILED - Bad Request (validation error)', 'error');
        return { success: false, issue: 'ADMIN_LOGIN_VALIDATION' };
      } else {
        this.log(`Admin login API test FAILED - HTTP ${httpCode}`, 'error');
        return { success: false, issue: 'ADMIN_LOGIN_API_ERROR' };
      }
      
    } catch (error) {
      this.log(`Admin login API test ERROR: ${error.message}`, 'error');
      return { success: false, issue: 'ADMIN_LOGIN_NETWORK_ERROR' };
    }
  }

  async checkFrontendDeployment() {
    this.log('Checking frontend deployment version');
    
    try {
      // Check if the frontend has the latest changes
      const response = execSync(`curl -s "${CONFIG.FRONTEND_URL}" | grep -o 'index-[a-f0-9]*\\.js' | head -1`, { encoding: 'utf8' });
      const jsFile = response.trim();
      
      if (jsFile) {
        this.log(`Frontend JS bundle: ${jsFile}`);
        return jsFile;
      } else {
        this.log('Could not detect frontend JS bundle version', 'warning');
        return 'unknown';
      }
    } catch (error) {
      this.log(`Error checking frontend deployment: ${error.message}`, 'warning');
      return 'error';
    }
  }

  async deployFix(issues) {
    this.log(`Analyzing ${issues.length} issue(s) and deploying fixes`, 'deploy');
    
    let fixApplied = false;
    const timestamp = Date.now();
    
    for (const issue of issues) {
      switch (issue) {
        case 'FORGOT_PASSWORD_404':
          this.log('Applying fix for forgot password 404 error', 'deploy');
          await this.fixForgotPasswordEndpoint(timestamp);
          fixApplied = true;
          break;
          
        case 'ADMIN_LOGIN_CREDENTIALS':
          this.log('Applying fix for admin login credentials', 'deploy');
          await this.fixAdminCredentials();
          fixApplied = true;
          break;
          
        case 'ADMIN_LOGIN_VALIDATION':
          this.log('Applying fix for admin login validation', 'deploy');
          await this.fixAdminCredentials(); // Same fix - likely password hash issue
          fixApplied = true;
          break;
          
        case 'ADMIN_LOGIN_ROLE_ISSUE':
          this.log('Applying fix for admin role issues', 'deploy');
          await this.fixAdminRoles();
          fixApplied = true;
          break;
          
        default:
          this.log(`No automated fix available for: ${issue}`, 'warning');
      }
    }
    
    if (fixApplied) {
      this.log('Committing and pushing fixes', 'deploy');
      this.gitCommitAndPush(`Automated fix - iteration ${this.iteration} - ${timestamp}`);
      
      this.log(`Waiting ${CONFIG.DEPLOYMENT_WAIT/1000} seconds for deployment`, 'deploy');
      await new Promise(resolve => setTimeout(resolve, CONFIG.DEPLOYMENT_WAIT));
    }
    
    return fixApplied;
  }

  async fixForgotPasswordEndpoint(timestamp) {
    const authServicePath = '/Users/rishovsen/ChillConnect/frontend/src/services/authService.js';
    let content = fs.readFileSync(authServicePath, 'utf8');
    
    // Fix forgot password endpoint paths
    let modified = false;
    
    if (content.includes("'/forgot-password'")) {
      content = content.replace(/\'\/forgot-password\'/g, "'/auth/forgot-password'");
      this.log('Fixed: /forgot-password → /auth/forgot-password');
      modified = true;
    }
    
    if (content.includes("'/reset-password'")) {
      content = content.replace(/\'\/reset-password\'/g, "'/auth/reset-password'");
      this.log('Fixed: /reset-password → /auth/reset-password');
      modified = true;
    }
    
    // Add version marker for cache busting
    const versionMarker = `(v${timestamp})`;
    content = content.replace(
      /\(v\d+\)/g, 
      versionMarker
    );
    
    if (!content.includes(versionMarker)) {
      content = content.replace(
        'Making API call to /auth/forgot-password for:',
        `Making API call to /auth/forgot-password for:', email, '${versionMarker}', 'email`
      );
    }
    
    if (modified) {
      fs.writeFileSync(authServicePath, content, 'utf8');
      this.log('Updated authService.js with API endpoint fixes');
    }
  }

  async fixAdminCredentials() {
    this.log('Running backend script to fix admin password');
    
    try {
      execSync('cd /Users/rishovsen/ChillConnect/backend && node fix-admin-password.js', { stdio: 'pipe' });
      this.log('Admin password fixed in database');
    } catch (error) {
      this.log(`Failed to fix admin password: ${error.message}`, 'error');
    }
  }

  async fixAdminRoles() {
    const appPath = '/Users/rishovsen/ChillConnect/frontend/src/App.jsx';
    let content = fs.readFileSync(appPath, 'utf8');
    
    // Ensure proper role-based redirects for admin users
    const roleBasedRedirect = `isAuthenticated ? (
                user && ['EMPLOYEE', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'].includes(user.role) ? (
                  <Navigate to="/admin/dashboard" replace />
                ) : (
                  <Navigate to="/dashboard" replace />
                )
              ) :`;
    
    // Replace simple authentication redirects
    content = content.replace(
      /isAuthenticated \? \(\s*<Navigate to="\/dashboard" replace \/>\s*\) :/g,
      roleBasedRedirect
    );
    
    fs.writeFileSync(appPath, content, 'utf8');
    this.log('Updated App.jsx with role-based redirects');
  }

  gitCommitAndPush(message) {
    try {
      execSync('git add .', { cwd: '/Users/rishovsen/ChillConnect', stdio: 'pipe' });
      execSync(`git commit -m "${message}" || echo "No changes to commit"`, { cwd: '/Users/rishovsen/ChillConnect', stdio: 'pipe' });
      execSync('git push origin main', { cwd: '/Users/rishovsen/ChillConnect', stdio: 'pipe' });
      this.log('Successfully pushed changes to GitHub');
    } catch (error) {
      this.log(`Git operation failed: ${error.message}`, 'error');
    }
  }

  async runTestLoop() {
    this.log(`Starting automated test and fix loop (max ${CONFIG.MAX_ITERATIONS} iterations)`);
    
    for (this.iteration = 1; this.iteration <= CONFIG.MAX_ITERATIONS; this.iteration++) {
      this.log(`\n=== ITERATION ${this.iteration} ===`);
      
      // Check deployment version
      await this.checkFrontendDeployment();
      
      // Test both functionalities
      const forgotPasswordResult = await this.testForgotPasswordAPI();
      const adminLoginResult = await this.testAdminLoginAPI();
      
      // Collect issues
      const currentIssues = [];
      if (!forgotPasswordResult.success) currentIssues.push(forgotPasswordResult.issue);
      if (!adminLoginResult.success) currentIssues.push(adminLoginResult.issue);
      
      // Check if all tests passed
      if (forgotPasswordResult.success && adminLoginResult.success) {
        this.log('🎉 ALL TESTS PASSED! Both forgot password and admin login APIs are working correctly.', 'success');
        break;
      }
      
      // Apply fixes if issues found
      if (currentIssues.length > 0) {
        this.log(`Found ${currentIssues.length} issue(s): ${currentIssues.join(', ')}`);
        
        const fixApplied = await this.deployFix(currentIssues);
        
        if (!fixApplied) {
          this.log('No automated fix available for current issues', 'warning');
          this.log('Manual intervention may be required', 'warning');
          break;
        }
      }
    }
    
    if (this.iteration > CONFIG.MAX_ITERATIONS) {
      this.log('Maximum iterations reached. Some issues may still exist.', 'warning');
    }
    
    this.log('Test loop completed');
  }
}

// Main execution
async function main() {
  const tester = new SimpleChillConnectTester();
  
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

module.exports = SimpleChillConnectTester;