#!/bin/bash

# Railway Deployment Test Script
# Replace YOUR_RAILWAY_URL with your actual Railway URL

RAILWAY_URL="https://web-production-[YOUR-ID].railway.app"

echo "🧪 Testing Railway Deployment"
echo "=============================="
echo "Backend URL: $RAILWAY_URL"
echo ""

echo "📊 Test 1: Health Check"
curl -s "$RAILWAY_URL/health" | jq '.' || echo "Health check failed"
echo ""

echo "📱 Test 2: Phone OTP Endpoint"
curl -s -X POST "$RAILWAY_URL/api/auth/send-phone-otp" \
  -H "Content-Type: application/json" \
  -d '{"phone":"9258221177"}' | jq '.' || echo "Phone OTP failed"
echo ""

echo "📧 Test 3: Email OTP Endpoint"  
curl -s -X POST "$RAILWAY_URL/api/auth/send-email-otp" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}' | jq '.' || echo "Email OTP failed"
echo ""

echo "👤 Test 4: User Registration"
REGISTER_RESPONSE=$(curl -s -X POST "$RAILWAY_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"password123","role":"SUPER_ADMIN","firstName":"Admin","lastName":"User"}')

echo "$REGISTER_RESPONSE" | jq '.'

# Extract token for admin test
TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.token // empty')

if [ ! -z "$TOKEN" ]; then
  echo ""
  echo "🔐 Test 5: Admin Users Endpoint"
  curl -s -H "Authorization: Bearer $TOKEN" \
    "$RAILWAY_URL/api/admin/users" | jq '.' || echo "Admin endpoint failed"
else
  echo "❌ No token received, skipping admin test"
fi

echo ""
echo "✅ Testing Complete!"
echo ""
echo "If all tests pass:"
echo "1. Update frontend .env.production with: VITE_API_BASE_URL=$RAILWAY_URL"
echo "2. Test provider registration at https://chillconnect.in/register-new"
echo "3. Test admin panel at https://chillconnect.in/admin/users"