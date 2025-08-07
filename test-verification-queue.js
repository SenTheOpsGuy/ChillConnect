const puppeteer = require('puppeteer');

(async () => {
  console.log('🔍 Testing VerificationQueue page after fix...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    devtools: true
  });
  
  try {
    const page = await browser.newPage();
    
    // Login
    console.log('🔐 Logging in...');
    await page.goto('https://chillconnect.in/employee-login', { waitUntil: 'networkidle0' });
    await page.type('input[type="email"]', 'sentheopsguy@gmail.com');
    await page.type('input[type="password"]', 'voltas-beko');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Navigate to verification queue
    console.log('📋 Clicking Verification Queue...');
    await page.click('a[href*="verification"]');
    
    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const currentUrl = page.url();
    console.log(`📍 URL: ${currentUrl}`);
    
    // Check if page has content
    const pageText = await page.evaluate(() => document.body.textContent);
    const hasVerificationContent = pageText.includes('Verification Queue') || pageText.includes('No verifications found');
    
    console.log(`✅ Page loaded: ${hasVerificationContent ? 'SUCCESS' : 'FAILED'}`);
    console.log(`📝 Page contains: ${pageText.substring(0, 200)}...`);
    
    // Take screenshot
    await page.screenshot({ 
      path: '/tmp/verification-queue-fixed.png', 
      fullPage: true 
    });
    
    console.log('📸 Screenshot saved: /tmp/verification-queue-fixed.png');
    
    if (hasVerificationContent) {
      console.log('🎉 VerificationQueue is now working!');
    } else {
      console.log('❌ VerificationQueue still has issues');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
})();