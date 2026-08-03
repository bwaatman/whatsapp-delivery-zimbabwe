-- Add verified badge fields to drivers and merchants tables

-- Add verification badge to drivers
ALTER TABLE drivers
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;

-- Add verification badge to merchants
ALTER TABLE merchants
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_drivers_is_verified ON drivers(is_verified);
CREATE INDEX IF NOT EXISTS idx_merchants_is_verified ON merchants(is_verified);
