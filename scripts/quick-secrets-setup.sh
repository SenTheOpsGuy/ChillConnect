#!/bin/bash

# Quick GitHub Secrets Setup for Development/Testing
# This script sets up basic secrets with example values for testing the pipeline

set -e

echo "⚡ Quick GitHub Secrets Setup for Development"
echo "============================================="

# Check if GitHub CLI is installed and authenticated
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI is not installed. Install with: brew install gh"
    exit 1
fi

if ! gh auth status &> /dev/null; then
    echo "❌ Please login to GitHub CLI first: gh auth login"
    exit 1
fi

echo "🔧 Setting up development secrets..."

# Basic secrets for CI/CD testing
echo "supersecretjwtkeythatisverylongandcomplex12345" | gh secret set JWT_SECRET
echo "TestAdminPassword123!" | gh secret set ADMIN_CHANGE_PASSWORD

# Database (you'll need to replace with actual values)
echo "postgresql://user:pass@localhost:5432/chillconnect_test" | gh secret set STAGING_DATABASE_URL

# Deployment tokens (replace with actual tokens)
echo "your-netlify-auth-token-here" | gh secret set NETLIFY_AUTH_TOKEN
echo "your-staging-netlify-site-id" | gh secret set STAGING_NETLIFY_SITE_ID
echo "your-prod-netlify-site-id" | gh secret set PROD_NETLIFY_SITE_ID

echo "your-railway-token-here" | gh secret set RAILWAY_TOKEN
echo "your-staging-project-id" | gh secret set RAILWAY_STAGING_PROJECT
echo "your-staging-service-id" | gh secret set RAILWAY_STAGING_SERVICE
echo "your-prod-project-id" | gh secret set RAILWAY_PROD_PROJECT
echo "your-prod-service-id" | gh secret set RAILWAY_PROD_SERVICE

# API endpoints
echo "https://staging-api.chillconnect.com/api" | gh secret set STAGING_API_BASE_URL
echo "https://api.chillconnect.com/api" | gh secret set PROD_API_BASE_URL
echo "https://staging-api.chillconnect.com" | gh secret set STAGING_SOCKET_URL
echo "https://api.chillconnect.com" | gh secret set PROD_SOCKET_URL

# External service secrets (replace with actual values)
echo "your-brevo-api-key" | gh secret set BREVO_API_KEY
echo "noreply@chillconnect.com" | gh secret set BREVO_SENDER_EMAIL
echo "ChillConnect" | gh secret set BREVO_SENDER_NAME

echo "your-twilio-account-sid" | gh secret set TWILIO_ACCOUNT_SID
echo "your-twilio-auth-token" | gh secret set TWILIO_AUTH_TOKEN
echo "+1234567890" | gh secret set TWILIO_PHONE_NUMBER

echo "your-paypal-client-id" | gh secret set PAYPAL_CLIENT_ID
echo "your-paypal-client-secret" | gh secret set PAYPAL_CLIENT_SECRET

echo "your-aws-access-key-id" | gh secret set AWS_ACCESS_KEY_ID
echo "your-aws-secret-access-key" | gh secret set AWS_SECRET_ACCESS_KEY
echo "chillconnect-uploads" | gh secret set AWS_S3_BUCKET

# Optional monitoring secrets
echo "your-snyk-token" | gh secret set SNYK_TOKEN
echo "your-sentry-dsn" | gh secret set SENTRY_DSN
echo "your-slack-webhook-url" | gh secret set SLACK_WEBHOOK_URL

echo ""
echo "✅ Basic secrets configured!"
echo ""
echo "⚠️  IMPORTANT: Replace placeholder values with actual credentials:"
echo "   - Netlify auth token and site IDs"
echo "   - Railway token and project/service IDs"
echo "   - External service API keys (Brevo, Twilio, PayPal, AWS)"
echo ""
echo "🔧 Update secrets individually:"
echo "   gh secret set SECRET_NAME"
echo ""
echo "📋 List all secrets:"
echo "   gh secret list"