-- Add categories, delivery time, and image support
-- This migration adds support for business categories, delivery times, and product images

-- Create business categories table
CREATE TABLE IF NOT EXISTS business_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert common business categories
INSERT INTO business_categories (name, description, icon) VALUES
('Restaurant', 'Food and dining establishments', '🍽️'),
('Grocery', 'Grocery stores and supermarkets', '🛒'),
('Pharmacy', 'Pharmacies and health products', '💊'),
('Electronics', 'Electronics and gadgets', '📱'),
('Clothing', 'Clothing and fashion', '👕'),
('Beauty', 'Beauty and personal care', '💄'),
('Home & Garden', 'Home improvement and garden supplies', '🏠'),
('Automotive', 'Auto parts and services', '🚗'),
('Pet Supplies', 'Pet food and supplies', '🐕'),
('Other', 'Other business types', '📦')
ON CONFLICT (name) DO NOTHING;

-- Add category_id to merchants table
ALTER TABLE merchants 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES business_categories(id);

-- Add category_id to drivers table
ALTER TABLE drivers 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES business_categories(id);

-- Add delivery_time and delivery_time_unit to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS delivery_time INTEGER,
ADD COLUMN IF NOT EXISTS delivery_time_unit TEXT DEFAULT 'minutes' CHECK (delivery_time_unit IN ('minutes', 'hours', 'days'));

-- Add image_url to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_merchants_category ON merchants(category_id);
CREATE INDEX IF NOT EXISTS idx_drivers_category ON drivers(category_id);
CREATE INDEX IF NOT EXISTS idx_products_delivery_time ON products(delivery_time, delivery_time_unit);
