const puppeteer = require('puppeteer');

class DetailedSiteAnalyzer {
    constructor() {
        this.baseUrl = 'http://www.chillconnect.in';
        this.analysis = {
            pages: {},
            forms: [],
            buttons: [],
            links: [],
            missingFeatures: [],
            implementedFeatures: []
        };
    }

    async analyzeSite() {
        console.log('🔍 Starting Detailed Site Analysis...\n');
        
        const browser = await puppeteer.launch({ 
            headless: false,
            defaultViewport: null,
            args: ['--start-maximized']
        });
        
        const page = await browser.newPage();
        
        try {
            // Analyze main page
            await this.analyzeMainPage(page);
            
            // Try to find and analyze other pages
            await this.discoverPages(page);
            
            // Generate comprehensive analysis
            this.generateAnalysis();
            
        } catch (error) {
            console.error('❌ Analysis failed:', error);
        } finally {
            await browser.close();
        }
    }
    
    async analyzeMainPage(page) {
        console.log('📄 Analyzing Main Page...');
        
        await page.goto(this.baseUrl, { waitUntil: 'networkidle0' });
        
        const pageAnalysis = await page.evaluate(() => {
            const analysis = {
                title: document.title,
                url: window.location.href,
                content: document.body.innerText,
                html: document.documentElement.innerHTML,
                forms: [],
                buttons: [],
                links: [],
                inputs: [],
                images: []
            };
            
            // Analyze forms
            const forms = Array.from(document.querySelectorAll('form'));
            forms.forEach((form, index) => {
                const formInputs = Array.from(form.querySelectorAll('input, select, textarea'));
                analysis.forms.push({
                    index,
                    action: form.action,
                    method: form.method,
                    inputs: formInputs.map(input => ({
                        type: input.type,
                        name: input.name,
                        placeholder: input.placeholder,
                        required: input.required
                    }))
                });
            });
            
            // Analyze buttons
            const buttons = Array.from(document.querySelectorAll('button, input[type="button"], input[type="submit"]'));
            buttons.forEach((button, index) => {
                analysis.buttons.push({
                    index,
                    text: button.textContent || button.value,
                    type: button.type,
                    classes: button.className,
                    onclick: button.onclick ? 'Has onclick' : 'No onclick'
                });
            });
            
            // Analyze links
            const links = Array.from(document.querySelectorAll('a'));
            links.forEach((link, index) => {
                analysis.links.push({
                    index,
                    text: link.textContent,
                    href: link.href,
                    classes: link.className
                });
            });
            
            // Analyze inputs
            const inputs = Array.from(document.querySelectorAll('input, textarea, select'));
            inputs.forEach((input, index) => {
                analysis.inputs.push({
                    index,
                    type: input.type,
                    name: input.name,
                    placeholder: input.placeholder,
                    classes: input.className
                });
            });
            
            return analysis;
        });
        
        this.analysis.pages.main = pageAnalysis;
        
        console.log(`✅ Main page analyzed: ${pageAnalysis.forms.length} forms, ${pageAnalysis.buttons.length} buttons, ${pageAnalysis.links.length} links`);
        
        // Check for specific features
        const content = pageAnalysis.content.toLowerCase();
        const html = pageAnalysis.html.toLowerCase();
        
        this.checkFeature('User Registration', content.includes('register') || content.includes('sign up') || html.includes('signup'));
        this.checkFeature('User Login', content.includes('login') || content.includes('sign in'));
        this.checkFeature('Provider Profiles', content.includes('provider') || content.includes('escort') || content.includes('companion'));
        this.checkFeature('Search Functionality', content.includes('search') || html.includes('search'));
        this.checkFeature('Chat System', content.includes('chat') || content.includes('message'));
        this.checkFeature('Booking System', content.includes('book') || content.includes('appointment') || content.includes('schedule'));
        this.checkFeature('Token System', content.includes('token') || content.includes('credit') || content.includes('wallet'));
        this.checkFeature('Payment Integration', content.includes('payment') || content.includes('paypal') || content.includes('stripe'));
        this.checkFeature('Admin Panel', html.includes('admin'));
        
        return pageAnalysis;
    }
    
    async discoverPages(page) {
        console.log('\n🔍 Discovering Additional Pages...');
        
        const commonPaths = [
            '/login', '/signin', '/sign-in',
            '/register', '/signup', '/sign-up',
            '/profile', '/dashboard',
            '/search', '/browse', '/providers',
            '/chat', '/messages',
            '/booking', '/appointments',
            '/wallet', '/tokens', '/payment',
            '/admin', '/admin/login',
            '/about', '/contact', '/help',
            '/terms', '/privacy', '/faq'
        ];
        
        for (const path of commonPaths) {
            try {
                const response = await page.goto(`${this.baseUrl}${path}`, { 
                    waitUntil: 'networkidle0', 
                    timeout: 10000 
                });
                
                if (response && response.ok()) {
                    const pageInfo = await page.evaluate(() => ({
                        title: document.title,
                        url: window.location.href,
                        content: document.body.innerText.substring(0, 500),
                        hasForm: document.querySelectorAll('form').length > 0,
                        hasInputs: document.querySelectorAll('input').length > 0
                    }));
                    
                    this.analysis.pages[path] = pageInfo;
                    console.log(`✅ Found page: ${path} - "${pageInfo.title}"`);
                    
                    // Special analysis for specific pages
                    if (path.includes('admin')) {
                        await this.analyzeAdminPage(page, pageInfo);
                    }
                } else {
                    console.log(`❌ Page not found: ${path}`);
                }
            } catch (error) {
                console.log(`❌ Failed to access: ${path} - ${error.message}`);
            }
        }
    }
    
    async analyzeAdminPage(page, pageInfo) {
        console.log('🔐 Analyzing Admin Page...');
        
        const adminAnalysis = await page.evaluate(() => {
            return {
                hasLoginForm: document.querySelector('form') !== null,
                hasPasswordField: document.querySelector('input[type="password"]') !== null,
                hasUsernameField: document.querySelector('input[type="text"], input[type="email"]') !== null,
                content: document.body.innerText.toLowerCase(),
                forms: Array.from(document.querySelectorAll('form')).length
            };
        });
        
        pageInfo.adminFeatures = adminAnalysis;
        
        if (adminAnalysis.hasLoginForm) {
            console.log('✅ Admin login form found');
        } else {
            console.log('❌ No admin login form found');
            this.analysis.missingFeatures.push('Admin login interface');
        }
    }
    
    checkFeature(featureName, isImplemented) {
        if (isImplemented) {
            this.analysis.implementedFeatures.push(featureName);
            console.log(`✅ ${featureName}: Implemented`);
        } else {
            this.analysis.missingFeatures.push(featureName);
            console.log(`❌ ${featureName}: Missing`);
        }
    }
    
    generateAnalysis() {
        console.log('\n📊 COMPREHENSIVE SITE ANALYSIS REPORT');
        console.log('=====================================');
        
        console.log(`\n🌐 Site: ${this.baseUrl}`);
        console.log(`📅 Analysis Date: ${new Date().toLocaleString()}`);
        
        console.log(`\n📄 DISCOVERED PAGES (${Object.keys(this.analysis.pages).length}):`);
        for (const [path, info] of Object.entries(this.analysis.pages)) {
            console.log(`  ${path}: "${info.title}" ${info.hasForm ? '(has forms)' : '(no forms)'}`);
        }
        
        console.log(`\n✅ IMPLEMENTED FEATURES (${this.analysis.implementedFeatures.length}):`);
        this.analysis.implementedFeatures.forEach((feature, i) => {
            console.log(`  ${i + 1}. ${feature}`);
        });
        
        console.log(`\n❌ MISSING FEATURES (${this.analysis.missingFeatures.length}):`);
        this.analysis.missingFeatures.forEach((feature, i) => {
            console.log(`  ${i + 1}. ${feature}`);
        });
        
        // Detailed form analysis
        if (this.analysis.pages.main && this.analysis.pages.main.forms.length > 0) {
            console.log(`\n📝 FORMS ANALYSIS:`);
            this.analysis.pages.main.forms.forEach((form, i) => {
                console.log(`  Form ${i + 1}: ${form.method} ${form.action}`);
                form.inputs.forEach(input => {
                    console.log(`    - ${input.type} field: ${input.name || input.placeholder || 'unnamed'}`);
                });
            });
        } else {
            console.log(`\n📝 NO INTERACTIVE FORMS FOUND`);
            console.log(`   This indicates the site might be mostly static content.`);
        }
        
        console.log(`\n🔗 NAVIGATION LINKS (${this.analysis.pages.main ? this.analysis.pages.main.links.length : 0}):`);
        if (this.analysis.pages.main && this.analysis.pages.main.links.length > 0) {
            this.analysis.pages.main.links.slice(0, 10).forEach((link, i) => {
                console.log(`  ${i + 1}. "${link.text}" -> ${link.href}`);
            });
            if (this.analysis.pages.main.links.length > 10) {
                console.log(`  ... and ${this.analysis.pages.main.links.length - 10} more links`);
            }
        }
        
        // Priority recommendations
        console.log(`\n🎯 PRIORITY IMPLEMENTATION RECOMMENDATIONS:`);
        const priorities = [
            'User registration and login system',
            'Provider profile creation and management',
            'Search and filtering for providers',
            'Booking system with calendar integration',
            'Secure chat system for user communication',
            'Token-based payment system',
            'Admin panel for content management',
            'Mobile-responsive design improvements',
            'Email verification system',
            'Document verification for providers'
        ];
        
        priorities.forEach((priority, i) => {
            console.log(`  ${i + 1}. ${priority}`);
        });
        
        return this.analysis;
    }
}

// Run the analysis
const analyzer = new DetailedSiteAnalyzer();
analyzer.analyzeSite().then(() => {
    console.log('\n🏁 Site analysis completed!');
    process.exit(0);
}).catch(error => {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
});