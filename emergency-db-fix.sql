-- Emergency fix for role enum issue
-- Run this in Railway database console

-- Drop the enum type constraint if it exists
DROP TYPE IF EXISTS "Role" CASCADE;

-- Update all existing role values to strings
UPDATE "User" SET role = 'SUPER_ADMIN' WHERE role::text = 'SUPER_ADMIN';
UPDATE "User" SET role = 'ADMIN' WHERE role::text = 'ADMIN';  
UPDATE "User" SET role = 'EMPLOYEE' WHERE role::text = 'EMPLOYEE';
UPDATE "User" SET role = 'PROVIDER' WHERE role::text = 'PROVIDER';
UPDATE "User" SET role = 'USER' WHERE role::text = 'USER';

-- Make sure the role column is text type
ALTER TABLE "User" ALTER COLUMN role TYPE TEXT;