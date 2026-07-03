-- Create platform configuration table
CREATE TABLE platform_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_platform_config_key ON platform_config(key);

-- Insert default configuration
INSERT INTO platform_config (key, value, description) VALUES
('vendor_commission_rate', '12', 'Vendor commission percentage'),
('driver_delivery_rate', '85', 'Driver delivery fee percentage'),
('payout_day', '2', 'Day of week for payouts (1=Monday, 7=Sunday)'),
('min_payout_amount', '100', 'Minimum payout amount'),
('service_fee', '10', 'Service fee charged per order');
