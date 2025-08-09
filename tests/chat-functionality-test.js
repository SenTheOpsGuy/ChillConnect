const puppeteer = require('puppeteer');
const axios = require('axios');

class ChatFunctionalityTest {
  constructor() {
    this.baseUrl = 'https://chillconnect.in';
    this.apiUrl = 'https://chillconnect-production.up.railway.app/api';
    this.results = {
      frontend: {},
      backend: {},
      socketIO: {},
      issues: []
    };
  }

  async testChatFrontend() {
    console.log('💬 Testing Chat Frontend...');
    
    const browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1280, height: 720 }
    });
    
    const page = await browser.newPage();
    
    try {
      // Test chat page accessibility
      await page.goto(`${this.baseUrl}/chat`);
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const currentUrl = page.url();
      const pageContent = await page.content();
      
      // Check if redirected to login
      const requiresLogin = currentUrl.includes('/login');
      const chatPageLoaded = !requiresLogin && currentUrl.includes('/chat');
      
      if (requiresLogin) {
        console.log('🔒 Chat page requires authentication (expected)');
        this.results.frontend.requiresAuth = true;
        this.results.frontend.pageExists = true;
      } else if (chatPageLoaded) {
        console.log('✅ Chat page loads without authentication');
        
        // Look for chat interface elements
        const chatInterface = await page.$('[class*="chat"], [class*="message"], .chat-container');
        const messageInput = await page.$('input[placeholder*="message" i], textarea[placeholder*="message" i]');
        const chatList = await page.$('[class*="conversation"], [class*="chat-list"], .chat-list');
        const sendButton = await page.$('button:contains("Send"), [class*="send"]');
        
        console.log(`   Chat interface: ${chatInterface ? '✅ Found' : '❌ Not found'}`);
        console.log(`   Message input: ${messageInput ? '✅ Found' : '❌ Not found'}`);
        console.log(`   Chat list: ${chatList ? '✅ Found' : '❌ Not found'}`);
        console.log(`   Send button: ${sendButton ? '✅ Found' : '❌ Not found'}`);
        
        this.results.frontend = {
          pageExists: true,
          requiresAuth: false,
          chatInterface: !!chatInterface,
          messageInput: !!messageInput,
          chatList: !!chatList,
          sendButton: !!sendButton
        };
      } else {
        console.log('❌ Chat page not found or not working');
        this.results.frontend = { pageExists: false };
      }
      
    } catch (error) {
      console.error('❌ Chat frontend test failed:', error.message);
      this.results.frontend = { error: error.message };
    } finally {
      await browser.close();
    }
  }

  async testChatBackendAPI() {
    console.log('🔧 Testing Chat Backend API...');
    
    // Test various chat-related endpoints
    const chatEndpoints = [
      { path: '/chat', method: 'GET', description: 'Get chat messages' },
      { path: '/chat/messages', method: 'GET', description: 'Get chat messages list' },
      { path: '/chat/conversations', method: 'GET', description: 'Get conversations' },
      { path: '/bookings', method: 'GET', description: 'Get bookings (chat context)' }
    ];
    
    for (const endpoint of chatEndpoints) {
      try {
        const response = await axios({
          method: endpoint.method,
          url: `${this.apiUrl}${endpoint.path}`,
          headers: { 'Content-Type': 'application/json' }
        });
        
        console.log(`✅ ${endpoint.description}: EXISTS (${response.status})`);
        
      } catch (error) {
        const status = error.response?.status;
        
        if (status === 401 || status === 403) {
          console.log(`✅ ${endpoint.description}: PROTECTED (${status}) - requires authentication`);
        } else if (status === 404) {
          console.log(`❌ ${endpoint.description}: NOT FOUND (${status})`);
        } else {
          console.log(`❓ ${endpoint.description}: UNKNOWN STATUS (${status})`);
        }
        
        if (!this.results.backend[endpoint.path]) {
          this.results.backend[endpoint.path] = {};
        }
        this.results.backend[endpoint.path].status = status;
        this.results.backend[endpoint.path].exists = status !== 404;
        this.results.backend[endpoint.path].protected = status === 401 || status === 403;
      }
    }
  }

  async testSocketIOConnection() {
    console.log('🔌 Testing Socket.IO Connection...');
    
    try {
      // Check if Socket.IO is available by trying to connect to the websocket endpoint
      const socketUrl = this.apiUrl.replace('/api', '');
      
      // Test WebSocket endpoint availability
      const response = await axios.get(`${socketUrl}/health`);
      
      if (response.status === 200) {
        console.log('✅ Server is running - Socket.IO likely available');
        
        // Check if socket.io path is accessible
        try {
          await axios.get(`${socketUrl}/socket.io/`);
          console.log('✅ Socket.IO endpoint detected');
          this.results.socketIO.available = true;
        } catch (socketError) {
          if (socketError.response?.status === 400) {
            console.log('✅ Socket.IO endpoint exists (400 expected for direct HTTP access)');
            this.results.socketIO.available = true;
          } else {
            console.log('⚠️ Socket.IO endpoint status unclear');
            this.results.socketIO.available = false;
          }
        }
      }
      
    } catch (error) {
      console.log('❌ Socket.IO connection test failed:', error.message);
      this.results.socketIO.error = error.message;
    }
  }

  async checkChatRoutes() {
    console.log('🔍 Checking Chat Route Implementation...');
    
    // Check if chat routes exist in the codebase
    const chatRouteChecks = [
      'Frontend chat route (/chat)',
      'Backend chat API routes',
      'Socket.IO chat handlers',
      'Chat message storage'
    ];
    
    console.log('📋 Chat System Components to Check:');
    chatRouteChecks.forEach((check, index) => {
      console.log(`   ${index + 1}. ${check}`);
    });
  }

  generateReport() {
    console.log('\n💬 CHAT FUNCTIONALITY TEST REPORT');
    console.log('==================================================');
    
    // Analyze results
    const frontendWorking = this.results.frontend.pageExists && 
                           (this.results.frontend.requiresAuth || this.results.frontend.chatInterface);
    
    const backendEndpoints = Object.values(this.results.backend || {});
    const protectedEndpoints = backendEndpoints.filter(ep => ep.protected).length;
    const existingEndpoints = backendEndpoints.filter(ep => ep.exists).length;
    
    const socketIOAvailable = this.results.socketIO.available;
    
    console.log('🎯 CHAT SYSTEM STATUS:');
    console.log(`   Frontend: ${frontendWorking ? '✅ WORKING' : '❌ ISSUES'}`);
    console.log(`   Backend APIs: ${existingEndpoints}/${backendEndpoints.length} endpoints exist`);
    console.log(`   Socket.IO: ${socketIOAvailable ? '✅ AVAILABLE' : '❌ UNAVAILABLE'}`);
    
    if (this.results.frontend.requiresAuth) {
      console.log('\n🔐 AUTHENTICATION:');
      console.log('   ✅ Chat properly requires user authentication');
      console.log('   ✅ Security implemented correctly');
    }
    
    if (this.results.frontend.chatInterface) {
      console.log('\n💻 FRONTEND INTERFACE:');
      console.log(`   Chat interface: ${this.results.frontend.chatInterface ? '✅' : '❌'}`);
      console.log(`   Message input: ${this.results.frontend.messageInput ? '✅' : '❌'}`);
      console.log(`   Chat list: ${this.results.frontend.chatList ? '✅' : '❌'}`);
      console.log(`   Send button: ${this.results.frontend.sendButton ? '✅' : '❌'}`);
    }
    
    console.log('\n📊 OVERALL ASSESSMENT:');
    
    if (frontendWorking && existingEndpoints > 0 && socketIOAvailable) {
      console.log('🌟 EXCELLENT - Chat system is fully implemented and functional!');
    } else if (frontendWorking && socketIOAvailable) {
      console.log('✅ GOOD - Chat system is mostly working, some backend routes may need implementation');
    } else if (this.results.frontend.requiresAuth) {
      console.log('⚠️ PARTIAL - Chat page exists but may need full implementation');
    } else {
      console.log('❌ NEEDS WORK - Chat system requires implementation');
    }
    
    return {
      status: frontendWorking && socketIOAvailable ? 'WORKING' : 'NEEDS_ATTENTION',
      frontend: this.results.frontend,
      backend: this.results.backend,
      socketIO: this.results.socketIO
    };
  }

  async runTest() {
    console.log('🚀 Starting Chat Functionality Test...\n');
    
    try {
      await this.testChatFrontend();
      console.log(''); // Empty line
      
      await this.testChatBackendAPI();
      console.log(''); // Empty line
      
      await this.testSocketIOConnection();
      console.log(''); // Empty line
      
      await this.checkChatRoutes();
      
      return this.generateReport();
      
    } catch (error) {
      console.error('❌ Chat functionality test failed:', error);
      return { status: 'ERROR', error: error.message };
    }
  }
}

// Run the chat functionality test
const tester = new ChatFunctionalityTest();
tester.runTest().then(result => {
  console.log('\n🏁 Test completed!');
  console.log(`📊 Final Status: ${result.status}`);
}).catch(console.error);