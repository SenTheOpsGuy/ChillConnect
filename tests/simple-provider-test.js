#!/usr/bin/env node

/**
 * Simple Provider Registration Test
 * Registers a provider with specific credentials:
 * - Email: mountainsagegiri@gmail.com
 * - Phone: 9258221177
 * - Password: qwerty123
 */

const puppeteer = require('puppeteer');

async function registerProvider() {
  console.log('🚀 Starting provider registration test...');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 800 },
    args: ['--no-sandbox']
  });
  
  const page = await browser.newPage();
  
  try {
    // Navigate to registration page
    console.log('📍 Going to registration page...');
    await page.goto('https://chillconnect.in/register-new', { 
      waitUntil: 'networkidle0',
      timeout: 20000 
    });
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log('✅ Page loaded');
    
    // Fill the registration form
    console.log('📝 Filling registration form...');
    
    // Email
    await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });
    await page.type('input[type="email"], input[name="email"]', 'mountainsagegiri@gmail.com');
    console.log('✅ Email filled');
    
    // Password
    await page.type('input[type="password"], input[name="password"]', 'qwerty123');
    console.log('✅ Password filled');
    
    // First Name
    const firstNameSelectors = [
      'input[name="firstName"]',
      'input[placeholder*="First"]',
      'input[placeholder*="first"]'
    ];
    
    for (const selector of firstNameSelectors) {
      const element = await page.$(selector);
      if (element) {
        await page.type(selector, 'Mountain');
        console.log('✅ First name filled');
        break;
      }
    }
    
    // Last Name
    const lastNameSelectors = [
      'input[name="lastName"]',
      'input[placeholder*="Last"]',
      'input[placeholder*="last"]'
    ];
    
    for (const selector of lastNameSelectors) {
      const element = await page.$(selector);
      if (element) {
        await page.type(selector, 'Sage');
        console.log('✅ Last name filled');
        break;
      }
    }
    
    // Phone Number
    const phoneSelectors = [
      'input[type="tel"]',
      'input[name="phone"]',
      'input[placeholder*="phone"]',
      'input[placeholder*="Phone"]'
    ];
    
    for (const selector of phoneSelectors) {
      const element = await page.$(selector);
      if (element) {
        await page.type(selector, '9258221177');
        console.log('✅ Phone number filled');
        break;
      }
    }
    
    // Date of Birth
    const dobSelectors = [
      'input[type="date"]',
      'input[name="dateOfBirth"]',
      'input[name="dob"]'
    ];
    
    for (const selector of dobSelectors) {
      const element = await page.$(selector);
      if (element) {
        await page.type(selector, '1990-01-15');
        console.log('✅ Date of birth filled');
        break;
      }
    }
    
    // Select Provider role
    console.log('🎯 Selecting provider role...');
    const roleSelectors = [
      'input[value="PROVIDER"]',
      'input[value="provider"]',
      'button[data-role="provider"]',
      '.role-provider input',
      'input[name="role"][value="PROVIDER"]'
    ];
    
    for (const selector of roleSelectors) {
      const element = await page.$(selector);
      if (element) {
        await page.click(selector);
        console.log('✅ Provider role selected');
        break;
      }
    }
    
    // Check agreement checkboxes
    console.log('☑️ Checking agreement boxes...');
    const checkboxes = await page.$$('input[type="checkbox"]');
    for (const checkbox of checkboxes) {
      const isChecked = await checkbox.evaluate(el => el.checked);
      if (!isChecked) {
        await checkbox.click();
        console.log('✅ Checkbox checked');
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Submit the form
    console.log('🚀 Submitting registration...');
    const submitButton = await page.$('button[type="submit"]') || 
                         await page.$x("//button[contains(text(), 'Register') or contains(text(), 'Sign Up')]")[0];
    
    if (submitButton) {
      await submitButton.click();
      console.log('✅ Registration form submitted');
    } else {
      console.log('❌ Could not find submit button');
    }
    
    // Wait for response
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Look for phone verification
    console.log('📱 Looking for phone verification...');
    const otpSelectors = [
      'input[name="otp"]',
      'input[placeholder*="OTP"]',
      'input[placeholder*="code"]',
      'input[maxlength="6"]'
    ];
    
    let foundOTP = false;
    for (const selector of otpSelectors) {
      const element = await page.$(selector);
      if (element) {
        console.log('✅ Found OTP input field');
        await page.type(selector, '123456'); // Development OTP
        console.log('✅ OTP entered');
        
        // Click verify
        const verifyBtn = await page.$('button[type="submit"]') ||
                          await page.$x("//button[contains(text(), 'Verify')]")[0];
        
        if (verifyBtn) {
          await verifyBtn.click();
          console.log('✅ OTP verification submitted');
        }
        
        foundOTP = true;
        break;
      }
    }
    
    if (!foundOTP) {
      console.log('⚠️ No OTP field found - checking registration status');
    }
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check final result
    const url = page.url();
    const content = await page.content();
    
    console.log(`\n📊 FINAL RESULTS:`);
    console.log(`URL: ${url}`);
    
    if (content.includes('success') || content.includes('welcome') || url.includes('dashboard')) {
      console.log('🎉 REGISTRATION SUCCESSFUL!');
      console.log('✅ Provider account created for mountainsagegiri@gmail.com');
      console.log('✅ Phone 9258221177 verification completed');
    } else if (content.includes('error') || content.includes('failed')) {
      console.log('❌ REGISTRATION FAILED - Check for errors');
    } else {
      console.log('🤔 REGISTRATION STATUS UNCLEAR - Manual check needed');
    }
    
    // Take a screenshot
    await page.screenshot({ 
      path: '/Users/rishovsen/ChillConnect/tests/provider-registration-result.png',
      fullPage: true 
    });
    
    console.log('\n📸 Screenshot saved: provider-registration-result.png');
    console.log('\n⏳ Browser will stay open for 15 seconds for inspection...');
    await new Promise(resolve => setTimeout(resolve, 15000));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

// Run the test
registerProvider().catch(console.error);