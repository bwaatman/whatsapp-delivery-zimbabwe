-- Add location health columns to merchants and drivers tables
-- These columns support the location health monitoring system

-- Add columns to merchants table
ALTER TABLE merchants 
ADD COLUMN IF NOT EXISTS is_temporarily_offline BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS offline_reason TEXT,
ADD COLUMN IF NOT EXISTS offline_since TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS location_metadata JSONB;

-- Add columns to drivers table
ALTER TABLE drivers
ADD COLUMN IF NOT EXISTS is_temporarily_offline BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS offline_reason TEXT,
ADD COLUMN IF NOT EXISTS offline_since TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS location_metadata JSONB;

-- Add comments for documentation
COMMENT ON COLUMN merchants.is_temporarily_offline IS 'Whether the shop is temporarily offline due to stale GPS location';
COMMENT ON COLUMN merchants.offline_reason IS 'Reason for being temporarily offline';
COMMENT ON COLUMN merchants.offline_since IS 'When the shop went temporarily offline';
COMMENT ON COLUMN merchants.location_metadata IS 'JSONB field storing GPS metadata (lat, lng, accuracy, timestamp)';

COMMENT ON COLUMN drivers.is_temporarily_offline IS 'Whether the driver is temporarily offline due to stale GPS location';
COMMENT ON COLUMN drivers.offline_reason IS 'Reason for being temporarily offline';
COMMENT ON COLUMN drivers.offline_since IS 'When the driver went temporarily offline';
COMMENT ON COLUMN drivers.location_metadata IS 'JSONB field storing GPS metadata (lat, lng, accuracy, timestamp)';

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_merchants_temporarily_offline ON merchants(is_temporarily_offline);
CREATE INDEX IF NOT EXISTS idx_drivers_temporarily_offline ON drivers(is_temporarily_offline);
