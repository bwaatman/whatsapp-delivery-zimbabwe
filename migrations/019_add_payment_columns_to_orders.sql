-- Add payment-related columns to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20) CHECK (payment_method IN ('online', 'cod'));
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed', 'refunded'));
ALTER TABLE orders ADD COLUMN IF NOT EXISTS food_amount DECIMAL(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_fee DECIMAL(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS service_fee DECIMAL(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS vendor_commission DECIMAL(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS vendor_earnings DECIMAL(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS driver_earnings DECIMAL(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS platform_revenue DECIMAL(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cash_collected DECIMAL(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cash_collected_at TIMESTAMP;

-- Create indexes for payment-related queries
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON orders(payment_method);
