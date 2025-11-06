#!/bin/bash
# ChillConnect Local Deployment Script
# Generated: 2025-11-06

set -e  # Exit on error

echo "🚀 ChillConnect Deployment Script"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -eq 0 ]; then
   echo -e "${YELLOW}Warning: Running as root. PostgreSQL needs to run as a non-root user.${NC}"
fi

# Step 1: Check Prerequisites
echo "📋 Step 1: Checking Prerequisites..."
command -v node >/dev/null 2>&1 || { echo -e "${RED}❌ Node.js is not installed${NC}"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo -e "${RED}❌ npm is not installed${NC}"; exit 1; }
command -v psql >/dev/null 2>&1 || { echo -e "${RED}❌ PostgreSQL client is not installed${NC}"; exit 1; }
echo -e "${GREEN}✅ Prerequisites check passed${NC}"
echo ""

# Step 2: Database Setup
echo "💾 Step 2: Setting up Database..."
echo "Checking PostgreSQL connection..."

# Try to connect to PostgreSQL
if psql -U postgres -c "SELECT 1;" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ PostgreSQL is running${NC}"

    # Create database if it doesn't exist
    echo "Creating database 'chillconnect' if it doesn't exist..."
    psql -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'chillconnect'" | grep -q 1 || \
        psql -U postgres -c "CREATE DATABASE chillconnect;"

    echo -e "${GREEN}✅ Database 'chillconnect' is ready${NC}"

    # Apply migrations
    echo "Applying database migrations..."
    if [ -f "backend/prisma/migrations/manual_withdrawal_migration.sql" ]; then
        psql -U postgres -d chillconnect -f backend/prisma/migrations/manual_withdrawal_migration.sql
        echo -e "${GREEN}✅ Migrations applied successfully${NC}"
    else
        echo -e "${YELLOW}⚠️  Manual migration SQL not found, skipping...${NC}"
    fi
else
    echo -e "${RED}❌ Cannot connect to PostgreSQL${NC}"
    echo -e "${YELLOW}Please ensure PostgreSQL is running:${NC}"
    echo "  - Linux: sudo systemctl start postgresql"
    echo "  - macOS: brew services start postgresql"
    echo "  - Windows: Check PostgreSQL service in Services"
    echo ""
    echo "Or update DATABASE_URL in backend/.env to point to your PostgreSQL instance"
    exit 1
fi
echo ""

# Step 3: Backend Setup
echo "⚙️  Step 3: Setting up Backend..."
cd backend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install
fi

# Check for .env file
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env file not found, using .env.production as template${NC}"
    cp .env.production .env
    echo -e "${YELLOW}⚠️  Please update backend/.env with your actual values${NC}"
fi

echo -e "${GREEN}✅ Backend setup complete${NC}"
cd ..
echo ""

# Step 4: Frontend Setup
echo "🎨 Step 4: Setting up Frontend..."
cd frontend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

# Check for .env file
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env file not found, creating default...${NC}"
    cat > .env << 'EOF'
VITE_API_BASE_URL=http://localhost:5000
VITE_FRONTEND_URL=http://localhost:3000
VITE_PAYPAL_CLIENT_ID=sandbox_client_id
EOF
fi

# Build frontend
echo "Building frontend for production..."
npm run build
echo -e "${GREEN}✅ Frontend built successfully${NC}"
cd ..
echo ""

# Step 5: Setup Admin User
echo "👤 Step 5: Setting up Admin User..."
echo "Admin user will be created when backend starts"
echo "Default credentials:"
echo "  Email: admin@chillconnect.com"
echo "  Password: SuperSecurePassword123!"
echo -e "${YELLOW}⚠️  Remember to change these credentials after first login!${NC}"
echo ""

# Step 6: Start Services
echo "🚀 Step 6: Starting Services..."
echo ""
echo "To start the backend server, run:"
echo "  cd backend && npm start"
echo ""
echo "To start the frontend development server, run:"
echo "  cd frontend && npm run dev"
echo ""
echo "Or to serve the built frontend from backend, the backend will serve static files."
echo ""

# Final Instructions
echo "=================================="
echo -e "${GREEN}✅ Deployment setup complete!${NC}"
echo ""
echo "📝 Next Steps:"
echo "1. Update environment variables in backend/.env"
echo "2. Start backend: cd backend && npm start"
echo "3. Start frontend: cd frontend && npm run dev (or use built version)"
echo "4. Access the application at http://localhost:3000"
echo "5. Login as admin and change default password"
echo ""
echo "📚 Documentation:"
echo "  - Deployment Guide: DEPLOYMENT_GUIDE.md"
echo "  - Testing Checklist: TESTING_CHECKLIST.md"
echo "  - Implementation Report: FINAL_IMPLEMENTATION_REPORT.md"
echo "  - Testing Report: INTEGRATION_TESTING_REPORT.md"
echo ""
echo "🎉 Happy deploying!"
