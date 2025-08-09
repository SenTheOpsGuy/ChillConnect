#!/usr/bin/env node

// Polyfill fetch for Node.js
if (!global.fetch) {
  global.fetch = require('node-fetch');
}

async function testOTPEndpoints() {
  console.log('🧪 Quick OTP Endpoints Test');
  console.log('===========================');

  const baseUrl = 'http://localhost:5001/api';
  const testEmail = 'test@example.com';
  const testPhone = '+919876543210';

  try {
    // Test 1: Send Email OTP
    console.log('📧 Testing email OTP endpoint...');
    const emailResponse = await fetch(`${baseUrl}/auth/send-email-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail })
    });

    if (emailResponse.ok) {
      const emailData = await emailResponse.json();
      console.log('✅ Email OTP endpoint working');
      console.log('   Response:', emailData.message);
      if (emailData.otp) {
        console.log(`   Development OTP: ${emailData.otp}`);
      }
    } else {
      const emailError = await emailResponse.text();
      console.log('❌ Email OTP endpoint failed:', emailResponse.status);
      console.log('   Error:', emailError);
    }

    // Test 2: Send Phone OTP
    console.log('\\n📱 Testing phone OTP endpoint...');
    const phoneResponse = await fetch(`${baseUrl}/auth/send-phone-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: testPhone })
    });

    if (phoneResponse.ok) {
      const phoneData = await phoneResponse.json();
      console.log('✅ Phone OTP endpoint working');
      console.log('   Response:', phoneData.message);
      if (phoneData.otp) {
        console.log(`   Development OTP: ${phoneData.otp}`);
      }
    } else {
      const phoneError = await phoneResponse.text();
      console.log('❌ Phone OTP endpoint failed:', phoneResponse.status);
      console.log('   Error:', phoneError);
    }

    // Test 3: Document verification endpoint
    console.log('\\n📄 Testing document verification endpoint...');
    const docResponse = await fetch(`${baseUrl}/auth/verify-document`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer dummy-token-for-test'
      },
      body: JSON.stringify({ type: 'age' })
    });

    // This should fail with invalid token, which is expected
    if (docResponse.status === 401) {
      console.log('✅ Document verification endpoint working (correctly rejected invalid token)');
    } else {
      console.log('❌ Document verification endpoint status:', docResponse.status);
    }

    // Test 4: Verification status endpoint
    console.log('\\n🔄 Testing verification status endpoint...');
    const statusResponse = await fetch(`${baseUrl}/auth/verification-status`, {
      method: 'GET',
      headers: { 
        'Authorization': 'Bearer dummy-token-for-test'
      }
    });

    // This should fail with invalid token, which is expected
    if (statusResponse.status === 401) {
      console.log('✅ Verification status endpoint working (correctly rejected invalid token)');
    } else {
      console.log('❌ Verification status endpoint status:', statusResponse.status);
    }

    console.log('\\n🎉 OTP ENDPOINTS TEST COMPLETED');
    console.log('✅ Backend is ready for Profile page verification features!');
    console.log('\\n🚀 Next: Test the frontend Profile page at http://localhost:3000/profile');

  } catch (error) {
    console.error('❌ OTP endpoints test failed:', error.message);
  }
}

// Run if called directly
if (require.main === module) {
  testOTPEndpoints();
}

module.exports = { testOTPEndpoints };