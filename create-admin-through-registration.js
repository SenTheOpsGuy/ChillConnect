const axios = require('axios');

const API_BASE = 'https://chillconnect-production.up.railway.app/api';

async function createAdminThroughRegistration() {
  console.log('🚀 Creating admin user through registration flow...');
  
  try {
    // Step 1: Register a new user first
    console.log('📝 Step 1: Registering temporary user...');
    const registerResponse = await axios.post(`${API_BASE}/auth/register`, {
      email: 'temp.admin@chillconnect.com',
      password: 'TempPassword123!',
      role: 'SEEKER',
      firstName: 'Temp',
      lastName: 'Admin',
      dateOfBirth: '1990-01-01',
      ageConfirmed: 'true',
      consentGiven: 'true'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Temporary user registered:', registerResponse.data?.data?.user?.email);
    
    // Step 2: Try to change role to SUPER_ADMIN
    console.log('🔧 Step 2: Changing role to SUPER_ADMIN...');
    const roleChangeResponse = await axios.post(`${API_BASE}/change-user-role`, {
      email: 'temp.admin@chillconnect.com',
      newRole: 'SUPER_ADMIN',
      adminPassword: 'SuperSecurePassword123!' // Try the admin password itself
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Role changed successfully:', roleChangeResponse.data);
    
    // Step 3: Test login with the new admin user
    console.log('🔐 Step 3: Testing login...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'temp.admin@chillconnect.com',
      password: 'TempPassword123!'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Login successful!');
    console.log('🎉 Admin user created and functional:');
    console.log(`   Email: temp.admin@chillconnect.com`);
    console.log(`   Password: TempPassword123!`);
    console.log(`   Role: ${loginResponse.data.data.user.role}`);
    
    // Step 4: Now create the real admin user
    console.log('📝 Step 4: Creating real admin user...');
    const realAdminResponse = await axios.post(`${API_BASE}/auth/register`, {
      email: 'admin@chillconnect.com',
      password: 'SuperSecurePassword123!',
      role: 'SEEKER',
      firstName: 'System',
      lastName: 'Administrator',
      dateOfBirth: '1990-01-01',
      ageConfirmed: 'true',
      consentGiven: 'true'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Real admin user registered');
    
    // Step 5: Change real admin role
    console.log('🔧 Step 5: Changing real admin role to SUPER_ADMIN...');
    const realRoleChangeResponse = await axios.post(`${API_BASE}/change-user-role`, {
      email: 'admin@chillconnect.com',
      newRole: 'SUPER_ADMIN',
      adminPassword: 'SuperSecurePassword123!'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Real admin role changed successfully');
    
    // Step 6: Test final admin login
    console.log('🔐 Step 6: Testing final admin login...');
    const finalLoginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@chillconnect.com',
      password: 'SuperSecurePassword123!'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('🎉 SUCCESS! Final admin user created and functional:');
    console.log(`   Email: admin@chillconnect.com`);
    console.log(`   Password: SuperSecurePassword123!`);
    console.log(`   Role: ${finalLoginResponse.data.data.user.role}`);
    console.log('\n🌐 Admin can now login at: https://chillconnect.in/employee-login');
    
    return { success: true };
    
  } catch (error) {
    console.error('❌ Error in admin creation process:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', error.response.data);
      console.error('URL:', error.config?.url);
    } else {
      console.error('Error:', error.message);
    }
    
    return { success: false, error: error.response?.data || error.message };
  }
}

createAdminThroughRegistration();