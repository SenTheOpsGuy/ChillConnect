const axios = require('axios');

const API_BASE_URL = 'http://localhost:5001/api';

async function verifyLogin(email, password, role) {
    try {
        console.log(`\n🔐 Testing ${role} login: ${email}`);
        
        const response = await axios.post(`${API_BASE_URL}/auth/login`, {
            email,
            password
        });
        
        if (response.data.success) {
            console.log(`✅ ${role} login successful`);
            const token = response.data.token || response.data.data?.token;
            const user = response.data.user || response.data.data?.user;
            console.log(`   Token: ${token ? token.substring(0, 20) + '...' : 'Present'}`);
            console.log(`   User: ${user?.profile?.firstName} ${user?.profile?.lastName}`);
            console.log(`   Role: ${user?.role}`);
            console.log(`   Verified: ${user?.isVerified}`);
            
            // Test protected endpoint
            const profileResponse = await axios.get(`${API_BASE_URL}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (profileResponse.data.success) {
                console.log(`✅ Protected endpoint access successful`);
            }
            
            return true;
        } else {
            console.log(`❌ ${role} login failed: ${response.data.error}`);
            return false;
        }
    } catch (error) {
        console.log(`❌ ${role} login error: ${error.response?.data?.error || error.message}`);
        return false;
    }
}

async function testAllLogins() {
    console.log('🧪 Testing ChillConnect Login Functionality');
    console.log('==========================================');
    
    const testAccounts = [
        { email: 'admin@chillconnect.com', password: 'admin123', role: 'SUPER_ADMIN' },
        { email: 'manager@chillconnect.com', password: 'manager123', role: 'MANAGER' },
        { email: 'employee1@chillconnect.com', password: 'employee1123', role: 'EMPLOYEE' },
        { email: 'provider1@chillconnect.com', password: 'provider1123', role: 'PROVIDER' },
        { email: 'seeker1@chillconnect.com', password: 'seeker1123', role: 'SEEKER' }
    ];
    
    let successCount = 0;
    
    for (const account of testAccounts) {
        const success = await verifyLogin(account.email, account.password, account.role);
        if (success) successCount++;
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`\n📊 Test Results: ${successCount}/${testAccounts.length} logins successful`);
    
    if (successCount === testAccounts.length) {
        console.log('🎉 All login tests passed! ChillConnect is ready for testing.');
    } else {
        console.log('⚠️  Some login tests failed. Please check the backend logs.');
    }
    
    // Test API health
    try {
        const healthResponse = await axios.get(`${API_BASE_URL}/health`);
        console.log(`✅ API Health Check: ${healthResponse.data.status}`);
    } catch (error) {
        console.log(`❌ API Health Check failed: ${error.message}`);
    }
}

testAllLogins().catch(console.error);