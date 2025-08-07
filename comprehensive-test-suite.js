const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Test configuration
const config = {
  baseUrl: 'https://chillconnect.in',
  timeout: 30000,
  viewport: { width: 1920, height: 1080 },
  headless: false, // Set to true for CI/CD
  slowMo: 100 // Slow down actions for debugging
};

// Test data
const testUsers = {
  seeker: {
    email: 'test.seeker@example.com',
    password: 'TestSeeker123!',
    firstName: 'John',
    lastName: 'Seeker',
    phone: '+1234567890',
    dateOfBirth: '1990-01-01'
  },
  provider: {
    email: 'test.provider@example.com',
    password: 'TestProvider123!',
    firstName: 'Jane',
    lastName: 'Provider',
    phone: '+1234567891',
    dateOfBirth: '1985-01-01'
  },
  admin: {
    email: 'admin@chillconnect.com',
    password: 'SuperSecurePassword123!'
  }
};

// Test results tracking
let testResults = {
  timestamp: new Date().toISOString(),
  totalTests: 0,
  passedTests: 0,
  failedTests: 0,
  issues: [],
  actionItems: [],
  detailedResults: {}
};

class ChillConnectTester {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  async initialize() {
    console.log('🚀 Initializing ChillConnect Test Suite...');
    this.browser = await puppeteer.launch({
      headless: config.headless,
      slowMo: config.slowMo,
      defaultViewport: config.viewport,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    this.page = await this.browser.newPage();
    await this.page.setDefaultTimeout(config.timeout);
    
    // Listen for console logs and errors
    this.page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.log('🔴 Console Error:', msg.text());
      }
    });

    this.page.on('pageerror', (error) => {
      console.log('🔴 Page Error:', error.message);
      this.addIssue('critical', 'Page JavaScript Error', error.message);
    });
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  addIssue(severity, title, description, page = 'Unknown') {
    testResults.issues.push({
      severity, // 'critical', 'high', 'medium', 'low'
      title,
      description,
      page,
      timestamp: new Date().toISOString()
    });
  }

  addActionItem(priority, task, description) {
    testResults.actionItems.push({
      priority, // 'high', 'medium', 'low'
      task,
      description,
      status: 'pending',
      timestamp: new Date().toISOString()
    });
  }

  async runTest(testName, testFunction) {
    console.log(`\n🧪 Running Test: ${testName}`);
    testResults.totalTests++;
    
    try {
      const startTime = Date.now();
      await testFunction();
      const duration = Date.now() - startTime;
      
      testResults.passedTests++;
      testResults.detailedResults[testName] = {
        status: 'PASSED',
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      };
      
      console.log(`✅ ${testName} - PASSED (${duration}ms)`);
    } catch (error) {
      testResults.failedTests++;
      testResults.detailedResults[testName] = {
        status: 'FAILED',
        error: error.message,
        timestamp: new Date().toISOString()
      };
      
      console.log(`❌ ${testName} - FAILED: ${error.message}`);
      this.addIssue('high', `Test Failed: ${testName}`, error.message);
    }
  }

  async takeScreenshot(name) {
    const screenshotPath = `/tmp/${name}-${Date.now()}.png`;
    await this.page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`📸 Screenshot saved: ${screenshotPath}`);
    return screenshotPath;
  }

  async waitForSelector(selector, options = {}) {
    try {
      return await this.page.waitForSelector(selector, { timeout: 10000, ...options });
    } catch (error) {
      await this.takeScreenshot(`selector-not-found-${selector.replace(/[^a-zA-Z0-9]/g, '-')}`);
      throw new Error(`Selector not found: ${selector}`);
    }
  }

  // LANDING PAGE TESTS
  async testLandingPage() {
    await this.page.goto(config.baseUrl);
    await this.page.waitForTimeout(3000); // Wait for page to load
    
    // Check if page loads
    const title = await this.page.title();
    if (!title.includes('ChillConnect')) {
      throw new Error(`Unexpected page title: ${title}`);
    }
    
    // Check essential elements
    const elements = [
      'header nav',
      '.cta-button, [href*="register"]',
      '[href*="login"]',
      'footer'
    ];
    
    for (const selector of elements) {
      const element = await this.page.$(selector);
      if (!element) {
        this.addIssue('medium', 'Missing Element', `Landing page missing: ${selector}`, 'Landing');
      }
    }
  }

  // USER REGISTRATION TESTS
  async testSeekerSignup() {
    await this.page.goto(`${config.baseUrl}/register`);
    await this.waitForSelector('form');

    // Fill registration form
    await this.page.type('input[name="firstName"], input[placeholder*="First"]', testUsers.seeker.firstName);
    await this.page.type('input[name="lastName"], input[placeholder*="Last"]', testUsers.seeker.lastName);
    await this.page.type('input[name="email"], input[type="email"]', testUsers.seeker.email);
    await this.page.type('input[name="phone"], input[type="tel"]', testUsers.seeker.phone);
    await this.page.type('input[name="dateOfBirth"], input[type="date"]', testUsers.seeker.dateOfBirth);
    await this.page.type('input[name="password"], input[type="password"]', testUsers.seeker.password);
    
    // Select user type
    const seekerRadio = await this.page.$('input[value="SEEKER"], input[value="seeker"]');
    if (seekerRadio) {
      await seekerRadio.click();
    }
    
    // Accept terms
    const termsCheckbox = await this.page.$('input[type="checkbox"]');
    if (termsCheckbox) {
      await termsCheckbox.click();
    }
    
    // Submit form
    await this.page.click('button[type="submit"], .submit-btn');
    await this.page.waitForTimeout(3000);
    
    // Check for success or error
    const currentUrl = this.page.url();
    if (currentUrl.includes('verify') || currentUrl.includes('dashboard')) {
      console.log('✅ Seeker registration successful');
    } else {
      await this.takeScreenshot('seeker-signup-failed');
      throw new Error('Seeker registration failed - no redirect to verification or dashboard');
    }
  }

  async testProviderSignup() {
    await this.page.goto(`${config.baseUrl}/register`);
    await this.waitForSelector('form');

    // Fill registration form
    await this.page.fill('input[name="firstName"], input[placeholder*="First"]', testUsers.provider.firstName);
    await this.page.fill('input[name="lastName"], input[placeholder*="Last"]', testUsers.provider.lastName);
    await this.page.fill('input[name="email"], input[type="email"]', testUsers.provider.email);
    await this.page.fill('input[name="phone"], input[type="tel"]', testUsers.provider.phone);
    await this.page.fill('input[name="dateOfBirth"], input[type="date"]', testUsers.provider.dateOfBirth);
    await this.page.fill('input[name="password"], input[type="password"]', testUsers.provider.password);
    
    // Select provider type
    const providerRadio = await this.page.$('input[value="PROVIDER"], input[value="provider"]');
    if (providerRadio) {
      await providerRadio.click();
    }
    
    // Accept terms
    const termsCheckbox = await this.page.$('input[type="checkbox"]');
    if (termsCheckbox) {
      await termsCheckbox.click();
    }
    
    // Submit form
    await this.page.click('button[type="submit"], .submit-btn');
    await this.page.waitForTimeout(3000);
    
    // Check for success
    const currentUrl = this.page.url();
    if (currentUrl.includes('verify') || currentUrl.includes('dashboard')) {
      console.log('✅ Provider registration successful');
    } else {
      await this.takeScreenshot('provider-signup-failed');
      throw new Error('Provider registration failed');
    }
  }

  // LOGIN TESTS
  async testSeekerLogin() {
    await this.page.goto(`${config.baseUrl}/login`);
    await this.waitForSelector('form');

    await this.page.fill('input[type="email"]', testUsers.seeker.email);
    await this.page.fill('input[type="password"]', testUsers.seeker.password);
    await this.page.click('button[type="submit"], .login-btn');
    
    await this.page.waitForTimeout(3000);
    
    const currentUrl = this.page.url();
    if (currentUrl.includes('dashboard') || currentUrl.includes('search')) {
      console.log('✅ Seeker login successful');
    } else {
      await this.takeScreenshot('seeker-login-failed');
      throw new Error('Seeker login failed');
    }
  }

  async testProviderLogin() {
    await this.page.goto(`${config.baseUrl}/login`);
    await this.waitForSelector('form');

    await this.page.fill('input[type="email"]', testUsers.provider.email);
    await this.page.fill('input[type="password"]', testUsers.provider.password);
    await this.page.click('button[type="submit"], .login-btn');
    
    await this.page.waitForTimeout(3000);
    
    const currentUrl = this.page.url();
    if (currentUrl.includes('dashboard')) {
      console.log('✅ Provider login successful');
    } else {
      await this.takeScreenshot('provider-login-failed');
      throw new Error('Provider login failed');
    }
  }

  // SEEKER FLOW TESTS
  async testSearchFunctionality() {
    // Ensure logged in as seeker
    await this.testSeekerLogin();
    
    await this.page.goto(`${config.baseUrl}/search`);
    await this.waitForSelector('.search-container, .search-form, form');

    // Test search input
    const searchInput = await this.page.$('input[type="text"], input[placeholder*="search"]');
    if (searchInput) {
      await searchInput.fill('massage');
      await this.page.keyboard.press('Enter');
      await this.page.waitForTimeout(2000);
    }

    // Check for results
    const results = await this.page.$$('.provider-card, .search-result, .service-card');
    if (results.length === 0) {
      this.addIssue('medium', 'No Search Results', 'Search functionality returns no results', 'Search');
    }
    
    console.log(`Found ${results.length} search results`);
  }

  async testBookingFlow() {
    await this.page.goto(`${config.baseUrl}/search`);
    await this.waitForSelector('.provider-card, .search-result, .service-card');

    // Click on first provider
    const firstProvider = await this.page.$('.provider-card, .search-result, .service-card');
    if (!firstProvider) {
      throw new Error('No providers found for booking test');
    }
    
    await firstProvider.click();
    await this.page.waitForTimeout(2000);

    // Look for booking button
    const bookingBtn = await this.page.$('button:has-text("Book"), .book-btn, [href*="booking"]');
    if (bookingBtn) {
      await bookingBtn.click();
      await this.page.waitForTimeout(2000);
      
      // Fill booking details if form appears
      const dateInput = await this.page.$('input[type="date"], input[type="datetime-local"]');
      if (dateInput) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        await dateInput.fill(tomorrow.toISOString().split('T')[0]);
      }
      
      // Submit booking
      const submitBtn = await this.page.$('button[type="submit"], .submit-booking');
      if (submitBtn) {
        await submitBtn.click();
        await this.page.waitForTimeout(3000);
        console.log('✅ Booking flow completed');
      }
    } else {
      this.addIssue('high', 'Missing Booking Button', 'No booking button found on provider page', 'Booking');
    }
  }

  async testChatFunctionality() {
    // Navigate to messages/chat
    await this.page.goto(`${config.baseUrl}/messages`);
    await this.page.waitForTimeout(2000);

    // Check if chat interface exists
    const chatInterface = await this.page.$('.chat-container, .messages-container, .chat-interface');
    if (!chatInterface) {
      this.addIssue('high', 'Missing Chat Interface', 'Chat/messaging interface not found', 'Chat');
      return;
    }

    // Test sending a message
    const messageInput = await this.page.$('input[type="text"], textarea, [contenteditable="true"]');
    if (messageInput) {
      await messageInput.fill('Test message from automated testing');
      
      const sendBtn = await this.page.$('.send-btn, button:has-text("Send"), [type="submit"]');
      if (sendBtn) {
        await sendBtn.click();
        await this.page.waitForTimeout(1000);
        console.log('✅ Chat message sent successfully');
      }
    }
  }

  // ADMIN TESTS
  async testAdminLogin() {
    await this.page.goto(`${config.baseUrl}/employee-login`);
    await this.waitForSelector('form');

    await this.page.fill('input[type="email"]', testUsers.admin.email);
    await this.page.fill('input[type="password"]', testUsers.admin.password);
    await this.page.click('button[type="submit"], .login-btn');
    
    await this.page.waitForTimeout(3000);
    
    const currentUrl = this.page.url();
    if (currentUrl.includes('admin')) {
      console.log('✅ Admin login successful');
    } else {
      await this.takeScreenshot('admin-login-failed');
      throw new Error('Admin login failed');
    }
  }

  async testAdminDashboard() {
    await this.page.goto(`${config.baseUrl}/admin/dashboard`);
    await this.page.waitForTimeout(3000);

    // Check for dashboard elements
    const elements = [
      'h1, h2, .dashboard-title',
      '.stats, .metrics, .stat-card',
      '.recent-activity, .activity-list'
    ];

    for (const selector of elements) {
      const element = await this.page.$(selector);
      if (!element) {
        this.addIssue('medium', 'Missing Dashboard Element', `Admin dashboard missing: ${selector}`, 'Admin Dashboard');
      }
    }
    
    // Test navigation to other admin pages
    const adminLinks = await this.page.$$('nav a, .sidebar a, .admin-nav a');
    console.log(`Found ${adminLinks.length} admin navigation links`);
  }

  async testUserManagement() {
    await this.page.goto(`${config.baseUrl}/admin/users`);
    await this.page.waitForTimeout(3000);

    // Check for user list
    const userTable = await this.page.$('table, .user-list, .users-grid');
    if (!userTable) {
      this.addIssue('high', 'Missing User Management Interface', 'User management table/list not found', 'User Management');
      return;
    }

    // Check for action buttons
    const actionButtons = await this.page.$$('button:has-text("Edit"), button:has-text("Delete"), .action-btn');
    if (actionButtons.length === 0) {
      this.addIssue('medium', 'Missing User Actions', 'No user action buttons found', 'User Management');
    }
    
    console.log(`Found ${actionButtons.length} user action buttons`);
  }

  async testVerificationQueue() {
    await this.page.goto(`${config.baseUrl}/admin/verification-queue`);
    await this.page.waitForTimeout(3000);

    // Check if verification queue loads
    const pageContent = await this.page.content();
    if (pageContent.includes('404') || pageContent.length < 1000) {
      this.addIssue('high', 'Verification Queue Not Working', 'Verification queue page not loading properly', 'Verification Queue');
      return;
    }

    // Check for verification items
    const verificationItems = await this.page.$$('.verification-item, .pending-verification, tr');
    console.log(`Found ${verificationItems.length} verification items`);

    // Check for approve/reject buttons
    const actionButtons = await this.page.$$('button:has-text("Approve"), button:has-text("Reject")');
    if (actionButtons.length === 0) {
      this.addIssue('medium', 'Missing Verification Actions', 'No approve/reject buttons found', 'Verification Queue');
    }
  }

  async testBookingMonitoring() {
    await this.page.goto(`${config.baseUrl}/admin/booking-monitoring`);
    await this.page.waitForTimeout(3000);

    const bookingsList = await this.page.$('table, .bookings-list, .monitoring-grid');
    if (!bookingsList) {
      this.addIssue('high', 'Missing Booking Monitor', 'Booking monitoring interface not found', 'Booking Monitoring');
      return;
    }

    console.log('✅ Booking monitoring interface found');
  }

  // MAIN TEST RUNNER
  async runAllTests() {
    try {
      await this.initialize();
      
      console.log('\n🌟 Starting Comprehensive ChillConnect Test Suite');
      console.log('=' .repeat(60));

      // Landing and Basic Tests
      await this.runTest('Landing Page Load', () => this.testLandingPage());
      
      // User Registration Tests
      await this.runTest('Seeker Signup', () => this.testSeekerSignup());
      await this.runTest('Provider Signup', () => this.testProviderSignup());
      
      // Login Tests
      await this.runTest('Seeker Login', () => this.testSeekerLogin());
      await this.runTest('Provider Login', () => this.testProviderLogin());
      
      // Seeker Flow Tests
      await this.runTest('Search Functionality', () => this.testSearchFunctionality());
      await this.runTest('Booking Flow', () => this.testBookingFlow());
      await this.runTest('Chat Functionality', () => this.testChatFunctionality());
      
      // Admin Tests
      await this.runTest('Admin Login', () => this.testAdminLogin());
      await this.runTest('Admin Dashboard', () => this.testAdminDashboard());
      await this.runTest('User Management', () => this.testUserManagement());
      await this.runTest('Verification Queue', () => this.testVerificationQueue());
      await this.runTest('Booking Monitoring', () => this.testBookingMonitoring());
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
      this.addIssue('critical', 'Test Suite Failure', error.message);
    } finally {
      await this.cleanup();
      await this.generateReport();
    }
  }

  async generateReport() {
    const reportData = {
      ...testResults,
      summary: {
        totalTests: testResults.totalTests,
        passedTests: testResults.passedTests,
        failedTests: testResults.failedTests,
        successRate: `${((testResults.passedTests / testResults.totalTests) * 100).toFixed(1)}%`,
        totalIssues: testResults.issues.length,
        criticalIssues: testResults.issues.filter(i => i.severity === 'critical').length,
        highIssues: testResults.issues.filter(i => i.severity === 'high').length,
        mediumIssues: testResults.issues.filter(i => i.severity === 'medium').length,
        lowIssues: testResults.issues.filter(i => i.severity === 'low').length
      }
    };

    // Generate action items based on issues
    this.generateActionItems();

    const reportPath = '/tmp/chillconnect-test-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));

    console.log('\n📊 TEST RESULTS SUMMARY');
    console.log('=' .repeat(60));
    console.log(`✅ Tests Passed: ${testResults.passedTests}/${testResults.totalTests} (${reportData.summary.successRate})`);
    console.log(`❌ Tests Failed: ${testResults.failedTests}`);
    console.log(`🚨 Issues Found: ${testResults.issues.length}`);
    console.log(`📋 Action Items: ${testResults.actionItems.length}`);
    console.log(`📄 Full Report: ${reportPath}`);

    return reportData;
  }

  generateActionItems() {
    // Convert issues to action items
    testResults.issues.forEach(issue => {
      let priority = 'medium';
      if (issue.severity === 'critical') priority = 'high';
      if (issue.severity === 'low') priority = 'low';

      this.addActionItem(
        priority,
        `Fix: ${issue.title}`,
        `${issue.description} (Page: ${issue.page})`
      );
    });

    // Add general improvement items
    if (testResults.failedTests > 0) {
      this.addActionItem('high', 'Fix Failed Tests', `${testResults.failedTests} tests are failing and need attention`);
    }

    if (testResults.issues.filter(i => i.severity === 'critical').length > 0) {
      this.addActionItem('high', 'Address Critical Issues', 'Critical issues found that may prevent app functionality');
    }
  }
}

// Run the test suite
if (require.main === module) {
  const tester = new ChillConnectTester();
  tester.runAllTests().catch(console.error);
}

module.exports = ChillConnectTester;