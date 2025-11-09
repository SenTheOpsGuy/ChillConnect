#!/bin/bash

echo "🚀 ChillConnect Local Setup"
echo "=========================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if PostgreSQL is running
echo "📊 Checking PostgreSQL..."
if ! pg_isready &> /dev/null; then
    echo -e "${YELLOW}⚠️  PostgreSQL is not running. Please start PostgreSQL first.${NC}"
    echo "   macOS: brew services start postgresql"
    echo "   Linux: sudo systemctl start postgresql"
    exit 1
fi
echo -e "${GREEN}✓ PostgreSQL is running${NC}"

# Backend setup
echo ""
echo "🔧 Setting up Backend..."
cd backend

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << 'EOF'
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/chillconnect_dev"

# JWT Secret
JWT_SECRET="super-secret-jwt-key-for-development-only-change-in-production"
JWT_EXPIRES_IN="7d"

# Server Configuration
PORT=5000
NODE_ENV="development"

# AWS Configuration (Mock/Development)
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="mock-access-key"
AWS_SECRET_ACCESS_KEY="mock-secret-key"

# AWS S3
S3_BUCKET_NAME="chillconnect-dev-uploads"
S3_REGION="us-east-1"

# AWS SES (Email)
SES_REGION="us-east-1"
FROM_EMAIL="noreply@chillconnect.local"

# AWS SNS (SMS)
SNS_REGION="us-east-1"

# PayPal Configuration
PAYPAL_MODE="sandbox"
PAYPAL_CLIENT_ID="mock-paypal-client-id"
PAYPAL_CLIENT_SECRET="mock-paypal-secret"

# Twilio (Alternative SMS provider)
TWILIO_ACCOUNT_SID="mock-twilio-sid"
TWILIO_AUTH_TOKEN="mock-twilio-token"
TWILIO_PHONE_NUMBER="+1234567890"

# Security
BCRYPT_ROUNDS=10
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Token System
TOKEN_VALUE_INR=100
MIN_TOKEN_PURCHASE=10

# Frontend URL (for CORS)
FRONTEND_URL="http://localhost:3000"
EOF
    echo -e "${GREEN}✓ .env file created${NC}"
else
    echo -e "${GREEN}✓ .env file already exists${NC}"
fi

# Install backend dependencies
echo "📦 Installing backend dependencies..."
npm install

# Setup database
echo "🗄️  Setting up database..."
createdb chillconnect_dev 2>/dev/null || echo "Database already exists"

# Run migrations
echo "🔄 Running database migrations..."
npx prisma migrate dev

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Seed database with test accounts
echo "🌱 Seeding database with test accounts..."
node prisma/seed.js

cd ..

# Frontend setup
echo ""
echo "🎨 Setting up Frontend..."
cd frontend

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating frontend .env file..."
    cat > .env << 'EOF'
VITE_API_BASE_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_NODE_ENV=development
EOF
    echo -e "${GREEN}✓ Frontend .env file created${NC}"
else
    echo -e "${GREEN}✓ Frontend .env file already exists${NC}"
fi

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
npm install

cd ..

echo ""
echo -e "${GREEN}✨ Setup complete!${NC}"
echo ""
echo "📋 Next steps:"
echo "   1. Start backend:  cd backend && npm run dev"
echo "   2. Start frontend: cd frontend && npm run dev"
echo ""
echo "🔐 Test Account Credentials:"
echo "   See TEST_ACCOUNTS.md for all credentials"
