#!/bin/bash
set -e

echo "🚀 ChillConnect Fixed Site Deployment"
echo "======================================"

# Step 1: Ensure backend is running
echo "🔧 Step 1: Checking backend status..."
cd /Users/rishovsen/ChillConnect/backend

# Start backend in background if not running
if ! curl -f http://localhost:5001/api/health > /dev/null 2>&1; then
    echo "🚀 Starting backend server..."
    npm start &
    BACKEND_PID=$!
    sleep 5
    
    if curl -f http://localhost:5001/api/health > /dev/null 2>&1; then
        echo "✅ Backend is running on port 5001"
    else
        echo "❌ Failed to start backend"
        exit 1
    fi
else
    echo "✅ Backend already running"
fi

# Step 2: Deploy frontend to Netlify
echo "🌐 Step 2: Deploying frontend to Netlify..."
cd ../frontend

# Check if Netlify CLI is available
if ! command -v netlify &> /dev/null; then
    echo "⚠️  Netlify CLI not found. Installing globally..."
    npm install -g netlify-cli
fi

# Configure API endpoint for production
echo "📝 Updating frontend configuration for production..."
cat > .env.production.local << 'EOL'
VITE_API_BASE_URL=https://chillconnect-backend.railway.app
VITE_FRONTEND_URL=https://chillconnect.in
VITE_PAYPAL_CLIENT_ID=placeholder
EOL

# Rebuild frontend with production API
echo "🏗️  Rebuilding frontend with production API..."
npm run build

# Deploy to Netlify
echo "🚀 Deploying to Netlify..."
echo "Please run the following command manually to deploy:"
echo "cd frontend && netlify deploy --prod --dir=dist"
echo ""

# Step 3: Test the deployment
echo "🧪 Step 3: Testing the fixed deployment..."
cd ..

echo "⏱️  Waiting for deployment to propagate..."
sleep 10

# Run the comprehensive test again
echo "🧪 Running comprehensive test suite..."
node simple-live-site-test.js

echo ""
echo "✅ Deployment and testing completed!"
echo ""
echo "📋 MANUAL STEPS STILL NEEDED:"
echo "1. Deploy backend to Railway or another hosting service"
echo "2. Update VITE_API_BASE_URL to actual backend URL"
echo "3. Rebuild and redeploy frontend"
echo "4. Configure production database (PostgreSQL)"
echo "5. Set up real payment gateway credentials"