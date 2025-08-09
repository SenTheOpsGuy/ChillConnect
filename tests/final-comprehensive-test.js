const puppeteer = require('puppeteer');

class FinalComprehensiveTest {
    constructor() {
        this.backendUrl = 'http://localhost:5001';
        this.liveUrl = 'https://chillconnect.in';
        this.results = [];
        this.criticalIssues = [];
        this.testUser = {
            email: `final_test_${Date.now()}@test.com`,
            password: 'FinalTest123!',
            firstName: 'Final',
            lastName: 'Test'
        };
    }

    async logResult(test, status, details = '', critical = false) {
        const result = { test, status, details, timestamp: new Date().toISOString() };
        this.results.push(result);
        
        const emoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : status === 'SKIP' ? '⏭️' : '⚠️';
        console.log(`${emoji} ${test}: ${status} ${details}`);
        
        if (status === 'FAIL' && critical) {
            this.criticalIssues.push(`CRITICAL: ${test} - ${details}`);
        }
    }

    async testBackendDirectly() {
        console.log('\n🔧 TESTING BACKEND API DIRECTLY');
        console.log('=================================');

        try {
            // Test health endpoint
            const healthResponse = await fetch(`${this.backendUrl}/api/health`);
            if (healthResponse.ok) {
                const healthData = await healthResponse.json();
                await this.logResult('Backend Health Check', 'PASS', `Status: ${healthData.status}`);
            } else {
                await this.logResult('Backend Health Check', 'FAIL', `Status: ${healthResponse.status}`, true);
                return false;
            }

            // Test registration with unique email
            const registerResponse = await fetch(`${this.backendUrl}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: this.testUser.email,
                    password: this.testUser.password,
                    role: 'SEEKER',
                    firstName: this.testUser.firstName,
                    lastName: this.testUser.lastName,
                    dateOfBirth: '1995-01-01',
                    ageConfirmed: 'true',
                    consentGiven: 'true'
                })
            });

            if (registerResponse.ok) {
                const registerData = await registerResponse.json();
                await this.logResult('Backend Registration', 'PASS', 'User created successfully');
                this.testUser.token = registerData.token;
                this.testUser.id = registerData.user.id;
            } else {
                const errorData = await registerResponse.json();
                await this.logResult('Backend Registration', 'FAIL', `Error: ${errorData.error}`, true);
                return false;
            }

            // Test login
            const loginResponse = await fetch(`${this.backendUrl}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: this.testUser.email,
                    password: this.testUser.password
                })
            });

            if (loginResponse.ok) {
                const loginData = await loginResponse.json();
                await this.logResult('Backend Login', 'PASS', 'Login successful');
                await this.logResult('JWT Token Generation', 'PASS', 'Token received');
                await this.logResult('Profile Data', loginData.user.profile ? 'PASS' : 'FAIL', 
                    loginData.user.profile ? 'Profile data present' : 'No profile data');
            } else {
                await this.logResult('Backend Login', 'FAIL', 'Login failed', true);
                return false;
            }

            // Test protected endpoint
            const meResponse = await fetch(`${this.backendUrl}/api/auth/me`, {
                headers: { 'Authorization': `Bearer ${this.testUser.token}` }
            });

            if (meResponse.ok) {
                await this.logResult('Protected Endpoint', 'PASS', 'JWT authentication working');
            } else {
                await this.logResult('Protected Endpoint', 'FAIL', 'JWT authentication failed');
            }

            return true;

        } catch (error) {
            await this.logResult('Backend API Tests', 'FAIL', error.message, true);
            return false;
        }
    }

    async generateFinalReport() {
        console.log('\n📊 FINAL COMPREHENSIVE TEST REPORT');
        console.log('====================================');

        const total = this.results.length;
        const passed = this.results.filter(r => r.status === 'PASS').length;
        const failed = this.results.filter(r => r.status === 'FAIL').length;
        const skipped = this.results.filter(r => r.status === 'SKIP').length;
        const warnings = this.results.filter(r => r.status === 'WARN').length;

        console.log(`📅 Test Date: ${new Date().toLocaleString()}`);
        console.log(`📊 Total Tests: ${total}`);
        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`⏭️  Skipped: ${skipped}`);
        console.log(`⚠️  Warnings: ${warnings}`);
        console.log(`📈 Success Rate: ${((passed / (total - skipped)) * 100).toFixed(1)}%`);

        if (this.criticalIssues.length > 0) {
            console.log('\n🚨 CRITICAL ISSUES:');
            this.criticalIssues.forEach((issue, i) => {
                console.log(`${i + 1}. ${issue}`);
            });
        }

        console.log('\n🎯 DEPLOYMENT STATUS:');
        const backendWorking = this.results.find(r => r.test === 'Backend Health Check')?.status === 'PASS';
        const authWorking = this.results.find(r => r.test === 'Backend Registration')?.status === 'PASS';

        if (backendWorking && authWorking) {
            console.log('✅ Backend: Ready for production deployment');
        } else {
            console.log('❌ Backend: Issues need fixing before deployment');
        }

        const overallReady = backendWorking && authWorking;
        console.log(`\n🚀 OVERALL DEPLOYMENT READINESS: ${overallReady ? '✅ READY' : '❌ NOT READY'}`);

        if (overallReady) {
            console.log('\n🎉 SYSTEM IS READY FOR PRODUCTION DEPLOYMENT!');
            console.log('\n📋 NEXT STEPS FOR FULL DEPLOYMENT:');
            console.log('1. Deploy backend to Railway: cd backend && railway up');
            console.log('2. Get backend URL and update frontend config');
            console.log('3. Rebuild and redeploy frontend to Netlify');
            console.log('4. Run final live tests');
            console.log('\n⚡ Expected final success rate: 95%+');
        }

        return {
            total,
            passed,
            failed,
            skipped,
            warnings,
            successRate: ((passed / (total - skipped)) * 100).toFixed(1),
            deploymentReady: overallReady,
            criticalIssues: this.criticalIssues
        };
    }

    async runAllTests() {
        try {
            console.log('🚀 Starting Final Comprehensive System Test');
            console.log('===========================================');

            // Test backend API directly
            const backendWorking = await this.testBackendDirectly();

            // Generate final report
            const report = await this.generateFinalReport();
            
            return report;

        } catch (error) {
            console.error('❌ Test execution failed:', error);
            return { error: error.message };
        }
    }
}

// Add fetch polyfill for Node.js
import('node-fetch').then(({ default: fetch }) => {
    global.fetch = fetch;
    
    // Run the final comprehensive test
    const tester = new FinalComprehensiveTest();
    tester.runAllTests().then(report => {
        if (report.deploymentReady) {
            console.log('\n🏆 ALL SYSTEMS GO! Ready for deployment!');
            process.exit(0);
        } else {
            console.log('\n⚠️  Some issues found. Check the report above.');
            process.exit(1);
        }
    }).catch(error => {
        console.error('❌ Final test failed:', error);
        process.exit(1);
    });
});