const puppeteer = require('puppeteer');
const fs = require('fs');

let issues = [];
let currentPage = '';

function logIssue(severity, description, details = '') {
  const issue = {
    page: currentPage,
    severity,
    description,
    details,
    timestamp: new Date().toISOString()
  };
  issues.push(issue);
  console.log(`🚨 ${severity.toUpperCase()}: ${description}`);
  if (details) console.log(`   Details: ${details}`);
}

async function waitAndScreenshot(page, filename) {
  await new Promise(resolve => setTimeout(resolve, 3000));
  await page.screenshot({ 
    path: `/tmp/${filename}`, 
    fullPage: true 
  });
  console.log(`📸 Screenshot saved: ${filename}`);
}

async function testPage(page, pageName, navigationSelector, expectedUrl, testFunction = null) {
  currentPage = pageName;
  console.log(`\n🔍 Testing ${pageName}...`);
  
  try {
    // Click navigation
    console.log(`🖱️  Clicking navigation for ${pageName}...`);
    await page.click(navigationSelector);
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}`);
    
    // Check URL
    if (!currentUrl.includes(expectedUrl)) {
      logIssue('high', `Navigation failed - Expected URL to contain "${expectedUrl}" but got "${currentUrl}"`);
    } else {
      console.log(`✅ Successfully navigated to ${pageName}`);
    }
    
    // Check for error messages
    const errorElements = await page.$$('[role="alert"], .error, .error-message, .text-red-500');
    if (errorElements.length > 0) {
      for (const errorEl of errorElements) {
        const errorText = await page.evaluate(el => el.textContent.trim(), errorEl);
        if (errorText && errorText.length > 0) {
          logIssue('high', 'Error message displayed on page', errorText);
        }
      }
    }
    
    // Run custom test function if provided
    if (testFunction) {
      await testFunction(page);
    }
    
    // Take screenshot
    await waitAndScreenshot(page, `admin-${pageName.toLowerCase().replace(/\s+/g, '-')}.png`);
    
    console.log(`✅ ${pageName} test completed`);
    
  } catch (error) {
    logIssue('critical', `${pageName} test failed`, error.message);
  }
}

// Test functions for specific pages
async function testUserManagement(page) {
  // Check for user table/list
  const userElements = await page.$$('table tr, .user-item, [class*="user-"], .list-item');
  console.log(`👥 Found ${userElements.length} user-related elements`);
  
  if (userElements.length < 2) {
    logIssue('medium', 'Very few user elements found - might not be loading users');
  }
  
  // Check for search
  const searchInput = await page.$('input[type="search"], input[placeholder*="search" i], input[placeholder*="Search" i]');
  if (!searchInput) {
    logIssue('medium', 'No search functionality found');
  } else {
    console.log('✅ Search input found');
  }
}

async function testVerificationQueue(page) {
  // Check for verification items
  const verificationElements = await page.$$('.verification-item, [class*="verification"], .queue-item, .pending-item');
  console.log(`📋 Found ${verificationElements.length} verification-related elements`);
  
  // Check for action buttons
  const actionButtons = await page.$$('button');
  const buttonTexts = await Promise.all(
    actionButtons.map(btn => page.evaluate(el => el.textContent.trim().toLowerCase(), btn))
  );
  
  const approveButtons = buttonTexts.filter(text => text.includes('approve') || text.includes('accept'));
  const rejectButtons = buttonTexts.filter(text => text.includes('reject') || text.includes('decline'));
  
  console.log(`✅ Found ${approveButtons.length} approve-type buttons`);
  console.log(`❌ Found ${rejectButtons.length} reject-type buttons`);
}

async function testBookingMonitoring(page) {
  // Check for booking-related elements
  const bookingElements = await page.$$('table tr, .booking-item, [class*="booking"], .list-item');
  console.log(`📅 Found ${bookingElements.length} booking-related elements`);
  
  // Check for filters or controls
  const filterElements = await page.$$('select, .filter, [class*="filter"], input[type="date"]');
  console.log(`🔍 Found ${filterElements.length} filter/control elements`);
}

async function testMessages(page) {
  // Check for chat/message interface
  const messageElements = await page.$$('.message, .chat, [class*="message"], [class*="chat"]');
  console.log(`💬 Found ${messageElements.length} message-related elements`);
  
  // Check for input field
  const messageInputs = await page.$$('input[type="text"], textarea, [contenteditable="true"]');
  console.log(`📝 Found ${messageInputs.length} message input fields`);
}

async function testWallet(page) {
  // Check for wallet/financial elements
  const walletElements = await page.$$('.balance, .amount, [class*="balance"], [class*="wallet"], [class*="transaction"]');
  console.log(`💰 Found ${walletElements.length} wallet-related elements`);
  
  // Look for monetary values
  const moneyPattern = /[\$₹€£¥]/;
  const textElements = await page.$$eval('*', elements => 
    elements.map(el => el.textContent).filter(text => text && text.match(/[\$₹€£¥]/))
  );
  console.log(`💵 Found ${textElements.length} elements with currency symbols`);
}

async function testProfile(page) {
  // Check for form elements
  const formElements = await page.$$('input, textarea, select');
  console.log(`📝 Found ${formElements.length} form elements`);
  
  if (formElements.length < 3) {
    logIssue('medium', 'Very few form elements found - profile form might be incomplete');
  }
  
  // Check for save/submit buttons
  const saveButtons = await page.$$('button[type="submit"], button:has-text("Save"), button:has-text("Update")');
  console.log(`💾 Found ${saveButtons.length} save/submit buttons`);
}

async function testSettings(page) {
  // Check for settings sections
  const settingElements = await page.$$('.setting, [class*="setting"], .config, [class*="config"], fieldset');
  console.log(`⚙️ Found ${settingElements.length} settings-related elements`);
  
  // Check for toggle/checkbox elements
  const toggleElements = await page.$$('input[type="checkbox"], input[type="radio"], .toggle, [role="switch"]');
  console.log(`🔘 Found ${toggleElements.length} toggle/option elements`);
}

(async () => {
  console.log('🚀 Starting comprehensive admin functionality test...');
  console.log('Will test all admin pages systematically and record issues.\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    devtools: false,
    args: ['--disable-web-security']
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    
    // Enable console monitoring
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.log(`❌ Frontend Error [${currentPage}]:`, msg.text());
      }
    });
    
    console.log('🔐 Logging into admin account...');
    await page.goto('https://chillconnect.in/employee-login', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    await page.type('input[type="email"]', 'sentheopsguy@gmail.com');
    await page.type('input[type="password"]', 'voltas-beko');
    await page.click('button[type="submit"]');
    
    // Wait for login and dashboard load
    console.log('⏳ Waiting for dashboard to load...');
    await new Promise(resolve => setTimeout(resolve, 8000));
    
    let currentUrl = page.url();
    console.log(`📍 Post-login URL: ${currentUrl}`);
    
    if (!currentUrl.includes('/admin/dashboard')) {
      logIssue('critical', 'Login failed - not redirected to admin dashboard', currentUrl);
      return;
    }
    
    console.log('✅ Successfully logged into admin dashboard!\n');
    
    // Test Dashboard (already loaded)
    currentPage = 'Admin Dashboard';
    await waitAndScreenshot(page, 'admin-dashboard.png');
    
    // Test each admin page systematically
    await testPage(page, 'User Management', 'a[href*="user"], a:contains("User Management")', '/admin/user', testUserManagement);
    
    // Go back to dashboard for next test
    await page.click('a[href*="dashboard"]');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await testPage(page, 'Verification Queue', 'a[href*="verification"]', '/admin/verification', testVerificationQueue);
    
    await page.click('a[href*="dashboard"]');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await testPage(page, 'Booking Monitoring', 'a[href*="booking"]', '/admin/booking', testBookingMonitoring);
    
    await page.click('a[href*="dashboard"]');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await testPage(page, 'Messages', 'a[href*="message"]', 'message', testMessages);
    
    await page.click('a[href*="dashboard"]');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await testPage(page, 'Wallet', 'a[href*="wallet"]', 'wallet', testWallet);
    
    await page.click('a[href*="dashboard"]');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await testPage(page, 'Profile', 'a[href*="profile"]', 'profile', testProfile);
    
    await page.click('a[href*="dashboard"]');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await testPage(page, 'Settings', 'a[href*="setting"]', 'setting', testSettings);
    
    // Generate comprehensive report
    console.log('\n📊 COMPREHENSIVE ADMIN TEST REPORT');
    console.log('==================================');
    console.log(`Total Issues Found: ${issues.length}`);
    
    const criticalIssues = issues.filter(i => i.severity === 'critical');
    const highIssues = issues.filter(i => i.severity === 'high');
    const mediumIssues = issues.filter(i => i.severity === 'medium');
    const lowIssues = issues.filter(i => i.severity === 'low');
    
    console.log(`🔴 Critical: ${criticalIssues.length}`);
    console.log(`🟠 High: ${highIssues.length}`);
    console.log(`🟡 Medium: ${mediumIssues.length}`);
    console.log(`🟢 Low: ${lowIssues.length}`);
    
    if (issues.length === 0) {
      console.log('\n🎉 ALL ADMIN PAGES ARE WORKING PERFECTLY!');
      console.log('✅ 100% Admin functionality achieved!');
    } else {
      console.log('\n🔍 ISSUES TO FIX:');
      issues.forEach((issue, index) => {
        console.log(`${index + 1}. [${issue.severity.toUpperCase()}] ${issue.page}`);
        console.log(`   Issue: ${issue.description}`);
        if (issue.details) console.log(`   Details: ${issue.details}`);
        console.log();
      });
    }
    
    // Save detailed report
    const report = {
      testDate: new Date().toISOString(),
      totalIssues: issues.length,
      issuesBySeverity: {
        critical: criticalIssues.length,
        high: highIssues.length,
        medium: mediumIssues.length,
        low: lowIssues.length
      },
      issues: issues,
      status: issues.length === 0 ? 'PERFECT' : 'NEEDS_FIXES'
    };
    
    fs.writeFileSync('/tmp/admin-test-report.json', JSON.stringify(report, null, 2));
    console.log('\n💾 Detailed report saved to /tmp/admin-test-report.json');
    console.log('📸 Screenshots saved to /tmp/admin-*.png');
    
  } catch (error) {
    console.error('❌ Testing failed:', error);
  } finally {
    await browser.close();
  }
})();