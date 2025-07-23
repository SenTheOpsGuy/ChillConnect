#!/bin/bash

# ChillConnect Backend Deployment Script
set -e

echo "🚀 Starting ChillConnect Backend Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

print_status "Docker and Docker Compose are available ✓"

# Check if .env file exists
if [ ! -f .env ]; then
    print_warning ".env file not found. Creating from .env.production template..."
    cp .env.production .env
    print_warning "Please edit .env file with your actual configuration values before proceeding."
    print_warning "Press Enter when you've updated the .env file, or Ctrl+C to exit..."
    read -r
fi

print_status "Environment configuration found ✓"

# Stop any existing containers
print_status "Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down 2>/dev/null || true

# Build the application
print_status "Building Docker images..."
docker-compose -f docker-compose.prod.yml build --no-cache

# Start the database first
print_status "Starting database..."
docker-compose -f docker-compose.prod.yml up -d db redis

# Wait for database to be ready
print_status "Waiting for database to be ready..."
sleep 10

# Run database migrations
print_status "Running database migrations..."
docker-compose -f docker-compose.prod.yml run --rm app npm run db:migrate

# Seed the database
print_status "Seeding database with initial data..."
docker-compose -f docker-compose.prod.yml run --rm app npm run seed

# Start the application
print_status "Starting application server..."
docker-compose -f docker-compose.prod.yml up -d app

# Wait for application to start
print_status "Waiting for application to start..."
sleep 15

# Check health
print_status "Checking application health..."
if curl -f http://localhost:5000/health > /dev/null 2>&1; then
    print_success "Application is healthy and running! ✓"
    print_success "Backend is accessible at: http://localhost:5000"
    print_success "Health check: http://localhost:5000/health"
else
    print_error "Application health check failed!"
    print_status "Checking logs..."
    docker-compose -f docker-compose.prod.yml logs app
    exit 1
fi

# Show running containers
print_status "Running containers:"
docker-compose -f docker-compose.prod.yml ps

print_success "🎉 Deployment completed successfully!"
print_status "To view logs: docker-compose -f docker-compose.prod.yml logs -f"
print_status "To stop: docker-compose -f docker-compose.prod.yml down"

echo ""
echo "📋 Next steps:"
echo "1. Update DNS to point to this server"
echo "2. Set up SSL/TLS certificate (e.g., with Nginx + Let's Encrypt)"
echo "3. Configure external services (AWS, PayPal)"
echo "4. Set up monitoring and backups"
echo "5. Test all functionality with frontend"