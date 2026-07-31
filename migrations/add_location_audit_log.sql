-- Create location_audit_log table for tracking GPS/location events
-- This table records all location-related events for vendors and drivers
-- for troubleshooting and audit purposes

CREATE TABLE IF NOT EXISTS location_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL, -- The ID of the shop or driver
  entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('shop', 'driver')),
  event_type VARCHAR(50) NOT NULL, -- e.g., 'gps_updated', 'shop_offline', 'shop_restored', 'driver_offline', 'driver_restored'
  details TEXT, -- Additional details about the event
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_location_audit_log_entity_id ON location_audit_log(entity_id);
CREATE INDEX IF NOT EXISTS idx_location_audit_log_entity_type ON location_audit_log(entity_type);
CREATE INDEX IF NOT EXISTS idx_location_audit_log_timestamp ON location_audit_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_location_audit_log_entity_timestamp ON location_audit_log(entity_id, timestamp DESC);

-- Add comments for documentation
COMMENT ON TABLE location_audit_log IS 'Audit log for location-related events (GPS updates, offline status, etc.)';
COMMENT ON COLUMN location_audit_log.entity_id IS 'ID of the shop or driver';
COMMENT ON COLUMN location_audit_log.entity_type IS 'Type of entity: shop or driver';
COMMENT ON COLUMN location_audit_log.event_type IS 'Type of event: gps_updated, shop_offline, shop_restored, driver_offline, driver_restored';
COMMENT ON COLUMN location_audit_log.details IS 'Additional details about the event';
COMMENT ON COLUMN location_audit_log.timestamp IS 'When the event occurred';
