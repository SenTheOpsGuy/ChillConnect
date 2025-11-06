-- Manual Migration SQL for Withdrawal System
-- Run this if Prisma migrations fail
-- Created: 2025-11-06

-- Create enums
DO $$ BEGIN
    CREATE TYPE "WithdrawalStatus" AS ENUM ('PENDING', 'APPROVED', 'PROCESSING', 'COMPLETED', 'REJECTED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "PaymentMethodType" AS ENUM ('PAYPAL', 'BANK_TRANSFER', 'UPI');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create payment_methods table
CREATE TABLE IF NOT EXISTS "payment_methods" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" "PaymentMethodType" NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,

    -- PayPal fields
    "paypalEmail" TEXT,

    -- Bank Transfer fields
    "accountHolderName" TEXT,
    "accountNumber" TEXT,
    "ifscCode" TEXT,
    "bankName" TEXT,
    "branchName" TEXT,

    -- UPI fields
    "upiId" TEXT,

    -- Metadata
    "nickname" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_methods_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create indexes for payment_methods
CREATE INDEX IF NOT EXISTS "payment_methods_userId_idx" ON "payment_methods"("userId");
CREATE INDEX IF NOT EXISTS "payment_methods_type_idx" ON "payment_methods"("type");

-- Create withdrawal_requests table
CREATE TABLE IF NOT EXISTS "withdrawal_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestNumber" SERIAL UNIQUE,
    "userId" TEXT NOT NULL,
    "amountTokens" INTEGER NOT NULL,
    "amountInr" INTEGER NOT NULL,
    "processingFee" INTEGER NOT NULL DEFAULT 0,
    "netAmount" INTEGER NOT NULL,
    "paymentMethodId" TEXT NOT NULL,
    "status" "WithdrawalStatus" NOT NULL DEFAULT 'PENDING',

    -- Admin approval
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,

    -- Processing
    "processedAt" TIMESTAMP(3),
    "transactionId" TEXT,

    -- Notes
    "providerNotes" TEXT,
    "adminNotes" TEXT,

    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "withdrawal_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "withdrawal_requests_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "payment_methods"("id") ON UPDATE CASCADE,
    CONSTRAINT "withdrawal_requests_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "users"("id") ON UPDATE CASCADE
);

-- Create indexes for withdrawal_requests
CREATE INDEX IF NOT EXISTS "withdrawal_requests_userId_idx" ON "withdrawal_requests"("userId");
CREATE INDEX IF NOT EXISTS "withdrawal_requests_status_idx" ON "withdrawal_requests"("status");
CREATE INDEX IF NOT EXISTS "withdrawal_requests_requestNumber_idx" ON "withdrawal_requests"("requestNumber");

-- Update TokenWallet table if needed (add new tracking fields if they don't exist)
DO $$ BEGIN
    ALTER TABLE "token_wallets" ADD COLUMN IF NOT EXISTS "escrowBalance" INTEGER NOT NULL DEFAULT 0;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Add WITHDRAWAL to TokenTransactionType enum if not present
DO $$ BEGIN
    ALTER TYPE "TokenTransactionType" ADD VALUE IF NOT EXISTS 'WITHDRAWAL';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Grant permissions (adjust as needed for your database setup)
-- GRANT ALL PRIVILEGES ON TABLE payment_methods TO your_db_user;
-- GRANT ALL PRIVILEGES ON TABLE withdrawal_requests TO your_db_user;
-- GRANT USAGE, SELECT ON SEQUENCE withdrawal_requests_requestNumber_seq TO your_db_user;

COMMIT;
