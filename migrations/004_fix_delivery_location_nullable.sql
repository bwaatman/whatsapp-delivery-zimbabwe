-- Fix the delivery_location column to allow NULL values for new orders
-- This allows orders to be created before the customer sends their location

ALTER TABLE orders ALTER COLUMN delivery_location DROP NOT NULL;

-- Also make merchant_id nullable since it's optional for initial order creation
ALTER TABLE orders ALTER COLUMN merchant_id DROP NOT NULL;
