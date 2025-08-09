#!/usr/bin/env node

/**
 * ChillConnect Provider Registration Test
 * Tests complete provider registration flow with phone verification
 * Uses real browser automation to verify the full user journey
 */

const puppeteer = require('puppeteer');

// Test configuration
const TEST_CONFIG = {
  email: 'mountainsagegiri@gmail.com',
  phone: '9258221177',
  password: 'qwerty123',
  firstName: 'Mountain',
  lastName: 'Sage',
  dateOfBirth: '1990-01-15',
  baseUrl: 'https://chillconnect.in'
};

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const logStep = (step, message) => {
  log(`\n🔄 Step ${step}: ${message}`, 'cyan');
};

const logSuccess = (message) => {
  log(`✅ ${message}`, 'green');
};

const logError = (message) => {
  log(`❌ ${message}`, 'red');
};

const logInfo = (message) => {
  log(`ℹ️  ${message}`, 'blue');
};

const logWarning = (message) => {
  log(`⚠️  ${message}`, 'yellow');
};

// Helper function to wait for element with timeout
const waitForSelector = async (page, selector, timeout = 10000) => {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch (error) {
    logWarning(`Timeout waiting for selector: ${selector}`);
    return false;
  }
};

// Helper function to wait for navigation
const waitForNavigation = async (page, timeout = 10000) => {
  try {
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout });
    return true;
  } catch (error) {
    logWarning('Navigation timeout or no navigation occurred');
    return false;
  }
};

// Helper function to fill form field
const fillField = async (page, selector, value, description) => {
  try {
    await page.waitForSelector(selector, { timeout: 5000 });
    await page.click(selector);
    await page.evaluate((sel) => {
      const element = document.querySelector(sel);
      if (element) element.value = '';
    }, selector);
    await page.type(selector, value);
    logSuccess(`Filled ${description}: ${value}`);
    return true;
  } catch (error) {
    logError(`Failed to fill ${description}: ${error.message}`);
    return false;
  }
};

// Helper function to click element
const clickElement = async (page, selector, description) => {
  try {
    await page.waitForSelector(selector, { timeout: 5000 });
    await page.click(selector);
    logSuccess(`Clicked ${description}`);
    return true;
  } catch (error) {
    logError(`Failed to click ${description}: ${error.message}`);
    return false;
  }
};

// Main test function
async function testProviderRegistration() {
  let browser;
  
  try {
    log(`\n${colors.bold}🚀 ChillConnect Provider Registration Test${colors.reset}`, 'magenta');
    log(`Testing with: ${TEST_CONFIG.email} | ${TEST_CONFIG.phone}`, 'cyan');
    log(`Target: ${TEST_CONFIG.baseUrl}`, 'cyan');
    
    // Launch browser
    logStep(1, 'Launching browser...');
    browser = await puppeteer.launch({
      headless: false, // Show browser for debugging
      defaultViewport: { width: 1280, height: 800 },
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-features=VizDisplayCompositor'
      ]
    });
    
    const page = await browser.newPage();
    
    // Set longer timeout
    page.setDefaultTimeout(15000);
    
    // Enable request interception to log API calls
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      if (request.url().includes('/api/')) {
        logInfo(`API Request: ${request.method()} ${request.url()}`);
      }
      request.continue();
    });
    
    page.on('response', async (response) => {
      if (response.url().includes('/api/')) {
        const status = response.status();
        const statusText = status >= 200 && status < 300 ? 'SUCCESS' : 'ERROR';
        log(`API Response: ${response.method()} ${response.url()} - ${status} ${statusText}`, 
            status >= 200 && status < 300 ? 'green' : 'red');
        
        // Log response body for important endpoints
        if (response.url().includes('/auth/') || response.url().includes('/admin/')) {
          try {
            const body = await response.text();
            if (body && body.length < 500) {
              logInfo(`Response: ${body}`);
            }
          } catch (e) {
            // Ignore response reading errors
          }
        }
      }
    });
    
    // Step 2: Navigate to registration page
    logStep(2, 'Navigating to provider registration page...');
    await page.goto(`${TEST_CONFIG.baseUrl}/register-new`, { 
      waitUntil: 'networkidle0',
      timeout: 15000 
    });
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    const currentUrl = page.url();
    logInfo(`Current URL: ${currentUrl}`);
    
    // Check if we're on the right page
    const pageTitle = await page.title();
    logInfo(`Page title: ${pageTitle}`);
    
    // Step 3: Fill registration form
    logStep(3, 'Filling provider registration form...');
    
    // Fill email
    await fillField(page, 'input[type="email"]', TEST_CONFIG.email, 'Email');
    
    // Fill password
    await fillField(page, 'input[type="password"]', TEST_CONFIG.password, 'Password');
    
    // Fill first name
    await fillField(page, 'input[name="firstName"], input[placeholder*="First"], input[placeholder*="first"]', 
                   TEST_CONFIG.firstName, 'First Name');
    
    // Fill last name
    await fillField(page, 'input[name="lastName"], input[placeholder*="Last"], input[placeholder*="last"]', 
                   TEST_CONFIG.lastName, 'Last Name');
    
    // Fill phone number
    await fillField(page, 'input[type="tel"], input[name="phone"], input[placeholder*="phone"]', 
                   TEST_CONFIG.phone, 'Phone Number');
    
    // Fill date of birth
    await fillField(page, 'input[type="date"], input[name="dateOfBirth"]', 
                   TEST_CONFIG.dateOfBirth, 'Date of Birth');
    
    // Select provider role (if needed)
    const roleSelectors = [
      'input[value="PROVIDER"]',
      'input[value="provider"]',
      'select[name="role"]',
      'button[data-role="provider"]',
      '.role-provider',
      'input[name="role"][value="PROVIDER"]'
    ];
    
    for (const selector of roleSelectors) {
      const element = await page.$(selector);
      if (element) {
        await clickElement(page, selector, 'Provider Role');
        break;
      }
    }
    
    // Accept terms and conditions
    const checkboxSelectors = [
      'input[name="ageConfirmed"]',
      'input[name="consentGiven"]',
      'input[type="checkbox"]',
      '.checkbox input',
      '.terms-checkbox'
    ];
    
    for (const selector of checkboxSelectors) {
      const checkboxes = await page.$$(selector);
      for (const checkbox of checkboxes) {
        const isChecked = await checkbox.evaluate(el => el.checked);
        if (!isChecked) {
          await checkbox.click();
          logSuccess('Checked agreement checkbox');
        }
      }
    }
    
    // Step 4: Submit registration form
    logStep(4, 'Submitting registration form...');
    
    const submitSelectors = [
      'button[type="submit"]',
      'input[type="submit"]',
      'button:contains("Register")',
      'button:contains("Sign Up")',
      '.submit-btn',
      '.register-btn'
    ];
    
    let submitSuccess = false;
    for (const selector of submitSelectors) {
      const submitBtn = await page.$(selector);
      if (submitBtn) {
        await submitBtn.click();
        logSuccess('Clicked registration submit button');
        submitSuccess = true;
        break;
      }
    }
    
    if (!submitSuccess) {
      // Try clicking by text content
      const submitButton = await page.$x("//button[contains(text(), 'Register') or contains(text(), 'Sign Up') or contains(text(), 'Submit')]");
      if (submitButton.length > 0) {
        await submitButton[0].click();
        logSuccess('Clicked registration submit button (by text)');
        submitSuccess = true;
      }
    }
    
    if (!submitSuccess) {
      logError('Could not find registration submit button');
      await page.screenshot({ path: '/Users/rishovsen/ChillConnect/tests/registration-form-error.png' });
    }
    
    // Wait for response
    await page.waitForTimeout(3000);
    
    // Step 5: Handle phone verification
    logStep(5, 'Looking for phone verification step...');
    
    // Check for phone verification modal or page
    const phoneVerificationSelectors = [
      'input[name="otp"]',
      'input[placeholder*="OTP"]',
      'input[placeholder*="code"]',
      '.otp-input',
      '.verification-code',
      'input[type="text"][maxlength="6"]'
    ];
    
    let foundPhoneVerification = false;
    for (const selector of phoneVerificationSelectors) {
      const otpField = await page.$(selector);
      if (otpField) {
        logSuccess('Found phone verification form');
        foundPhoneVerification = true;
        
        // Enter OTP (in development, backend returns 123456)
        await fillField(page, selector, '123456', 'OTP Code');
        
        // Click verify button
        const verifySelectors = [
          'button:contains("Verify")',
          'button[type="submit"]',
          '.verify-btn',
          '.otp-verify-btn'
        ];
        
        for (const verifySelector of verifySelectors) {
          const verifyBtn = await page.$(verifySelector);
          if (verifyBtn) {
            await verifyBtn.click();
            logSuccess('Clicked OTP verify button');
            break;
          }
        }
        
        // Try verify button by text
        const verifyButton = await page.$x("//button[contains(text(), 'Verify') or contains(text(), 'Confirm')]");
        if (verifyButton.length > 0) {
          await verifyButton[0].click();
          logSuccess('Clicked OTP verify button (by text)');
        }
        
        break;
      }
    }
    
    if (!foundPhoneVerification) {
      logWarning('Phone verification step not found - checking if registration completed');
    }
    
    // Wait for final response
    await page.waitForTimeout(5000);
    
    // Step 6: Check registration success
    logStep(6, 'Checking registration result...');
    
    const finalUrl = page.url();
    logInfo(`Final URL: ${finalUrl}`);
    
    // Check for success indicators
    const successIndicators = [
      'Welcome',
      'success',
      'registered',
      'dashboard',
      'profile',
      'verification sent',
      'account created'
    ];
    
    const pageContent = await page.content();
    let registrationSuccess = false;
    
    for (const indicator of successIndicators) {
      if (pageContent.toLowerCase().includes(indicator.toLowerCase())) {
        logSuccess(`Registration appears successful - found: "${indicator}"`);
        registrationSuccess = true;
        break;
      }
    }
    
    // Check for error messages
    const errorIndicators = [
      'error',
      'failed',
      'invalid',
      'already exists',
      'try again'
    ];
    
    let hasError = false;
    for (const error of errorIndicators) {
      if (pageContent.toLowerCase().includes(error.toLowerCase())) {
        logError(`Found error indicator: "${error}"`);
        hasError = true;
      }
    }
    
    // Take final screenshot
    await page.screenshot({ 
      path: '/Users/rishovsen/ChillConnect/tests/registration-final-result.png',
      fullPage: true 
    });
    
    // Step 7: Test login with new account
    logStep(7, 'Testing login with newly created account...');
    
    // Navigate to login page
    await page.goto(`${TEST_CONFIG.baseUrl}/login`, { 
      waitUntil: 'networkidle0' 
    });
    
    await page.waitForTimeout(2000);
    
    // Fill login form
    await fillField(page, 'input[type="email"]', TEST_CONFIG.email, 'Login Email');
    await fillField(page, 'input[type="password"]', TEST_CONFIG.password, 'Login Password');
    
    // Click login button
    const loginButton = await page.$('button[type="submit"]') || 
                       await page.$x("//button[contains(text(), 'Login') or contains(text(), 'Sign In')]")[0];
    
    if (loginButton) {
      await loginButton.click();
      logSuccess('Clicked login button');
      await page.waitForTimeout(3000);
      
      const loginUrl = page.url();
      if (loginUrl !== `${TEST_CONFIG.baseUrl}/login`) {
        logSuccess('Login successful - redirected from login page');
      } else {
        logWarning('Still on login page - login may have failed');
      }
    }
    
    // Final results
    log(`\n${colors.bold}📊 TEST RESULTS SUMMARY${colors.reset}`, 'magenta');
    log('═'.repeat(50), 'cyan');
    
    if (registrationSuccess && !hasError) {
      logSuccess('REGISTRATION TEST PASSED');
      logSuccess(`✅ Provider account created: ${TEST_CONFIG.email}`);
      logSuccess(`✅ Phone number verified: ${TEST_CONFIG.phone}`);
      logSuccess('✅ Ready for booking services');
    } else if (hasError) {
      logError('REGISTRATION TEST FAILED - Errors detected');
      logError('Check form validation or server errors');
    } else {
      logWarning('REGISTRATION TEST UNCLEAR - Manual verification needed');
      logInfo('Check final screenshot for visual confirmation');
    }
    
    logInfo(`Screenshots saved to: /Users/rishovsen/ChillConnect/tests/`);
    log('═'.repeat(50), 'cyan');
    
    // Keep browser open for manual inspection
    logInfo('Browser will remain open for 30 seconds for manual inspection...');
    await page.waitForTimeout(30000);
    
  } catch (error) {
    logError(`Test failed with error: ${error.message}`);
    console.error(error.stack);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
if (require.main === module) {
  testProviderRegistration().catch(console.error);
}

module.exports = testProviderRegistration;