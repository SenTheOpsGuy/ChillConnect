const puppeteer = require('puppeteer');

async function debug400Error() {
  console.log('🔍 Debugging 400 Error in Admin Login...');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Capture all network requests and responses
  const requests = [];
  const responses = [];
  
  page.on('request', (request) => {
    requests.push({
      url: request.url(),
      method: request.method(),
      headers: request.headers(),
      postData: request.postData()
    });
    console.log(`📤 REQUEST: ${request.method()} ${request.url()}`);
    if (request.postData()) {
      console.log(`📤 REQUEST BODY:`, request.postData());
    }
  });
  
  page.on('response', async (response) => {
    const responseData = {
      url: response.url(),
      status: response.status(),
      headers: response.headers()
    };
    
    try {
      if (response.url().includes('/api/auth/login')) {
        const body = await response.text();
        responseData.body = body;
        console.log(`📥 RESPONSE: ${response.status()} ${response.url()}`);
        console.log(`📥 RESPONSE BODY:`, body);
        console.log(`📥 RESPONSE HEADERS:`, response.headers());
      }
    } catch (e) {
      console.log(`📥 RESPONSE: ${response.status()} ${response.url()} (could not read body)`);
    }
    
    responses.push(responseData);
  });
  
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
      
      console.log('📧 Email filled: admin@chillconnect.com');
      console.log('🔑 Password filled: SuperSecurePassword123!');
      
      // Submit form
      console.log('🔄 Submitting form...');
      const submitButton = await page.$('button[type="submit"]');
      if (submitButton) {
        await submitButton.click();
        console.log('✅ Submit button clicked');
        
        // Wait for network activity to complete
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const finalUrl = page.url();
        console.log('📍 Final URL after login:', finalUrl);
        
        // Analyze the captured network data
        console.log('\n🔍 Network Analysis:');
        console.log('📊 Total requests:', requests.length);
        console.log('📊 Total responses:', responses.length);
        
        // Find the login request
        const loginRequest = requests.find(req => req.url.includes('/api/auth/login'));
        const loginResponse = responses.find(res => res.url.includes('/api/auth/login'));
        
        if (loginRequest) {
          console.log('\n🔍 Login Request Details:');
          console.log('URL:', loginRequest.url);
          console.log('Method:', loginRequest.method);
          console.log('Headers:', JSON.stringify(loginRequest.headers, null, 2));
          console.log('Body:', loginRequest.postData);
        }
        
        if (loginResponse) {
          console.log('\n🔍 Login Response Details:');
          console.log('Status:', loginResponse.status);
          console.log('Headers:', JSON.stringify(loginResponse.headers, null, 2));
          console.log('Body:', loginResponse.body);
          
          if (loginResponse.status === 400) {
            console.log('\n❌ 400 Error Details:');
            try {
              const errorData = JSON.parse(loginResponse.body);
              console.log('Error Object:', JSON.stringify(errorData, null, 2));
            } catch (e) {
              console.log('Error parsing response body as JSON');
            }
          }
        }
        
      }
    } else {
      console.log('❌ Could not find email or password inputs');
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  } finally {
    console.log('\n🏁 Debug session complete');
    await new Promise(resolve => setTimeout(resolve, 3000));
    await browser.close();
  }
}

debug400Error().catch(console.error);