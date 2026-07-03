-- Create default admin user
INSERT INTO admin_users (email, password_hash, name, role, is_active)
VALUES ('admin@zimdelivery.com', '$2b$10$BcTWWctBH4HeH9.XT6nseu.ml5JkMPcI6Bt3oi7XRHamTA2YG0Asm', 'Admin', 'admin', true)
ON CONFLICT (email) DO NOTHING;
