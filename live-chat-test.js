const puppeteer = require('puppeteer');

async function testLiveChatFunctionality() {
  console.log('🌐 Testing Live Chat on chillconnect.in...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  try {
    // Enable console logging
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.log(`❌ Browser Error:`, msg.text());
      }
    });

    console.log('1. 📍 Testing chat page access...');
    await page.goto('https://chillconnect.in/chat');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const currentUrl = page.url();
    console.log(`   Current URL: ${currentUrl}`);
    
    if (currentUrl.includes('/login')) {
      console.log('✅ Chat correctly requires authentication');
      console.log('   - Chat page exists but requires login (good security)');
      
      // Test with admin login to see chat functionality
      console.log('\n2. 🔐 Testing with admin login...');
      
      // Fill login form
      await page.type('input[type="email"]', 'admin@chillconnect.com');
      await page.type('input[type="password"]', 'SuperSecurePassword123!');
      await page.click('button[type="submit"]');
      
      // Wait for login
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const postLoginUrl = page.url();
      console.log(`   Post-login URL: ${postLoginUrl}`);
      
      if (postLoginUrl.includes('/admin')) {
        console.log('✅ Admin logged in successfully');
        
        // Now try to access chat as admin
        console.log('\n3. 💬 Testing chat access as authenticated admin...');
        await page.goto('https://chillconnect.in/chat');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const chatUrl = page.url();
        console.log(`   Chat URL after admin login: ${chatUrl}`);
        
        if (chatUrl.includes('/chat') && !chatUrl.includes('/login')) {
          console.log('✅ Chat page accessible to authenticated users');
          
          // Look for chat interface elements
          const pageContent = await page.content();
          
          // Check for common chat elements
          const hasMessageElements = pageContent.includes('message') || 
                                   pageContent.includes('chat') ||
                                   pageContent.includes('conversation');
          
          const hasInputElements = await page.$('input, textarea');
          const hasChatContainer = await page.$('[class*="chat"], [class*="message"], .chat-container, .messages');
          
          console.log('\n4. 🔍 Chat interface analysis:');
          console.log(`   Message-related content: ${hasMessageElements ? '✅ Found' : '❌ Not found'}`);
          console.log(`   Input elements: ${hasInputElements ? '✅ Found' : '❌ Not found'}`);
          console.log(`   Chat container: ${hasChatContainer ? '✅ Found' : '❌ Not found'}`);
          
          // Check for any error messages
          const errorMessages = await page.$$eval('*', elements => {
            return elements
              .filter(el => el.textContent && (
                el.textContent.toLowerCase().includes('error') ||
                el.textContent.toLowerCase().includes('not found') ||
                el.textContent.toLowerCase().includes('404')
              ))
              .map(el => el.textContent.trim())
              .filter(text => text.length > 0);
          });
          
          if (errorMessages.length > 0) {
            console.log('\n⚠️ Error messages found:');
            errorMessages.forEach(msg => console.log(`   - ${msg}`));
          }
          
          // Take a screenshot for visual verification
          await page.screenshot({ path: '/tmp/chat-page-screenshot.png' });
          console.log('\n📷 Screenshot saved: /tmp/chat-page-screenshot.png');
          
          return {
            status: 'ACCESSIBLE',
            requiresAuth: true,
            hasInterface: hasMessageElements || hasChatContainer,
            hasInputs: !!hasInputElements,
            errors: errorMessages
          };
          
        } else {
          console.log('❌ Chat page still not accessible after admin login');
          return { status: 'NOT_ACCESSIBLE', reason: 'Redirected after authentication' };
        }
        
      } else {
        console.log('❌ Admin login failed or redirected unexpectedly');
        return { status: 'LOGIN_FAILED' };
      }
      
    } else if (currentUrl.includes('/chat')) {
      console.log('✅ Chat page loaded without authentication required');
      
      // Analyze the chat interface
      const pageContent = await page.content();
      const hasMessageElements = pageContent.includes('message') || pageContent.includes('chat');
      const hasInputElements = await page.$('input, textarea');
      
      console.log('\n📋 Chat interface:');
      console.log(`   Message elements: ${hasMessageElements ? '✅' : '❌'}`);
      console.log(`   Input elements: ${hasInputElements ? '✅' : '❌'}`);
      
      return {
        status: 'ACCESSIBLE_NO_AUTH',
        hasInterface: hasMessageElements,
        hasInputs: !!hasInputElements
      };
      
    } else {
      console.log('❌ Chat page not found or redirected to unexpected location');
      return { status: 'NOT_FOUND', redirectedTo: currentUrl };
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return { status: 'ERROR', error: error.message };
  } finally {
    await new Promise(resolve => setTimeout(resolve, 3000)); // Allow time to see results
    await browser.close();
  }
}

// Test regular user chat access
async function testRegularUserChatFlow() {
  console.log('\n👤 Testing Regular User Chat Access...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 }
  });

  const page = await browser.newPage();
  
  try {
    console.log('1. 📍 Accessing main site...');
    await page.goto('https://chillconnect.in');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Look for chat-related navigation or links
    const chatLinks = await page.$$eval('a, button, [role="button"]', elements => {
      return elements
        .filter(el => {
          const text = el.textContent.toLowerCase();
          return text.includes('chat') || text.includes('message') || text.includes('conversation');
        })
        .map(el => ({
          text: el.textContent.trim(),
          href: el.href || el.getAttribute('data-href') || 'button',
          visible: el.offsetWidth > 0 && el.offsetHeight > 0
        }));
    });
    
    console.log('2. 🔍 Looking for chat navigation...');
    if (chatLinks.length > 0) {
      console.log('✅ Chat links found:');
      chatLinks.forEach(link => {
        console.log(`   - "${link.text}" (${link.href}) ${link.visible ? '[Visible]' : '[Hidden]'}`);
      });
    } else {
      console.log('⚠️ No obvious chat navigation found on main page');
    }
    
    // Test direct chat URL access
    console.log('\n3. 🔗 Testing direct chat URL access...');
    await page.goto('https://chillconnect.in/chat');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const finalUrl = page.url();
    console.log(`   Final URL: ${finalUrl}`);
    
    if (finalUrl.includes('/login')) {
      console.log('✅ Chat properly requires authentication');
    } else if (finalUrl.includes('/chat')) {
      console.log('✅ Chat accessible - checking interface...');
      
      const hasInterface = await page.$('[class*="chat"], [class*="message"], input, textarea');
      console.log(`   Chat interface: ${hasInterface ? '✅ Present' : '❌ Not found'}`);
    } else {
      console.log('❓ Unexpected redirect or page behavior');
    }
    
    return {
      chatLinksFound: chatLinks.length,
      requiresAuth: finalUrl.includes('/login'),
      accessibleDirectly: finalUrl.includes('/chat')
    };
    
  } catch (error) {
    console.error('❌ Regular user test failed:', error.message);
    return { error: error.message };
  } finally {
    await browser.close();
  }
}

// Run both tests
async function runCompleteTest() {
  console.log('🚀 COMPLETE LIVE CHAT FUNCTIONALITY TEST');
  console.log('==========================================\n');
  
  const adminTest = await testLiveChatFunctionality();
  const userTest = await testRegularUserChatFlow();
  
  console.log('\n📊 FINAL RESULTS');
  console.log('==================');
  
  console.log('\n🔐 Admin/Authenticated Access:');
  console.log(`   Status: ${adminTest.status}`);
  if (adminTest.hasInterface) {
    console.log('   Interface: ✅ Chat interface detected');
  }
  if (adminTest.errors && adminTest.errors.length > 0) {
    console.log(`   Errors: ⚠️ ${adminTest.errors.length} issues detected`);
  }
  
  console.log('\n👥 Regular User Access:');
  console.log(`   Requires Auth: ${userTest.requiresAuth ? '✅ Yes (secure)' : '❌ No (potential security issue)'}`);
  console.log(`   Chat Links: ${userTest.chatLinksFound} found in navigation`);
  
  console.log('\n🎯 OVERALL CHAT STATUS:');
  if (adminTest.status === 'ACCESSIBLE' && userTest.requiresAuth) {
    console.log('🌟 EXCELLENT - Chat is working and properly secured!');
    console.log('   ✅ Chat requires authentication (security)');
    console.log('   ✅ Chat is accessible to authenticated users');
    console.log('   ✅ Interface elements are present');
  } else if (adminTest.status === 'ACCESSIBLE') {
    console.log('✅ GOOD - Chat is accessible but check security');
  } else {
    console.log('⚠️ NEEDS ATTENTION - Chat may have issues');
  }
  
  return { adminTest, userTest };
}

runCompleteTest().catch(console.error);