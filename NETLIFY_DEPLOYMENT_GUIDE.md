# ChillConnect Netlify Deployment Guide

## Overview
This guide will help you deploy the ChillConnect React frontend to Netlify while setting up the backend on a separate hosting service.

## Prerequisites
- Netlify account
- GitHub repository with ChillConnect code
- Backend hosting solution (Railway, Render, Heroku, or VPS)

## Frontend Deployment to Netlify

### Step 1: Prepare the Repository
1. Ensure all AWS deployment files have been cleaned (✅ Already done)
2. The frontend is configured in `/frontend` directory
3. Netlify configuration files are ready:
   - `netlify.toml` (build settings)
   - `frontend/_redirects` (SPA routing)
   - `.nvmrc` (Node.js version)

### Step 2: Deploy to Netlify
1. **Connect Repository:**
   - Go to Netlify dashboard
   - Click "New site from Git"
   - Connect your GitHub repository

2. **Build Settings:**
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `frontend/dist`
   - Node.js version: 18 (specified in .nvmrc)

3. **Environment Variables:**
   Add these in Netlify dashboard under Site Settings > Environment Variables:
   ```
   VITE_API_BASE_URL=https://your-backend-url.com/api
   VITE_NODE_ENV=production
   VITE_SOCKET_URL=https://your-backend-url.com
   ```

### Step 3: Custom Domain Setup
1. In Netlify dashboard, go to Domain Management
2. Add custom domain: `chillconnect.in`
3. Update DNS records at your domain registrar:
   - Delete existing A records
   - Add CNAME record: `chillconnect.in` → `your-netlify-app.netlify.app`
4. Enable HTTPS (automatic with Netlify)

## Backend Deployment Options

Since Netlify only hosts static sites, you need a separate backend hosting solution:

### Option 1: Railway (Recommended)
- **Pros:** Easy deployment, PostgreSQL included, Docker support
- **Cost:** Free tier available, $5/month for production
- **Setup:**
  1. Connect GitHub repo to Railway
  2. Deploy backend from `/backend` directory
  3. Add PostgreSQL service
  4. Set environment variables

### Option 2: Render
- **Pros:** Free tier, PostgreSQL included, easy setup
- **Cost:** Free tier available, $7/month for production
- **Setup:**
  1. Create web service from GitHub
  2. Root directory: `backend`
  3. Build command: `npm install`
  4. Start command: `npm start`

### Option 3: Heroku
- **Pros:** Well-established platform
- **Cost:** $7/month minimum
- **Setup:**
  1. Create Heroku app
  2. Add PostgreSQL addon
  3. Deploy backend code

### Option 4: VPS (DigitalOcean, Linode)
- **Pros:** Full control, cost-effective for multiple apps
- **Cost:** $5-10/month
- **Setup:** Manual server setup required

## Database Setup

### Railway/Render PostgreSQL:
1. Database will be automatically provisioned
2. Get connection string from dashboard
3. Add to backend environment variables:
   ```
   DATABASE_URL=postgresql://user:pass@host:port/dbname
   ```

### Manual Database Setup:
1. Run migrations: `npm run db:migrate`
2. Seed database: `npm run db:seed`

## Environment Variables for Backend

Create `.env` file in backend with:
```env
# Database
DATABASE_URL=postgresql://user:pass@host:port/dbname

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# Server
PORT=5001
NODE_ENV=production
CORS_ORIGIN=https://chillconnect.in

# Email (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Twilio (for SMS)
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=your-twilio-phone

# PayPal
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret
PAYPAL_MODE=live

# AWS S3 (for file uploads)
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-s3-bucket
```

## Post-Deployment Steps

1. **Update Frontend Environment:**
   ```
   VITE_API_BASE_URL=https://your-backend-url.com/api
   VITE_SOCKET_URL=https://your-backend-url.com
   ```

2. **Update Netlify Redirects:**
   Edit `netlify.toml` and `frontend/_redirects` to point to actual backend URL

3. **Test Functionality:**
   - User registration/login
   - Booking creation
   - Real-time chat
   - File uploads
   - Payment processing

4. **SSL Certificate:**
   - Netlify: Automatic HTTPS
   - Backend: Ensure hosting service provides SSL

## Monitoring and Maintenance

1. **Netlify Monitoring:**
   - Build logs in Netlify dashboard
   - Analytics and performance metrics

2. **Backend Monitoring:**
   - Application logs from hosting service
   - Database performance monitoring
   - Uptime monitoring (UptimeRobot, etc.)

3. **Domain Health:**
   - SSL certificate renewal (automatic)
   - DNS propagation checks
   - Performance monitoring

## Troubleshooting

### Common Issues:
1. **API calls failing:** Check CORS configuration in backend
2. **Build failures:** Verify Node.js version and dependencies
3. **Socket.io not connecting:** Ensure WebSocket support on backend host
4. **File uploads failing:** Check S3 configuration and CORS

### Support Resources:
- Netlify Documentation: https://docs.netlify.com/
- Railway Documentation: https://docs.railway.app/
- Render Documentation: https://render.com/docs

This deployment architecture separates frontend (Netlify) and backend (Railway/Render) for optimal performance and cost efficiency.