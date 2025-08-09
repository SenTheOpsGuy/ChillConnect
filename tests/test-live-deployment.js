#!/usr/bin/env node

// Test script for live ChillConnect deployment
const fetch = require('node-fetch');

class LiveDeploymentTester {
    constructor(backendUrl = null, frontendUrl = 'https://chillconnect.in') {
        this.backendUrl = backendUrl || process.argv[2];
        this.frontendUrl = frontendUrl;
        this.results = [];
        
        if (!this.backendUrl) {
            console.log('❌ Please provide backend URL as argument');
            console.log('Usage: node test-live-deployment.js https://your-backend-url.onrender.com');
            process.exit(1);
        }
    }

    async logResult(test, status, details = '') {
        const result = { test, status, details };
        this.results.push(result);
        
        const emoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
        console.log(`${emoji} ${test}: ${status} ${details}`);
    }

    async testBackendHealth() {
        console.log('\n🔧 TESTING LIVE BACKEND');
        console.log('========================');
        
        try {
            const response = await fetch(`${this.backendUrl}/api/health`, {
                timeout: 10000
            });
            
            if (response.ok) {
                const data = await response.json();
                await this.logResult('Backend Health Check', 'PASS', `Status: ${data.status}`);
                return true;
            } else {
                await this.logResult('Backend Health Check', 'FAIL', `HTTP ${response.status}`);
                return false;
            }
        } catch (error) {
            await this.logResult('Backend Health Check', 'FAIL', error.message);
            return false;
        }
    }

    async testBackendAuth() {
        console.log('\n🔐 TESTING LIVE AUTHENTICATION');
        console.log('===============================');
        
        const testEmail = `live_test_${Date.now()}@test.com`;
        
        try {
            // Test registration
            const registerResponse = await fetch(`${this.backendUrl}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: testEmail,
                    password: 'LiveTest123!',
                    role: 'SEEKER',
                    firstName: 'Live',
                    lastName: 'Test',
                    dateOfBirth: '1995-01-01',
                    ageConfirmed: 'true',
                    consentGiven: 'true'
                }),
                timeout: 10000
            });

            if (registerResponse.ok) {
                const registerData = await registerResponse.json();
                await this.logResult('Live Registration', 'PASS', 'User created successfully');
                
                // Test login
                const loginResponse = await fetch(`${this.backendUrl}/api/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: testEmail,
                        password: 'LiveTest123!'
                    }),
                    timeout: 10000
                });

                if (loginResponse.ok) {
                    const loginData = await loginResponse.json();
                    await this.logResult('Live Login', 'PASS', 'Authentication successful');
                    
                    // Test protected endpoint
                    const meResponse = await fetch(`${this.backendUrl}/api/auth/me`, {
                        headers: { 'Authorization': `Bearer ${loginData.token}` },
                        timeout: 10000
                    });

                    if (meResponse.ok) {
                        await this.logResult('Protected Endpoint', 'PASS', 'JWT authentication working');
                        return true;
                    } else {
                        await this.logResult('Protected Endpoint', 'FAIL', 'JWT verification failed');
                        return false;
                    }
                } else {
                    const loginError = await loginResponse.json();
                    await this.logResult('Live Login', 'FAIL', loginError.error);
                    return false;
                }
            } else {
                const registerError = await registerResponse.json();
                await this.logResult('Live Registration', 'FAIL', registerError.error);
                return false;
            }
        } catch (error) {
            await this.logResult('Live Authentication', 'FAIL', error.message);
            return false;
        }
    }

    async testFrontendAccess() {
        console.log('\n🌐 TESTING LIVE FRONTEND');
        console.log('========================');
        
        try {
            const response = await fetch(this.frontendUrl, {
                timeout: 10000
            });
            
            if (response.ok) {
                const html = await response.text();
                const hasReactApp = html.includes('root') || html.includes('React') || html.includes('id="app"');
                const hasTitle = html.includes('ChillConnect');
                
                if (hasReactApp && hasTitle) {
                    await this.logResult('Frontend Access', 'PASS', 'React app loaded successfully');
                } else if (hasTitle) {
                    await this.logResult('Frontend Access', 'WARN', 'Site loads but may be static HTML');
                } else {
                    await this.logResult('Frontend Access', 'FAIL', 'Unexpected content');
                }
                
                return true;
            } else {
                await this.logResult('Frontend Access', 'FAIL', `HTTP ${response.status}`);
                return false;
            }
        } catch (error) {
            await this.logResult('Frontend Access', 'FAIL', error.message);
            return false;
        }
    }

    async testCorsIntegration() {
        console.log('\n🔗 TESTING CORS INTEGRATION');
        console.log('============================');
        
        try {
            // Simulate a browser request from the frontend domain
            const response = await fetch(`${this.backendUrl}/api/health`, {
                headers: {
                    'Origin': this.frontendUrl,
                    'Access-Control-Request-Method': 'GET'
                },
                timeout: 5000
            });
            
            const corsHeaders = response.headers.get('access-control-allow-origin');
            
            if (corsHeaders && (corsHeaders.includes(this.frontendUrl) || corsHeaders === '*')) {
                await this.logResult('CORS Configuration', 'PASS', `Allows: ${corsHeaders}`);
                return true;
            } else {
                await this.logResult('CORS Configuration', 'WARN', 'May need CORS configuration update');
                return false;
            }
        } catch (error) {
            await this.logResult('CORS Configuration', 'FAIL', error.message);
            return false;
        }
    }

    async generateReport() {
        console.log('\n📊 LIVE DEPLOYMENT TEST REPORT');
        console.log('===============================');
        
        const passed = this.results.filter(r => r.status === 'PASS').length;
        const failed = this.results.filter(r => r.status === 'FAIL').length;
        const warnings = this.results.filter(r => r.status === 'WARN').length;
        const total = this.results.length;
        
        console.log(`📅 Test Date: ${new Date().toLocaleString()}`);
        console.log(`🌐 Backend URL: ${this.backendUrl}`);
        console.log(`🎨 Frontend URL: ${this.frontendUrl}`);
        console.log(`📊 Results: ${passed} passed, ${failed} failed, ${warnings} warnings`);
        console.log(`📈 Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
        
        const allPassed = failed === 0;
        
        if (allPassed) {
            console.log('\n🎉 DEPLOYMENT SUCCESSFUL!');
            console.log('✅ All critical systems are working');
            console.log('✅ Users can register and login');
            console.log('✅ Frontend-backend integration working');
            console.log('✅ Ready for production use');
        } else {
            console.log('\n⚠️  DEPLOYMENT NEEDS ATTENTION');
            console.log('❌ Some critical systems are not working');
            console.log('🔧 Please check the failed tests above');
        }
        
        return {
            passed,
            failed,
            warnings,
            total,
            successRate: ((passed / total) * 100).toFixed(1),
            deploymentReady: allPassed
        };
    }

    async runAllTests() {
        console.log('🚀 Testing ChillConnect Live Deployment');
        console.log('========================================');
        console.log(`Backend: ${this.backendUrl}`);
        console.log(`Frontend: ${this.frontendUrl}`);
        
        try {
            // Test backend
            const backendWorking = await this.testBackendHealth();
            
            if (backendWorking) {
                await this.testBackendAuth();
                await this.testCorsIntegration();
            }
            
            // Test frontend
            await this.testFrontendAccess();
            
            // Generate report
            return await this.generateReport();
            
        } catch (error) {
            console.error('❌ Test execution failed:', error);
            return { error: error.message };
        }
    }
}

// Run the tests
if (require.main === module) {
    const tester = new LiveDeploymentTester();
    tester.runAllTests().then(report => {
        process.exit(report.deploymentReady ? 0 : 1);
    }).catch(error => {
        console.error('❌ Testing failed:', error);
        process.exit(1);
    });
}

module.exports = LiveDeploymentTester;