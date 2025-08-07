const bcrypt = require('bcryptjs');
const fetch = require('node-fetch'); // You might need: npm install node-fetch@2
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function testAdminLogin() {
  try {
    console.log('🔍 Testing admin login...');
    
    // 1. Check database user
    const user = await prisma.user.findUnique({
      where: { email: 'admin@chillconnect.com' }
    });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('✅ User found:');
    console.log('- Email:', user.email);
    console.log('- Role:', user.role);
    console.log('- ID:', user.id);
    console.log('- Verified:', user.isVerified);
    
    // 2. Test password
    const passwordMatch = await bcrypt.compare('SuperSecurePassword123!', user.passwordHash);
    console.log('- Password match:', passwordMatch ? '✅' : '❌');
    
    // 3. Test login API endpoint (if server is running)
    console.log('\n🔍 Testing login API...');
    
    try {
      const response = await fetch('http://localhost:5001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'admin@chillconnect.com',
          password: 'SuperSecurePassword123!'
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        console.log('✅ Login API successful');
        console.log('- User role:', data.data?.user?.role || data.user?.role);
        console.log('- Token received:', !!data.token || !!(data.data?.token));
      } else {
        console.log('❌ Login API failed');
        console.log('- Status:', response.status);
        console.log('- Error:', data.error || data.message);
      }
    } catch (apiError) {
      console.log('❌ Could not connect to API (server might not be running)');
      console.log('- Error:', apiError.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAdminLogin();