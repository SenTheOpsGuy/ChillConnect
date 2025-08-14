#!/bin/bash

# ChillConnect GitHub Secrets Setup Script
# This script sets up all required GitHub secrets for the CI/CD pipeline

set -e

echo "🔐 ChillConnect GitHub Secrets Setup"
echo "===================================="

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI is not installed. Please install it first:"
    echo "   macOS: brew install gh"
    echo "   Linux: https://github.com/cli/cli/blob/trunk/docs/install_linux.md"
    echo "   Windows: https://github.com/cli/cli/releases"
    exit 1
fi

# Check if user is logged in
if ! gh auth status &> /dev/null; then
    echo "🔑 Please login to GitHub CLI first:"
    echo "   gh auth login"
    exit 1
fi

echo "✅ GitHub CLI is ready"
echo ""

# Function to set secret with confirmation
set_secret() {
    local secret_name=$1
    local description=$2
    local example_value=$3
    
    echo "📝 Setting secret: $secret_name"
    echo "   Description: $description"
    echo "   Example: $example_value"
    echo ""
    
    read -p "Enter value for $secret_name (or 'skip' to skip): " secret_value
    
    if [ "$secret_value" = "skip" ]; then
        echo "⏭️  Skipped $secret_name"
        echo ""
        return
    fi
    
    if [ -z "$secret_value" ]; then
        echo "⚠️  Empty value provided for $secret_name"
        echo ""
        return
    fi
    
    # Set the secret
    echo "$secret_value" | gh secret set "$secret_name"
    echo "✅ Set $secret_name"
    echo ""
}

echo "🚀 Starting GitHub Secrets setup..."
echo "You can type 'skip' for any secret to skip it"
echo ""

# Authentication & Security
echo "🔐 AUTHENTICATION & SECURITY"
echo "=============================="
set_secret "JWT_SECRET" "Secret key for JWT token signing" "your-super-long-random-jwt-secret-key-here"
set_secret "ADMIN_CHANGE_PASSWORD" "Password for admin operations" "SuperSecureAdminPassword123!"

# Database
echo "🗄️  DATABASE"
echo "============="
set_secret "DATABASE_URL" "Production database connection string" "postgresql://user:pass@host:5432/db"
set_secret "STAGING_DATABASE_URL" "Staging database connection string" "postgresql://user:pass@staging-host:5432/db"

# Netlify (Frontend)
echo "🌐 NETLIFY (FRONTEND)"
echo "===================="
set_secret "NETLIFY_AUTH_TOKEN" "Netlify authentication token" "your-netlify-auth-token"
set_secret "PROD_NETLIFY_SITE_ID" "Production Netlify site ID" "your-production-site-id"
set_secret "STAGING_NETLIFY_SITE_ID" "Staging Netlify site ID" "your-staging-site-id"

# Railway (Backend)
echo "🚂 RAILWAY (BACKEND)"
echo "==================="
set_secret "RAILWAY_TOKEN" "Railway CLI authentication token" "your-railway-token"
set_secret "RAILWAY_PROD_PROJECT" "Production Railway project ID" "your-prod-project-id"
set_secret "RAILWAY_PROD_SERVICE" "Production Railway service ID" "your-prod-service-id"
set_secret "RAILWAY_STAGING_PROJECT" "Staging Railway project ID" "your-staging-project-id"
set_secret "RAILWAY_STAGING_SERVICE" "Staging Railway service ID" "your-staging-service-id"

# API Endpoints
echo "🔗 API ENDPOINTS"
echo "================"
set_secret "PROD_API_BASE_URL" "Production API base URL" "https://api.chillconnect.com/api"
set_secret "STAGING_API_BASE_URL" "Staging API base URL" "https://staging-api.chillconnect.com/api"
set_secret "PROD_SOCKET_URL" "Production Socket.IO URL" "https://api.chillconnect.com"
set_secret "STAGING_SOCKET_URL" "Staging Socket.IO URL" "https://staging-api.chillconnect.com"

# Email Service (Brevo)
echo "📧 EMAIL SERVICE (BREVO)"
echo "========================"
set_secret "BREVO_API_KEY" "Brevo email service API key" "your-brevo-api-key"
set_secret "BREVO_SENDER_EMAIL" "Sender email address" "noreply@chillconnect.com"
set_secret "BREVO_SENDER_NAME" "Sender name" "ChillConnect"

# SMS Service (Twilio)
echo "📱 SMS SERVICE (TWILIO)"
echo "======================="
set_secret "TWILIO_ACCOUNT_SID" "Twilio account SID" "your-twilio-account-sid"
set_secret "TWILIO_AUTH_TOKEN" "Twilio authentication token" "your-twilio-auth-token"
set_secret "TWILIO_PHONE_NUMBER" "Twilio phone number" "+1234567890"

# Payment Service (PayPal)
echo "💳 PAYMENT SERVICE (PAYPAL)"
echo "==========================="
set_secret "PAYPAL_CLIENT_ID" "PayPal client ID" "your-paypal-client-id"
set_secret "PAYPAL_CLIENT_SECRET" "PayPal client secret" "your-paypal-client-secret"

# AWS Services
echo "☁️  AWS SERVICES"
echo "==============="
set_secret "AWS_ACCESS_KEY_ID" "AWS access key ID" "AKIA..."
set_secret "AWS_SECRET_ACCESS_KEY" "AWS secret access key" "your-aws-secret-key"
set_secret "AWS_S3_BUCKET" "S3 bucket name for file uploads" "chillconnect-uploads"

# Security & Monitoring
echo "🔍 SECURITY & MONITORING"
echo "========================"
set_secret "SNYK_TOKEN" "Snyk security scanning token" "your-snyk-token"
set_secret "SENTRY_DSN" "Sentry error monitoring DSN" "https://your-sentry-dsn"
set_secret "LHCI_GITHUB_APP_TOKEN" "Lighthouse CI GitHub app token" "your-lhci-token"

# Notifications
echo "💬 NOTIFICATIONS"
echo "================"
set_secret "SLACK_WEBHOOK_URL" "Slack webhook for CI/CD notifications" "https://hooks.slack.com/services/..."

echo ""
echo "🎉 GitHub Secrets setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Verify secrets in GitHub repository settings"
echo "2. Test the CI/CD pipeline with a test commit"
echo "3. Check deployment workflows are working"
echo ""
echo "🔗 Useful commands:"
echo "   gh secret list                    # List all secrets"
echo "   gh secret set SECRET_NAME        # Set individual secret"
echo "   gh secret delete SECRET_NAME     # Delete a secret"
echo ""
echo "📖 For more information, see: .github/SECRETS.md"