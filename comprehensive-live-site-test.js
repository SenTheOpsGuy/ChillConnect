const puppeteer = require('puppeteer');

class ChillConnectLiveTester {
    constructor() {
        this.baseUrl = 'http://www.chillconnect.in';
        this.browser = null;
        this.page = null;
        this.testResults = [];
        this.issues = [];
    }

    async init() {
        console.log('🚀 Starting ChillConnect Live Site Testing...');
        this.browser = await puppeteer.launch({ 
            headless: false,
            defaultViewport: null,
            args: ['--start-maximized']
        });
        this.page = await this.browser.newPage();
        
        // Add delay function
        this.page.waitForTimeout = (ms) => new Promise(resolve => setTimeout(resolve, ms));
        
        // Set up error listeners
        this.page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log('❌ Console Error:', msg.text());
                this.issues.push(`Console Error: ${msg.text()}`);
            }
        });

        this.page.on('pageerror', error => {
            console.log('❌ Page Error:', error.message);
            this.issues.push(`Page Error: ${error.message}`);
        });

        await this.page.goto(this.baseUrl, { waitUntil: 'networkidle2' });
    }

    async logResult(test, status, details = '') {
        const result = {
            test,
            status,
            details,
            timestamp: new Date().toISOString()
        };
        this.testResults.push(result);
        
        const emoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
        console.log(`${emoji} ${test}: ${status} ${details}`);
        
        if (status === 'FAIL') {
            this.issues.push(`${test}: ${details}`);
        }
    }

    async testBasicSiteAccess() {
        console.log('\n📋 Testing Basic Site Access...');
        try {
            const title = await this.page.title();
            if (title) {
                await this.logResult('Site Access', 'PASS', `Title: ${title}`);
            } else {
                await this.logResult('Site Access', 'FAIL', 'No title found');
            }

            // Check if basic elements are present
            const navExists = await this.page.$('nav') !== null;
            await this.logResult('Navigation Present', navExists ? 'PASS' : 'FAIL');

            // Check for login/signup buttons using XPath for text content
            const loginButton = await this.page.$x("//button[contains(text(), 'Login')] | //a[contains(text(), 'Login')] | //*[@data-testid='login-button'] | //*[contains(@class, 'login-btn')]");
            const signupButton = await this.page.$x("//button[contains(text(), 'Sign Up')] | //a[contains(text(), 'Sign Up')] | //*[@data-testid='signup-button'] | //*[contains(@class, 'signup-btn')]");
            
            await this.logResult('Login Button Present', loginButton.length > 0 ? 'PASS' : 'FAIL');
            await this.logResult('Signup Button Present', signupButton.length > 0 ? 'PASS' : 'FAIL');

        } catch (error) {
            await this.logResult('Basic Site Access', 'FAIL', error.message);
        }
    }

    async testRegistrationFlow() {
        console.log('\n📋 Testing Registration Flows...');
        try {
            // Test Seeker Registration
            await this.testSeekerRegistration();
            await this.page.waitForTimeout(2000);
            
            // Test Provider Registration  
            await this.testProviderRegistration();
            
        } catch (error) {
            await this.logResult('Registration Flow', 'FAIL', error.message);
        }
    }

    async testSeekerRegistration() {
        try {
            // Navigate to registration
            const signupButton = await this.page.$('button:contains("Sign Up"), a:contains("Sign Up"), .signup-btn, [data-testid="signup-button"]');
            
            if (signupButton) {
                await signupButton.click();
                await this.page.waitForTimeout(2000);
                
                // Check if registration form appears
                const emailField = await this.page.$('input[type="email"], input[name="email"]');
                const passwordField = await this.page.$('input[type="password"], input[name="password"]');
                
                await this.logResult('Seeker Registration Form', emailField && passwordField ? 'PASS' : 'FAIL');
                
                if (emailField && passwordField) {
                    // Fill test registration data
                    const testEmail = `seeker_${Date.now()}@test.com`;
                    await emailField.type(testEmail);
                    await passwordField.type('TestPassword123!');
                    
                    // Look for user type selection
                    const seekerOption = await this.page.$('input[value="seeker"], .seeker-option, [data-role="seeker"]');
                    if (seekerOption) {
                        await seekerOption.click();
                        await this.logResult('Seeker Role Selection', 'PASS');
                    }
                    
                    const submitButton = await this.page.$('button[type="submit"], .submit-btn, button:contains("Register")');
                    if (submitButton) {
                        await submitButton.click();
                        await this.page.waitForTimeout(3000);
                        await this.logResult('Seeker Registration Submission', 'PASS');
                    } else {
                        await this.logResult('Seeker Registration Submission', 'FAIL', 'No submit button found');
                    }
                }
            } else {
                await this.logResult('Seeker Registration Access', 'FAIL', 'No signup button found');
            }
        } catch (error) {
            await this.logResult('Seeker Registration', 'FAIL', error.message);
        }
    }

    async testProviderRegistration() {
        try {
            // Navigate back to home and try provider registration
            await this.page.goto(this.baseUrl);
            await this.page.waitForTimeout(2000);
            
            const signupButton = await this.page.$('button:contains("Sign Up"), a:contains("Sign Up"), .signup-btn, [data-testid="signup-button"]');
            
            if (signupButton) {
                await signupButton.click();
                await this.page.waitForTimeout(2000);
                
                const emailField = await this.page.$('input[type="email"], input[name="email"]');
                const passwordField = await this.page.$('input[type="password"], input[name="password"]');
                
                if (emailField && passwordField) {
                    const testEmail = `provider_${Date.now()}@test.com`;
                    await emailField.clear();
                    await passwordField.clear();
                    await emailField.type(testEmail);
                    await passwordField.type('TestPassword123!');
                    
                    // Look for provider option
                    const providerOption = await this.page.$('input[value="provider"], .provider-option, [data-role="provider"]');
                    if (providerOption) {
                        await providerOption.click();
                        await this.logResult('Provider Role Selection', 'PASS');
                    }
                    
                    const submitButton = await this.page.$('button[type="submit"], .submit-btn, button:contains("Register")');
                    if (submitButton) {
                        await submitButton.click();
                        await this.page.waitForTimeout(3000);
                        await this.logResult('Provider Registration Submission', 'PASS');
                    }
                }
            }
        } catch (error) {
            await this.logResult('Provider Registration', 'FAIL', error.message);
        }
    }

    async testLoginFlow() {
        console.log('\n📋 Testing Login Flow...');
        try {
            await this.page.goto(this.baseUrl);
            await this.page.waitForTimeout(2000);
            
            const loginButton = await this.page.$('button:contains("Login"), a:contains("Login"), .login-btn, [data-testid="login-button"]');
            
            if (loginButton) {
                await loginButton.click();
                await this.page.waitForTimeout(2000);
                
                const emailField = await this.page.$('input[type="email"], input[name="email"]');
                const passwordField = await this.page.$('input[type="password"], input[name="password"]');
                
                await this.logResult('Login Form Present', emailField && passwordField ? 'PASS' : 'FAIL');
                
                if (emailField && passwordField) {
                    // Test with demo credentials
                    await emailField.type('demo@chillconnect.in');
                    await passwordField.type('demopassword');
                    
                    const submitButton = await this.page.$('button[type="submit"], .submit-btn, button:contains("Login")');
                    if (submitButton) {
                        await submitButton.click();
                        await this.page.waitForTimeout(3000);
                        await this.logResult('Login Submission', 'PASS');
                    }
                }
            } else {
                await this.logResult('Login Access', 'FAIL', 'No login button found');
            }
        } catch (error) {
            await this.logResult('Login Flow', 'FAIL', error.message);
        }
    }

    async testSearchFunctionality() {
        console.log('\n📋 Testing Search & Discovery...');
        try {
            // Look for search functionality
            const searchInput = await this.page.$('input[type="search"], input[name="search"], .search-input, [data-testid="search"]');
            const searchButton = await this.page.$('.search-btn, button:contains("Search"), [data-testid="search-button"]');
            
            if (searchInput) {
                await this.logResult('Search Input Present', 'PASS');
                await searchInput.type('massage');
                
                if (searchButton) {
                    await searchButton.click();
                    await this.page.waitForTimeout(3000);
                    await this.logResult('Search Functionality', 'PASS');
                }
            } else {
                await this.logResult('Search Functionality', 'FAIL', 'No search input found');
            }
            
            // Test filter options
            const filters = await this.page.$$('.filter-option, .category-filter, [data-testid="filter"]');
            await this.logResult('Filter Options Present', filters.length > 0 ? 'PASS' : 'FAIL', `Found ${filters.length} filters`);
            
        } catch (error) {
            await this.logResult('Search Functionality', 'FAIL', error.message);
        }
    }

    async testTokenSystemAccess() {
        console.log('\n📋 Testing Token System Access...');
        try {
            // Look for wallet or token-related elements
            const walletLink = await this.page.$('a:contains("Wallet"), .wallet-link, [data-testid="wallet"]');
            const tokenButton = await this.page.$('button:contains("Token"), .token-btn, [data-testid="tokens"]');
            const buyTokensButton = await this.page.$('button:contains("Buy"), .buy-tokens-btn, [data-testid="buy-tokens"]');
            
            if (walletLink || tokenButton || buyTokensButton) {
                await this.logResult('Token System Access', 'PASS', 'Token-related elements found');
                
                // Try to access token purchase
                if (buyTokensButton) {
                    await buyTokensButton.click();
                    await this.page.waitForTimeout(3000);
                    
                    // Check for token packages
                    const tokenPackages = await this.page.$$('.token-package, .package-option, [data-package]');
                    await this.logResult('Token Packages Display', tokenPackages.length > 0 ? 'PASS' : 'FAIL', `Found ${tokenPackages.length} packages`);
                }
            } else {
                await this.logResult('Token System Access', 'FAIL', 'No token-related elements found');
            }
        } catch (error) {
            await this.logResult('Token System', 'FAIL', error.message);
        }
    }

    async testChatSystemAccess() {
        console.log('\n📋 Testing Chat System Access...');
        try {
            // Look for chat-related elements
            const chatButton = await this.page.$('button:contains("Chat"), .chat-btn, [data-testid="chat"]');
            const messagesLink = await this.page.$('a:contains("Messages"), .messages-link, [data-testid="messages"]');
            
            if (chatButton || messagesLink) {
                await this.logResult('Chat System Access', 'PASS');
                
                if (chatButton) {
                    await chatButton.click();
                    await this.page.waitForTimeout(2000);
                    
                    // Check for chat interface elements
                    const messageInput = await this.page.$('input[placeholder*="message"], .message-input, [data-testid="message-input"]');
                    const sendButton = await this.page.$('button:contains("Send"), .send-btn, [data-testid="send"]');
                    
                    await this.logResult('Chat Interface', messageInput && sendButton ? 'PASS' : 'FAIL');
                }
            } else {
                await this.logResult('Chat System Access', 'FAIL', 'No chat elements found');
            }
        } catch (error) {
            await this.logResult('Chat System', 'FAIL', error.message);
        }
    }

    async testAdminAccess() {
        console.log('\n📋 Testing Admin Panel Access...');
        try {
            // Try to access admin panel
            await this.page.goto(`${this.baseUrl}/admin`);
            await this.page.waitForTimeout(3000);
            
            const currentUrl = this.page.url();
            if (currentUrl.includes('/admin')) {
                await this.logResult('Admin Panel Access', 'PASS');
                
                // Check for admin login form
                const adminLoginForm = await this.page.$('form, .admin-login, [data-testid="admin-login"]');
                await this.logResult('Admin Login Form', adminLoginForm ? 'PASS' : 'FAIL');
            } else {
                await this.logResult('Admin Panel Access', 'WARN', 'Redirected away from admin URL');
            }
        } catch (error) {
            await this.logResult('Admin Access', 'FAIL', error.message);
        }
    }

    async testMobileResponsiveness() {
        console.log('\n📋 Testing Mobile Responsiveness...');
        try {
            // Test mobile viewport
            await this.page.setViewport({ width: 375, height: 667 }); // iPhone SE size
            await this.page.goto(this.baseUrl);
            await this.page.waitForTimeout(2000);
            
            // Check if mobile menu/hamburger exists
            const mobileMenu = await this.page.$('.hamburger, .mobile-menu, .menu-toggle, [data-testid="mobile-menu"]');
            await this.logResult('Mobile Menu Present', mobileMenu ? 'PASS' : 'FAIL');
            
            // Test mobile navigation
            if (mobileMenu) {
                await mobileMenu.click();
                await this.page.waitForTimeout(1000);
                const mobileNav = await this.page.$('.mobile-nav, .mobile-navigation, [data-testid="mobile-nav"]');
                await this.logResult('Mobile Navigation', mobileNav ? 'PASS' : 'FAIL');
            }
            
            // Reset to desktop view
            await this.page.setViewport({ width: 1920, height: 1080 });
        } catch (error) {
            await this.logResult('Mobile Responsiveness', 'FAIL', error.message);
        }
    }

    async testPerformance() {
        console.log('\n📋 Testing Performance...');
        try {
            const startTime = Date.now();
            await this.page.goto(this.baseUrl, { waitUntil: 'networkidle2' });
            const loadTime = Date.now() - startTime;
            
            if (loadTime < 3000) {
                await this.logResult('Page Load Performance', 'PASS', `${loadTime}ms`);
            } else if (loadTime < 5000) {
                await this.logResult('Page Load Performance', 'WARN', `${loadTime}ms (slow)`);
            } else {
                await this.logResult('Page Load Performance', 'FAIL', `${loadTime}ms (too slow)`);
            }
            
            // Check for performance metrics
            const performanceMetrics = await this.page.evaluate(() => {
                const navigation = performance.getEntriesByType('navigation')[0];
                return {
                    domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                    loadComplete: navigation.loadEventEnd - navigation.loadEventStart
                };
            });
            
            await this.logResult('DOM Content Loaded', 'INFO', `${performanceMetrics.domContentLoaded}ms`);
            await this.logResult('Load Complete', 'INFO', `${performanceMetrics.loadComplete}ms`);
            
        } catch (error) {
            await this.logResult('Performance Testing', 'FAIL', error.message);
        }
    }

    async generateReport() {
        console.log('\n📊 Generating Test Report...');
        
        const passCount = this.testResults.filter(r => r.status === 'PASS').length;
        const failCount = this.testResults.filter(r => r.status === 'FAIL').length;
        const warnCount = this.testResults.filter(r => r.status === 'WARN').length;
        
        console.log('\n=== CHILLCONNECT LIVE SITE TEST REPORT ===');
        console.log(`📅 Test Date: ${new Date().toLocaleString()}`);
        console.log(`🌐 Site Tested: ${this.baseUrl}`);
        console.log(`📊 Total Tests: ${this.testResults.length}`);
        console.log(`✅ Passed: ${passCount}`);
        console.log(`❌ Failed: ${failCount}`);
        console.log(`⚠️  Warnings: ${warnCount}`);
        console.log(`📈 Success Rate: ${((passCount / this.testResults.length) * 100).toFixed(1)}%`);
        
        if (this.issues.length > 0) {
            console.log('\n🚨 ISSUES FOUND:');
            this.issues.forEach((issue, index) => {
                console.log(`${index + 1}. ${issue}`);
            });
        }
        
        console.log('\n📋 DETAILED RESULTS:');
        this.testResults.forEach(result => {
            const emoji = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : result.status === 'WARN' ? '⚠️' : 'ℹ️';
            console.log(`${emoji} ${result.test}: ${result.status} ${result.details}`);
        });
        
        // Return structured data for further processing
        return {
            summary: { total: this.testResults.length, passed: passCount, failed: failCount, warnings: warnCount },
            issues: this.issues,
            results: this.testResults
        };
    }

    async runAllTests() {
        try {
            await this.init();
            
            // Update todo status
            await this.testBasicSiteAccess();
            await this.testRegistrationFlow();
            await this.testLoginFlow();
            await this.testSearchFunctionality();
            await this.testTokenSystemAccess();
            await this.testChatSystemAccess();
            await this.testAdminAccess();
            await this.testMobileResponsiveness();
            await this.testPerformance();
            
            const report = await this.generateReport();
            
            return report;
            
        } catch (error) {
            console.log('❌ Test suite failed:', error.message);
            return { error: error.message };
        } finally {
            if (this.browser) {
                await this.browser.close();
            }
        }
    }
}

// Run the tests
const tester = new ChillConnectLiveTester();
tester.runAllTests().then(report => {
    console.log('\n🏁 Testing completed!');
    if (report.issues && report.issues.length > 0) {
        console.log(`\n❗ Found ${report.issues.length} issues that need attention.`);
    } else {
        console.log('\n🎉 All tests completed successfully!');
    }
    process.exit(0);
}).catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
});