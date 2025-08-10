#!/usr/bin/env node

/**
 * RCA-DRIVEN TEST FRAMEWORK
 * Prevents false positives by checking ACTUAL user experience
 */

const puppeteer = require('puppeteer');

class RCATestFramework {
  constructor() {
    this.results = {
      apiCalls: [],
      uiErrors: [],
      userExperience: 'UNKNOWN',
      actualStatus: 'UNKNOWN'
    };
  }

  async testPhoneVerification() {
    console.log('🔍 RCA-DRIVEN PHONE VERIFICATION TEST');
    console.log('=====================================');
    console.log('❌ PREVIOUS FAILURES: Repeatedly claimed success despite visible UI errors');
    console.log('🎯 RCA REQUIREMENT: Must check ACTUAL user experience, not just API calls');
    
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: false,
        defaultViewport: { width: 1280, height: 800 }
      });
      
      const page = await browser.newPage();
      
      // Track API calls
      await page.setRequestInterception(true);
      page.on('request', (request) => {
        if (request.url().includes('/api/auth/send-phone-verification')) {
          this.results.apiCalls.push({
            method: request.method(),
            url: request.url(),
            postData: request.postData()
          });
        }
        request.continue();
      });
      
      page.on('response', async (response) => {
        if (response.url().includes('/api/auth/send-phone-verification')) {
          try {
            const responseText = await response.text();
            this.results.apiCalls.push({
              status: response.status(),
              response: responseText
            });
          } catch (e) {
            // Ignore
          }
        }
      });
      
      // Navigate to registration
      await page.goto('https://chillconnect.in/register-new', { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });
      
      // Fill form - wait for elements to be available
      const timestamp = Date.now();
      await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });
      await page.type('input[type="email"], input[name="email"]', `test-${timestamp}@example.com`);
      await page.type('input[type="password"]', 'qwerty123');
      await page.type('input[type="tel"]', '9258221177');
      
      // Try multiple selectors for name fields
      const firstNameSelectors = ['input[name="firstName"]', 'input[placeholder*="First"]', 'input[placeholder*="first"]'];
      for (const selector of firstNameSelectors) {
        const element = await page.$(selector);
        if (element) {
          await page.type(selector, 'Test');
          break;
        }
      }
      
      const lastNameSelectors = ['input[name="lastName"]', 'input[placeholder*="Last"]', 'input[placeholder*="last"]'];
      for (const selector of lastNameSelectors) {
        const element = await page.$(selector);
        if (element) {
          await page.type(selector, 'User');
          break;
        }
      }
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Wait for response
      await new Promise(resolve => setTimeout(resolve, 8000));
      
      // RCA-DRIVEN CHECKS: Verify ACTUAL user experience
      await this.checkUserExperience(page);
      
      // Take evidence screenshot
      await page.screenshot({ 
        path: '/Users/rishovsen/ChillConnect/rca-evidence.png',
        fullPage: true 
      });
      
      // Final analysis
      this.analyzeResults();
      
      await new Promise(resolve => setTimeout(resolve, 5000));
      
    } catch (error) {
      console.error('❌ Test failed:', error.message);
      this.results.actualStatus = 'TEST_FAILED';
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
  
  async checkUserExperience(page) {
    console.log('\n🔍 RCA CHECK 1: Looking for ERROR MESSAGES in UI');
    
    // Check for error messages (the ones I keep missing!)
    const errorSelectors = [
      '.error', '.alert-error', '[class*="error"]',
      '.failure', '.alert-danger', '[class*="fail"]',
      'div:contains("Failed")', 'div:contains("Error")',
      '*[style*="red"]', '*[style*="danger"]'
    ];
    
    for (const selector of errorSelectors) {
      try {
        const elements = await page.$$(selector);
        for (const element of elements) {
          const text = await page.evaluate(el => el.textContent, element);
          if (text && text.trim()) {
            this.results.uiErrors.push({
              selector,
              text: text.trim(),
              visible: await element.isIntersectingViewport()
            });
          }
        }
      } catch (e) {
        // Continue
      }
    }
    
    // Check for success indicators
    console.log('\n🔍 RCA CHECK 2: Looking for SUCCESS INDICATORS');
    const successSelectors = [
      '*:contains("sent")', '*:contains("success")', '*:contains("verify")',
      '.success', '.alert-success', '[class*="success"]'
    ];
    let successFound = false;
    for (const selector of successSelectors) {
      try {
        const elements = await page.$$(selector);
        if (elements.length > 0) {
          successFound = true;
          break;
        }
      } catch (e) {
        // Continue
      }
    }
    
    // Check if form is still visible (indicates failure)
    const formStillVisible = await page.$('button[type="submit"]') !== null;
    
    // Determine user experience
    if (this.results.uiErrors.length > 0) {
      this.results.userExperience = 'FAILED_WITH_ERRORS';
      console.log('❌ USER EXPERIENCE: FAILED - Error messages visible');
      this.results.uiErrors.forEach(err => {
        console.log(`   ERROR: "${err.text}" (${err.selector})`);
      });
    } else if (successFound && !formStillVisible) {
      this.results.userExperience = 'SUCCESS';
      console.log('✅ USER EXPERIENCE: SUCCESS - No errors, success messages found');
    } else if (formStillVisible) {
      this.results.userExperience = 'STUCK_OR_LOADING';
      console.log('⏳ USER EXPERIENCE: STUCK/LOADING - Form still visible');
    } else {
      this.results.userExperience = 'UNCLEAR';
      console.log('❓ USER EXPERIENCE: UNCLEAR - Need manual verification');
    }
  }
  
  analyzeResults() {
    console.log('\n📊 RCA-DRIVEN FINAL ANALYSIS');
    console.log('===========================');
    
    console.log('\n🔍 API ACTIVITY:');
    if (this.results.apiCalls.length === 0) {
      console.log('❌ No API calls detected');
    } else {
      this.results.apiCalls.forEach((call, i) => {
        console.log(`${i + 1}. ${call.method || 'Response'} - ${call.status || 'Request'}`);
        if (call.response) console.log(`   Response: ${call.response}`);
      });
    }
    
    console.log('\n🔍 UI ERROR ANALYSIS:');
    if (this.results.uiErrors.length === 0) {
      console.log('✅ No UI errors detected');
    } else {
      console.log(`❌ ${this.results.uiErrors.length} UI errors found:`);
      this.results.uiErrors.forEach(err => {
        console.log(`   • "${err.text}"`);
      });
    }
    
    console.log('\n🎯 RCA-DRIVEN VERDICT:');
    console.log('===================');
    
    // Apply RCA logic to prevent false positives
    if (this.results.userExperience === 'SUCCESS') {
      this.results.actualStatus = 'WORKING';
      console.log('✅ PHONE VERIFICATION: WORKING');
      console.log('   Evidence: No errors, success indicators present');
    } else if (this.results.userExperience === 'FAILED_WITH_ERRORS') {
      this.results.actualStatus = 'NOT_WORKING';
      console.log('❌ PHONE VERIFICATION: NOT WORKING');
      console.log('   Evidence: UI shows error messages');
    } else {
      this.results.actualStatus = 'REQUIRES_INVESTIGATION';
      console.log('⚠️  PHONE VERIFICATION: REQUIRES_INVESTIGATION');
      console.log('   Evidence: Inconclusive results');
    }
    
    console.log('\n📸 Evidence screenshot saved: rca-evidence.png');
    console.log('🔍 Manual verification of screenshot is REQUIRED');
  }
}

// Run RCA test
const rca = new RCATestFramework();
rca.testPhoneVerification().catch(console.error);