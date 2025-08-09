#!/usr/bin/env node

const puppeteer = require('puppeteer');

class ProfileVerificationTester {
  constructor() {
    this.baseUrl = 'http://localhost:3000';
    this.apiUrl = 'http://localhost:5001/api';
    this.testEmail = 'testuser@chillconnect.com';
    this.testPassword = 'testpassword123';
    this.testPhone = '+919876543210';
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async testVerificationFeatures() {
    console.log('🔍 Testing Profile Page Verification Features');
    console.log('=============================================');

    let browser;
    try {
      browser = await puppeteer.launch({ 
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized']
      });

      const page = await browser.newPage();
      let testResults = [];

      // Step 1: Register a test user
      console.log('📝 Step 1: Registering test user...');
      await page.goto(`${this.baseUrl}/register`);
      await this.delay(2000);

      try {
        // Fill registration form
        await page.type('input[name="firstName"]', 'Test');
        await page.type('input[name="lastName"]', 'User');
        await page.type('input[name="email"]', this.testEmail);
        await page.type('input[name="password"]', this.testPassword);
        await page.type('input[name="confirmPassword"]', this.testPassword);
        await page.type('input[name="dateOfBirth"]', '1995-05-15');
        await page.type('input[name="phone"]', this.testPhone);
        
        // Select role
        await page.click('input[value="PROVIDER"]');
        
        // Accept terms
        await page.click('input[name="ageConfirmed"]');
        await page.click('input[name="consentGiven"]');
        
        // Submit registration
        await page.click('button[type="submit"]');
        await this.delay(3000);
        
        testResults.push({ test: 'User Registration', status: 'PASS' });
        console.log('✅ User registered successfully');
      } catch (error) {
        testResults.push({ test: 'User Registration', status: 'FAIL', error: error.message });
        console.log('❌ Registration failed:', error.message);
      }

      // Step 2: Navigate to Profile page
      console.log('📄 Step 2: Navigating to Profile page...');
      try {
        await page.goto(`${this.baseUrl}/profile`);
        await this.delay(2000);
        
        testResults.push({ test: 'Profile Page Access', status: 'PASS' });
        console.log('✅ Profile page loaded successfully');
      } catch (error) {
        testResults.push({ test: 'Profile Page Access', status: 'FAIL', error: error.message });
        console.log('❌ Failed to access profile page:', error.message);
      }

      // Step 3: Test Email Verification Button
      console.log('📧 Step 3: Testing Email Verification...');
      try {
        // Check if Send OTP button exists
        const emailSendButton = await page.$('button:contains("Send OTP")');
        if (emailSendButton) {
          await emailSendButton.click();
          await this.delay(2000);
          
          // Check for success message or OTP input
          const otpInput = await page.$('input[placeholder="Enter OTP"]');
          if (otpInput) {
            testResults.push({ test: 'Email OTP Send Button', status: 'PASS' });
            console.log('✅ Email OTP button works - OTP input appeared');
          } else {
            testResults.push({ test: 'Email OTP Send Button', status: 'WARN', error: 'OTP input not found after clicking' });
            console.log('⚠️  Email OTP button clicked but no input appeared');
          }
        } else {
          testResults.push({ test: 'Email OTP Send Button', status: 'FAIL', error: 'Send OTP button not found' });
          console.log('❌ Email OTP Send button not found');
        }
      } catch (error) {
        testResults.push({ test: 'Email OTP Send Button', status: 'FAIL', error: error.message });
        console.log('❌ Email verification test failed:', error.message);
      }

      // Step 4: Test Phone Verification Button
      console.log('📱 Step 4: Testing Phone Verification...');
      try {
        // Check if Send SMS button exists
        const phoneSendButton = await page.$('button:contains("Send SMS")');
        if (phoneSendButton) {
          await phoneSendButton.click();
          await this.delay(2000);
          
          testResults.push({ test: 'Phone OTP Send Button', status: 'PASS' });
          console.log('✅ Phone OTP button works');
        } else {
          testResults.push({ test: 'Phone OTP Send Button', status: 'FAIL', error: 'Send SMS button not found' });
          console.log('❌ Phone OTP Send button not found');
        }
      } catch (error) {
        testResults.push({ test: 'Phone OTP Send Button', status: 'FAIL', error: error.message });
        console.log('❌ Phone verification test failed:', error.message);
      }

      // Step 5: Test Document Upload Button
      console.log('📄 Step 5: Testing Document Upload...');
      try {
        // Check if Upload ID button exists
        const uploadButton = await page.$('button:contains("Upload ID")');
        if (uploadButton) {
          await uploadButton.click();
          await this.delay(1000);
          
          testResults.push({ test: 'Document Upload Button', status: 'PASS' });
          console.log('✅ Document upload button works');
        } else {
          testResults.push({ test: 'Document Upload Button', status: 'FAIL', error: 'Upload ID button not found' });
          console.log('❌ Document upload button not found');
        }
      } catch (error) {
        testResults.push({ test: 'Document Upload Button', status: 'FAIL', error: error.message });
        console.log('❌ Document upload test failed:', error.message);
      }

      // Step 6: Test Refresh Status Button  
      console.log('🔄 Step 6: Testing Refresh Status...');
      try {
        // Check if Refresh button exists
        const refreshButton = await page.$('button:contains("Refresh")');
        if (refreshButton) {
          await refreshButton.click();
          await this.delay(2000);
          
          testResults.push({ test: 'Refresh Status Button', status: 'PASS' });
          console.log('✅ Refresh status button works');
        } else {
          testResults.push({ test: 'Refresh Status Button', status: 'FAIL', error: 'Refresh button not found' });
          console.log('❌ Refresh status button not found');
        }
      } catch (error) {
        testResults.push({ test: 'Refresh Status Button', status: 'FAIL', error: error.message });
        console.log('❌ Refresh status test failed:', error.message);
      }

      // Generate Test Report
      console.log('\\n📋 PROFILE VERIFICATION TEST REPORT');
      console.log('=====================================');
      
      const total = testResults.length;
      const passed = testResults.filter(r => r.status === 'PASS').length;
      const failed = testResults.filter(r => r.status === 'FAIL').length;
      const warnings = testResults.filter(r => r.status === 'WARN').length;
      
      testResults.forEach((result, i) => {
        const emoji = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
        console.log(`${emoji} ${result.test}: ${result.status}`);
        if (result.error) {
          console.log(`   Error: ${result.error}`);
        }
      });

      console.log(`\\n📊 Test Summary:`);
      console.log(`Total Tests: ${total}`);
      console.log(`Passed: ${passed}`);
      console.log(`Failed: ${failed}`);
      console.log(`Warnings: ${warnings}`);
      console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

      if (passed === total) {
        console.log('\\n🎉 ALL VERIFICATION FEATURES ARE WORKING!');
        console.log('✅ Profile page has functional call-to-action buttons');
        console.log('✅ Email verification workflow implemented');
        console.log('✅ Phone verification workflow implemented');
        console.log('✅ Document upload workflow implemented');
        console.log('✅ Status refresh functionality implemented');
      } else {
        console.log('\\n⚠️  SOME VERIFICATION FEATURES NEED ATTENTION');
        console.log('🔧 Check the specific failed tests above for details');
      }

      return {
        total,
        passed,
        failed,
        warnings,
        successRate: ((passed / total) * 100).toFixed(1),
        allWorking: passed === total
      };

    } catch (error) {
      console.error('❌ Test execution failed:', error);
      return { error: error.message };
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  async testBackendEndpoints() {
    console.log('\\n🔧 Testing Backend OTP Endpoints');
    console.log('=================================');

    try {
      // Test email OTP endpoint
      const emailOTPResponse = await fetch(`${this.apiUrl}/auth/send-email-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: this.testEmail })
      });

      if (emailOTPResponse.ok) {
        console.log('✅ Email OTP endpoint working');
      } else {
        console.log('❌ Email OTP endpoint failed:', emailOTPResponse.status);
      }

      // Test phone OTP endpoint  
      const phoneOTPResponse = await fetch(`${this.apiUrl}/auth/send-phone-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: this.testPhone })
      });

      if (phoneOTPResponse.ok) {
        console.log('✅ Phone OTP endpoint working');
      } else {
        console.log('❌ Phone OTP endpoint failed:', phoneOTPResponse.status);
      }

    } catch (error) {
      console.log('❌ Backend endpoint test failed:', error.message);
    }
  }
}

// Run the test
if (require.main === module) {
  const tester = new ProfileVerificationTester();
  
  (async () => {
    try {
      // Test backend endpoints first
      await tester.testBackendEndpoints();
      
      // Then test frontend integration
      const report = await tester.testVerificationFeatures();
      
      console.log('\\n🏁 TESTING COMPLETED');
      console.log('====================');
      
      if (report.allWorking) {
        console.log('🎊 SUCCESS: All profile verification features are functional!');
        console.log('🚀 The Profile page now has complete call-to-action buttons');
        process.exit(0);
      } else {
        console.log('⚠️  PARTIAL SUCCESS: Some features may need refinement');
        process.exit(1);
      }
      
    } catch (error) {
      console.error('💥 Test suite failed:', error);
      process.exit(1);
    }
  })();
}

module.exports = ProfileVerificationTester;