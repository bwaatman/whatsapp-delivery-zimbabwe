-- Fix RLS policy for admin_users to allow anon key access for login
DROP POLICY IF EXISTS "Allow anon to read admin users for login" ON admin_users;
CREATE POLICY "Allow anon to read admin users for login" ON admin_users
    FOR SELECT USING (true);
