#!/usr/bin/env node

/**
 * Browser automation script to test forgot password functionality
 * This script will navigate to the live site and test the actual user experience
 */

const puppeteer = require('puppeteer');

async function testForgotPassword() {
  let browser = null;
  
  try {
    console.log('🚀 Starting browser automation test for forgot password');
    console.log('====================================================');
    
    // Launch browser
    browser = await puppeteer.launch({
      headless: false, // Show browser for debugging
      defaultViewport: { width: 1280, height: 720 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Enable console logging
    page.on('console', msg => {
      console.log(`📱 Browser Console: ${msg.text()}`);
    });
    
    // Enable network logging
    page.on('response', response => {
      const url = response.url();
      if (url.includes('/api/') || url.includes('forgot-password')) {
        console.log(`🌐 Network: ${response.request().method()} ${url} - ${response.status()}`);
      }
    });
    
    // Enable error logging
    page.on('pageerror', error => {
      console.log(`❌ Page Error: ${error.message}`);
    });
    
    console.log('🔍 Step 1: Navigating to forgot password page...');
    await page.goto('https://chillconnect.in/forgot-password', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Take screenshot for debugging
    await page.screenshot({ path: '/tmp/forgot-password-page.png' });
    console.log('📸 Screenshot saved: /tmp/forgot-password-page.png');
    
    console.log('🔍 Step 2: Checking page content...');
    const title = await page.title();
    console.log(`📄 Page title: ${title}`);
    
    // Check if the page loaded correctly
    const pageContent = await page.content();
    if (pageContent.includes('Forgot Password')) {
      console.log('✅ Forgot password page loaded successfully');
    } else {
      console.log('❌ Forgot password page may not have loaded correctly');
    }
    
    console.log('🔍 Step 3: Looking for email input field...');
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    console.log('✅ Email input field found');
    
    console.log('🔍 Step 4: Entering email address...');
    const testEmail = 'mountainsagegiri@gmail.com';
    await page.type('input[type="email"]', testEmail);
    console.log(`📧 Entered email: ${testEmail}`);
    
    console.log('🔍 Step 5: Looking for submit button...');
    const submitButton = await page.$('button[type="submit"]');
    if (!submitButton) {
      console.log('❌ Submit button not found');
      return;
    }
    console.log('✅ Submit button found');
    
    console.log('🔍 Step 6: Clicking submit button...');
    await submitButton.click();
    console.log('🖱️  Clicked submit button');
    
    console.log('🔍 Step 7: Waiting for response...');
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds for response
    
    // Take another screenshot
    await page.screenshot({ path: '/tmp/forgot-password-after-submit.png' });
    console.log('📸 After-submit screenshot saved: /tmp/forgot-password-after-submit.png');
    
    console.log('🔍 Step 8: Checking for success or error messages...');
    const finalContent = await page.content();
    
    // Check for various possible outcomes
    if (finalContent.includes('Check Your Email')) {
      console.log('✅ SUCCESS: Found "Check Your Email" message');
      console.log('✅ Forgot password functionality is WORKING');
    } else if (finalContent.includes('Password reset email sent')) {
      console.log('✅ SUCCESS: Found "Password reset email sent" message');
      console.log('✅ Forgot password functionality is WORKING');
    } else if (finalContent.includes('Failed to send reset email')) {
      console.log('❌ FAILURE: Found "Failed to send reset email" message');
      console.log('❌ Forgot password functionality is BROKEN');
    } else if (finalContent.includes('error')) {
      console.log('❌ FAILURE: Found generic error message');
      console.log('❌ Forgot password functionality has errors');
    } else {
      console.log('⚠️  UNKNOWN: Could not determine success or failure');
      console.log('📋 Current page URL:', page.url());
      
      // Look for any toast messages or alerts
      const toastMessages = await page.evaluate(() => {
        const toasts = document.querySelectorAll('[role="alert"], .toast, .notification');
        return Array.from(toasts).map(toast => toast.textContent);
      });
      
      if (toastMessages.length > 0) {
        console.log('🔔 Found toast/alert messages:', toastMessages);
      }
    }
    
    console.log('🔍 Step 9: Extracting console logs for analysis...');
    // Get any final console logs
    await page.evaluate(() => {
      console.log('🏁 Test completed - final browser state check');
    });
    
    console.log('\n📊 TEST SUMMARY');
    console.log('===============');
    console.log(`📧 Test Email: ${testEmail}`);
    console.log(`🌐 Final URL: ${page.url()}`);
    console.log(`📄 Final Title: ${await page.title()}`);
    
  } catch (error) {
    console.error('❌ TEST FAILED with error:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    if (browser) {
      console.log('🔄 Closing browser...');
      await browser.close();
    }
  }
}

// Check if Puppeteer is installed
async function checkPuppeteer() {
  try {
    console.log('🔍 Checking if Puppeteer is available...');
    require('puppeteer');
    console.log('✅ Puppeteer is available');
    return true;
  } catch (error) {
    console.log('❌ Puppeteer not found. Installing...');
    const { execSync } = require('child_process');
    try {
      execSync('npm install puppeteer', { stdio: 'inherit' });
      console.log('✅ Puppeteer installed successfully');
      return true;
    } catch (installError) {
      console.error('❌ Failed to install Puppeteer:', installError.message);
      console.log('💡 Please run: npm install puppeteer');
      return false;
    }
  }
}

// Main execution
async function main() {
  const puppeteerAvailable = await checkPuppeteer();
  if (!puppeteerAvailable) {
    process.exit(1);
  }
  
  await testForgotPassword();
}

// Run the test
if (require.main === module) {
  main().catch(console.error);
}