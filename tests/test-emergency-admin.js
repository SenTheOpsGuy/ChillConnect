const axios = require('axios');

async function testEmergencyAdminSetup() {
  console.log('🆘 Testing emergency admin setup...');
  
  const passwords = [
    'admin-setup-emergency-2024',
    'SuperSecurePassword123!',
    'ChillConnect2024Admin'
  ];
  
  for (const password of passwords) {
    console.log(`\n🔐 Trying emergency password: ${password.substring(0, 10)}...`);
    
    try {
      const response = await axios.post('https://chillconnect-production.up.railway.app/api/setup-admin', {
        adminPassword: password
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`✅ Emergency admin setup successful with password: ${password.substring(0, 10)}...`);
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
      console.log('\n🌐 Admin can now login at: https://chillconnect.in/employee-login');
      
      return { success: true, password };
      
    } catch (error) {
      console.log(`❌ Failed with emergency password: ${password.substring(0, 10)}...`);
      if (error.response) {
        console.log('Status:', error.response.status);
        console.log('Response:', error.response.data);
      } else {
        console.log('Error:', error.message);
      }
    }
  }
  
  return { success: false, error: 'All emergency passwords failed' };
}

testEmergencyAdminSetup();