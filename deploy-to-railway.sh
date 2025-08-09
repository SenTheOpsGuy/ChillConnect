#!/bin/bash
set -e

echo "🚀 Deploying ChillConnect Backend to Railway"
echo "============================================="

# Check if we're in the right directory
if [ ! -f "backend/package.json" ]; then
    echo "❌ Error: Please run this from the ChillConnect root directory"
    exit 1
fi

cd backend

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "📦 Installing Railway CLI..."
    npm install -g @railway/cli
fi

# Login to Railway (will open browser for authentication)
echo "🔑 Logging into Railway..."
echo "This will open your browser for authentication."
read -p "Press Enter to continue..."
railway login

# Create new Railway project
echo "🏗️  Creating new Railway project..."
railway create

# Add environment variables
echo "⚙️  Setting environment variables..."

# Create production environment variables
railway variables set DATABASE_URL="postgresql://postgres:$(openssl rand -base64 32 | tr -d '=' | head -c 32)@postgres:5432/chillconnect"
railway variables set JWT_SECRET="$(openssl rand -base64 64 | tr -d '=' | head -c 64)"
railway variables set JWT_EXPIRES_IN="7d"
railway variables set PORT="5000"
railway variables set NODE_ENV="production"
railway variables set FRONTEND_URL="https://chillconnect.in"
railway variables set CORS_ORIGIN="https://chillconnect.in,http://localhost:3000"
railway variables set SUPER_ADMIN_EMAIL="admin@chillconnect.in"
railway variables set SUPER_ADMIN_PASSWORD="ChillConnect2024Admin"
railway variables set BREVO_API_KEY="xkeysib-placeholder"
railway variables set FROM_EMAIL="noreply@chillconnect.in"
railway variables set FROM_NAME="ChillConnect"
railway variables set PAYPAL_MODE="sandbox"
railway variables set PAYPAL_CLIENT_ID="placeholder"
railway variables set PAYPAL_CLIENT_SECRET="placeholder"
railway variables set TOKEN_VALUE_INR="100"
railway variables set MIN_TOKEN_PURCHASE="10"
railway variables set BCRYPT_ROUNDS="12"
railway variables set RATE_LIMIT_WINDOW_MS="900000"
railway variables set RATE_LIMIT_MAX_REQUESTS="100"

# Add PostgreSQL database
echo "🗄️  Adding PostgreSQL database..."
railway add postgresql

# Wait for database to be ready
echo "⏱️  Waiting for database to be ready..."
sleep 10

# Update schema for PostgreSQL
echo "🔄 Updating schema for PostgreSQL..."
cat > prisma/schema.prisma << 'EOL'
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id          String   @id @default(uuid())
  email       String   @unique
  password    String
  role        String   @default("USER")
  isVerified  Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  profile     Profile?
  otps        OTP[]
  bookingsAsSeeker   Booking[] @relation("SeekerBookings")
  bookingsAsProvider Booking[] @relation("ProviderBookings")
  sentMessages     Message[] @relation("SentMessages")
  receivedMessages Message[] @relation("ReceivedMessages")
  tokenTransactions TokenTransaction[]
  walletBalance     Int @default(0)
  
  @@map("users")
}

model Profile {
  id          String   @id @default(uuid())
  userId      String   @unique
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  firstName   String?
  lastName    String?
  displayName String?
  age         Int?
  phoneNumber String?
  location    String?
  bio         String?
  profilePhoto String?
  
  isProvider       Boolean @default(false)
  verificationStatus String @default("PENDING")
  services         String?
  hourlyRate       Int?
  availability     String?
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@map("profiles")
}

model OTP {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  code      String
  type      String
  expiresAt DateTime
  verified  Boolean  @default(false)
  attempts  Int      @default(0)
  createdAt DateTime @default(now())
  
  @@map("otps")
}

model Booking {
  id          String   @id @default(uuid())
  seekerId    String
  providerId  String
  seeker      User     @relation("SeekerBookings", fields: [seekerId], references: [id])
  provider    User     @relation("ProviderBookings", fields: [providerId], references: [id])
  
  serviceType String
  status      String @default("PENDING")
  
  scheduledAt DateTime
  duration    Int
  location    String?
  
  tokenAmount Int
  escrowHeld  Boolean  @default(false)
  
  chatId      String?  @unique
  chat        Chat?    @relation(fields: [chatId], references: [id])
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@map("bookings")
}

model Chat {
  id          String    @id @default(uuid())
  participantIds String
  messages    Message[]
  booking     Booking?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  @@map("chats")
}

model Message {
  id         String   @id @default(uuid())
  chatId     String
  chat       Chat     @relation(fields: [chatId], references: [id], onDelete: Cascade)
  
  senderId   String
  receiverId String
  sender     User     @relation("SentMessages", fields: [senderId], references: [id])
  receiver   User     @relation("ReceivedMessages", fields: [receiverId], references: [id])
  
  content    String
  type       String @default("TEXT")
  fileUrl    String?
  
  isRead     Boolean  @default(false)
  readAt     DateTime?
  
  createdAt  DateTime @default(now())
  
  @@map("messages")
}

model TokenTransaction {
  id            String   @id @default(uuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id])
  
  type          String
  amount        Int
  valueInr      Int
  status        String @default("PENDING")
  
  paymentId     String?
  paymentMethod String?
  bookingId     String?
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@map("token_transactions")
}
EOL

# Deploy to Railway
echo "🚀 Deploying to Railway..."
railway up

# Run database migration
echo "📊 Running database migrations..."
railway run npx prisma migrate deploy

# Generate Prisma client
echo "🔧 Generating Prisma client..."
railway run npx prisma generate

echo ""
echo "✅ Deployment completed!"
echo ""
echo "🌐 Your backend is now deployed!"
echo "📋 Next steps:"
echo "1. Note down your Railway app URL"
echo "2. Update the frontend .env.production with the Railway URL"
echo "3. Rebuild and redeploy the frontend"
echo ""
echo "🔍 To get your app URL, run:"
echo "railway status"