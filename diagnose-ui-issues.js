const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

class UIHealthChecker {
  constructor() {
    this.browser = null;
    this.page = null;
    this.issues = [];
    this.screenshotDir = './ui-diagnostics';
  }

  async init() {
    // Create screenshots directory
    if (!fs.existsSync(this.screenshotDir)) {
      fs.mkdirSync(this.screenshotDir, { recursive: true });
    }

    this.browser = await chromium.launch({ 
      headless: false,
      args: ['--disable-web-security', '--disable-features=VizDisplayCompositor']
    });
    this.page = await this.browser.newPage();
    
    // Listen for console errors
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        this.issues.push(`Console Error: ${msg.text()}`);
      }
    });

    // Listen for page errors
    this.page.on('pageerror', error => {
      this.issues.push(`Page Error: ${error.message}`);
    });

    // Listen for failed network requests
    this.page.on('response', response => {
      if (response.status() >= 400) {
        this.issues.push(`Network Error: ${response.url()} - ${response.status()}`);
      }
    });
  }

  async checkLandingPage() {
    console.log('\n🏠 Checking Landing Page...');
    try {
      await this.page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
      await this.page.screenshot({ path: path.join(this.screenshotDir, 'landing-page.png') });
      
      // Check for basic elements
      const title = await this.page.title();
      console.log(`✅ Page title: ${title}`);
      
      // Check if CSS is loading
      const styles = await this.page.evaluate(() => {
        const styleSheets = Array.from(document.styleSheets);
        return styleSheets.length;
      });
      console.log(`✅ Stylesheets loaded: ${styles}`);
      
      // Check for specific UI elements
      const elements = await this.page.evaluate(() => {
        return {
          hasHeader: !!document.querySelector('header'),
          hasNav: !!document.querySelector('nav'),
          hasMainContent: !!document.querySelector('main'),
          hasButtons: document.querySelectorAll('button').length,
          hasCards: document.querySelectorAll('.card').length,
          bodyClasses: document.body.className,
          bodyStyles: window.getComputedStyle(document.body).backgroundColor
        };
      });
      
      console.log(`📊 UI Elements found:`, elements);
      
      // Check if Tailwind is working
      const tailwindWorking = await this.page.evaluate(() => {
        const testEl = document.createElement('div');
        testEl.className = 'bg-red-500';
        document.body.appendChild(testEl);
        const styles = window.getComputedStyle(testEl);
        const isWorking = styles.backgroundColor === 'rgb(239, 68, 68)';
        document.body.removeChild(testEl);
        return isWorking;
      });
      
      console.log(`🎨 Tailwind CSS working: ${tailwindWorking}`);
      
    } catch (error) {
      this.issues.push(`Landing page error: ${error.message}`);
      console.error('❌ Landing page check failed:', error.message);
    }
  }

  async loginAsAdmin() {
    console.log('\n🔐 Attempting admin login...');
    try {
      await this.page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
      await this.page.screenshot({ path: path.join(this.screenshotDir, 'login-page.png') });
      
      // Try to login with admin credentials
      await this.page.fill('input[name="email"], input[type="email"]', 'admin@chillconnect.com');
      await this.page.fill('input[name="password"], input[type="password"]', 'admin123');
      await this.page.click('button[type="submit"], .btn-primary');
      
      await this.page.waitForTimeout(3000); // Wait for navigation
      
      const currentUrl = this.page.url();
      console.log(`✅ Current URL after login: ${currentUrl}`);
      
      await this.page.screenshot({ path: path.join(this.screenshotDir, 'after-login.png') });
      
    } catch (error) {
      this.issues.push(`Login error: ${error.message}`);
      console.error('❌ Login failed:', error.message);
    }
  }

  async checkProfilePage() {
    console.log('\n👤 Checking Profile Page...');
    try {
      await this.page.goto('http://localhost:3000/profile', { waitUntil: 'networkidle' });
      await this.page.screenshot({ path: path.join(this.screenshotDir, 'profile-page.png') });
      
      // Check what's actually rendered
      const pageContent = await this.page.evaluate(() => {
        return {
          hasContent: document.body.textContent.trim().length > 0,
          innerHTML: document.body.innerHTML.substring(0, 500),
          visibleElements: document.querySelectorAll('*:not(script):not(style)').length,
          profileElements: {
            cards: document.querySelectorAll('.card').length,
            inputs: document.querySelectorAll('input').length,
            buttons: document.querySelectorAll('button').length,
            avatars: document.querySelectorAll('.avatar').length
          },
          errorMessages: Array.from(document.querySelectorAll('.error, .text-red-500')).map(el => el.textContent),
          loadingStates: Array.from(document.querySelectorAll('.loading, .spinner')).length,
          reduxState: window.__REDUX_DEVTOOLS_EXTENSION__ ? 'Available' : 'Not available'
        };
      });
      
      console.log(`📊 Profile page analysis:`, pageContent);
      
      // Check if Redux store has user data
      const reduxData = await this.page.evaluate(() => {
        try {
          return {
            hasRedux: !!window.store,
            authState: window.store ? window.store.getState().auth : 'No store found'
          };
        } catch (e) {
          return { error: e.message };
        }
      });
      
      console.log(`🏪 Redux state:`, reduxData);
      
    } catch (error) {
      this.issues.push(`Profile page error: ${error.message}`);
      console.error('❌ Profile page check failed:', error.message);
    }
  }

  async checkBackendConnection() {
    console.log('\n🌐 Checking Backend Connection...');
    try {
      // Test API endpoints
      const response = await this.page.evaluate(async () => {
        try {
          const response = await fetch('http://localhost:5001/api/health');
          return {
            status: response.status,
            text: await response.text()
          };
        } catch (error) {
          return { error: error.message };
        }
      });
      
      console.log(`🔌 Backend health check:`, response);
      
    } catch (error) {
      this.issues.push(`Backend connection error: ${error.message}`);
      console.error('❌ Backend check failed:', error.message);
    }
  }

  async generateReport() {
    console.log('\n📝 Generating Diagnostic Report...');
    
    const report = {
      timestamp: new Date().toISOString(),
      issues: this.issues,
      recommendations: []
    };

    // Add recommendations based on issues found
    if (this.issues.some(issue => issue.includes('Tailwind'))) {
      report.recommendations.push('Check Tailwind CSS configuration and build process');
    }
    
    if (this.issues.some(issue => issue.includes('Network Error'))) {
      report.recommendations.push('Check backend server status and API endpoints');
    }
    
    if (this.issues.some(issue => issue.includes('Console Error'))) {
      report.recommendations.push('Check browser console for JavaScript errors');
    }

    // Write report
    fs.writeFileSync(
      path.join(this.screenshotDir, 'diagnostic-report.json'),
      JSON.stringify(report, null, 2)
    );

    console.log(`📊 Diagnostic complete! Found ${this.issues.length} issues`);
    console.log(`📁 Screenshots and report saved to: ${this.screenshotDir}`);
    
    if (this.issues.length > 0) {
      console.log('\n❌ Issues found:');
      this.issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`);
      });
    }

    console.log('\n💡 Next steps:');
    report.recommendations.forEach((rec, index) => {
      console.log(`   ${index + 1}. ${rec}`);
    });
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

async function main() {
  const checker = new UIHealthChecker();
  
  try {
    await checker.init();
    await checker.checkLandingPage();
    await checker.loginAsAdmin();
    await checker.checkProfilePage();
    await checker.checkBackendConnection();
    await checker.generateReport();
  } catch (error) {
    console.error('❌ Diagnostic failed:', error);
  } finally {
    await checker.cleanup();
  }
}

main().catch(console.error);