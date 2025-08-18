#!/usr/bin/env node

/**
 * Authentication Testing Script
 * Tests employee, seeker, and provider login functionality
 */

const https = require('https');
const http = require('http');

const TEST_CONFIGS = {
  production: {
    baseUrl: 'https://chillconnect.in',
    name: 'Production (Netlify -> Vercel)'
  },
  vercelDirect: {
    baseUrl: 'https://chillconnect-backend-bb1cydhia-rishovs-projects.vercel.app',
    name: 'Vercel Backend Direct'
  }
};

const TEST_USERS = {
  employee: {
    email: 'sentheopsguy@gmail.com',
    password: 'voltas-beko',
    expectedRole: 'EMPLOYEE'
  },
  // Add test seeker/provider credentials if available
  seeker: {
    email: 'test-seeker@example.com',
    password: 'test-password',
    expectedRole: 'SEEKER'
  },
  provider: {
    email: 'test-provider@example.com', 
    password: 'test-password',
    expectedRole: 'PROVIDER'
  }
};

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const lib = urlObj.protocol === 'https:' ? https : http;
    
    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ChillConnect-Test-Script/1.0',
        ...options.headers
      }
    };

    if (options.data) {
      reqOptions.headers['Content-Length'] = Buffer.byteLength(options.data);
    }

    const req = lib.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed, raw: data });
        } catch (e) {
          resolve({ status: res.statusCode, data: null, raw: data, parseError: e.message });
        }
      });
    });

    req.on('error', reject);
    
    if (options.data) {
      req.write(options.data);
    }
    
    req.end();
  });
}

async function testHealthEndpoint(config) {
  console.log(`\n🏥 Testing Health Endpoint: ${config.name}`);
  try {
    const result = await makeRequest(`${config.baseUrl}/api/health`);
    console.log(`   Status: ${result.status}`);
    if (result.data) {
      console.log(`   Response: ${JSON.stringify(result.data)}`);
      return result.status === 200;
    } else {
      console.log(`   Raw Response: ${result.raw.substring(0, 200)}...`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return false;
  }
}

async function testLogin(config, userType, credentials) {
  console.log(`\n🔐 Testing ${userType} Login: ${config.name}`);
  console.log(`   Email: ${credentials.email}`);
  
  try {
    const result = await makeRequest(`${config.baseUrl}/api/auth/login`, {
      method: 'POST',
      data: JSON.stringify({
        email: credentials.email,
        password: credentials.password
      })
    });

    console.log(`   Status: ${result.status}`);
    
    if (result.data) {
      console.log(`   Response: ${JSON.stringify(result.data, null, 2)}`);
      
      // Check for successful login
      if (result.data.success && result.data.token) {
        console.log(`   ✅ Login successful`);
        console.log(`   📝 Token received: ${result.data.token.substring(0, 20)}...`);
        
        if (result.data.user && result.data.user.role === credentials.expectedRole) {
          console.log(`   ✅ Role matches expected: ${credentials.expectedRole}`);
        } else {
          console.log(`   ⚠️  Role mismatch. Expected: ${credentials.expectedRole}, Got: ${result.data.user?.role}`);
        }
        
        return { success: true, token: result.data.token, user: result.data.user };
      } else if (result.data.error) {
        console.log(`   ❌ Login failed: ${result.data.error}`);
        return { success: false, error: result.data.error };
      }
    } else {
      console.log(`   ❌ Invalid response format`);
      console.log(`   Raw Response: ${result.raw.substring(0, 300)}...`);
      return { success: false, error: 'Invalid response format' };
    }
  } catch (error) {
    console.log(`   ❌ Network error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testProtectedEndpoint(config, token) {
  if (!token) return { success: false, error: 'No token provided' };
  
  console.log(`\n🔒 Testing Protected Endpoint: ${config.name}`);
  try {
    const result = await makeRequest(`${config.baseUrl}/api/users/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log(`   Status: ${result.status}`);
    if (result.data) {
      console.log(`   Response: ${JSON.stringify(result.data, null, 2)}`);
      return result.status === 200 && result.data.success !== false;
    }
    return false;
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('🧪 ChillConnect Authentication Test Suite');
  console.log('==========================================');
  
  const results = {
    timestamp: new Date().toISOString(),
    configs: {},
    summary: { passed: 0, failed: 0, total: 0 }
  };

  for (const [configName, config] of Object.entries(TEST_CONFIGS)) {
    console.log(`\n📍 Testing Configuration: ${config.name}`);
    console.log(`   Base URL: ${config.baseUrl}`);
    
    const configResults = {
      health: false,
      logins: {},
      protectedAccess: {}
    };

    // Test health endpoint
    configResults.health = await testHealthEndpoint(config);

    // Test each user type login
    for (const [userType, credentials] of Object.entries(TEST_USERS)) {
      const loginResult = await testLogin(config, userType, credentials);
      configResults.logins[userType] = loginResult;

      // If login successful, test protected endpoint
      if (loginResult.success && loginResult.token) {
        const protectedResult = await testProtectedEndpoint(config, loginResult.token);
        configResults.protectedAccess[userType] = protectedResult;
      }
    }

    results.configs[configName] = configResults;
  }

  // Generate summary
  console.log('\n📊 TEST RESULTS SUMMARY');
  console.log('=======================');

  for (const [configName, config] of Object.entries(TEST_CONFIGS)) {
    const configResults = results.configs[configName];
    console.log(`\n${config.name}:`);
    console.log(`  Health: ${configResults.health ? '✅ PASS' : '❌ FAIL'}`);
    
    for (const [userType, loginResult] of Object.entries(configResults.logins)) {
      const protectedResult = configResults.protectedAccess[userType];
      console.log(`  ${userType} Login: ${loginResult.success ? '✅ PASS' : '❌ FAIL'}`);
      if (loginResult.success && protectedResult !== undefined) {
        console.log(`  ${userType} Protected Access: ${protectedResult ? '✅ PASS' : '❌ FAIL'}`);
      }
    }
  }

  // Count totals
  let totalTests = 0;
  let passedTests = 0;

  for (const configResults of Object.values(results.configs)) {
    totalTests++;
    if (configResults.health) passedTests++;

    for (const loginResult of Object.values(configResults.logins)) {
      totalTests++;
      if (loginResult.success) passedTests++;
    }

    for (const protectedResult of Object.values(configResults.protectedAccess)) {
      if (protectedResult !== undefined) {
        totalTests++;
        if (protectedResult) passedTests++;
      }
    }
  }

  results.summary = { passed: passedTests, failed: totalTests - passedTests, total: totalTests };

  console.log(`\n🎯 FINAL SUMMARY:`);
  console.log(`   Total Tests: ${results.summary.total}`);
  console.log(`   Passed: ${results.summary.passed} ✅`);
  console.log(`   Failed: ${results.summary.failed} ❌`);
  console.log(`   Success Rate: ${((results.summary.passed / results.summary.total) * 100).toFixed(1)}%`);

  // Save results to file
  const fs = require('fs');
  fs.writeFileSync('/Users/rishovsen/ChillConnect/test-results.json', JSON.stringify(results, null, 2));
  console.log(`\n📄 Detailed results saved to: test-results.json`);

  return results;
}

// Run tests if script is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests, makeRequest, testLogin };