# ChillConnect Deployment Guide

Complete deployment documentation for the ChillConnect adult services booking platform.

## 📋 Table of Contents

- [Deployment Architecture](#deployment-architecture)
- [Environment Setup](#environment-setup)
- [Frontend Deployment (Netlify)](#frontend-deployment-netlify)
- [Backend Deployment (Railway)](#backend-deployment-railway)
- [Database Management](#database-management)
- [Mobile App Deployment](#mobile-app-deployment)
- [Monitoring & Health Checks](#monitoring--health-checks)
- [Security Configuration](#security-configuration)
- [Rollback Procedures](#rollback-procedures)
- [Troubleshooting](#troubleshooting)

## 🏗 Deployment Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        A[Web App - Netlify]
        B[Mobile App - App Stores]
    end
    
    subgraph "CDN & Load Balancer"
        C[Netlify CDN]
        D[Railway Load Balancer]
    end
    
    subgraph "Application Layer"
        E[Backend API - Railway]
        F[Socket.IO Server]
    end
    
    subgraph "Data Layer"
        G[PostgreSQL - Railway]
        H[Redis Cache]
        I[AWS S3 Storage]
    end
    
    subgraph "External Services"
        J[PayPal API]
        K[Twilio SMS]
        L[Brevo Email]
        M[AWS SES]
    end
    
    A --> C
    B --> D
    C --> E
    D --> E
    E --> F
    E --> G
    E --> H
    E --> I
    E --> J
    E --> K
    E --> L
    E --> M
```

## ⚙️ Environment Setup

### Development Environment

```bash
# Prerequisites
node >= 20.0.0
npm >= 10.0.0
postgresql >= 15
redis >= 7 (optional)

# Clone repository
git clone https://github.com/SenTheOpsGuy/ChillConnect.git
cd ChillConnect

# Install dependencies
npm run install:all

# Setup environment files
cp .env.example .env
cp frontend/.env.example frontend/.env.local
cp backend/.env.example backend/.env

# Start development servers
npm run dev
```

### Staging Environment

**Infrastructure:**
- Frontend: Netlify (staging subdomain)
- Backend: Railway (staging service)
- Database: PostgreSQL (staging instance)
- Storage: AWS S3 (staging bucket)

### Production Environment

**Infrastructure:**
- Frontend: Netlify (custom domain)
- Backend: Railway (production service)
- Database: PostgreSQL (production instance)
- Storage: AWS S3 (production bucket)
- CDN: Netlify Edge + Cloudflare

## 🌐 Frontend Deployment (Netlify)

### Build Configuration

**Build Settings:**
```toml
[build]
  publish = "frontend/dist"
  command = "cd frontend && npm install && npm run build"

[build.environment]
  NODE_VERSION = "20"
  NPM_VERSION = "10"
  VITE_API_BASE_URL = "https://api.chillconnect.com/api"
  VITE_SOCKET_URL = "https://api.chillconnect.com"
  VITE_NODE_ENV = "production"
```

**Redirects Configuration:**
```toml
# API proxy to backend
[[redirects]]
  from = "/api/*"
  to = "https://api.chillconnect.com/api/:splat"
  status = 200
  force = true

# SPA routing
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Domain Configuration

**Custom Domain Setup:**
1. Add custom domain in Netlify dashboard
2. Configure DNS records:
   ```
   Type: CNAME
   Name: chillconnect.in
   Value: vigilant-franklin-123456.netlify.app
   ```
3. Enable SSL certificate (automatic via Let's Encrypt)
4. Configure HTTPS redirects

### Security Headers

```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Content-Security-Policy = '''
      default-src 'self';
      script-src 'self' 'unsafe-inline' 'unsafe-eval';
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      img-src 'self' data: https:;
      font-src 'self' https: https://fonts.gstatic.com;
      connect-src 'self' wss: https:;
    '''
```

### Deployment Process

**Automatic Deployment:**
```yaml
# GitHub Actions triggers Netlify build
on:
  push:
    branches: [main]
    paths: ['frontend/**']

steps:
  - name: Deploy to Netlify
    uses: nwtgck/actions-netlify@v2.1
    with:
      publish-dir: 'frontend/dist'
      production-deploy: true
```

**Manual Deployment:**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login and link site
netlify login
netlify link

# Deploy
netlify deploy --prod --dir=frontend/dist
```

## 🚂 Backend Deployment (Railway)

### Service Configuration

**Railway Setup:**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and initialize
railway login
railway init

# Deploy
railway up
```

**Environment Variables:**
```bash
# Database
DATABASE_URL=postgresql://user:pass@host:port/db
REDIS_URL=redis://user:pass@host:port

# Authentication
JWT_SECRET=your-super-secret-jwt-key
ADMIN_CHANGE_PASSWORD=your-admin-password

# External Services
BREVO_API_KEY=your-brevo-key
TWILIO_ACCOUNT_SID=your-twilio-sid
PAYPAL_CLIENT_ID=your-paypal-id
AWS_ACCESS_KEY_ID=your-aws-key

# Server Configuration
PORT=5001
NODE_ENV=production
FRONTEND_URL=https://chillconnect.in
```

### Docker Configuration

**Dockerfile:**
```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy application
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5001/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

EXPOSE 5001

CMD ["node", "railway-start.js"]
```

**Railway Start Script:**
```javascript
// railway-start.js
const { execSync } = require('child_process')

console.log('🚂 Starting Railway deployment...')

// Run database migrations
console.log('📊 Running database migrations...')
execSync('npx prisma migrate deploy', { stdio: 'inherit' })

// Start the application
console.log('🚀 Starting application...')
require('./src/index.js')
```

### Database Migrations

**Production Migration Process:**
```bash
# Backup current database
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Run migrations
npx prisma migrate deploy

# Verify migration
npx prisma migrate status
```

**Rollback Process:**
```bash
# Restore from backup if needed
psql $DATABASE_URL < backup_20250114_120000.sql

# Reset to specific migration
npx prisma migrate reset --to-migration 20250101000000_init
```

## 🗄️ Database Management

### PostgreSQL Configuration

**Production Settings:**
- **Instance Type**: Railway PostgreSQL
- **Storage**: 10GB (auto-scaling)
- **Backups**: Daily automated backups
- **Connections**: Max 100 concurrent connections

**Connection Pool:**
```javascript
// Prisma configuration
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### Backup Strategy

**Automated Backups:**
- Daily full backups via Railway
- Point-in-time recovery available
- Cross-region backup replication

**Manual Backup:**
```bash
# Create backup
pg_dump $DATABASE_URL > chillconnect_backup.sql

# Restore backup
psql $NEW_DATABASE_URL < chillconnect_backup.sql
```

### Migration Management

**Safe Migration Practices:**
1. **Test in staging first**
2. **Backup before migration**
3. **Use transactions where possible**
4. **Monitor performance impact**
5. **Plan rollback strategy**

## 📱 Mobile App Deployment

### Android (Google Play Store)

**Build Process:**
```bash
# Install dependencies
cd frontend
npm install

# Build for production
npm run build

# Sync with Capacitor
npx cap sync android

# Build APK/AAB
cd android
./gradlew assembleRelease  # APK
./gradlew bundleRelease    # AAB for Play Store
```

**Play Store Configuration:**
```json
{
  "app_name": "ChillConnect",
  "package_name": "com.chillconnect.app",
  "version_code": 1,
  "version_name": "1.0.0",
  "target_sdk": 34,
  "min_sdk": 26
}
```

### iOS (App Store)

**Build Process:**
```bash
# Sync with Capacitor
npx cap sync ios

# Open in Xcode
npx cap open ios

# Build and upload via Xcode or
# xcodebuild -workspace App.xcworkspace -scheme App archive
```

**App Store Configuration:**
```plist
<key>CFBundleIdentifier</key>
<string>com.chillconnect.app</string>
<key>CFBundleVersion</key>
<string>1.0.0</string>
<key>CFBundleShortVersionString</key>
<string>1.0.0</string>
```

### App Store Guidelines Compliance

**Content Rating:**
- Mature 17+ rating required
- Age verification implementation
- Content filtering mechanisms
- User safety features

## 📊 Monitoring & Health Checks

### Health Check Endpoints

**Backend Health Check:**
```javascript
// GET /health
{
  "status": "OK",
  "timestamp": "2025-01-14T12:00:00Z",
  "environment": "production",
  "database": "connected",
  "redis": "connected",
  "external_services": {
    "brevo": "connected",
    "twilio": "connected",
    "paypal": "connected"
  }
}
```

**Frontend Health Check:**
```javascript
// Netlify function or edge function
export default async (request, context) => {
  return new Response(JSON.stringify({
    status: 'OK',
    timestamp: new Date().toISOString(),
    build_id: process.env.BUILD_ID,
    commit_sha: process.env.COMMIT_REF
  }), {
    headers: { 'content-type': 'application/json' }
  })
}
```

### Monitoring Setup

**Application Monitoring:**
- **Railway**: Built-in metrics and logs
- **Netlify**: Function logs and analytics
- **Sentry**: Error tracking and performance monitoring
- **Uptime Robot**: External uptime monitoring

**Custom Monitoring:**
```javascript
// Performance monitoring
const performanceMiddleware = (req, res, next) => {
  const start = Date.now()
  
  res.on('finish', () => {
    const duration = Date.now() - start
    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`
    })
  })
  
  next()
}
```

### Alerting Configuration

**Slack Alerts:**
```yaml
# GitHub Actions notification
- name: Notify Slack on Failure
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    status: failure
    channel: '#alerts'
    message: |
      🚨 Production Deployment Failed
      Branch: ${{ github.ref_name }}
      Commit: ${{ github.sha }}
      Author: ${{ github.actor }}
```

## 🔒 Security Configuration

### SSL/TLS Configuration

**Netlify SSL:**
- Automatic Let's Encrypt certificates
- HTTPS redirects enabled
- HTTP Strict Transport Security (HSTS)

**Railway SSL:**
- Automatic SSL termination
- TLS 1.2+ enforced
- Certificate auto-renewal

### Environment Security

**Secret Management:**
```bash
# Production secrets (Railway)
railway variables set JWT_SECRET=your-secret
railway variables set DATABASE_URL=your-db-url

# Staging secrets
railway variables set JWT_SECRET=staging-secret --environment staging
```

**Network Security:**
- Railway: Private networking between services
- Netlify: Edge network protection
- Database: SSL-only connections

### Content Security

**CSP Headers:**
```javascript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "https:"]
    }
  }
}))
```

## 🔄 Rollback Procedures

### Frontend Rollback

**Netlify Rollback:**
```bash
# Via CLI
netlify sites:list
netlify api getDeploy --data='{"deploy_id": "previous-deploy-id"}'
netlify api rollbackDeploy --data='{"deploy_id": "previous-deploy-id"}'

# Via Dashboard
# 1. Go to Netlify dashboard
# 2. Select site
# 3. Go to Deploys
# 4. Click "Publish deploy" on previous version
```

### Backend Rollback

**Railway Rollback:**
```bash
# List deployments
railway status

# Rollback to previous deployment
railway rollback

# Or rollback to specific deployment
railway rollback --deployment-id=previous-deployment-id
```

**Database Rollback:**
```bash
# Emergency database restore
psql $DATABASE_URL < backup_before_deployment.sql

# Selective rollback (if migration-safe)
npx prisma migrate reset --to-migration previous_migration_id
```

### Emergency Procedures

**Complete Service Rollback:**
1. **Immediate**: Rollback frontend and backend
2. **Database**: Restore from backup if needed
3. **Monitoring**: Verify all services restored
4. **Communication**: Notify stakeholders
5. **Analysis**: Document incident and lessons learned

## 🔧 Troubleshooting

### Common Deployment Issues

#### Frontend Build Failures

**Issue**: Vite build fails with memory errors
```bash
# Solution: Increase Node.js memory
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

**Issue**: Environment variables not available
```bash
# Check Netlify environment variables
netlify env:list

# Verify variable names start with VITE_
VITE_API_BASE_URL=https://api.chillconnect.com
```

#### Backend Deployment Issues

**Issue**: Railway deployment timeout
```bash
# Check build logs
railway logs

# Verify Dockerfile and start command
# Ensure health check endpoint is working
```

**Issue**: Database connection failures
```bash
# Verify DATABASE_URL format
postgresql://user:password@host:port/database?sslmode=require

# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

#### Migration Issues

**Issue**: Migration fails in production
```bash
# Check migration status
npx prisma migrate status

# Force reset (DANGEROUS - backup first!)
npx prisma migrate reset --force

# Apply specific migration
npx prisma migrate deploy
```

### Performance Issues

**Issue**: Slow API responses
```bash
# Check Railway metrics
railway status

# Review database queries
# Add database indexes if needed
# Implement Redis caching
```

**Issue**: Frontend loading slowly
```bash
# Analyze bundle size
npm run build -- --analyze

# Check Lighthouse scores
lighthouse https://chillconnect.in

# Optimize images and assets
```

### Security Issues

**Issue**: SSL certificate problems
```bash
# Check certificate status
curl -vI https://chillconnect.in

# Verify certificate chain
openssl s_client -connect chillconnect.in:443 -servername chillconnect.in
```

**Issue**: CORS errors in production
```javascript
// Verify CORS configuration
app.use(cors({
  origin: [
    'https://chillconnect.in',
    'https://www.chillconnect.in'
  ],
  credentials: true
}))
```

### Monitoring & Debugging

**Production Debugging:**
```bash
# Backend logs (Railway)
railway logs --tail

# Frontend logs (Netlify)
netlify logs

# Database queries
# Enable query logging in Prisma
# Check slow query logs
```

**Performance Monitoring:**
```bash
# API response times
curl -w "@curl-format.txt" -s -o /dev/null https://api.chillconnect.com/health

# Database performance
EXPLAIN ANALYZE SELECT * FROM "User" WHERE email = 'user@example.com';
```

## 📞 Support Contacts

### Emergency Contacts

- **Platform Issues**: DevOps team
- **Security Incidents**: Security team
- **Database Issues**: Database administrator
- **External Services**: Third-party support

### Useful Resources

- [Railway Documentation](https://docs.railway.app/)
- [Netlify Documentation](https://docs.netlify.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

*Last Updated: January 2025*
*Version: 1.0.0*