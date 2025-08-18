#!/bin/bash
set -e

echo "🚀 Starting ChillConnect Backend..."

# Generate Prisma client if needed
echo "📦 Generating Prisma client..."
npx prisma generate

# Run database migrations
if [ -n "$DATABASE_URL" ]; then
  echo "🗄️ Running database migrations..."
  npx prisma migrate deploy
  
  echo "👤 Creating employee user..."
  psql $DATABASE_URL -f create-employee-user.sql || echo "⚠️ User creation failed (may already exist)"
else
  echo "⚠️ No DATABASE_URL found, skipping migrations"
fi

echo "🎯 Starting application..."
exec node src/index.js