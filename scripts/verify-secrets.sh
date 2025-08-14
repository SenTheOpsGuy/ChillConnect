#!/bin/bash

# GitHub Secrets Verification Script
# Checks if all required secrets are configured

set -e

echo "🔍 Verifying GitHub Secrets Configuration"
echo "=========================================="

# Check if GitHub CLI is installed and authenticated
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI is not installed"
    exit 1
fi

if ! gh auth status &> /dev/null; then
    echo "❌ Please login to GitHub CLI first: gh auth login"
    exit 1
fi

# Required secrets list
REQUIRED_SECRETS=(
    "JWT_SECRET"
    "ADMIN_CHANGE_PASSWORD"
    "NETLIFY_AUTH_TOKEN"
    "STAGING_NETLIFY_SITE_ID"
    "PROD_NETLIFY_SITE_ID"
    "RAILWAY_TOKEN"
    "RAILWAY_STAGING_PROJECT"
    "RAILWAY_STAGING_SERVICE"
    "RAILWAY_PROD_PROJECT"
    "RAILWAY_PROD_SERVICE"
    "STAGING_API_BASE_URL"
    "PROD_API_BASE_URL"
    "STAGING_SOCKET_URL"
    "PROD_SOCKET_URL"
)

OPTIONAL_SECRETS=(
    "STAGING_DATABASE_URL"
    "DATABASE_URL"
    "BREVO_API_KEY"
    "BREVO_SENDER_EMAIL"
    "BREVO_SENDER_NAME"
    "TWILIO_ACCOUNT_SID"
    "TWILIO_AUTH_TOKEN"
    "TWILIO_PHONE_NUMBER"
    "PAYPAL_CLIENT_ID"
    "PAYPAL_CLIENT_SECRET"
    "AWS_ACCESS_KEY_ID"
    "AWS_SECRET_ACCESS_KEY"
    "AWS_S3_BUCKET"
    "SNYK_TOKEN"
    "SENTRY_DSN"
    "LHCI_GITHUB_APP_TOKEN"
    "SLACK_WEBHOOK_URL"
)

echo "📋 Getting current secrets..."
CURRENT_SECRETS=$(gh secret list --json name --jq '.[].name')

echo ""
echo "✅ REQUIRED SECRETS"
echo "==================="

missing_required=0
for secret in "${REQUIRED_SECRETS[@]}"; do
    if echo "$CURRENT_SECRETS" | grep -q "^$secret$"; then
        echo "✅ $secret"
    else
        echo "❌ $secret (MISSING - REQUIRED)"
        missing_required=$((missing_required + 1))
    fi
done

echo ""
echo "🔧 OPTIONAL SECRETS"
echo "==================="

missing_optional=0
for secret in "${OPTIONAL_SECRETS[@]}"; do
    if echo "$CURRENT_SECRETS" | grep -q "^$secret$"; then
        echo "✅ $secret"
    else
        echo "⚠️  $secret (missing - optional)"
        missing_optional=$((missing_optional + 1))
    fi
done

echo ""
echo "📊 SUMMARY"
echo "=========="
echo "Required secrets: $((${#REQUIRED_SECRETS[@]} - missing_required))/${#REQUIRED_SECRETS[@]} configured"
echo "Optional secrets: $((${#OPTIONAL_SECRETS[@]} - missing_optional))/${#OPTIONAL_SECRETS[@]} configured"

if [ $missing_required -eq 0 ]; then
    echo ""
    echo "🎉 All required secrets are configured!"
    echo "✅ Your CI/CD pipeline should work"
    
    if [ $missing_optional -gt 0 ]; then
        echo ""
        echo "💡 Consider configuring optional secrets for full functionality:"
        for secret in "${OPTIONAL_SECRETS[@]}"; do
            if ! echo "$CURRENT_SECRETS" | grep -q "^$secret$"; then
                echo "   - $secret"
            fi
        done
    fi
else
    echo ""
    echo "❌ Missing $missing_required required secrets!"
    echo "🔧 Configure missing secrets with:"
    echo "   ./scripts/setup-github-secrets.sh"
    echo "   OR"
    echo "   gh secret set SECRET_NAME"
    
    echo ""
    echo "Missing required secrets:"
    for secret in "${REQUIRED_SECRETS[@]}"; do
        if ! echo "$CURRENT_SECRETS" | grep -q "^$secret$"; then
            echo "   - $secret"
        fi
    done
    
    exit 1
fi

echo ""
echo "🔗 Useful commands:"
echo "   gh secret list                    # List all secrets"
echo "   gh secret set SECRET_NAME         # Set a secret"
echo "   gh secret delete SECRET_NAME      # Delete a secret"
echo "   ./scripts/setup-github-secrets.sh # Interactive setup"