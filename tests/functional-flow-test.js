const puppeteer = require('puppeteer');

class FunctionalFlowTester {
    constructor() {
        this.baseUrl = 'http://www.chillconnect.in';
        this.results = [];
        this.criticalIssues = [];
        this.testUser = {
            seeker: {
                email: `seeker_test_${Date.now()}@test.com`,
                password: 'TestPassword123!'
            },
            provider: {
                email: `provider_test_${Date.now()}@test.com`,
                password: 'TestPassword123!'
            }
        };
    }

    async logResult(test, status, details = '', critical = false) {
        const result = { test, status, details, timestamp: new Date().toISOString() };
        this.results.push(result);
        
        const emoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : status === 'PARTIAL' ? '🟡' : '⚠️';
        console.log(`${emoji} ${test}: ${status} ${details}`);
        
        if (status === 'FAIL' && critical) {
            this.criticalIssues.push(`CRITICAL: ${test} - ${details}`);
        }
    }

    async testCompleteUserFlows() {
        console.log('🚀 Testing Complete User Flows on ChillConnect...\n');
        
        const browser = await puppeteer.launch({ 
            headless: false,
            defaultViewport: null,
            args: ['--start-maximized']
        });
        
        try {
            // Test 1: Registration Flows
            await this.testRegistrationFlows(browser);
            
            // Test 2: Login Flows
            await this.testLoginFlows(browser);
            
            // Test 3: Profile Management
            await this.testProfileFlows(browser);
            
            // Test 4: Search and Discovery
            await this.testSearchFlows(browser);
            
            // Test 5: Token System
            await this.testTokenFlows(browser);
            
            // Test 6: Booking System
            await this.testBookingFlows(browser);
            
            // Test 7: Chat System
            await this.testChatFlows(browser);
            
            // Test 8: Admin Panel
            await this.testAdminFlows(browser);
            
            // Test 9: Payment Flows
            await this.testPaymentFlows(browser);
            
            // Generate comprehensive report
            this.generateFlowReport();
            
        } catch (error) {
            console.error('❌ Flow testing failed:', error);
        } finally {
            await browser.close();
        }
    }
    
    async testRegistrationFlows(browser) {
        console.log('👤 TESTING REGISTRATION FLOWS');
        console.log('==============================');
        
        const page = await browser.newPage();
        
        try {
            // Test Seeker Registration
            console.log('\n📝 Testing Seeker Registration...');
            await page.goto(`${this.baseUrl}/register`, { waitUntil: 'networkidle0' });
            
            const registerForm = await page.$('form');
            if (registerForm) {
                await this.logResult('Registration Page Access', 'PASS', 'Form found');
                
                // Check form fields
                const emailField = await page.$('input[type="email"], input[name="email"]');
                const passwordField = await page.$('input[type="password"], input[name="password"]');
                const submitButton = await page.$('button[type="submit"], input[type="submit"]');
                
                if (emailField && passwordField && submitButton) {
                    await this.logResult('Registration Form Fields', 'PASS', 'All required fields present');
                    
                    // Try to register
                    await emailField.type(this.testUser.seeker.email);
                    await passwordField.type(this.testUser.seeker.password);
                    
                    // Look for user type selection
                    const seekerOption = await page.$('input[value="seeker"], input[value="user"], .user-type-seeker');
                    if (seekerOption) {
                        await seekerOption.click();
                        await this.logResult('User Type Selection', 'PASS', 'Seeker option available');
                    } else {
                        await this.logResult('User Type Selection', 'PARTIAL', 'No explicit user type selection');
                    }
                    
                    await submitButton.click();
                    await page.waitForTimeout(3000);
                    
                    // Check if registration was successful
                    const currentUrl = page.url();
                    const pageContent = await page.evaluate(() => document.body.innerText.toLowerCase());
                    
                    if (currentUrl !== `${this.baseUrl}/register` || pageContent.includes('dashboard') || pageContent.includes('profile')) {
                        await this.logResult('Seeker Registration Submission', 'PASS', `Redirected to: ${currentUrl}`);
                    } else {
                        await this.logResult('Seeker Registration Submission', 'FAIL', 'Registration may have failed', true);
                    }
                } else {
                    await this.logResult('Registration Form Fields', 'FAIL', 'Missing required form fields', true);
                }
            } else {
                await this.logResult('Registration Page Access', 'FAIL', 'No registration form found', true);
            }
            
            // Test Provider Registration
            console.log('\n🏢 Testing Provider Registration...');
            await page.goto(`${this.baseUrl}/register`, { waitUntil: 'networkidle0' });
            
            const providerRegisterForm = await page.$('form');
            if (providerRegisterForm) {
                const emailField = await page.$('input[type="email"], input[name="email"]');
                const passwordField = await page.$('input[type="password"], input[name="password"]');
                
                if (emailField && passwordField) {
                    await emailField.clear();
                    await passwordField.clear();
                    await emailField.type(this.testUser.provider.email);
                    await passwordField.type(this.testUser.provider.password);
                    
                    const providerOption = await page.$('input[value="provider"], input[value="escort"], .user-type-provider');
                    if (providerOption) {
                        await providerOption.click();
                        await this.logResult('Provider Type Selection', 'PASS', 'Provider option available');
                        
                        const submitButton = await page.$('button[type="submit"], input[type="submit"]');
                        if (submitButton) {
                            await submitButton.click();
                            await page.waitForTimeout(3000);
                            
                            const currentUrl = page.url();
                            if (currentUrl !== `${this.baseUrl}/register`) {
                                await this.logResult('Provider Registration Submission', 'PASS', `Redirected to: ${currentUrl}`);
                            } else {
                                await this.logResult('Provider Registration Submission', 'FAIL', 'Registration may have failed');
                            }
                        }
                    } else {
                        await this.logResult('Provider Type Selection', 'FAIL', 'No provider option found');
                    }
                }
            }
            
        } catch (error) {
            await this.logResult('Registration Flow', 'FAIL', error.message, true);
        } finally {
            await page.close();
        }
    }
    
    async testLoginFlows(browser) {
        console.log('\n🔐 TESTING LOGIN FLOWS');
        console.log('======================');
        
        const page = await browser.newPage();
        
        try {
            await page.goto(`${this.baseUrl}/login`, { waitUntil: 'networkidle0' });
            
            const loginForm = await page.$('form');
            if (loginForm) {
                await this.logResult('Login Page Access', 'PASS', 'Login form found');
                
                const emailField = await page.$('input[type="email"], input[name="email"], input[name="username"]');
                const passwordField = await page.$('input[type="password"], input[name="password"]');
                const submitButton = await page.$('button[type="submit"], input[type="submit"]');
                
                if (emailField && passwordField && submitButton) {
                    await this.logResult('Login Form Fields', 'PASS', 'All fields present');
                    
                    // Try demo login
                    await emailField.type('demo@chillconnect.in');
                    await passwordField.type('demopassword');
                    await submitButton.click();
                    await page.waitForTimeout(3000);
                    
                    const currentUrl = page.url();
                    const pageContent = await page.evaluate(() => document.body.innerText.toLowerCase());
                    
                    if (currentUrl !== `${this.baseUrl}/login` || pageContent.includes('dashboard')) {
                        await this.logResult('Login Functionality', 'PASS', `Redirected to: ${currentUrl}`);
                    } else {
                        await this.logResult('Login Functionality', 'FAIL', 'Login may have failed');
                    }
                } else {
                    await this.logResult('Login Form Fields', 'FAIL', 'Missing form fields', true);
                }
            } else {
                await this.logResult('Login Page Access', 'FAIL', 'No login form found', true);
            }
            
        } catch (error) {
            await this.logResult('Login Flow', 'FAIL', error.message, true);
        } finally {
            await page.close();
        }
    }
    
    async testProfileFlows(browser) {
        console.log('\n👤 TESTING PROFILE FLOWS');
        console.log('========================');
        
        const page = await browser.newPage();
        
        try {
            await page.goto(`${this.baseUrl}/profile`, { waitUntil: 'networkidle0' });
            
            const profileForm = await page.$('form');
            if (profileForm) {
                await this.logResult('Profile Page Access', 'PASS', 'Profile form found');
                
                // Check for profile fields
                const nameField = await page.$('input[name="name"], input[name="fullname"], input[placeholder*="name"]');
                const ageField = await page.$('input[name="age"], input[type="number"]');
                const locationField = await page.$('input[name="location"], input[name="city"]');
                const bioField = await page.$('textarea[name="bio"], textarea[name="description"]');
                
                const profileFieldsCount = [nameField, ageField, locationField, bioField].filter(field => field !== null).length;
                
                if (profileFieldsCount > 0) {
                    await this.logResult('Profile Form Fields', 'PASS', `${profileFieldsCount} profile fields found`);
                } else {
                    await this.logResult('Profile Form Fields', 'FAIL', 'No profile fields found');
                }
                
                // Check for file upload (profile photo)
                const fileUpload = await page.$('input[type="file"]');
                if (fileUpload) {
                    await this.logResult('Profile Photo Upload', 'PASS', 'File upload available');
                } else {
                    await this.logResult('Profile Photo Upload', 'FAIL', 'No photo upload found');
                }
                
            } else {
                await this.logResult('Profile Page Access', 'FAIL', 'No profile form found', true);
            }
            
        } catch (error) {
            await this.logResult('Profile Flow', 'FAIL', error.message);
        } finally {
            await page.close();
        }
    }
    
    async testSearchFlows(browser) {
        console.log('\n🔍 TESTING SEARCH FLOWS');
        console.log('=======================');
        
        const page = await browser.newPage();
        
        try {
            await page.goto(`${this.baseUrl}/search`, { waitUntil: 'networkidle0' });
            
            const searchForm = await page.$('form');
            if (searchForm) {
                await this.logResult('Search Page Access', 'PASS', 'Search form found');
                
                const searchInput = await page.$('input[type="search"], input[name="search"], input[name="query"]');
                const locationInput = await page.$('input[name="location"], input[name="city"]');
                const categorySelect = await page.$('select[name="category"], select[name="service"]');
                const searchButton = await page.$('button[type="submit"], input[type="submit"]');
                
                if (searchInput) {
                    await this.logResult('Search Input Field', 'PASS', 'Search field available');
                    
                    // Test search functionality
                    await searchInput.type('massage');
                    if (searchButton) {
                        await searchButton.click();
                        await page.waitForTimeout(3000);
                        
                        const results = await page.$$('.search-result, .provider-card, .listing');
                        await this.logResult('Search Results', results.length > 0 ? 'PASS' : 'FAIL', 
                            `${results.length} results found`);
                    }
                } else {
                    await this.logResult('Search Input Field', 'FAIL', 'No search input found');
                }
                
                if (categorySelect) {
                    await this.logResult('Category Filters', 'PASS', 'Category selection available');
                } else {
                    await this.logResult('Category Filters', 'FAIL', 'No category filters found');
                }
                
            } else {
                await this.logResult('Search Page Access', 'FAIL', 'No search form found', true);
            }
            
        } catch (error) {
            await this.logResult('Search Flow', 'FAIL', error.message);
        } finally {
            await page.close();
        }
    }
    
    async testTokenFlows(browser) {
        console.log('\n💰 TESTING TOKEN FLOWS');
        console.log('======================');
        
        const page = await browser.newPage();
        
        try {
            await page.goto(`${this.baseUrl}/wallet`, { waitUntil: 'networkidle0' });
            
            const walletForm = await page.$('form');
            if (walletForm) {
                await this.logResult('Wallet Page Access', 'PASS', 'Wallet form found');
                
                // Check for token packages
                const tokenPackages = await page.$$('.token-package, .package, .token-option');
                if (tokenPackages.length > 0) {
                    await this.logResult('Token Packages', 'PASS', `${tokenPackages.length} packages available`);
                } else {
                    await this.logResult('Token Packages', 'FAIL', 'No token packages found');
                }
                
                // Check for payment options
                const paymentButtons = await page.$$('button[data-payment], .paypal-button, .stripe-button');
                if (paymentButtons.length > 0) {
                    await this.logResult('Payment Integration', 'PASS', `${paymentButtons.length} payment options`);
                } else {
                    await this.logResult('Payment Integration', 'FAIL', 'No payment buttons found');
                }
                
            } else {
                await this.logResult('Wallet Page Access', 'FAIL', 'No wallet form found', true);
            }
            
        } catch (error) {
            await this.logResult('Token Flow', 'FAIL', error.message);
        } finally {
            await page.close();
        }
    }
    
    async testBookingFlows(browser) {
        console.log('\n📅 TESTING BOOKING FLOWS');
        console.log('========================');
        
        const page = await browser.newPage();
        
        try {
            await page.goto(`${this.baseUrl}/booking`, { waitUntil: 'networkidle0' });
            
            const pageContent = await page.evaluate(() => document.body.innerText.toLowerCase());
            
            if (pageContent.includes('booking') || pageContent.includes('appointment')) {
                await this.logResult('Booking Page Access', 'PASS', 'Booking page loaded');
                
                // Check for calendar/date picker
                const dateInput = await page.$('input[type="date"], input[type="datetime-local"], .date-picker');
                const timeInput = await page.$('input[type="time"], .time-picker');
                
                if (dateInput) {
                    await this.logResult('Date Selection', 'PASS', 'Date picker available');
                } else {
                    await this.logResult('Date Selection', 'FAIL', 'No date selection found');
                }
                
                if (timeInput) {
                    await this.logResult('Time Selection', 'PASS', 'Time picker available');
                } else {
                    await this.logResult('Time Selection', 'FAIL', 'No time selection found');
                }
                
                // Check for service type options
                const incallOption = await page.$('input[value="incall"], .incall-option');
                const outcallOption = await page.$('input[value="outcall"], .outcall-option');
                
                if (incallOption || outcallOption) {
                    await this.logResult('Service Type Options', 'PASS', 'Incall/Outcall options available');
                } else {
                    await this.logResult('Service Type Options', 'FAIL', 'No service type options');
                }
                
            } else {
                await this.logResult('Booking Page Access', 'FAIL', 'Booking page not functional', true);
            }
            
        } catch (error) {
            await this.logResult('Booking Flow', 'FAIL', error.message);
        } finally {
            await page.close();
        }
    }
    
    async testChatFlows(browser) {
        console.log('\n💬 TESTING CHAT FLOWS');
        console.log('=====================');
        
        const page = await browser.newPage();
        
        try {
            await page.goto(`${this.baseUrl}/messages`, { waitUntil: 'networkidle0' });
            
            const chatForm = await page.$('form');
            if (chatForm) {
                await this.logResult('Chat Page Access', 'PASS', 'Chat form found');
                
                const messageInput = await page.$('input[type="text"], textarea[name="message"], .message-input');
                const sendButton = await page.$('button[type="submit"], .send-button');
                
                if (messageInput && sendButton) {
                    await this.logResult('Chat Interface', 'PASS', 'Message input and send button available');
                    
                    // Test message sending
                    await messageInput.type('Test message');
                    await sendButton.click();
                    await page.waitForTimeout(2000);
                    
                    const messageElements = await page.$$('.message, .chat-message, .msg');
                    if (messageElements.length > 0) {
                        await this.logResult('Message Sending', 'PASS', 'Messages appear in chat');
                    } else {
                        await this.logResult('Message Sending', 'FAIL', 'Messages not displaying');
                    }
                } else {
                    await this.logResult('Chat Interface', 'FAIL', 'Missing chat interface elements');
                }
            } else {
                await this.logResult('Chat Page Access', 'FAIL', 'No chat form found', true);
            }
            
        } catch (error) {
            await this.logResult('Chat Flow', 'FAIL', error.message);
        } finally {
            await page.close();
        }
    }
    
    async testAdminFlows(browser) {
        console.log('\n🔐 TESTING ADMIN FLOWS');
        console.log('======================');
        
        const page = await browser.newPage();
        
        try {
            await page.goto(`${this.baseUrl}/admin`, { waitUntil: 'networkidle0' });
            
            const pageContent = await page.evaluate(() => document.body.innerText.toLowerCase());
            
            if (pageContent.includes('admin') || pageContent.includes('dashboard')) {
                await this.logResult('Admin Panel Access', 'PASS', 'Admin page accessible');
                
                const loginForm = await page.$('form');
                if (loginForm) {
                    await this.logResult('Admin Login Form', 'PASS', 'Admin login form found');
                    
                    const usernameField = await page.$('input[name="username"], input[name="email"]');
                    const passwordField = await page.$('input[type="password"]');
                    
                    if (usernameField && passwordField) {
                        await this.logResult('Admin Login Fields', 'PASS', 'Username and password fields available');
                    } else {
                        await this.logResult('Admin Login Fields', 'FAIL', 'Missing login fields');
                    }
                } else {
                    await this.logResult('Admin Login Form', 'FAIL', 'No admin login form found');
                }
            } else {
                await this.logResult('Admin Panel Access', 'FAIL', 'Admin panel not accessible', true);
            }
            
        } catch (error) {
            await this.logResult('Admin Flow', 'FAIL', error.message);
        } finally {
            await page.close();
        }
    }
    
    async testPaymentFlows(browser) {
        console.log('\n💳 TESTING PAYMENT FLOWS');
        console.log('========================');
        
        const page = await browser.newPage();
        
        try {
            await page.goto(`${this.baseUrl}/payment`, { waitUntil: 'networkidle0' });
            
            const pageContent = await page.evaluate(() => document.body.innerText.toLowerCase());
            
            if (pageContent.includes('payment') || pageContent.includes('paypal') || pageContent.includes('checkout')) {
                await this.logResult('Payment Page Access', 'PASS', 'Payment page accessible');
                
                // Check for payment gateways
                const paypalButton = await page.$('.paypal-button, #paypal-button-container, [data-payment="paypal"]');
                const stripeButton = await page.$('.stripe-button, [data-payment="stripe"]');
                
                if (paypalButton) {
                    await this.logResult('PayPal Integration', 'PASS', 'PayPal button found');
                } else {
                    await this.logResult('PayPal Integration', 'FAIL', 'No PayPal integration');
                }
                
                if (stripeButton) {
                    await this.logResult('Stripe Integration', 'PASS', 'Stripe button found');
                } else {
                    await this.logResult('Stripe Integration', 'FAIL', 'No Stripe integration');
                }
                
            } else {
                await this.logResult('Payment Page Access', 'FAIL', 'Payment page not accessible', true);
            }
            
        } catch (error) {
            await this.logResult('Payment Flow', 'FAIL', error.message);
        } finally {
            await page.close();
        }
    }
    
    generateFlowReport() {
        console.log('\n📊 COMPREHENSIVE FLOW TEST REPORT');
        console.log('===================================');
        
        const total = this.results.length;
        const passed = this.results.filter(r => r.status === 'PASS').length;
        const failed = this.results.filter(r => r.status === 'FAIL').length;
        const partial = this.results.filter(r => r.status === 'PARTIAL').length;
        
        console.log(`📅 Test Date: ${new Date().toLocaleString()}`);
        console.log(`🌐 Site Tested: ${this.baseUrl}`);
        console.log(`📊 Total Tests: ${total}`);
        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`🟡 Partial: ${partial}`);
        console.log(`📈 Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
        
        if (this.criticalIssues.length > 0) {
            console.log('\n🚨 CRITICAL ISSUES REQUIRING IMMEDIATE ATTENTION:');
            this.criticalIssues.forEach((issue, i) => {
                console.log(`${i + 1}. ${issue}`);
            });
        }
        
        console.log('\n📋 IMPLEMENTATION PRIORITY ORDER:');
        const priorities = [
            '1. Functional registration and login system with proper form validation',
            '2. User profile management with file upload capabilities',
            '3. Provider search with filters and results display',
            '4. Token purchase system with payment gateway integration',
            '5. Booking system with calendar and service type selection',
            '6. Real-time chat system with message persistence',
            '7. Admin panel with proper authentication and management tools',
            '8. Email verification and notification system',
            '9. Document verification workflow for providers',
            '10. Mobile-responsive design improvements'
        ];
        
        priorities.forEach(priority => console.log(priority));
        
        console.log('\n💡 NEXT STEPS:');
        console.log('1. Fix critical form functionality issues');
        console.log('2. Implement missing backend API endpoints');
        console.log('3. Add proper database integration');
        console.log('4. Implement user session management');
        console.log('5. Add comprehensive testing suite');
        
        return {
            summary: { total, passed, failed, partial, successRate: ((passed / total) * 100).toFixed(1) },
            criticalIssues: this.criticalIssues,
            results: this.results
        };
    }
}

// Run the functional flow tests
const tester = new FunctionalFlowTester();
tester.testCompleteUserFlows().then(() => {
    console.log('\n🏁 Functional flow testing completed!');
    process.exit(0);
}).catch(error => {
    console.error('❌ Flow testing failed:', error);
    process.exit(1);
});