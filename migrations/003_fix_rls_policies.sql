-- Fix RLS policies to allow anonymous access for the WhatsApp webhook
-- These policies allow the API to work without authentication

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON merchants;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON drivers;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON orders;

-- Create more permissive policies for the WhatsApp API
CREATE POLICY "Enable all operations for WhatsApp API" ON merchants
    FOR ALL USING (true);

CREATE POLICY "Enable all operations for WhatsApp API" ON drivers
    FOR ALL USING (true);

CREATE POLICY "Enable all operations for WhatsApp API" ON orders
    FOR ALL USING (true);

-- Alternatively, disable RLS for now (uncomment if needed)
-- ALTER TABLE merchants DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE drivers DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
