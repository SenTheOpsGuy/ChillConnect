const axios = require('axios');

async function testAdminSetupAlternative() {
  console.log('🧪 Testing admin setup endpoint with alternative passwords...');
  
  const passwords = [
    'ChillConnect2024Admin',
    'SuperSecurePassword123!'
  ];
  
  for (const password of passwords) {
    console.log(`\n🔐 Trying password: ${password.substring(0, 5)}...`);
    
    try {
      const response = await axios.post('https://chillconnect-production.up.railway.app/api/setup-admin', {
        adminPassword: password
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`✅ Admin setup successful with password: ${password.substring(0, 5)}...`);
      console.log('Response:', response.data);
      
      // Now test the admin login
      console.log('\n🔐 Testing admin login...');
      const loginResponse = await axios.post('https://chillconnect-production.up.railway.app/api/auth/login', {
        email: 'admin@chillconnect.com',
        password: 'SuperSecurePassword123!'
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Admin login successful!');
      console.log('🎉 Admin user data:', loginResponse.data.data.user);
      
      return { success: true, password, message: 'Admin setup and login test passed' };
      
    } catch (error) {
      console.log(`❌ Failed with password: ${password.substring(0, 5)}...`);
      if (error.response) {
        console.log('Status:', error.response.status);
        console.log('Response:', error.response.data);
      } else {
        console.log('Error:', error.message);
      }
    }
  }
  
  return { success: false, error: 'All passwords failed' };
}

testAdminSetupAlternative();