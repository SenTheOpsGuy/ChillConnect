# GitHub Secrets Configuration

This document outlines all the GitHub Secrets that need to be configured for the ChillConnect CI/CD pipeline to work properly.

## Required Secrets

### 🔐 Authentication & Security

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `JWT_SECRET` | Secret key for JWT token signing | `your-super-long-random-jwt-secret-key-here` |
| `ADMIN_CHANGE_PASSWORD` | Password for admin operations | `SuperSecureAdminPassword123!` |

### 🗄️ Database

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `DATABASE_URL` | Production database connection string | `postgresql://user:pass@host:5432/db` |
| `STAGING_DATABASE_URL` | Staging database connection string | `postgresql://user:pass@staging-host:5432/db` |

### ☁️ Deployment

#### Netlify (Frontend)
| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `NETLIFY_AUTH_TOKEN` | Netlify authentication token | `your-netlify-auth-token` |
| `PROD_NETLIFY_SITE_ID` | Production Netlify site ID | `your-production-site-id` |
| `STAGING_NETLIFY_SITE_ID` | Staging Netlify site ID | `your-staging-site-id` |

#### Railway (Backend)
| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `RAILWAY_TOKEN` | Railway CLI authentication token | `your-railway-token` |
| `RAILWAY_PROD_PROJECT` | Production Railway project ID | `your-prod-project-id` |
| `RAILWAY_PROD_SERVICE` | Production Railway service ID | `your-prod-service-id` |
| `RAILWAY_STAGING_PROJECT` | Staging Railway project ID | `your-staging-project-id` |
| `RAILWAY_STAGING_SERVICE` | Staging Railway service ID | `your-staging-service-id` |

### 🌐 API Endpoints

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `PROD_API_BASE_URL` | Production API base URL | `https://api.chillconnect.com/api` |
| `STAGING_API_BASE_URL` | Staging API base URL | `https://staging-api.chillconnect.com/api` |
| `PROD_SOCKET_URL` | Production Socket.IO URL | `https://api.chillconnect.com` |
| `STAGING_SOCKET_URL` | Staging Socket.IO URL | `https://staging-api.chillconnect.com` |

### 📧 Email Service (Brevo)

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `BREVO_API_KEY` | Brevo email service API key | `your-brevo-api-key` |
| `BREVO_SENDER_EMAIL` | Sender email address | `noreply@chillconnect.com` |
| `BREVO_SENDER_NAME` | Sender name | `ChillConnect` |

### 📱 SMS Service (Twilio)

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `TWILIO_ACCOUNT_SID` | Twilio account SID | `your-twilio-account-sid` |
| `TWILIO_AUTH_TOKEN` | Twilio authentication token | `your-twilio-auth-token` |
| `TWILIO_PHONE_NUMBER` | Twilio phone number | `+1234567890` |

### 💳 Payment Service (PayPal)

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `PAYPAL_CLIENT_ID` | PayPal client ID | `your-paypal-client-id` |
| `PAYPAL_CLIENT_SECRET` | PayPal client secret | `your-paypal-client-secret` |

### ☁️ AWS Services

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `AWS_ACCESS_KEY_ID` | AWS access key ID | `AKIA...` |
| `AWS_SECRET_ACCESS_KEY` | AWS secret access key | `your-aws-secret-key` |
| `AWS_S3_BUCKET` | S3 bucket name for file uploads | `chillconnect-uploads` |

### 🔍 Security & Monitoring

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `SNYK_TOKEN` | Snyk security scanning token | `your-snyk-token` |
| `SENTRY_DSN` | Sentry error monitoring DSN | `https://your-sentry-dsn` |
| `LHCI_GITHUB_APP_TOKEN` | Lighthouse CI GitHub app token | `your-lhci-token` |

### 💬 Notifications

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `SLACK_WEBHOOK_URL` | Slack webhook for CI/CD notifications | `https://hooks.slack.com/services/...` |

## Setup Instructions

### 1. GitHub Repository Settings

1. Go to your repository on GitHub
2. Click on **Settings** tab
3. Click on **Secrets and variables** → **Actions**
4. Click **New repository secret** for each secret above

### 2. Environment-Specific Secrets

Some secrets are environment-specific and should be set accordingly:

#### Production Secrets
- Use production API keys and endpoints
- Set `NODE_ENV=production` in deployment
- Use production database connections

#### Staging Secrets
- Use staging/sandbox API keys
- Set `NODE_ENV=staging` in deployment
- Use staging database connections

### 3. Security Best Practices

- **Rotate secrets regularly** (every 90 days recommended)
- **Use different secrets for staging and production**
- **Never commit secrets to version control**
- **Use least-privilege access for service accounts**
- **Monitor secret usage and access logs**

### 4. Testing Secrets Setup

You can test if secrets are properly configured by:

1. Running the CI/CD pipeline
2. Checking deployment logs for missing environment variables
3. Running health checks on deployed services

## Emergency Procedures

### If Secrets Are Compromised

1. **Immediately rotate all affected secrets**
2. **Update secrets in GitHub repository**
3. **Redeploy all services**
4. **Monitor for unauthorized access**
5. **Notify team members**

### If Deployment Fails

1. Check GitHub Actions logs for missing secrets
2. Verify secret names match exactly (case-sensitive)
3. Ensure secrets have proper permissions
4. Contact platform support if needed

## Troubleshooting

### Common Issues

1. **Secret name typos** - Ensure exact match with workflow files
2. **Missing secrets** - Check all required secrets are set
3. **Wrong values** - Verify secret values are correct
4. **Permissions** - Ensure service accounts have proper access

### Getting Help

- Check GitHub Actions logs for specific error messages
- Verify secret names in workflow files match repository secrets
- Contact DevOps team for assistance with sensitive secrets