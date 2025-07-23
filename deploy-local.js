const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting ChillConnect Local Deployment...\n');

// Function to start a process
function startProcess(command, args, cwd, name) {
    return new Promise((resolve, reject) => {
        const process = spawn(command, args, {
            cwd,
            stdio: 'inherit',
            shell: true
        });

        process.on('error', (error) => {
            console.error(`❌ Error starting ${name}:`, error);
            reject(error);
        });

        // For dev servers, we consider them "started" after a short delay
        setTimeout(() => {
            console.log(`✅ ${name} started successfully`);
            resolve(process);
        }, 3000);
    });
}

async function deployLocal() {
    try {
        console.log('📦 Starting Backend Server...');
        const backendProcess = startProcess('npm', ['run', 'dev'], 
            path.join(__dirname, 'backend'), 'Backend Server');

        console.log('⚛️  Starting Frontend Server...');
        const frontendProcess = startProcess('npm', ['run', 'dev'], 
            path.join(__dirname, 'frontend'), 'Frontend Server');

        // Wait for both to start
        await Promise.all([backendProcess, frontendProcess]);

        console.log('\n🎉 ChillConnect deployed successfully!');
        console.log('\n📊 Access URLs:');
        console.log('Frontend: http://localhost:3001');
        console.log('Backend API: http://localhost:5001');
        console.log('\n🔑 Test Credentials:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('👑 SUPER ADMIN:     admin@chillconnect.com      / admin123');
        console.log('👔 MANAGER:         manager@chillconnect.com    / manager123');
        console.log('🏢 EMPLOYEE:        employee1@chillconnect.com  / employee1123');
        console.log('💼 PROVIDER:        provider1@chillconnect.com  / provider1123');
        console.log('🔍 SEEKER:          seeker1@chillconnect.com    / seeker1123');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\n📝 Additional Test Accounts:');
        console.log('Providers: provider2@chillconnect.com to provider5@chillconnect.com');
        console.log('Seekers: seeker2@chillconnect.com to seeker10@chillconnect.com');
        console.log('Employees: employee2@chillconnect.com, employee3@chillconnect.com');
        console.log('Password pattern: [username]123 (e.g., provider2123, seeker3123)');
        console.log('\n🏃‍♂️ Keep this terminal open to maintain the servers');
        console.log('Press Ctrl+C to stop all servers\n');

        // Handle graceful shutdown
        process.on('SIGINT', () => {
            console.log('\n🛑 Shutting down servers...');
            process.exit(0);
        });

        // Keep the process alive
        setInterval(() => {
            // Keep alive
        }, 10000);

    } catch (error) {
        console.error('❌ Deployment failed:', error);
        process.exit(1);
    }
}

deployLocal();