const puppeteer = require('puppeteer');
const fs = require('fs');

// Test configuration
const config = {
  baseUrl: 'https://chillconnect.in',
  timeout: 30000,
  viewport: { width: 1920, height: 1080 },
  headless: false
};

// Test results tracking
let testResults = {
  timestamp: new Date().toISOString(),
  totalTests: 0,
  passedTests: 0,
  failedTests: 0,
  issues: [],
  detailedResults: {}
};

// Helper function for delays
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

class ChillConnectTester {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  async initialize() {
    console.log('🚀 Initializing ChillConnect Test Suite...');
    this.browser = await puppeteer.launch({
      headless: config.headless,
      defaultViewport: config.viewport,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    this.page = await this.browser.newPage();
    await this.page.setDefaultTimeout(config.timeout);
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  addIssue(severity, title, description, page = 'Unknown') {
    testResults.issues.push({
      severity,
      title,
      description,
      page,
      timestamp: new Date().toISOString()
    });
  }

  async runTest(testName, testFunction) {
    console.log(`\n🧪 Testing: ${testName}`);
    testResults.totalTests++;
    
    try {
      await testFunction();
      testResults.passedTests++;
      testResults.detailedResults[testName] = { status: 'PASSED' };
      console.log(`✅ ${testName} - PASSED`);
    } catch (error) {
      testResults.failedTests++;
      testResults.detailedResults[testName] = { status: 'FAILED', error: error.message };
      console.log(`❌ ${testName} - FAILED: ${error.message}`);
      this.addIssue('high', testName, error.message);
    }
  }

  async testLandingPage() {
    await this.page.goto(config.baseUrl);
    await wait(3000);
    
    const title = await this.page.title();
    if (!title.includes('ChillConnect')) {
      throw new Error(`Unexpected page title: ${title}`);
    }

    // Check for essential elements
    const navExists = await this.page.$('nav') !== null;
    const headerExists = await this.page.$('header') !== null;
    
    if (!navExists && !headerExists) {
      this.addIssue('medium', 'Missing Navigation', 'No nav or header found', 'Landing');
    }

    console.log(`📄 Page title: ${title}`);
  }

  async testRegisterPage() {
    await this.page.goto(`${config.baseUrl}/register`);
    await wait(2000);
    
    const form = await this.page.$('form');
    if (!form) {
      throw new Error('Registration form not found');
    }

    // Check for required form fields
    const emailInput = await this.page.$('input[type="email"]');
    const passwordInput = await this.page.$('input[type="password"]');
    
    if (!emailInput) {
      this.addIssue('high', 'Missing Email Input', 'No email input field found', 'Register');
    }
    
    if (!passwordInput) {
      this.addIssue('high', 'Missing Password Input', 'No password input field found', 'Register');
    }

    console.log(`📝 Registration form found with ${emailInput ? '✅' : '❌'} email and ${passwordInput ? '✅' : '❌'} password fields`);
  }

  async testLoginPage() {
    await this.page.goto(`${config.baseUrl}/login`);
    await wait(2000);
    
    const form = await this.page.$('form');
    if (!form) {
      throw new Error('Login form not found');
    }

    const emailInput = await this.page.$('input[type="email"]');
    const passwordInput = await this.page.$('input[type="password"]');
    const submitButton = await this.page.$('button[type="submit"]');
    
    if (!emailInput || !passwordInput || !submitButton) {
      this.addIssue('high', 'Incomplete Login Form', 'Missing essential login form elements', 'Login');
    }

    console.log(`🔐 Login form complete: ${emailInput && passwordInput && submitButton ? '✅' : '❌'}`);
  }

  async testSearch() {
    await this.page.goto(`${config.baseUrl}/search`);
    await wait(3000);
    
    // Check if redirected to login
    const currentUrl = this.page.url();
    if (currentUrl.includes('/login')) {
      console.log('🔒 Search redirected to login (expected for protected route)');
      return;
    }

    const searchInput = await this.page.$('input[type="text"]');
    if (!searchInput) {
      this.addIssue('medium', 'Missing Search Input', 'No search input field found', 'Search');
    }

    console.log(`🔍 Search page: ${searchInput ? 'Has search input ✅' : 'Missing search input ❌'}`);
  }

  async testBookingsPage() {
    await this.page.goto(`${config.baseUrl}/bookings`);
    await wait(2000);
    
    const currentUrl = this.page.url();
    const pageContent = await this.page.content();
    
    if (pageContent.includes('404') || pageContent.includes('Not Found')) {
      throw new Error('Bookings page shows 404 error');
    }
    
    if (currentUrl.includes('/login')) {
      console.log('🔒 Bookings redirected to login (expected for protected route)');
    } else {
      console.log('📅 Bookings page loaded successfully');
    }
  }

  async testPrivacyPolicy() {
    await this.page.goto(`${config.baseUrl}/privacy-policy`);
    await wait(2000);
    
    const pageContent = await this.page.content();
    if (pageContent.includes('404') || pageContent.includes('Not Found')) {
      throw new Error('Privacy Policy page shows 404 error');
    }

    console.log('📋 Privacy Policy page loaded');
  }

  async testTermsOfService() {
    await this.page.goto(`${config.baseUrl}/terms-of-service`);
    await wait(2000);
    
    const pageContent = await this.page.content();
    if (pageContent.includes('404') || pageContent.includes('Not Found')) {
      throw new Error('Terms of Service page shows 404 error');
    }

    console.log('📋 Terms of Service page loaded');
  }

  async testCommunityGuidelines() {
    await this.page.goto(`${config.baseUrl}/community-guidelines`);
    await wait(2000);
    
    const pageContent = await this.page.content();
    if (pageContent.includes('404') || pageContent.includes('Not Found')) {
      throw new Error('Community Guidelines page shows 404 error');
    }

    console.log('📋 Community Guidelines page loaded');
  }

  async testEmployeeLogin() {
    await this.page.goto(`${config.baseUrl}/employee-login`);
    await wait(2000);
    
    const form = await this.page.$('form');
    if (!form) {
      throw new Error('Employee login form not found');
    }

    console.log('👨‍💼 Employee login form found');

    // Try to fill and submit admin login
    try {
      const emailInput = await this.page.$('input[type="email"]');
      const passwordInput = await this.page.$('input[type="password"]');
      
      if (emailInput && passwordInput) {
        await emailInput.type('admin@chillconnect.com');
        await passwordInput.type('SuperSecurePassword123!');
        
        const submitButton = await this.page.$('button[type="submit"]');
        if (submitButton) {
          await submitButton.click();
          await wait(3000);
          
          const currentUrl = this.page.url();
          if (currentUrl.includes('admin')) {
            console.log('✅ Admin login successful');
            return true;
          } else {
            this.addIssue('high', 'Admin Login Failed', 'Admin login did not redirect to admin area', 'Employee Login');
          }
        }
      }
    } catch (error) {
      this.addIssue('high', 'Admin Login Error', error.message, 'Employee Login');
    }
    
    return false;
  }

  async testAdminDashboard() {
    // First try to login as admin
    const loginSuccess = await this.testEmployeeLogin();
    if (!loginSuccess) {
      await this.page.goto(`${config.baseUrl}/admin/dashboard`);
      await wait(3000);
    }
    
    const pageContent = await this.page.content();
    if (pageContent.includes('404')) {
      throw new Error('Admin dashboard shows 404 error');
    }

    const hasTitle = await this.page.$('h1') !== null;
    if (!hasTitle) {
      this.addIssue('medium', 'Missing Dashboard Title', 'No main heading found on admin dashboard', 'Admin Dashboard');
    }

    console.log(`📊 Admin dashboard: ${hasTitle ? 'Has title ✅' : 'Missing title ❌'}`);
  }

  async testUserManagement() {
    await this.page.goto(`${config.baseUrl}/admin/users`);
    await wait(3000);
    
    const currentUrl = this.page.url();
    const pageContent = await this.page.content();
    
    if (pageContent.includes('404')) {
      throw new Error('User Management page shows 404 error');
    }

    if (currentUrl.includes('/login')) {
      console.log('🔒 User Management redirected to login (auth required)');
    } else {
      console.log('👥 User Management page accessible');
    }
  }

  async testVerificationQueue() {
    await this.page.goto(`${config.baseUrl}/admin/verification-queue`);
    await wait(3000);
    
    const currentUrl = this.page.url();
    const pageContent = await this.page.content();
    
    if (pageContent.includes('404')) {
      throw new Error('Verification Queue page shows 404 error');
    }

    if (currentUrl.includes('/login')) {
      console.log('🔒 Verification Queue redirected to login (auth required)');
    } else {
      // Check if page content is meaningful (not blank)
      if (pageContent.length < 1000) {
        this.addIssue('high', 'Verification Queue Empty', 'Verification queue page has minimal content', 'Verification Queue');
      }
      console.log('✅ Verification Queue page accessible');
    }
  }

  async runAllTests() {
    try {
      await this.initialize();
      
      console.log('\n🌟 ChillConnect Comprehensive Test Suite');
      console.log('=' .repeat(50));

      // Basic page tests
      await this.runTest('Landing Page', () => this.testLandingPage());
      await this.runTest('Register Page', () => this.testRegisterPage());
      await this.runTest('Login Page', () => this.testLoginPage());
      await this.runTest('Search Page', () => this.testSearch());
      await this.runTest('Bookings Page', () => this.testBookingsPage());
      await this.runTest('Privacy Policy', () => this.testPrivacyPolicy());
      await this.runTest('Terms of Service', () => this.testTermsOfService());
      await this.runTest('Community Guidelines', () => this.testCommunityGuidelines());
      
      // Admin tests
      await this.runTest('Employee Login', () => this.testEmployeeLogin());
      await this.runTest('Admin Dashboard', () => this.testAdminDashboard());
      await this.runTest('User Management', () => this.testUserManagement());
      await this.runTest('Verification Queue', () => this.testVerificationQueue());
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
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
        mediumIssues: testResults.issues.filter(i => i.severity === 'medium').length
      }
    };

    // Generate action items
    const actionItems = [];
    testResults.issues.forEach(issue => {
      actionItems.push({
        priority: issue.severity === 'critical' ? 'high' : issue.severity,
        task: `Fix: ${issue.title}`,
        description: issue.description,
        page: issue.page
      });
    });

    reportData.actionItems = actionItems;

    const reportPath = '/tmp/chillconnect-test-final.json';
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));

    console.log('\n📊 TEST RESULTS SUMMARY');
    console.log('=' .repeat(50));
    console.log(`✅ Tests Passed: ${testResults.passedTests}/${testResults.totalTests} (${reportData.summary.successRate})`);
    console.log(`❌ Tests Failed: ${testResults.failedTests}`);
    console.log(`🚨 Issues Found: ${testResults.issues.length}`);
    
    if (testResults.issues.length > 0) {
      console.log('\n🔍 ISSUES FOUND:');
      testResults.issues.forEach((issue, i) => {
        console.log(`${i + 1}. [${issue.severity.toUpperCase()}] ${issue.title}`);
        console.log(`   📍 ${issue.page}: ${issue.description}`);
      });

      console.log('\n📋 ACTION ITEMS GENERATED:');
      actionItems.forEach((item, i) => {
        console.log(`${i + 1}. [${item.priority.toUpperCase()}] ${item.task}`);
        console.log(`   ${item.description}`);
      });
    }

    console.log(`\n📄 Full Report: ${reportPath}`);
    return reportData;
  }
}

// Run the test suite
if (require.main === module) {
  const tester = new ChillConnectTester();
  tester.runAllTests().catch(console.error);
}

module.exports = ChillConnectTester;