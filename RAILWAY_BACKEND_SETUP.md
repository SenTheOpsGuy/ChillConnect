# 🚂 Railway Backend Deployment Guide

## Step 1: Create Railway Account & Project

1. Go to [Railway.app](https://railway.app)
2. Sign in with GitHub
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Choose your ChillConnect repository
6. Railway will detect it's a Node.js project

## Step 2: Configure Backend Service

### Project Settings:
- **Root Directory:** `backend`
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Port:** Railway will auto-detect from your app (5001)

### Variables Tab - Add Environment Variables:

```bash
# Database (Railway will auto-generate this when you add PostgreSQL)
DATABASE_URL=postgresql://user:password@host:port/database

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-now
JWT_EXPIRES_IN=7d

# Server Configuration
NODE_ENV=production
FRONTEND_URL=https://your-netlify-app.netlify.app
PORT=5001

# Email Configuration (Gmail SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password

# Twilio SMS Configuration (Optional)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# PayPal Configuration
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret
PAYPAL_MODE=live

# AWS S3 Configuration (for file uploads)
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-s3-bucket-name
```

## Step 3: Add PostgreSQL Database

1. In your Railway project dashboard
2. Click "New Service"
3. Select "PostgreSQL"
4. Railway will automatically:
   - Create a PostgreSQL instance
   - Generate DATABASE_URL
   - Connect it to your backend service

## Step 4: Deploy Backend

1. Click "Deploy" in Railway dashboard
2. Railway will:
   - Pull code from GitHub
   - Install dependencies
   - Start your Node.js server
   - Provide a public URL

## Step 5: Get Your Backend URL

After deployment, Railway will provide:
- **Public URL:** `https://your-app-name.up.railway.app`
- **Internal URL:** For service-to-service communication

## Step 6: Update Frontend Environment

Once you have the Railway backend URL, update Netlify environment variables:

```bash
VITE_API_BASE_URL=https://your-app-name.up.railway.app/api
VITE_SOCKET_URL=https://your-app-name.up.railway.app
```

## Database Migrations

Railway will run automatically, but if needed:
1. Open Railway terminal
2. Run: `npx prisma migrate deploy`
3. Run: `npx prisma db seed`

## Monitoring

Railway provides:
- ✅ Automatic deployments from GitHub
- ✅ Logs and metrics
- ✅ SSL certificates
- ✅ Custom domains
- ✅ Database backups

## Cost

- Free tier: 500 hours/month
- Pro: $5/month for backend + $5/month for PostgreSQL
- Total: ~$10/month for production backend

Your backend will be live at: `https://your-app-name.up.railway.app`