-- Add order_items and total_amount columns to orders table
-- These columns are needed for the WhatsApp bot to store order details

ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_items JSONB;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10, 2) DEFAULT 0.00;

-- Add comments to describe the columns
COMMENT ON COLUMN orders.order_items IS 'Array of ordered products with quantities and prices';
COMMENT ON COLUMN orders.total_amount IS 'Total cost of the order';
