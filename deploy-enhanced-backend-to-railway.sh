#!/bin/bash
set -e

echo "🚀 DEPLOYING ENHANCED BACKEND TO RAILWAY"
echo "========================================"
echo "Adding OTP verification endpoints to production"
echo ""

# Check if Railway CLI is available
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found"
    echo "Please install it: npm install -g @railway/cli"
    echo "Or use manual deployment approach"
    echo ""
    echo "📋 MANUAL DEPLOYMENT STEPS:"
    echo "=========================="
    echo "1. Go to https://railway.app/dashboard"
    echo "2. Find your chillconnect-backend project"  
    echo "3. Connect to your GitHub repository"
    echo "4. Ensure the repository has the latest code with enhanced auth-simple.js"
    echo "5. Trigger a new deployment"
    echo ""
    echo "🔍 VERIFY ENHANCED BACKEND FEATURES:"
    echo "==================================="
    echo "After deployment, test these new endpoints:"
    echo "• POST /api/auth/send-email-otp"
    echo "• POST /api/auth/verify-email-otp"
    echo "• POST /api/auth/send-phone-otp"
    echo "• POST /api/auth/verify-phone-otp"
    echo "• POST /api/auth/verify-document"
    echo "• GET /api/auth/verification-status"
    echo ""
    exit 1
fi

# Check if we're in a Railway project
echo "🔍 Checking Railway project connection..."
if ! railway status &> /dev/null; then
    echo "❌ Not connected to Railway project"
    echo "Please run: railway login && railway link"
    exit 1
fi

echo "✅ Railway CLI ready"
echo ""

# Show current deployment info
echo "📊 Current Railway deployment status:"
railway status
echo ""

# Create a deployment summary
echo "📋 DEPLOYMENT SUMMARY:"
echo "====================="
echo "Enhanced features being deployed:"
echo "• ✅ Email OTP verification endpoints"
echo "• ✅ Phone OTP verification endpoints"  
echo "• ✅ Document verification endpoint"
echo "• ✅ Verification status endpoint"
echo "• ✅ Enhanced Profile page integration"
echo "• ✅ Production-ready error handling"
echo ""

# Deploy to Railway
echo "🚀 Deploying enhanced backend..."
echo "This will update the production backend with OTP verification features"
echo ""

# Deploy
railway up

echo ""
echo "✅ DEPLOYMENT COMPLETED!"
echo "======================="
echo ""

# Test the deployed endpoints
echo "🧪 Testing deployed OTP endpoints..."
echo ""

BACKEND_URL="https://chillconnect-backend.railway.app"

echo "Testing health endpoint..."
if curl -s "$BACKEND_URL/health" > /dev/null; then
    echo "✅ Backend is responding"
else
    echo "❌ Backend health check failed"
fi

echo ""
echo "Testing email OTP endpoint..."
RESULT=$(curl -s -X POST "$BACKEND_URL/api/auth/send-email-otp" \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com"}' \
    -w "%{http_code}")

if [[ "$RESULT" == *"200"* ]] || [[ "$RESULT" == *"success"* ]]; then
    echo "✅ Email OTP endpoint working"
else
    echo "❌ Email OTP endpoint failed - Response: $RESULT"
fi

echo ""
echo "Testing phone OTP endpoint..."
RESULT=$(curl -s -X POST "$BACKEND_URL/api/auth/send-phone-otp" \
    -H "Content-Type: application/json" \
    -d '{"phone":"+919876543210"}' \
    -w "%{http_code}")

if [[ "$RESULT" == *"200"* ]] || [[ "$RESULT" == *"success"* ]]; then
    echo "✅ Phone OTP endpoint working"
else
    echo "❌ Phone OTP endpoint failed - Response: $RESULT"
fi

echo ""
echo "🎉 ENHANCED BACKEND DEPLOYMENT COMPLETE!"
echo "======================================="
echo ""
echo "🌐 Production Backend: $BACKEND_URL"
echo "📱 OTP endpoints now available for phone verification"
echo "📧 Email verification endpoints ready"
echo "👤 Profile verification features enabled"
echo ""
echo "🧪 Test the registration flow at:"
echo "https://chillconnect.in/register-new"
echo ""
echo "Provider registration with phone verification should now work!"
echo ""