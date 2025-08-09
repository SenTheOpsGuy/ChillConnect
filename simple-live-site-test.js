const puppeteer = require('puppeteer');

class SimpleChillConnectTester {
    constructor() {
        this.baseUrl = 'http://www.chillconnect.in';
        this.issues = [];
        this.results = [];
    }

    async logResult(test, status, details = '') {
        const result = { test, status, details, timestamp: new Date().toISOString() };
        this.results.push(result);
        
        const emoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
        console.log(`${emoji} ${test}: ${status} ${details}`);
        
        if (status === 'FAIL') {
            this.issues.push(`${test}: ${details}`);
        }
    }

    async testSite() {
        console.log('🚀 Starting ChillConnect Live Site Testing...\n');
        
        const browser = await puppeteer.launch({ 
            headless: false,
            defaultViewport: null,
            args: ['--start-maximized', '--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        
        try {
            // Test 1: Basic Site Access
            console.log('📋 Testing Basic Site Access...');
            const response = await page.goto(this.baseUrl, { waitUntil: 'networkidle0', timeout: 30000 });
            
            if (response && response.ok()) {
                await this.logResult('Site Access', 'PASS', `Status: ${response.status()}`);
            } else {
                await this.logResult('Site Access', 'FAIL', `Status: ${response ? response.status() : 'No response'}`);
            }
            
            const title = await page.title();
            await this.logResult('Page Title', title ? 'PASS' : 'FAIL', title);
            
            // Test 2: Check page content and structure
            console.log('\n📋 Testing Page Structure...');
            const bodyContent = await page.evaluate(() => document.body ? document.body.innerText.length : 0);
            await this.logResult('Page Content', bodyContent > 100 ? 'PASS' : 'FAIL', `${bodyContent} characters`);
            
            // Test for navigation
            const nav = await page.$('nav, .nav, .navbar, .navigation, header');
            await this.logResult('Navigation Elements', nav ? 'PASS' : 'FAIL');
            
            // Test 3: Look for authentication elements
            console.log('\n📋 Testing Authentication Elements...');
            const authElements = await page.$$eval('*', () => {
                const elements = Array.from(document.querySelectorAll('*'));
                const textContent = elements.map(el => el.textContent || '').join(' ').toLowerCase();
                return {
                    hasLogin: textContent.includes('login') || textContent.includes('sign in'),
                    hasSignup: textContent.includes('sign up') || textContent.includes('register'),
                    hasProfile: textContent.includes('profile'),
                    hasWallet: textContent.includes('wallet') || textContent.includes('token'),
                    hasChat: textContent.includes('chat') || textContent.includes('message'),
                    hasBooking: textContent.includes('book') || textContent.includes('appointment'),
                    hasAdmin: textContent.includes('admin'),
                    hasSearch: textContent.includes('search') || textContent.includes('find')
                };
            });
            
            await this.logResult('Login/Auth Elements', authElements.hasLogin ? 'PASS' : 'FAIL');
            await this.logResult('Signup Elements', authElements.hasSignup ? 'PASS' : 'FAIL');
            await this.logResult('Profile Elements', authElements.hasProfile ? 'PASS' : 'FAIL');
            await this.logResult('Wallet/Token Elements', authElements.hasWallet ? 'PASS' : 'FAIL');
            await this.logResult('Chat Elements', authElements.hasChat ? 'PASS' : 'FAIL');
            await this.logResult('Booking Elements', authElements.hasBooking ? 'PASS' : 'FAIL');
            await this.logResult('Search Elements', authElements.hasSearch ? 'PASS' : 'FAIL');
            
            // Test 4: Form elements
            console.log('\n📋 Testing Form Elements...');
            const forms = await page.$$('form');
            await this.logResult('Forms Present', forms.length > 0 ? 'PASS' : 'FAIL', `Found ${forms.length} forms`);
            
            const inputs = await page.$$('input');
            await this.logResult('Input Fields', inputs.length > 0 ? 'PASS' : 'FAIL', `Found ${inputs.length} inputs`);
            
            const buttons = await page.$$('button');
            await this.logResult('Buttons Present', buttons.length > 0 ? 'PASS' : 'FAIL', `Found ${buttons.length} buttons`);
            
            // Test 5: Check for JavaScript errors
            console.log('\n📋 Testing JavaScript Functionality...');
            const jsErrors = [];
            page.on('pageerror', error => jsErrors.push(error.message));
            
            // Reload page to catch any JS errors
            await page.reload({ waitUntil: 'networkidle0' });
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            await this.logResult('JavaScript Errors', jsErrors.length === 0 ? 'PASS' : 'FAIL', 
                jsErrors.length > 0 ? `${jsErrors.length} errors: ${jsErrors[0]}` : 'No JS errors');
            
            // Test 6: Mobile responsiveness
            console.log('\n📋 Testing Mobile Responsiveness...');
            await page.setViewport({ width: 375, height: 667 });
            await page.reload({ waitUntil: 'networkidle0' });
            
            const mobileContent = await page.evaluate(() => {
                const body = document.body;
                return {
                    hasHorizontalScroll: body.scrollWidth > window.innerWidth,
                    bodyWidth: body.scrollWidth,
                    windowWidth: window.innerWidth
                };
            });
            
            await this.logResult('Mobile Layout', 
                !mobileContent.hasHorizontalScroll ? 'PASS' : 'FAIL',
                `Body: ${mobileContent.bodyWidth}px, Window: ${mobileContent.windowWidth}px`);
            
            // Reset viewport
            await page.setViewport({ width: 1920, height: 1080 });
            
            // Test 7: Admin access
            console.log('\n📋 Testing Admin Panel Access...');
            try {
                const adminResponse = await page.goto(`${this.baseUrl}/admin`, { waitUntil: 'networkidle0', timeout: 10000 });
                const adminUrl = page.url();
                
                if (adminUrl.includes('/admin')) {
                    await this.logResult('Admin Panel URL', 'PASS', adminUrl);
                    
                    const adminContent = await page.evaluate(() => document.body.innerText.toLowerCase());
                    const hasAdminElements = adminContent.includes('admin') || adminContent.includes('dashboard') || adminContent.includes('login');
                    await this.logResult('Admin Panel Content', hasAdminElements ? 'PASS' : 'FAIL');
                } else {
                    await this.logResult('Admin Panel Access', 'FAIL', `Redirected to: ${adminUrl}`);
                }
            } catch (error) {
                await this.logResult('Admin Panel Access', 'FAIL', error.message);
            }
            
            // Test 8: API endpoints (basic check)
            console.log('\n📋 Testing API Endpoints...');
            try {
                const apiResponse = await page.goto(`${this.baseUrl}/api/health`, { timeout: 5000 });
                await this.logResult('API Health Endpoint', apiResponse.ok() ? 'PASS' : 'FAIL', `Status: ${apiResponse.status()}`);
            } catch (error) {
                await this.logResult('API Health Endpoint', 'FAIL', 'Endpoint not accessible');
            }
            
            // Test 9: Performance
            console.log('\n📋 Testing Performance...');
            const startTime = Date.now();
            await page.goto(this.baseUrl, { waitUntil: 'networkidle0' });
            const loadTime = Date.now() - startTime;
            
            if (loadTime < 3000) {
                await this.logResult('Page Load Performance', 'PASS', `${loadTime}ms`);
            } else if (loadTime < 5000) {
                await this.logResult('Page Load Performance', 'WARN', `${loadTime}ms (acceptable)`);
            } else {
                await this.logResult('Page Load Performance', 'FAIL', `${loadTime}ms (too slow)`);
            }
            
        } catch (error) {
            await this.logResult('Test Execution', 'FAIL', error.message);
        } finally {
            await browser.close();
        }
        
        // Generate report
        this.generateReport();
        return this.results;
    }
    
    generateReport() {
        console.log('\n=== CHILLCONNECT LIVE SITE TEST REPORT ===');
        console.log(`📅 Test Date: ${new Date().toLocaleString()}`);
        console.log(`🌐 Site: ${this.baseUrl}`);
        
        const passed = this.results.filter(r => r.status === 'PASS').length;
        const failed = this.results.filter(r => r.status === 'FAIL').length;
        const warnings = this.results.filter(r => r.status === 'WARN').length;
        
        console.log(`📊 Results: ${passed} passed, ${failed} failed, ${warnings} warnings`);
        console.log(`📈 Success Rate: ${((passed / this.results.length) * 100).toFixed(1)}%`);
        
        if (this.issues.length > 0) {
            console.log('\n🚨 CRITICAL ISSUES FOUND:');
            this.issues.forEach((issue, i) => console.log(`${i + 1}. ${issue}`));
        }
        
        console.log('\n📋 RECOMMENDATIONS:');
        if (failed > 0) {
            console.log('❌ Fix critical failures before proceeding with detailed testing');
        }
        if (!this.results.find(r => r.test.includes('Login') && r.status === 'PASS')) {
            console.log('🔐 Implement user authentication system');
        }
        if (!this.results.find(r => r.test.includes('Wallet') && r.status === 'PASS')) {
            console.log('💰 Add token/payment system');
        }
        if (!this.results.find(r => r.test.includes('Chat') && r.status === 'PASS')) {
            console.log('💬 Implement chat functionality');
        }
        if (!this.results.find(r => r.test.includes('Booking') && r.status === 'PASS')) {
            console.log('📅 Add booking system');
        }
    }
}

// Run the test
const tester = new SimpleChillConnectTester();
tester.testSite().then(() => {
    console.log('\n🏁 Testing completed!');
    process.exit(0);
}).catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
});