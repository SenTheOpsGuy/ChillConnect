const axios = require('axios');

async function testAdminSetup() {
  console.log('🧪 Testing admin setup endpoint...');
  
  try {
    const response = await axios.post('https://chillconnect-production.up.railway.app/api/setup-admin', {
      adminPassword: 'ChillConnect2024Admin'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Admin setup response:', response.data);
    
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
    
    return { success: true, message: 'Admin setup and login test passed' };
    
  } catch (error) {
    console.error('❌ Admin setup/login test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
    
    return { success: false, error: error.response?.data || error.message };
  }
}

testAdminSetup();