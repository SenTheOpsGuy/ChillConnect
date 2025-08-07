const puppeteer = require('puppeteer');
const fs = require('fs');

// Track issues found
let issues = [];
let currentPage = '';

function logIssue(severity, description, details = '') {
  const issue = {
    page: currentPage,
    severity, // 'critical', 'high', 'medium', 'low'
    description,
    details,
    timestamp: new Date().toISOString()
  };
  issues.push(issue);
  console.log(`🚨 ${severity.toUpperCase()} ISSUE on ${currentPage}: ${description}`);
  if (details) console.log(`   Details: ${details}`);
}

async function testAdminDashboard(page) {
  currentPage = 'Admin Dashboard';
  console.log(`\n🔍 Testing ${currentPage}...`);
  
  try {
    await page.goto('https://chillconnect.in/admin/dashboard', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // Check for errors in console
    const errors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if page title/header exists
    const pageHeader = await page.$('h1, h2, .dashboard-title');
    if (!pageHeader) {
      logIssue('medium', 'No clear page title/header found');
    }
    
    // Check for loading states or errors
    const errorElement = await page.$('[role="alert"], .error, .error-message');
    if (errorElement) {
      const errorText = await page.evaluate(el => el.textContent, errorElement);
      logIssue('high', 'Error message displayed on page', errorText);
    }
    
    // Check stats cards
    const statsCards = await page.$$('.stat-card, [class*="stat"], [class*="metric"]');
    console.log(`📊 Found ${statsCards.length} stats cards`);
    
    if (statsCards.length === 0) {
      logIssue('medium', 'No statistics cards found on dashboard');
    }
    
    // Check recent activity section
    const activitySection = await page.$('[class*="activity"], [class*="recent"]');
    if (!activitySection) {
      logIssue('medium', 'No recent activity section found');
    }
    
    // Take screenshot
    await page.screenshot({ 
      path: `/tmp/admin-dashboard-test.png`, 
      fullPage: true 
    });
    
    console.log(`✅ ${currentPage} basic structure test completed`);
    
  } catch (error) {
    logIssue('critical', 'Page failed to load or crashed', error.message);
  }
}

async function testUserManagement(page) {
  currentPage = 'User Management';
  console.log(`\n🔍 Testing ${currentPage}...`);
  
  try {
    // Click on User Management link
    await page.click('[href*="user"], a:contains("User Management"), nav a:contains("User")');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}`);
    
    if (!currentUrl.includes('user')) {
      logIssue('high', 'User Management navigation failed - URL does not contain "user"');
    }
    
    // Check for user table/list
    const userTable = await page.$('table, .user-list, [class*="user-table"]');
    if (!userTable) {
      logIssue('high', 'No user table or list found');
    }
    
    // Check for search functionality
    const searchInput = await page.$('input[type="search"], input[placeholder*="search" i]');
    if (!searchInput) {
      logIssue('medium', 'No search functionality found');
    }
    
    // Check for action buttons
    const actionButtons = await page.$$('button:contains("Edit"), button:contains("Delete"), button:contains("View")');
    console.log(`🔘 Found ${actionButtons.length} action buttons`);
    
    // Take screenshot
    await page.screenshot({ 
      path: `/tmp/admin-user-management-test.png`, 
      fullPage: true 
    });
    
    console.log(`✅ ${currentPage} test completed`);
    
  } catch (error) {
    logIssue('critical', 'User Management page failed', error.message);
  }
}

async function testVerificationQueue(page) {
  currentPage = 'Verification Queue';
  console.log(`\n🔍 Testing ${currentPage}...`);
  
  try {
    await page.click('[href*="verification"], a:contains("Verification"), nav a:contains("Queue")');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}`);
    
    // Check for verification items
    const verificationItems = await page.$$('.verification-item, [class*="verification"], .queue-item');
    console.log(`📋 Found ${verificationItems.length} verification items`);
    
    // Check for approve/reject buttons
    const approveButtons = await page.$$('button:contains("Approve"), button:contains("Accept")');
    const rejectButtons = await page.$$('button:contains("Reject"), button:contains("Decline")');
    
    console.log(`✅ Found ${approveButtons.length} approve buttons`);
    console.log(`❌ Found ${rejectButtons.length} reject buttons`);
    
    if (approveButtons.length === 0 && rejectButtons.length === 0) {
      logIssue('high', 'No approve/reject buttons found in verification queue');
    }
    
    // Take screenshot
    await page.screenshot({ 
      path: `/tmp/admin-verification-queue-test.png`, 
      fullPage: true 
    });
    
    console.log(`✅ ${currentPage} test completed`);
    
  } catch (error) {
    logIssue('critical', 'Verification Queue page failed', error.message);
  }
}

async function testBookingMonitoring(page) {
  currentPage = 'Booking Monitoring';
  console.log(`\n🔍 Testing ${currentPage}...`);
  
  try {
    await page.click('[href*="booking"], a:contains("Booking"), nav a:contains("Monitor")');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}`);
    
    // Check for booking list/table
    const bookingsList = await page.$('table, .booking-list, [class*="booking"]');
    if (!bookingsList) {
      logIssue('high', 'No bookings list or table found');
    }
    
    // Check for filters
    const filters = await page.$$('select, .filter, [class*="filter"]');
    console.log(`🔍 Found ${filters.length} filter elements`);
    
    // Check for status indicators
    const statusElements = await page.$$('[class*="status"], .badge, .chip');
    console.log(`🏷️ Found ${statusElements.length} status indicators`);
    
    // Take screenshot
    await page.screenshot({ 
      path: `/tmp/admin-booking-monitoring-test.png`, 
      fullPage: true 
    });
    
    console.log(`✅ ${currentPage} test completed`);
    
  } catch (error) {
    logIssue('critical', 'Booking Monitoring page failed', error.message);
  }
}

async function testAdminMessages(page) {
  currentPage = 'Admin Messages';
  console.log(`\n🔍 Testing ${currentPage}...`);
  
  try {
    await page.click('[href*="message"], a:contains("Messages"), nav a:contains("Chat")');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}`);
    
    // Check for chat interface
    const chatInterface = await page.$('.chat, [class*="message"], .conversation');
    if (!chatInterface) {
      logIssue('high', 'No chat interface found');
    }
    
    // Check for message input
    const messageInput = await page.$('input[type="text"], textarea, [contenteditable="true"]');
    if (!messageInput) {
      logIssue('medium', 'No message input field found');
    }
    
    // Take screenshot
    await page.screenshot({ 
      path: `/tmp/admin-messages-test.png`, 
      fullPage: true 
    });
    
    console.log(`✅ ${currentPage} test completed`);
    
  } catch (error) {
    logIssue('critical', 'Admin Messages page failed', error.message);
  }
}

async function testAdminWallet(page) {
  currentPage = 'Admin Wallet';
  console.log(`\n🔍 Testing ${currentPage}...`);
  
  try {
    await page.click('[href*="wallet"], a:contains("Wallet"), nav a:contains("Wallet")');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}`);
    
    // Check for wallet balance
    const balanceElement = await page.$('[class*="balance"], .wallet-balance, .amount');
    if (!balanceElement) {
      logIssue('medium', 'No wallet balance display found');
    }
    
    // Check for transaction history
    const transactionsList = await page.$('table, .transaction-list, [class*="transaction"]');
    if (!transactionsList) {
      logIssue('medium', 'No transaction history found');
    }
    
    // Take screenshot
    await page.screenshot({ 
      path: `/tmp/admin-wallet-test.png`, 
      fullPage: true 
    });
    
    console.log(`✅ ${currentPage} test completed`);
    
  } catch (error) {
    logIssue('critical', 'Admin Wallet page failed', error.message);
  }
}

async function testAdminProfile(page) {
  currentPage = 'Admin Profile';
  console.log(`\n🔍 Testing ${currentPage}...`);
  
  try {
    await page.click('[href*="profile"], a:contains("Profile"), nav a:contains("Profile")');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}`);
    
    // Check for profile form
    const profileForm = await page.$('form, .profile-form, [class*="profile"]');
    if (!profileForm) {
      logIssue('high', 'No profile form found');
    }
    
    // Check for profile fields
    const profileFields = await page.$$('input, textarea, select');
    console.log(`📝 Found ${profileFields.length} form fields`);
    
    if (profileFields.length < 3) {
      logIssue('medium', 'Very few profile fields found - form might be incomplete');
    }
    
    // Take screenshot
    await page.screenshot({ 
      path: `/tmp/admin-profile-test.png`, 
      fullPage: true 
    });
    
    console.log(`✅ ${currentPage} test completed`);
    
  } catch (error) {
    logIssue('critical', 'Admin Profile page failed', error.message);
  }
}

async function testAdminSettings(page) {
  currentPage = 'Admin Settings';
  console.log(`\n🔍 Testing ${currentPage}...`);
  
  try {
    await page.click('[href*="settings"], a:contains("Settings"), nav a:contains("Settings")');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}`);
    
    // Check for settings sections
    const settingSections = await page.$$('.setting-section, [class*="setting"], .config');
    console.log(`⚙️ Found ${settingSections.length} setting sections`);
    
    if (settingSections.length === 0) {
      logIssue('high', 'No settings sections found');
    }
    
    // Check for save button
    const saveButton = await page.$('button:contains("Save"), button[type="submit"]');
    if (!saveButton) {
      logIssue('medium', 'No save button found in settings');
    }
    
    // Take screenshot
    await page.screenshot({ 
      path: `/tmp/admin-settings-test.png`, 
      fullPage: true 
    });
    
    console.log(`✅ ${currentPage} test completed`);
    
  } catch (error) {
    logIssue('critical', 'Admin Settings page failed', error.message);
  }
}

(async () => {
  console.log('🚀 Starting comprehensive admin pages testing...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    devtools: false,
    args: ['--disable-web-security', '--disable-features=VizDisplayCompositor']
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Enable console logging
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.log(`❌ Frontend Error [${currentPage}]:`, msg.text());
      }
    });
    
    // Login first
    console.log('🔐 Logging into admin account...');
    await page.goto('https://chillconnect.in/employee-login', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    await page.type('input[type="email"]', 'sentheopsguy@gmail.com');
    await page.type('input[type="password"]', 'voltas-beko');
    await page.click('button[type="submit"]');
    
    // Wait for login redirect
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('✅ Admin login completed');
    
    // Test each admin page
    await testAdminDashboard(page);
    await testUserManagement(page);
    await testVerificationQueue(page);
    await testBookingMonitoring(page);
    await testAdminMessages(page);
    await testAdminWallet(page);
    await testAdminProfile(page);
    await testAdminSettings(page);
    
    // Generate test report
    console.log('\n📊 ADMIN PAGES TEST REPORT');
    console.log('===========================');
    console.log(`Total Issues Found: ${issues.length}`);
    
    const criticalIssues = issues.filter(i => i.severity === 'critical');
    const highIssues = issues.filter(i => i.severity === 'high');
    const mediumIssues = issues.filter(i => i.severity === 'medium');
    const lowIssues = issues.filter(i => i.severity === 'low');
    
    console.log(`🔴 Critical: ${criticalIssues.length}`);
    console.log(`🟠 High: ${highIssues.length}`);
    console.log(`🟡 Medium: ${mediumIssues.length}`);
    console.log(`🟢 Low: ${lowIssues.length}`);
    
    console.log('\n🔍 DETAILED ISSUES:');
    issues.forEach((issue, index) => {
      console.log(`${index + 1}. [${issue.severity.toUpperCase()}] ${issue.page}: ${issue.description}`);
      if (issue.details) console.log(`   └─ ${issue.details}`);
    });
    
    // Save issues to file
    fs.writeFileSync('/tmp/admin-issues.json', JSON.stringify(issues, null, 2));
    console.log('\n💾 Issues saved to /tmp/admin-issues.json');
    console.log('📸 Screenshots saved to /tmp/admin-*-test.png');
    
  } catch (error) {
    console.error('❌ Testing failed:', error);
  } finally {
    await browser.close();
  }
})();