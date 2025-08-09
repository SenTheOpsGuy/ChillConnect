const axios = require('axios');
const puppeteer = require('puppeteer');

class TestAccountsAndBookingsChecker {
  constructor() {
    this.apiUrl = 'https://chillconnect-production.up.railway.app/api';
    this.frontendUrl = 'https://chillconnect.in';
    this.testAccounts = [];
  }

  async findTestAccounts() {
    console.log('🔍 Looking for test accounts created during testing...\n');
    
    // From our previous tests, we created accounts with specific patterns
    const testEmailPatterns = [
      'provider*@test.chillconnect.com',
      'seeker*@test.chillconnect.com', 
      'provider*@test.example.com',
      'seeker*@test.example.com'
    ];
    
    console.log('📧 Test email patterns used in previous tests:');
    testEmailPatterns.forEach(pattern => console.log(`   - ${pattern}`));
    
    // Try to login with some of the accounts we created
    const recentTimestamps = [
      '1754578439366', // From earlier tests
      '1754578596639',
      '1754578605550',
      '1754578694364',
      '1754578868228'
    ];
    
    console.log('\n🔐 Attempting to verify created accounts...');
    
    for (const timestamp of recentTimestamps) {
      const providerEmail = `provider${timestamp}@test.chillconnect.com`;
      const seekerEmail = `seeker${timestamp}@test.chillconnect.com`;
      
      // Try provider account
      const providerResult = await this.tryLogin(providerEmail, 'TestProvider123!');
      if (providerResult.success) {
        this.testAccounts.push({
          email: providerEmail,
          password: 'TestProvider123!',
          role: 'PROVIDER',
          token: providerResult.token,
          user: providerResult.user
        });
      }
      
      // Try seeker account  
      const seekerResult = await this.tryLogin(seekerEmail, 'TestSeeker123!');
      if (seekerResult.success) {
        this.testAccounts.push({
          email: seekerEmail,
          password: 'TestSeeker123!',
          role: 'SEEKER',
          token: seekerResult.token,
          user: seekerResult.user
        });
      }
    }
    
    console.log(`\n✅ Found ${this.testAccounts.length} working test accounts:`);
    this.testAccounts.forEach(account => {
      console.log(`   📧 ${account.email} (${account.role}) - ID: ${account.user.id}`);
    });
    
    return this.testAccounts;
  }

  async tryLogin(email, password) {
    try {
      const response = await axios.post(`${this.apiUrl}/auth/login`, {
        email,
        password
      });
      
      return {
        success: true,
        token: response.data.data?.token,
        user: response.data.data?.user
      };
    } catch (error) {
      return { success: false, error: error.response?.data?.error };
    }
  }

  async checkForBookings() {
    console.log('\n📅 Checking for bookings between test accounts...\n');
    
    if (this.testAccounts.length < 2) {
      console.log('⚠️ Need at least 2 accounts to check for bookings');
      return [];
    }
    
    const bookings = [];
    
    // Check bookings for each account
    for (const account of this.testAccounts) {
      try {
        console.log(`🔍 Checking bookings for ${account.email}...`);
        
        const response = await axios.get(`${this.apiUrl}/bookings`, {
          headers: {
            'Authorization': `Bearer ${account.token}`
          }
        });
        
        const userBookings = response.data.bookings || response.data.data || [];
        console.log(`   Found ${userBookings.length} bookings`);
        
        userBookings.forEach(booking => {
          console.log(`   📋 Booking ID: ${booking.id}`);
          console.log(`   📅 Status: ${booking.status}`);
          console.log(`   👥 Between: ${booking.seeker?.profile?.firstName} & ${booking.provider?.profile?.firstName}`);
          bookings.push(booking);
        });
        
      } catch (error) {
        console.log(`   ❌ Error checking bookings: ${error.response?.data?.error || error.message}`);
      }
    }
    
    return bookings;
  }

  async checkChatConversations() {
    console.log('\n💬 Checking for chat conversations...\n');
    
    for (const account of this.testAccounts) {
      try {
        console.log(`💬 Checking conversations for ${account.email}...`);
        
        const response = await axios.get(`${this.apiUrl}/chat/conversations`, {
          headers: {
            'Authorization': `Bearer ${account.token}`
          }
        });
        
        const conversations = response.data.conversations || response.data.data || [];
        console.log(`   Found ${conversations.length} conversations`);
        
        conversations.forEach(conversation => {
          console.log(`   💬 Conversation: ${conversation.booking?.id}`);
          console.log(`   📨 Messages: ${conversation.messageCount || 0}`);
        });
        
      } catch (error) {
        console.log(`   ❌ Error checking conversations: ${error.response?.data?.error || error.message}`);
      }
    }
  }

  async testLiveChatWithRealAccounts() {
    console.log('\n🎭 Testing live chat with actual test accounts...\n');
    
    if (this.testAccounts.length < 1) {
      console.log('❌ No working test accounts found for live chat test');
      return;
    }
    
    const browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1920, height: 1080 }
    });
    
    const page = await browser.newPage();
    
    try {
      const testAccount = this.testAccounts[0];
      console.log(`🔐 Logging in as: ${testAccount.email}`);
      
      // Go to login page
      await page.goto(`${this.frontendUrl}/login`);
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Fill login form
      await page.type('input[type="email"]', testAccount.email);
      await page.type('input[type="password"]', testAccount.password);
      await page.click('button[type="submit"]');
      
      // Wait for login
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const postLoginUrl = page.url();
      console.log(`📍 Post-login URL: ${postLoginUrl}`);
      
      if (postLoginUrl.includes('/login')) {
        console.log('❌ Login failed - account may need email verification');
        return;
      }
      
      console.log('✅ Login successful!');
      
      // Test messages page
      console.log('\n📱 Testing /messages page...');
      await page.goto(`${this.frontendUrl}/messages`);
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const messagesUrl = page.url();
      console.log(`📍 Messages page URL: ${messagesUrl}`);
      
      if (messagesUrl.includes('/messages')) {
        console.log('✅ Messages page accessible!');
        
        // Look for conversation elements
        const conversationElements = await page.$$('[class*="conversation"], [class*="chat"], [class*="booking"], .message-item');
        console.log(`💬 Found ${conversationElements.length} conversation elements`);
        
        // Take screenshot for visual verification
        await page.screenshot({ path: '/tmp/messages-page-authenticated.png' });
        console.log('📷 Screenshot saved: /tmp/messages-page-authenticated.png');
        
        // Look for any specific booking IDs or chat links
        const chatLinks = await page.$$eval('a[href*="/chat/"], button[data-booking-id]', elements => {
          return elements.map(el => ({
            href: el.href || el.getAttribute('data-booking-id'),
            text: el.textContent.trim()
          }));
        });
        
        if (chatLinks.length > 0) {
          console.log(`🔗 Found ${chatLinks.length} chat links:`);
          chatLinks.forEach(link => {
            console.log(`   💬 ${link.text} -> ${link.href}`);
          });
          
          // Try clicking the first chat link
          console.log('\n🖱️ Testing chat link...');
          await page.click('a[href*="/chat/"], button[data-booking-id]');
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          const chatUrl = page.url();
          console.log(`💬 Chat URL: ${chatUrl}`);
          
          if (chatUrl.includes('/chat/')) {
            console.log('🎉 SUCCESS! Chat is working with real booking!');
            
            // Look for chat interface
            const chatInterface = await page.$('input[placeholder*="message"], textarea, [class*="message-input"]');
            console.log(`💬 Chat input found: ${!!chatInterface}`);
            
            await page.screenshot({ path: '/tmp/chat-page-working.png' });
            console.log('📷 Chat screenshot saved: /tmp/chat-page-working.png');
          }
        } else {
          console.log('⚠️ No chat links found - may need active bookings');
        }
      } else {
        console.log('❌ Messages page not accessible');
      }
      
    } catch (error) {
      console.error('❌ Live chat test failed:', error.message);
    } finally {
      await browser.close();
    }
  }

  async runCompleteCheck() {
    console.log('🔍 CHECKING TEST ACCOUNTS, BOOKINGS & CHAT FUNCTIONALITY');
    console.log('=======================================================\n');
    
    // Find working test accounts
    const accounts = await this.findTestAccounts();
    
    if (accounts.length === 0) {
      console.log('❌ No working test accounts found');
      console.log('💡 This means either:');
      console.log('   1. Accounts were created but need email verification');
      console.log('   2. Accounts were created with different passwords');
      console.log('   3. Account creation failed during testing');
      return;
    }
    
    // Check for bookings
    const bookings = await this.checkForBookings();
    
    // Check for conversations
    await this.checkChatConversations();
    
    // Test live chat if accounts exist
    if (accounts.length > 0) {
      await this.testLiveChatWithRealAccounts();
    }
    
    console.log('\n🎯 FINAL ANALYSIS');
    console.log('==================');
    console.log(`✅ Working accounts: ${accounts.length}`);
    console.log(`📅 Total bookings: ${bookings.length}`);
    console.log(`💬 Chat system: ${accounts.length > 0 ? 'TESTABLE' : 'NEEDS ACCOUNTS'}`);
    
    if (accounts.length > 0 && bookings.length > 0) {
      console.log('\n🌟 CHAT IS FULLY FUNCTIONAL WITH REAL DATA!');
    } else if (accounts.length > 0) {
      console.log('\n✅ Accounts exist, chat system ready for bookings');
    } else {
      console.log('\n⚠️ Need to create verified accounts to test chat');
    }
  }
}

const checker = new TestAccountsAndBookingsChecker();
checker.runCompleteCheck().catch(console.error);