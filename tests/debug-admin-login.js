const puppeteer = require('puppeteer');

async function debugAdminLogin() {
  console.log('🔍 Debugging Admin Login Flow...');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Enable console logs from the page
  page.on('console', (msg) => {
    console.log(`🖥️ Browser Console [${msg.type()}]:`, msg.text());
  });
  
  try {
    // Navigate to employee login
    console.log('📍 Navigating to employee login...');
    await page.goto('https://chillconnect.in/employee-login');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('📍 Current URL after navigation:', page.url());
    
    // Fill login form
    console.log('✏️ Filling login form...');
    const emailInput = await page.$('input[type="email"]');
    const passwordInput = await page.$('input[type="password"]');
    
    if (emailInput && passwordInput) {
      await emailInput.type('admin@chillconnect.com');
      await passwordInput.type('SuperSecurePassword123!');
      
      console.log('📧 Email filled');
      console.log('🔑 Password filled');
      
      // Submit form
      console.log('🔄 Submitting form...');
      const submitButton = await page.$('button[type="submit"]');
      if (submitButton) {
        await submitButton.click();
        console.log('✅ Submit button clicked');
        
        // Wait for navigation or response
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const finalUrl = page.url();
        console.log('📍 Final URL after login:', finalUrl);
        
        // Check if user is redirected to admin area
        if (finalUrl.includes('admin')) {
          console.log('✅ Successfully redirected to admin area!');
        } else {
          console.log('❌ Login did not redirect to admin area');
          
          // Check for any error messages
          const errorElement = await page.$('.error, .alert, [role="alert"]');
          if (errorElement) {
            const errorText = await page.evaluate(el => el.textContent, errorElement);
            console.log('🚨 Error message found:', errorText);
          }
          
          // Check network requests
          console.log('🌐 Checking for network requests...');
          
          // Try to access admin dashboard directly
          console.log('🔄 Trying to access admin dashboard directly...');
          await page.goto('https://chillconnect.in/admin/dashboard');
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          const dashboardUrl = page.url();
          console.log('📍 Dashboard URL:', dashboardUrl);
          
          if (dashboardUrl.includes('admin/dashboard')) {
            console.log('✅ Admin dashboard accessible (login worked, redirect issue)');
          } else {
            console.log('❌ Admin dashboard not accessible (login failed)');
          }
        }
      }
    } else {
      console.log('❌ Could not find email or password inputs');
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  } finally {
    await new Promise(resolve => setTimeout(resolve, 2000));
    await browser.close();
  }
}

debugAdminLogin().catch(console.error);