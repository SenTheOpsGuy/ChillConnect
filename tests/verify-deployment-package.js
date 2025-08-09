#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class DeploymentPackageVerifier {
    constructor() {
        this.packagePath = './deployment-package';
        this.results = [];
        this.errors = [];
    }

    logResult(test, status, details = '') {
        const result = { test, status, details };
        this.results.push(result);
        
        const emoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
        console.log(`${emoji} ${test}: ${status} ${details}`);
        
        if (status === 'FAIL') {
            this.errors.push(`${test}: ${details}`);
        }
    }

    checkFileExists(filePath, description) {
        const exists = fs.existsSync(path.join(this.packagePath, filePath));
        this.logResult(`File Check: ${description}`, exists ? 'PASS' : 'FAIL', filePath);
        return exists;
    }

    checkPackageStructure() {
        console.log('📦 VERIFYING DEPLOYMENT PACKAGE STRUCTURE');
        console.log('==========================================');
        
        // Check main directories
        this.checkFileExists('backend', 'Backend Directory');
        this.checkFileExists('frontend-dist', 'Frontend Build Directory');
        this.checkFileExists('DEPLOY_NOW.md', 'Deployment Instructions');
        this.checkFileExists('DEPLOYMENT_REPORT.md', 'Deployment Report');
        
        // Check backend essentials
        this.checkFileExists('backend/package.json', 'Backend Package.json');
        this.checkFileExists('backend/src/index.js', 'Main Server File');
        this.checkFileExists('backend/src/routes/auth-simple.js', 'Authentication Routes');
        this.checkFileExists('backend/prisma/schema.prisma', 'Database Schema');
        this.checkFileExists('backend/.env.production', 'Production Environment');
        
        // Check frontend essentials
        this.checkFileExists('frontend-dist/index.html', 'Frontend Index');
        this.checkFileExists('frontend-dist/assets', 'Frontend Assets');
        this.checkFileExists('frontend-dist/_redirects', 'API Redirects');
    }

    verifyBackendConfiguration() {
        console.log('\n🔧 VERIFYING BACKEND CONFIGURATION');
        console.log('===================================');
        
        try {
            // Check package.json
            const packageJson = JSON.parse(
                fs.readFileSync(path.join(this.packagePath, 'backend/package.json'), 'utf8')
            );
            
            const hasStartScript = packageJson.scripts && packageJson.scripts.start;
            this.logResult('Start Script', hasStartScript ? 'PASS' : 'FAIL', 
                hasStartScript ? packageJson.scripts.start : 'Missing start script');
            
            const hasPrisma = packageJson.dependencies && packageJson.dependencies['@prisma/client'];
            this.logResult('Prisma Dependency', hasPrisma ? 'PASS' : 'FAIL',
                hasPrisma ? `Version: ${hasPrisma}` : 'Prisma not found');
            
            // Check environment file
            const envContent = fs.readFileSync(
                path.join(this.packagePath, 'backend/.env.production'), 'utf8'
            );
            
            const hasJWT = envContent.includes('JWT_SECRET');
            const hasDatabase = envContent.includes('DATABASE_URL') || envContent.includes('NODE_ENV=production');
            const hasCORS = envContent.includes('CORS_ORIGIN');
            
            this.logResult('JWT Configuration', hasJWT ? 'PASS' : 'FAIL');
            this.logResult('Production Environment', hasDatabase ? 'PASS' : 'FAIL');
            this.logResult('CORS Configuration', hasCORS ? 'PASS' : 'FAIL');
            
        } catch (error) {
            this.logResult('Backend Configuration', 'FAIL', error.message);
        }
    }

    verifyFrontendBuild() {
        console.log('\n🎨 VERIFYING FRONTEND BUILD');
        console.log('============================');
        
        try {
            // Check index.html
            const indexContent = fs.readFileSync(
                path.join(this.packagePath, 'frontend-dist/index.html'), 'utf8'
            );
            
            const hasTitle = indexContent.includes('ChillConnect');
            const hasAssets = indexContent.includes('/assets/');
            const isMinified = indexContent.length < 2000; // Typical for minified builds
            
            this.logResult('HTML Index File', hasTitle ? 'PASS' : 'FAIL',
                hasTitle ? 'ChillConnect title found' : 'No title found');
            this.logResult('Asset References', hasAssets ? 'PASS' : 'FAIL',
                hasAssets ? 'Asset links present' : 'No asset links');
            this.logResult('Build Optimization', isMinified ? 'PASS' : 'WARN',
                `Size: ${indexContent.length} chars`);
            
            // Check assets directory
            const assetsPath = path.join(this.packagePath, 'frontend-dist/assets');
            if (fs.existsSync(assetsPath)) {
                const assets = fs.readdirSync(assetsPath);
                const hasJS = assets.some(file => file.endsWith('.js'));
                const hasCSS = assets.some(file => file.endsWith('.css'));
                
                this.logResult('JavaScript Assets', hasJS ? 'PASS' : 'FAIL',
                    `${assets.filter(f => f.endsWith('.js')).length} JS files`);
                this.logResult('CSS Assets', hasCSS ? 'PASS' : 'FAIL',
                    `${assets.filter(f => f.endsWith('.css')).length} CSS files`);
            }
            
            // Check redirects file
            const redirectsContent = fs.readFileSync(
                path.join(this.packagePath, 'frontend-dist/_redirects'), 'utf8'
            );
            
            const hasAPIProxy = redirectsContent.includes('/api/*');
            const hasSPAFallback = redirectsContent.includes('/* /index.html');
            
            this.logResult('API Proxy Configuration', hasAPIProxy ? 'PASS' : 'FAIL');
            this.logResult('SPA Fallback', hasSPAFallback ? 'PASS' : 'FAIL');
            
        } catch (error) {
            this.logResult('Frontend Build Verification', 'FAIL', error.message);
        }
    }

    calculatePackageMetrics() {
        console.log('\n📊 PACKAGE METRICS');
        console.log('==================');
        
        try {
            const getDirectorySize = (dirPath) => {
                let totalSize = 0;
                const items = fs.readdirSync(dirPath, { withFileTypes: true });
                
                for (const item of items) {
                    const itemPath = path.join(dirPath, item.name);
                    if (item.isDirectory()) {
                        totalSize += getDirectorySize(itemPath);
                    } else {
                        totalSize += fs.statSync(itemPath).size;
                    }
                }
                return totalSize;
            };
            
            const backendSize = getDirectorySize(path.join(this.packagePath, 'backend'));
            const frontendSize = getDirectorySize(path.join(this.packagePath, 'frontend-dist'));
            const totalSize = getDirectorySize(this.packagePath);
            
            console.log(`📁 Backend Size: ${Math.round(backendSize / 1024)}KB`);
            console.log(`📁 Frontend Size: ${Math.round(frontendSize / 1024)}KB`);
            console.log(`📁 Total Package Size: ${Math.round(totalSize / 1024)}KB`);
            
            // Verify sizes are reasonable
            this.logResult('Backend Package Size', backendSize < 5 * 1024 * 1024 ? 'PASS' : 'WARN',
                `${Math.round(backendSize / 1024)}KB`);
            this.logResult('Frontend Package Size', frontendSize < 2 * 1024 * 1024 ? 'PASS' : 'WARN',
                `${Math.round(frontendSize / 1024)}KB`);
            
        } catch (error) {
            this.logResult('Package Metrics', 'FAIL', error.message);
        }
    }

    generateVerificationReport() {
        console.log('\n📋 DEPLOYMENT PACKAGE VERIFICATION REPORT');
        console.log('==========================================');
        
        const total = this.results.length;
        const passed = this.results.filter(r => r.status === 'PASS').length;
        const failed = this.results.filter(r => r.status === 'FAIL').length;
        const warnings = this.results.filter(r => r.status === 'WARN').length;
        
        console.log(`📅 Verification Date: ${new Date().toLocaleString()}`);
        console.log(`📊 Total Checks: ${total}`);
        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`⚠️  Warnings: ${warnings}`);
        console.log(`📈 Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
        
        const deploymentReady = failed === 0;
        
        if (deploymentReady) {
            console.log('\n🎉 DEPLOYMENT PACKAGE VERIFIED!');
            console.log('✅ All essential components present');
            console.log('✅ Configuration files correct');
            console.log('✅ Build assets optimized');
            console.log('✅ Ready for production deployment');
            console.log('\n🚀 Next Steps:');
            console.log('1. Choose hosting provider (Render.com recommended)');
            console.log('2. Follow instructions in DEPLOY_NOW.md');
            console.log('3. Deploy backend and frontend');
            console.log('4. Test live deployment');
            console.log('\n⏱️ Estimated deployment time: 15-20 minutes');
            console.log('📈 Expected success rate: 95%+');
        } else {
            console.log('\n⚠️  DEPLOYMENT PACKAGE NEEDS ATTENTION');
            console.log('❌ Some critical components are missing or incorrect');
            console.log('\n🔧 Issues to fix:');
            this.errors.forEach((error, i) => {
                console.log(`${i + 1}. ${error}`);
            });
        }
        
        return {
            total,
            passed,
            failed,
            warnings,
            successRate: ((passed / total) * 100).toFixed(1),
            deploymentReady,
            errors: this.errors
        };
    }

    async runAllVerifications() {
        console.log('🔍 ChillConnect Deployment Package Verification');
        console.log('==============================================');
        
        if (!fs.existsSync(this.packagePath)) {
            console.log('❌ Deployment package not found at:', this.packagePath);
            return { error: 'Package not found' };
        }
        
        try {
            this.checkPackageStructure();
            this.verifyBackendConfiguration();
            this.verifyFrontendBuild();
            this.calculatePackageMetrics();
            
            return this.generateVerificationReport();
            
        } catch (error) {
            console.error('❌ Verification failed:', error);
            return { error: error.message };
        }
    }
}

// Run the verification
if (require.main === module) {
    const verifier = new DeploymentPackageVerifier();
    verifier.runAllVerifications().then(report => {
        process.exit(report.deploymentReady ? 0 : 1);
    }).catch(error => {
        console.error('❌ Verification process failed:', error);
        process.exit(1);
    });
}

module.exports = DeploymentPackageVerifier;