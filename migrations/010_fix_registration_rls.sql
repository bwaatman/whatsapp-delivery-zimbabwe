-- Fix RLS policies for registration tables to allow public registration

-- Enable RLS on registration tables if not already enabled
ALTER TABLE driver_registration_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_registration_requests ENABLE ROW LEVEL SECURITY;

-- Add INSERT policy for driver registration requests (allow public registration)
DROP POLICY IF EXISTS "Public can insert driver registration requests" ON driver_registration_requests;
CREATE POLICY "Public can insert driver registration requests" ON driver_registration_requests
    FOR INSERT WITH CHECK (true);

-- Add INSERT policy for vendor registration requests (allow public registration)
DROP POLICY IF EXISTS "Public can insert vendor registration requests" ON vendor_registration_requests;
CREATE POLICY "Public can insert vendor registration requests" ON vendor_registration_requests
    FOR INSERT WITH CHECK (true);

-- Add INSERT policy for drivers table (allow public registration)
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can insert drivers" ON drivers;
CREATE POLICY "Public can insert drivers" ON drivers
    FOR INSERT WITH CHECK (true);

-- Add INSERT policy for merchants table (allow public registration)
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can insert merchants" ON merchants;
CREATE POLICY "Public can insert merchants" ON merchants
    FOR INSERT WITH CHECK (true);
