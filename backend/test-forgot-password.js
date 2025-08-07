const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function testForgotPassword() {
  try {
    console.log('🔍 Testing forgot password functionality...');
    
    // Check environment variables
    console.log('Environment variables:');
    console.log('- BREVO_API_KEY:', process.env.BREVO_API_KEY ? 'Set (' + process.env.BREVO_API_KEY.substring(0, 10) + '...)' : 'NOT SET');
    console.log('- FRONTEND_URL:', process.env.FRONTEND_URL || 'NOT SET');
    console.log('- JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'NOT SET');
    console.log('- EMAIL_FROM:', process.env.EMAIL_FROM || 'NOT SET');
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: 'mountainsagegiri@gmail.com' }
    });
    
    if (user) {
      console.log('✅ User found:', user.email, 'Role:', user.role);
    } else {
      console.log('❌ User not found with email: mountainsagegiri@gmail.com');
    }
    
    // Test Brevo service
    const { sendTransactionalEmail } = require('./src/services/brevoService');
    
    console.log('🔍 Testing Brevo service...');
    await sendTransactionalEmail(
      'mountainsagegiri@gmail.com',
      'Test Email - ChillConnect',
      '<h1>Test Email</h1><p>This is a test email to verify Brevo service is working.</p>'
    );
    
    console.log('✅ Brevo email service test successful');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Error details:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testForgotPassword();