#!/usr/bin/env node

/**
 * Delete test users via API calls to the backend
 */

async function deleteTestUsers() {
  console.log('🗑️  Deleting test users via API...');
  
  try {
    // Create a delete endpoint call
    const response = await fetch('https://chillconnect-production.up.railway.app/api/admin/delete-test-users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone: '9258221177',
        email: 'mountainsagegiri@gmail.com',
        emergencyPassword: 'ChillConnect2024!'
      })
    });
    
    const result = await response.text();
    console.log('🔍 API Response:', result);
    
    if (response.ok) {
      console.log('✅ Users deleted successfully');
    } else {
      console.log('❌ API call failed, trying manual SQL approach');
      console.log('🔧 Run these commands in Railway database console:');
      console.log(`
-- Delete related records first
DELETE FROM "OTPVerification" WHERE "userId" IN (
  SELECT id FROM "User" WHERE phone IN ('+919258221177', '9258221177') OR email = 'mountainsagegiri@gmail.com'
);

DELETE FROM "EmailOTPVerification" WHERE "userId" IN (
  SELECT id FROM "User" WHERE phone IN ('+919258221177', '9258221177') OR email = 'mountainsagegiri@gmail.com'
);

DELETE FROM "UserProfile" WHERE "userId" IN (
  SELECT id FROM "User" WHERE phone IN ('+919258221177', '9258221177') OR email = 'mountainsagegiri@gmail.com'
);

DELETE FROM "TokenWallet" WHERE "userId" IN (
  SELECT id FROM "User" WHERE phone IN ('+919258221177', '9258221177') OR email = 'mountainsagegiri@gmail.com'
);

-- Delete the users
DELETE FROM "User" WHERE phone IN ('+919258221177', '9258221177') OR email = 'mountainsagegiri@gmail.com';
      `);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('💡 Manual deletion required in Railway database console');
  }
}

// Add fetch polyfill for Node.js
if (!globalThis.fetch) {
  const { default: fetch } = require('node-fetch');
  globalThis.fetch = fetch;
}

deleteTestUsers().catch(console.error);