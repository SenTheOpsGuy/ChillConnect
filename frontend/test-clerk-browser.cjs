#!/usr/bin/env node

const { spawn } = require('child_process');
const { exec } = require('child_process');

console.log('🧪 Testing Clerk Integration in Browser');
console.log('=====================================');

// Function to open URL in browser
function openBrowser(url) {
  const command = process.platform === 'darwin' ? 'open' : 
                 process.platform === 'win32' ? 'start' : 'xdg-open';
  
  exec(`${command} "${url}"`, (error) => {
    if (error) {
      console.log(`❌ Failed to open browser: ${error.message}`);
    } else {
      console.log(`✅ Opened ${url} in browser`);
    }
  });
}

// Check if dev server is running
function checkServer() {
  return new Promise((resolve) => {
    const http = require('http');
    const req = http.get('http://localhost:3000', (res) => {
      resolve(true);
    });
    
    req.on('error', () => {
      resolve(false);
    });
    
    req.setTimeout(2000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function main() {
  console.log('🔍 Checking if dev server is running...');
  
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    console.log('❌ Dev server not running on localhost:3000');
    console.log('🚀 Starting dev server...');
    
    const devServer = spawn('npm', ['run', 'dev'], {
      stdio: 'pipe',
      shell: true
    });
    
    devServer.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(output);
      
      if (output.includes('Local:   http://localhost:3000')) {
        console.log('✅ Dev server started successfully');
        setTimeout(() => {
          testRoutes();
        }, 2000);
      }
    });
    
    devServer.stderr.on('data', (data) => {
      console.error(`❌ Server error: ${data}`);
    });
    
  } else {
    console.log('✅ Dev server is running');
    testRoutes();
  }
}

function testRoutes() {
  console.log('\n🌐 Opening test routes in browser...');
  
  const routes = [
    'http://localhost:3000/',
    'http://localhost:3000/test-clerk',
    'http://localhost:3000/clerk-register'
  ];
  
  routes.forEach((url, index) => {
    setTimeout(() => {
      console.log(`Opening: ${url}`);
      openBrowser(url);
    }, index * 2000);
  });
  
  console.log('\n📋 Test Checklist:');
  console.log('1. Landing page should load (http://localhost:3000/)');
  console.log('2. Test page should show Clerk status (http://localhost:3000/test-clerk)');
  console.log('3. Clerk register should show role selection (http://localhost:3000/clerk-register)');
  console.log('\n⏰ Opening routes with 2-second delays...');
}

main().catch(console.error);