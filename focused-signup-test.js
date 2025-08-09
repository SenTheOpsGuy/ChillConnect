const puppeteer = require('puppeteer');

async function testUserSignupFlow() {
  console.log('🚀 Testing User Signup Flow...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 720 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const results = {
    provider: { attempted: false, success: false },
    seeker: { attempted: false, success: false },
    emails: []
  };

  // Monitor network requests for email activity
  page.on('response', (response) => {
    if (response.url().includes('/auth/') || 
        response.url().includes('email') || 
        response.url().includes('send') ||
        response.url().includes('verify')) {
      results.emails.push({
        url: response.url(),
        status: response.status(),
        timestamp: new Date().toISOString()
      });
    }
  });

  try {
    // Test Provider Signup
    console.log('🏢 Testing Provider Signup...');
    results.provider.attempted = true;

    await page.goto('https://chillconnect.in/register', { waitUntil: 'networkidle2' });
    console.log('📄 Registration page loaded');

    // Wait for the role selection to be available
    try {
      await page.waitForSelector('input[name="role"][value="PROVIDER"]', { timeout: 10000 });
      await page.click('input[name="role"][value="PROVIDER"]');
      console.log('✅ Selected Provider role');
    } catch (error) {
      console.log('⚠️ Could not find Provider role selector, continuing...');
    }

    // Generate unique credentials
    const timestamp = Date.now();
    const providerEmail = `provider${timestamp}@test.example.com`;
    
    // Fill form with shorter timeout
    const fillForm = async () => {
      await page.type('input[name="firstName"]', 'Test', { delay: 50 });
      await page.type('input[name="lastName"]', 'Provider', { delay: 50 });
      await page.type('input[name="email"]', providerEmail, { delay: 50 });
      await page.type('input[name="phone"]', '+1234567890', { delay: 50 });
      await page.type('input[name="dateOfBirth"]', '1990-01-01');
      await page.type('input[name="password"]', 'TestPass123!', { delay: 50 });
      await page.type('input[name="confirmPassword"]', 'TestPass123!', { delay: 50 });
      
      // Check required checkboxes
      await page.click('input[name="ageConfirmed"]');
      await page.click('input[name="consentGiven"]');
    };

    await fillForm();
    console.log('✅ Provider form filled');

    // Submit form
    await page.click('button[type="submit"]');
    console.log('🚀 Provider form submitted');

    // Wait for response (shorter timeout)
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const providerUrl = page.url();
    const providerContent = await page.content();
    
    const providerSuccess = !providerUrl.includes('/register') || 
                          providerContent.includes('verification') ||
                          providerContent.includes('dashboard');
    
    results.provider.success = providerSuccess;
    results.provider.email = providerEmail;
    results.provider.finalUrl = providerUrl;

    console.log(`${providerSuccess ? '✅' : '❌'} Provider signup: ${providerSuccess ? 'SUCCESS' : 'FAILED'}`);
    console.log(`📧 Provider email: ${providerEmail}`);
    console.log(`📍 Final URL: ${providerUrl}`);

    // Test Seeker Signup (new page)
    console.log('\n🔍 Testing Seeker Signup...');
    results.seeker.attempted = true;

    await page.goto('https://chillconnect.in/register', { waitUntil: 'networkidle2' });
    
    // Wait for form and select Seeker role (should be default)
    try {
      await page.waitForSelector('input[name="role"][value="SEEKER"]', { timeout: 10000 });
      await page.click('input[name="role"][value="SEEKER"]');
      console.log('✅ Selected Seeker role');
    } catch (error) {
      console.log('⚠️ Could not find Seeker role selector, continuing...');
    }

    const seekerTimestamp = Date.now();
    const seekerEmail = `seeker${seekerTimestamp}@test.example.com`;

    // Fill seeker form
    await page.type('input[name="firstName"]', 'Test');
    await page.type('input[name="lastName"]', 'Seeker');
    await page.type('input[name="email"]', seekerEmail);
    await page.type('input[name="phone"]', '+1234567891');
    await page.type('input[name="dateOfBirth"]', '1992-01-01');
    await page.type('input[name="password"]', 'TestPass123!');
    await page.type('input[name="confirmPassword"]', 'TestPass123!');
    
    await page.click('input[name="ageConfirmed"]');
    await page.click('input[name="consentGiven"]');

    console.log('✅ Seeker form filled');

    // Submit seeker form
    await page.click('button[type="submit"]');
    console.log('🚀 Seeker form submitted');

    // Wait for response
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const seekerUrl = page.url();
    const seekerContent = await page.content();
    
    const seekerSuccess = !seekerUrl.includes('/register') || 
                         seekerContent.includes('verification') ||
                         seekerContent.includes('dashboard');
    
    results.seeker.success = seekerSuccess;
    results.seeker.email = seekerEmail;
    results.seeker.finalUrl = seekerUrl;

    console.log(`${seekerSuccess ? '✅' : '❌'} Seeker signup: ${seekerSuccess ? 'SUCCESS' : 'FAILED'}`);
    console.log(`📧 Seeker email: ${seekerEmail}`);
    console.log(`📍 Final URL: ${seekerUrl}`);

    // Test additional functionality quickly
    console.log('\n🔍 Testing Additional Functionality...');
    
    // Test search page
    await page.goto('https://chillconnect.in/search');
    await new Promise(resolve => setTimeout(resolve, 2000));
    const searchAccessible = !page.url().includes('/login');
    console.log(`${searchAccessible ? '✅' : '❌'} Search page: ${searchAccessible ? 'ACCESSIBLE' : 'REQUIRES LOGIN'}`);

    // Test bookings page
    await page.goto('https://chillconnect.in/bookings');
    await new Promise(resolve => setTimeout(resolve, 2000));
    const bookingsAccessible = !page.url().includes('/login');
    console.log(`${bookingsAccessible ? '✅' : '❌'} Bookings page: ${bookingsAccessible ? 'ACCESSIBLE' : 'REQUIRES LOGIN'}`);

    // Test chat page
    await page.goto('https://chillconnect.in/chat');
    await new Promise(resolve => setTimeout(resolve, 2000));
    const chatAccessible = !page.url().includes('/login');
    console.log(`${chatAccessible ? '✅' : '❌'} Chat page: ${chatAccessible ? 'ACCESSIBLE' : 'REQUIRES LOGIN'}`);

    // Summary
    console.log('\n📊 TEST SUMMARY');
    console.log('==================================================');
    console.log(`🏢 Provider Signup: ${results.provider.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`🔍 Seeker Signup: ${results.seeker.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`📧 Email Requests: ${results.emails.length} detected`);
    console.log(`🔍 Search: ${searchAccessible ? 'ACCESSIBLE' : 'LOGIN REQUIRED'}`);
    console.log(`📅 Bookings: ${bookingsAccessible ? 'ACCESSIBLE' : 'LOGIN REQUIRED'}`);
    console.log(`💬 Chat: ${chatAccessible ? 'ACCESSIBLE' : 'LOGIN REQUIRED'}`);

    const totalTests = 6;
    const passedTests = [
      results.provider.success,
      results.seeker.success,
      results.emails.length > 0,
      searchAccessible,
      bookingsAccessible,
      chatAccessible
    ].filter(Boolean).length;

    console.log(`\n📈 Overall: ${passedTests}/${totalTests} tests passed (${(passedTests/totalTests*100).toFixed(1)}%)`);

    if (results.emails.length > 0) {
      console.log('\n📧 Email Activity Detected:');
      results.emails.forEach((email, index) => {
        console.log(`   ${index + 1}. ${email.url} (${email.status})`);
      });
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await new Promise(resolve => setTimeout(resolve, 2000)); // Brief pause to see results
    await browser.close();
  }

  return results;
}

// Run the test
testUserSignupFlow().catch(console.error);