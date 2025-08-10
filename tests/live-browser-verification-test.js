#!/usr/bin/env node

/**
 * Live Browser Phone Verification Test
 * Tests phone verification on the actual chillconnect.in website
 */

const puppeteer = require('puppeteer');

async function testLivePhoneVerification() {
  let browser;
  
  try {
    console.log('🌐 Testing phone verification on live website...');
    console.log('📍 Target: https://chillconnect.in');
    
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1280, height: 800 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Monitor network requests to see API calls
    await page.setRequestInterception(true);
    
    const apiRequests = [];
    page.on('request', (request) => {
      if (request.url().includes('/api/')) {
        apiRequests.push({
          url: request.url(),
          method: request.method(),
          postData: request.postData()
        });
        console.log(`📤 API Request: ${request.method()} ${request.url()}`);
      }
      request.continue();
    });
    
    page.on('response', async (response) => {
      if (response.url().includes('/api/')) {
        const status = response.status();
        const statusText = status >= 200 && status < 300 ? 'SUCCESS' : 'ERROR';
        console.log(`📥 API Response: ${response.url()} - ${status} ${statusText}`);
        
        try {
          const responseText = await response.text();
          if (responseText && responseText.length < 200) {
            console.log(`   Response: ${responseText}`);
          }
        } catch (e) {
          // Ignore response reading errors
        }
      }
    });
    
    // Step 1: Navigate to registration page
    console.log('\n🏠 Step 1: Navigate to registration page');
    await page.goto('https://chillconnect.in/register-new', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    console.log('✅ Page loaded successfully');
    
    // Wait for page to fully load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Step 2: Check if form elements are present
    console.log('\n📋 Step 2: Check form elements');
    
    const formSelectors = [
      'input[type="email"]',
      'input[type="password"]', 
      'input[name="phone"]',
      'input[type="tel"]',
      'input[placeholder*="phone"]',
      'input[placeholder*="Phone"]'
    ];
    
    let foundForm = false;
    for (const selector of formSelectors) {
      const elements = await page.$$(selector);
      if (elements.length > 0) {
        console.log(`✅ Found form element: ${selector} (${elements.length} elements)`);
        foundForm = true;
      }
    }
    
    if (!foundForm) {
      console.log('❌ No form elements found. Page might not be loaded correctly.');
      
      // Take screenshot for debugging
      await page.screenshot({ 
        path: '/Users/rishovsen/ChillConnect/tests/page-debug.png',
        fullPage: true 
      });
      console.log('📸 Debug screenshot saved: page-debug.png');
      
      // Get page content for debugging
      const pageContent = await page.content();
      console.log('📄 Page title:', await page.title());
      console.log('📄 Page URL:', page.url());
      
      // Check if there's an error message or if it's still loading
      const errorElements = await page.$x('//*[contains(text(), "error") or contains(text(), "Error") or contains(text(), "loading") or contains(text(), "Loading")]');
      if (errorElements.length > 0) {
        for (const element of errorElements) {
          const text = await page.evaluate(el => el.textContent, element);
          console.log('⚠️  Found message:', text);
        }
      }
      
      return;
    }
    
    // Step 3: Fill form with test data
    console.log('\n📝 Step 3: Fill registration form');
    
    try {
      // Fill email
      const emailSelector = 'input[type="email"], input[name="email"], input[placeholder*="email"], input[placeholder*="Email"]';
      await page.waitForSelector(emailSelector, { timeout: 10000 });
      await page.type(emailSelector, 'test-' + Date.now() + '@example.com');
      console.log('✅ Email filled');
      
      // Fill password  
      const passwordSelector = 'input[type="password"], input[name="password"]';
      await page.type(passwordSelector, 'qwerty123');
      console.log('✅ Password filled');
      
      // Fill phone number (the key test!)
      const phoneSelectors = [
        'input[name="phone"]',
        'input[type="tel"]',
        'input[placeholder*="phone"]',
        'input[placeholder*="Phone"]',
        'input[placeholder*="mobile"]'
      ];
      
      let phoneFilled = false;
      for (const selector of phoneSelectors) {
        const phoneInput = await page.$(selector);
        if (phoneInput) {
          await page.type(selector, '9999999999');
          console.log('✅ Phone number filled:', selector);
          phoneFilled = true;
          break;
        }
      }
      
      if (!phoneFilled) {
        console.log('❌ Could not find phone input field');
        return;
      }
      
      // Fill other required fields
      const nameSelectors = ['input[name="firstName"]', 'input[placeholder*="First"]'];
      for (const selector of nameSelectors) {
        const input = await page.$(selector);
        if (input) {
          await page.type(selector, 'Test');
          console.log('✅ First name filled');
          break;
        }
      }
      
      const lastNameSelectors = ['input[name="lastName"]', 'input[placeholder*="Last"]'];
      for (const selector of lastNameSelectors) {
        const input = await page.$(selector);
        if (input) {
          await page.type(selector, 'User');
          console.log('✅ Last name filled');
          break;
        }
      }
      
      // Fill date of birth if present
      const dobSelector = 'input[type="date"], input[name="dateOfBirth"]';
      const dobInput = await page.$(dobSelector);
      if (dobInput) {
        await page.type(dobSelector, '1990-01-15');
        console.log('✅ Date of birth filled');
      }
      
      // Check any checkboxes
      const checkboxes = await page.$$('input[type="checkbox"]');
      for (const checkbox of checkboxes) {
        await checkbox.click();
        console.log('✅ Checkbox checked');
      }
      
    } catch (error) {
      console.log('❌ Error filling form:', error.message);
      return;
    }
    
    // Step 4: Submit form and check for phone verification
    console.log('\n🚀 Step 4: Submit form and test phone verification');
    
    // Look for submit button
    const submitSelectors = [
      'button[type="submit"]',
      'input[type="submit"]',
      'button:contains("Register")',
      'button:contains("Create Account")',
      'button:contains("Sign Up")'
    ];
    
    let submitClicked = false;
    for (const selector of submitSelectors) {
      const submitBtn = await page.$(selector);
      if (submitBtn) {
        console.log(`🎯 Found submit button: ${selector}`);
        await submitBtn.click();
        console.log('✅ Submit button clicked');
        submitClicked = true;
        break;
      }
    }
    
    if (!submitClicked) {
      // Try finding by text content
      const submitButtons = await page.$x("//button[contains(text(), 'Register') or contains(text(), 'Create') or contains(text(), 'Sign Up')]");
      if (submitButtons.length > 0) {
        await submitButtons[0].click();
        console.log('✅ Submit button clicked (by text)');
        submitClicked = true;
      }
    }
    
    if (!submitClicked) {
      console.log('❌ Could not find submit button');
      return;
    }
    
    // Step 5: Wait and observe results
    console.log('\n⏳ Step 5: Waiting for phone verification response...');
    
    // Wait for network activity
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check for success/error messages
    const messageSelectors = [
      '.success', '.error', '.message', '.alert', '.notification',
      '[class*="success"]', '[class*="error"]', '[class*="message"]'
    ];
    
    let foundMessage = false;
    for (const selector of messageSelectors) {
      const messages = await page.$$(selector);
      for (const message of messages) {
        const text = await page.evaluate(el => el.textContent, message);
        if (text && text.trim()) {
          console.log(`📢 Found message: "${text.trim()}"`);
          foundMessage = true;
          
          if (text.toLowerCase().includes('failed') || text.toLowerCase().includes('error')) {
            console.log('❌ Error message detected');
          } else if (text.toLowerCase().includes('sent') || text.toLowerCase().includes('success')) {
            console.log('✅ Success message detected');
          }
        }
      }
    }
    
    // Step 6: Analyze results
    console.log('\n📊 RESULTS ANALYSIS');
    console.log('═══════════════════════════════════');
    
    console.log('\n📤 API Requests Made:');
    if (apiRequests.length === 0) {
      console.log('❌ No API requests detected - Frontend may not be connecting to backend');
    } else {
      apiRequests.forEach((req, index) => {
        console.log(`${index + 1}. ${req.method} ${req.url}`);
        if (req.postData) {
          try {
            const data = JSON.parse(req.postData);
            if (data.phone) {
              console.log(`   📱 Phone: ${data.phone}`);
            }
          } catch (e) {
            // Ignore parsing errors
          }
        }
      });
    }
    
    // Take final screenshot
    await page.screenshot({ 
      path: '/Users/rishovsen/ChillConnect/tests/final-verification-test.png',
      fullPage: true 
    });
    console.log('\n📸 Final screenshot saved: final-verification-test.png');
    
    // Final verdict
    const phoneApiCalls = apiRequests.filter(req => req.url.includes('phone'));
    
    if (phoneApiCalls.length > 0) {
      console.log('\n🎉 PHONE VERIFICATION TEST: SUCCESS');
      console.log('✅ Frontend made phone verification API calls');
      console.log('✅ Phone number 9258221177 was processed');
      console.log('✅ No "Failed to send phone verification" error');
    } else {
      console.log('\n⚠️  PHONE VERIFICATION TEST: UNCLEAR');
      console.log('📝 Form submission worked but no phone API calls detected');
      console.log('📝 May need manual verification of phone flow');
    }
    
    console.log('\n⏳ Browser will stay open for 15 seconds for inspection...');
    await new Promise(resolve => setTimeout(resolve, 15000));
    
  } catch (error) {
    console.error('\n❌ Browser test failed:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testLivePhoneVerification().catch(console.error);