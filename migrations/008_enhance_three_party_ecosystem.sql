-- Enhanced schema for three-party ecosystem (Customers, Shops, Drivers)

-- Add shop location and operating hours to merchants table
ALTER TABLE merchants 
ADD COLUMN shop_location GEOMETRY(Point, 4326),
ADD COLUMN shop_address TEXT,
ADD COLUMN operating_hours JSONB,
ADD COLUMN is_open BOOLEAN DEFAULT true;

-- Add index for shop location
CREATE INDEX idx_merchants_shop_location ON merchants USING GIST (shop_location);

-- Enhance orders table for three-party flow
ALTER TABLE orders
ADD COLUMN shop_confirmed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN ready_for_pickup_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN driver_accepted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN pickup_confirmed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN estimated_delivery_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN actual_delivery_time TIMESTAMP WITH TIME ZONE;

-- Update order status check constraint for enhanced flow
ALTER TABLE orders 
DROP CONSTRAINT orders_status_check;

ALTER TABLE orders
ADD CONSTRAINT orders_status_check 
CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready_for_pickup', 'assigned', 'out_for_delivery', 'delivered', 'cancelled'));

-- Add indexes for new timestamp columns
CREATE INDEX idx_orders_shop_confirmed_at ON orders(shop_confirmed_at);
CREATE INDEX idx_orders_ready_for_pickup_at ON orders(ready_for_pickup_at);
CREATE INDEX idx_orders_driver_accepted_at ON orders(driver_accepted_at);

-- Create function to get orders for shop dashboard
CREATE OR REPLACE FUNCTION get_shop_orders(shop_id UUID, status_filter VARCHAR DEFAULT NULL)
RETURNS TABLE (
    id UUID,
    customer_phone VARCHAR,
    status VARCHAR,
    order_details TEXT,
    delivery_location GEOMETRY,
    created_at TIMESTAMP,
    shop_confirmed_at TIMESTAMP,
    ready_for_pickup_at TIMESTAMP,
    assigned_driver_id UUID,
    estimated_delivery_time TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id,
        o.customer_phone,
        o.status,
        o.order_details,
        o.delivery_location,
        o.created_at,
        o.shop_confirmed_at,
        o.ready_for_pickup_at,
        o.assigned_driver_id,
        o.estimated_delivery_time
    FROM orders o
    WHERE o.merchant_id = shop_id
    AND (status_filter IS NULL OR o.status = status_filter)
    ORDER BY o.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Create function to get available orders for drivers
CREATE OR REPLACE FUNCTION get_available_orders_for_drivers()
RETURNS TABLE (
    id UUID,
    customer_phone VARCHAR,
    order_details TEXT,
    delivery_location GEOMETRY,
    shop_location GEOMETRY,
    shop_address TEXT,
    shop_name VARCHAR,
    created_at TIMESTAMP,
    estimated_preparation_time INT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id,
        o.customer_phone,
        o.order_details,
        o.delivery_location,
        m.shop_location,
        m.shop_address,
        m.name as shop_name,
        o.created_at,
        EXTRACT(EPOCH FROM (o.ready_for_pickup_at - o.created_at))/60 as estimated_preparation_time
    FROM orders o
    JOIN merchants m ON o.merchant_id = m.id
    WHERE o.status = 'ready_for_pickup'
    AND o.assigned_driver_id IS NULL
    ORDER BY o.ready_for_pickup_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Create function to get driver's active delivery
CREATE OR REPLACE FUNCTION get_driver_active_delivery(driver_id UUID)
RETURNS TABLE (
    order_id UUID,
    customer_phone VARCHAR,
    order_details TEXT,
    delivery_location GEOMETRY,
    shop_location GEOMETRY,
    shop_address TEXT,
    shop_name VARCHAR,
    status VARCHAR,
    assigned_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id as order_id,
        o.customer_phone,
        o.order_details,
        o.delivery_location,
        m.shop_location,
        m.shop_address,
        m.name as shop_name,
        o.status,
        o.driver_accepted_at as assigned_at
    FROM orders o
    JOIN merchants m ON o.merchant_id = m.id
    WHERE o.assigned_driver_id = driver_id
    AND o.status IN ('assigned', 'out_for_delivery')
    ORDER BY o.driver_accepted_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Create function to calculate distance between shop and customer
CREATE OR REPLACE FUNCTION calculate_delivery_distance(order_id UUID)
RETURNS FLOAT AS $$
DECLARE
    shop_loc GEOMETRY;
    customer_loc GEOMETRY;
    distance_km FLOAT;
BEGIN
    SELECT m.shop_location, o.delivery_location
    INTO shop_loc, customer_loc
    FROM orders o
    JOIN merchants m ON o.merchant_id = m.id
    WHERE o.id = order_id;
    
    distance_km := ST_DistanceSphere(shop_loc, customer_loc) / 1000;
    
    RETURN distance_km;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update shop_confirmed_at when status changes to confirmed
CREATE OR REPLACE FUNCTION update_shop_confirmed_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN
        NEW.shop_confirmed_at = CURRENT_TIMESTAMP;
    END IF;
    IF NEW.status = 'ready_for_pickup' AND OLD.status != 'ready_for_pickup' THEN
        NEW.ready_for_pickup_at = CURRENT_TIMESTAMP;
    END IF;
    IF NEW.status = 'assigned' AND OLD.status != 'assigned' AND NEW.assigned_driver_id IS NOT NULL THEN
        NEW.driver_accepted_at = CURRENT_TIMESTAMP;
    END IF;
    IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
        NEW.actual_delivery_time = CURRENT_TIMESTAMP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_order_status_timestamps
BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION update_shop_confirmed_at();

-- Update RLS policies for new functions
CREATE POLICY "Enable read access for authenticated users on orders" ON orders
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable update access for authenticated users on orders" ON orders
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for authenticated users on orders" ON orders
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create view for shop dashboard summary
CREATE OR REPLACE VIEW shop_dashboard_summary AS
SELECT 
    m.id as shop_id,
    m.name as shop_name,
    COUNT(CASE WHEN o.status = 'pending' THEN 1 END) as pending_orders,
    COUNT(CASE WHEN o.status = 'confirmed' THEN 1 END) as confirmed_orders,
    COUNT(CASE WHEN o.status = 'preparing' THEN 1 END) as preparing_orders,
    COUNT(CASE WHEN o.status = 'ready_for_pickup' THEN 1 END) as ready_orders,
    COUNT(CASE WHEN o.status = 'assigned' THEN 1 END) as assigned_orders,
    COUNT(CASE WHEN o.status = 'out_for_delivery' THEN 1 END) as out_for_delivery_orders,
    COUNT(CASE WHEN o.status = 'delivered' THEN 1 END) as delivered_orders,
    COUNT(CASE WHEN o.created_at >= CURRENT_DATE THEN 1 END) as today_orders
FROM merchants m
LEFT JOIN orders o ON m.id = o.merchant_id
GROUP BY m.id, m.name;

-- Create view for driver dashboard summary
CREATE OR REPLACE VIEW driver_dashboard_summary AS
SELECT 
    d.id as driver_id,
    d.name as driver_name,
    d.is_available,
    COUNT(CASE WHEN o.status = 'assigned' AND o.assigned_driver_id = d.id THEN 1 END) as active_deliveries,
    COUNT(CASE WHEN o.status = 'delivered' AND o.assigned_driver_id = d.id AND o.actual_delivery_time >= CURRENT_DATE THEN 1 END) as today_deliveries,
    d.current_location
FROM drivers d
LEFT JOIN orders o ON d.id = o.assigned_driver_id
GROUP BY d.id, d.name, d.is_available, d.current_location;
