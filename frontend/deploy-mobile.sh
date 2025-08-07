#!/bin/bash

# ChillConnect Mobile Deployment Script
# This script handles building and deploying the mobile app

set -e  # Exit on any error

echo "🚀 ChillConnect Mobile Deployment"
echo "=================================="

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

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the frontend directory"
    exit 1
fi

# Parse command line arguments
PLATFORM=""
BUILD_TYPE="debug"
OPEN_IDE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --platform)
            PLATFORM="$2"
            shift 2
            ;;
        --release)
            BUILD_TYPE="release"
            shift
            ;;
        --open)
            OPEN_IDE=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --platform PLATFORM  Specify platform (android|ios|both)"
            echo "  --release            Build for release (default: debug)"
            echo "  --open               Open IDE after build"
            echo "  -h, --help           Show this help message"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# If no platform specified, ask user
if [ -z "$PLATFORM" ]; then
    echo "Which platform would you like to build for?"
    echo "1) Android"
    echo "2) iOS"
    echo "3) Both"
    echo -n "Enter your choice (1-3): "
    read choice
    
    case $choice in
        1) PLATFORM="android" ;;
        2) PLATFORM="ios" ;;
        3) PLATFORM="both" ;;
        *) 
            print_error "Invalid choice"
            exit 1
            ;;
    esac
fi

print_status "Starting deployment for platform: $PLATFORM"
print_status "Build type: $BUILD_TYPE"

# Step 1: Install dependencies
print_status "Installing dependencies..."
npm install
if [ $? -eq 0 ]; then
    print_success "Dependencies installed"
else
    print_error "Failed to install dependencies"
    exit 1
fi

# Step 2: Build the web app
print_status "Building React application..."
npm run build
if [ $? -eq 0 ]; then
    print_success "React app built successfully"
else
    print_error "Failed to build React app"
    exit 1
fi

# Step 3: Sync with Capacitor
print_status "Syncing with Capacitor..."

deploy_android() {
    print_status "Syncing Android project..."
    npx cap sync android
    if [ $? -eq 0 ]; then
        print_success "Android sync completed"
        
        if [ "$OPEN_IDE" = true ]; then
            print_status "Opening Android Studio..."
            npx cap open android
        else
            print_status "To open Android Studio, run: npx cap open android"
        fi
    else
        print_error "Android sync failed"
        return 1
    fi
}

deploy_ios() {
    print_status "Syncing iOS project..."
    
    # Check if CocoaPods is installed
    if ! command -v pod &> /dev/null; then
        print_warning "CocoaPods not found. Installing..."
        sudo gem install cocoapods
    fi
    
    npx cap sync ios
    if [ $? -eq 0 ]; then
        print_success "iOS sync completed"
        
        if [ "$OPEN_IDE" = true ]; then
            print_status "Opening Xcode..."
            npx cap open ios
        else
            print_status "To open Xcode, run: npx cap open ios"
        fi
    else
        print_error "iOS sync failed"
        return 1
    fi
}

# Deploy based on platform choice
case $PLATFORM in
    "android")
        deploy_android
        ;;
    "ios")
        deploy_ios
        ;;
    "both")
        deploy_android
        if [ $? -eq 0 ]; then
            deploy_ios
        fi
        ;;
esac

# Step 4: Display next steps
echo ""
print_success "Mobile deployment completed!"
echo ""
echo "📱 Next Steps:"
echo "=============="
echo ""

if [ "$PLATFORM" = "android" ] || [ "$PLATFORM" = "both" ]; then
    echo "🤖 Android:"
    echo "  1. Open Android Studio: npx cap open android"
    echo "  2. Connect device or start emulator"
    echo "  3. Click 'Run' to test the app"
    echo "  4. For release: Build > Generate Signed Bundle/APK"
    echo ""
fi

if [ "$PLATFORM" = "ios" ] || [ "$PLATFORM" = "both" ]; then
    echo "🍎 iOS:"
    echo "  1. Open Xcode: npx cap open ios"
    echo "  2. Select target device/simulator"
    echo "  3. Click 'Run' to test the app"
    echo "  4. For release: Product > Archive"
    echo ""
fi

echo "📋 App Store Submission:"
echo "  - Review app-store-metadata.md for store listings"
echo "  - Prepare screenshots using device simulators"
echo "  - Test thoroughly on physical devices"
echo "  - Submit for review following platform guidelines"
echo ""

print_status "Happy coding! 🚀"