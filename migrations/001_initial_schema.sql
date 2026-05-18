-- Enable PostGIS extension for geographic coordinate support
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create merchants table for business partners
CREATE TABLE merchants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(20) UNIQUE NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create drivers table for delivery personnel
CREATE TABLE drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    current_location GEOMETRY(Point, 4326), -- Using WGS 84 coordinate system
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create orders table for delivery requests
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_phone VARCHAR(20) NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'assigned', 'out_for_delivery', 'delivered')),
    delivery_location GEOMETRY(Point, 4326) NOT NULL, -- Using WGS 84 coordinate system
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE RESTRICT,
    change_requested_usd DECIMAL(10, 2) DEFAULT 0.00,
    assigned_driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add spatial indexes for efficient location queries
CREATE INDEX idx_orders_delivery_location ON orders USING GIST (delivery_location);
CREATE INDEX idx_drivers_current_location ON drivers USING GIST (current_location);

-- Add indexes for frequently queried fields
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_customer_phone ON orders(customer_phone);
CREATE INDEX idx_orders_merchant_id ON orders(merchant_id);
CREATE INDEX idx_merchants_active ON merchants(active);
CREATE INDEX idx_drivers_available ON drivers(is_available);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for automatic timestamp updates
CREATE TRIGGER update_merchants_updated_at BEFORE UPDATE ON merchants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON drivers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add RLS (Row Level Security) policies
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (adjust as needed for production)
CREATE POLICY "Enable all operations for authenticated users" ON merchants
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all operations for authenticated users" ON drivers
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all operations for authenticated users" ON orders
    FOR ALL USING (auth.role() = 'authenticated');
