const puppeteer = require('puppeteer');

(async () => {
  console.log('🔍 Testing admin authentication and routing...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    devtools: true,
    args: ['--disable-web-security', '--disable-features=VizDisplayCompositor']
  });
  
  try {
    const page = await browser.newPage();
    
    // Enable detailed logging
    page.on('console', (msg) => {
      console.log(`Frontend [${msg.type()}]:`, msg.text());
    });
    
    page.on('response', (response) => {
      if (response.url().includes('/api/')) {
        console.log(`🌐 API: ${response.status()} ${response.url()}`);
      }
    });
    
    console.log('1. 🔐 Logging into admin account...');
    await page.goto('https://chillconnect.in/employee-login', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    await page.type('input[type="email"]', 'sentheopsguy@gmail.com');
    await page.type('input[type="password"]', 'voltas-beko');
    
    // Click login and wait for redirect
    console.log('2. 🔘 Clicking login...');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
      page.click('button[type="submit"]')
    ]);
    
    const postLoginUrl = page.url();
    console.log(`3. 📍 Post-login URL: ${postLoginUrl}`);
    
    if (postLoginUrl.includes('/admin/dashboard')) {
      console.log('✅ Successfully redirected to admin dashboard');
      
      // Check if we can see the admin dashboard content
      await page.waitForSelector('h1, h2, .dashboard-title', { timeout: 5000 }).catch(() => {
        console.log('⚠️  No dashboard title found');
      });
      
      // Take screenshot of actual dashboard
      await page.screenshot({ 
        path: '/tmp/admin-dashboard-actual.png', 
        fullPage: true 
      });
      console.log('📸 Dashboard screenshot saved');
      
    } else {
      console.log('❌ Not redirected to admin dashboard');
      
      // Take screenshot of wherever we ended up
      await page.screenshot({ 
        path: '/tmp/admin-redirect-failed.png', 
        fullPage: true 
      });
    }
    
    // Test direct navigation to admin dashboard
    console.log('4. 🎯 Testing direct navigation to /admin/dashboard...');
    await page.goto('https://chillconnect.in/admin/dashboard', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    const directNavUrl = page.url();
    console.log(`5. 📍 Direct navigation result URL: ${directNavUrl}`);
    
    await page.screenshot({ 
      path: '/tmp/admin-dashboard-direct.png', 
      fullPage: true 
    });
    
    console.log('6. 🔍 Checking localStorage for auth tokens...');
    const authData = await page.evaluate(() => {
      return {
        token: localStorage.getItem('token'),
        user: localStorage.getItem('user'),
        isAuthenticated: localStorage.getItem('isAuthenticated')
      };
    });
    
    console.log('Auth data:', authData);
    
    console.log('7. 🔍 Testing sidebar navigation...');
    
    // Look for sidebar navigation elements
    const sidebarLinks = await page.$$eval('nav a, .sidebar a, [class*="sidebar"] a', links => 
      links.map(link => ({
        text: link.textContent.trim(),
        href: link.href
      }))
    ).catch(() => []);
    
    console.log(`Found ${sidebarLinks.length} sidebar links:`, sidebarLinks);
    
    // Keep browser open for inspection
    console.log('🔍 Test completed. Browser will remain open for inspection...');
    console.log('Press Ctrl+C to close.');
    
    await new Promise(() => {}); // Keep running
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
})();