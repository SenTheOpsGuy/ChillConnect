-- Manual Migration SQL for OTP Table
-- Creates the otps table required by the OTP model
-- Created: 2025-11-07

-- Create the otps table to match the OTP model in schema.prisma
CREATE TABLE IF NOT EXISTS "otps" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "otps_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "otps_userId_idx" ON "otps"("userId");
CREATE INDEX IF NOT EXISTS "otps_type_idx" ON "otps"("type");
CREATE INDEX IF NOT EXISTS "otps_expiresAt_idx" ON "otps"("expiresAt");
CREATE INDEX IF NOT EXISTS "otps_verified_idx" ON "otps"("verified");

COMMIT;