#!/usr/bin/env node

/**
 * Test complete login flow on chillconnect.in
 */

async function testLoginFlow() {
  console.log('🧪 Testing complete login flow...');
  
  const baseUrl = 'https://chillconnect.in/api/auth';
  const testEmail = 'logintest@example.com';
  const testPassword = 'TestPassword123!';
  
  try {
    // Step 1: Register a new user
    console.log('\n1️⃣ Creating test user...');
    const registerResponse = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        firstName: 'Login',
        lastName: 'Test',
        dateOfBirth: '1990-01-01',
        phoneNumber: '+919876543210',
        role: 'SEEKER',
        ageConfirmed: true,
        consentGiven: true
      })
    });
    
    const registerResult = await registerResponse.text();
    console.log('📝 Registration result:', registerResult);
    
    if (registerResponse.status === 400 && registerResult.includes('already exists')) {
      console.log('✅ User already exists, proceeding to login test');
    } else if (registerResponse.ok) {
      console.log('✅ User created successfully');
    } else {
      console.log('❌ Registration failed');
    }
    
    // Step 2: Test regular login
    console.log('\n2️⃣ Testing regular login...');
    const loginResponse = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword
      })
    });
    
    const loginResult = await loginResponse.text();
    console.log('🔑 Login result:', loginResult);
    
    if (loginResponse.ok) {
      const loginData = JSON.parse(loginResult);
      console.log('✅ LOGIN WORKING: Token received');
      console.log('   User ID:', loginData.data?.user?.id);
      console.log('   Email:', loginData.data?.user?.email);
    } else {
      console.log('❌ LOGIN FAILED:', loginResponse.status, loginResult);
    }
    
    // Step 3: Test login with OTP
    console.log('\n3️⃣ Testing Login with OTP...');
    const otpRequestResponse = await fetch(`${baseUrl}/login-otp-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: testEmail,
        type: 'email'
      })
    });
    
    const otpRequestResult = await otpRequestResponse.text();
    console.log('📧 OTP request result:', otpRequestResult);
    
    if (otpRequestResponse.ok) {
      console.log('✅ LOGIN WITH OTP WORKING: OTP sent');
    } else {
      console.log('❌ LOGIN WITH OTP FAILED:', otpRequestResponse.status, otpRequestResult);
    }
    
    console.log('\n🎯 LOGIN FLOW TEST COMPLETE');
    console.log('============================');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Add fetch polyfill for Node.js
if (!globalThis.fetch) {
  const { default: fetch } = require('node-fetch');
  globalThis.fetch = fetch;
}

testLoginFlow().catch(console.error);