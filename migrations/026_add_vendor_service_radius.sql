-- Add service radius to merchants table for vendor delivery coverage
-- This allows each vendor to configure their own delivery coverage area
-- The effective delivery radius is MIN(category_default_radius, vendor_service_radius)

-- Add service_radius_km column to merchants table
ALTER TABLE merchants
ADD COLUMN IF NOT EXISTS service_radius_km DECIMAL(10,2);

-- Add comment to document the purpose
COMMENT ON COLUMN merchants.service_radius_km IS 'Vendor service radius in kilometers. Effective delivery radius is MIN(category_default_radius, this value). NULL means use category default.';

-- Create index for efficient filtering by service radius
CREATE INDEX IF NOT EXISTS idx_merchants_service_radius ON merchants(service_radius_km) WHERE service_radius_km IS NOT NULL;

-- Set existing vendors to NULL (will use category default by default)
-- This ensures backward compatibility - existing vendors will use their category's default radius
UPDATE merchants
SET service_radius_km = NULL
WHERE service_radius_km IS NULL;
