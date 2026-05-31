-- Add password fields to drivers and merchants tables
-- This migration adds password authentication support

-- Add password field to drivers table
ALTER TABLE drivers 
ADD COLUMN IF NOT EXISTS password TEXT;

-- Add password field to merchants table
ALTER TABLE merchants 
ADD COLUMN IF NOT EXISTS password TEXT;

-- Set default password '12345' for existing drivers
UPDATE drivers 
SET password = '12345' 
WHERE password IS NULL;

-- Set default password '12345' for existing merchants
UPDATE merchants 
SET password = '12345' 
WHERE password IS NULL;

-- Add password field to driver_registration_requests table
ALTER TABLE driver_registration_requests 
ADD COLUMN IF NOT EXISTS password TEXT;

-- Add password field to vendor_registration_requests table
ALTER TABLE vendor_registration_requests 
ADD COLUMN IF NOT EXISTS password TEXT;

-- Add index on phone for faster login lookups
CREATE INDEX IF NOT EXISTS idx_drivers_phone ON drivers(phone);
CREATE INDEX IF NOT EXISTS idx_merchants_phone ON merchants(contact_phone);
