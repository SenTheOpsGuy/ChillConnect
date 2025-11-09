-- Manual Migration SQL for Leave and Roster Management System
-- Run this if Prisma migrations fail
-- Created: 2025-11-07

-- Create enums
DO $$ BEGIN
    CREATE TYPE "LeaveStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "LeaveTypeEnum" AS ENUM ('SICK', 'VACATION', 'PERSONAL', 'MATERNITY', 'PATERNITY', 'UNPAID', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create leave_types table
CREATE TABLE IF NOT EXISTS "leave_types" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" "LeaveTypeEnum" NOT NULL UNIQUE,
    "description" TEXT,
    "maxDaysPerYear" INTEGER,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT true,
    "isPaid" BOOLEAN NOT NULL DEFAULT true,
    "color" TEXT NOT NULL DEFAULT '#3B82F6',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- Create leave_requests table
CREATE TABLE IF NOT EXISTS "leave_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestNumber" SERIAL UNIQUE,
    "userId" TEXT NOT NULL,
    "leaveTypeId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "totalDays" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "LeaveStatus" NOT NULL DEFAULT 'PENDING',

    -- Approval workflow
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,

    -- Metadata
    "attachments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "adminNotes" TEXT,

    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leave_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "leave_requests_leaveTypeId_fkey" FOREIGN KEY ("leaveTypeId") REFERENCES "leave_types"("id") ON UPDATE CASCADE,
    CONSTRAINT "leave_requests_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "users"("id") ON UPDATE CASCADE
);

-- Create indexes for leave_requests
CREATE INDEX IF NOT EXISTS "leave_requests_userId_idx" ON "leave_requests"("userId");
CREATE INDEX IF NOT EXISTS "leave_requests_status_idx" ON "leave_requests"("status");
CREATE INDEX IF NOT EXISTS "leave_requests_startDate_idx" ON "leave_requests"("startDate");
CREATE INDEX IF NOT EXISTS "leave_requests_endDate_idx" ON "leave_requests"("endDate");

-- Create roster_shifts table
CREATE TABLE IF NOT EXISTS "roster_shifts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "department" TEXT,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurringPattern" TEXT,
    "color" TEXT NOT NULL DEFAULT '#10B981',
    "notes" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roster_shifts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create indexes for roster_shifts
CREATE INDEX IF NOT EXISTS "roster_shifts_userId_idx" ON "roster_shifts"("userId");
CREATE INDEX IF NOT EXISTS "roster_shifts_startTime_idx" ON "roster_shifts"("startTime");
CREATE INDEX IF NOT EXISTS "roster_shifts_endTime_idx" ON "roster_shifts"("endTime");

-- Insert default leave types
INSERT INTO "leave_types" ("id", "name", "code", "description", "maxDaysPerYear", "requiresApproval", "isPaid", "color", "isActive", "createdAt", "updatedAt")
VALUES
    (gen_random_uuid(), 'Sick Leave', 'SICK', 'Leave for medical reasons or illness', 12, true, true, '#EF4444', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'Vacation Leave', 'VACATION', 'Annual vacation or holiday leave', 20, true, true, '#3B82F6', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'Personal Leave', 'PERSONAL', 'Personal time off for non-medical reasons', 5, true, true, '#8B5CF6', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'Maternity Leave', 'MATERNITY', 'Leave for maternity purposes', 180, true, true, '#EC4899', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'Paternity Leave', 'PATERNITY', 'Leave for paternity purposes', 15, true, true, '#06B6D4', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'Unpaid Leave', 'UNPAID', 'Leave without pay', NULL, true, false, '#6B7280', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'Other', 'OTHER', 'Other types of leave', NULL, true, true, '#F59E0B', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (code) DO NOTHING;

COMMIT;
