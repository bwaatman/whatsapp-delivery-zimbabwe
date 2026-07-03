-- Add missing columns to drivers table
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS emergency_contact_name text;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS emergency_contact_phone text;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS home_address text;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS driver_license_number text;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS vehicle_type text;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS vehicle_registration text;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS vehicle_color text;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS category_id text;
