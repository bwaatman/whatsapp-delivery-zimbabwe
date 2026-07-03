-- Create RPC functions for driver order management

-- Function to get available orders for drivers (orders that are ready_for_pickup)
CREATE OR REPLACE FUNCTION get_available_orders_for_drivers()
RETURNS TABLE (
  id UUID,
  customer_phone VARCHAR(255),
  order_details TEXT,
  delivery_location GEOMETRY(Point, 4326),
  shop_location GEOMETRY(Point, 4326),
  shop_address VARCHAR(255),
  shop_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE,
  estimated_preparation_time INTEGER,
  merchant_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
    c.delivery_time as estimated_preparation_time,
    o.merchant_id
  FROM orders o
  INNER JOIN merchants m ON o.merchant_id = m.id
  INNER JOIN categories c ON m.category_id = c.id
  WHERE o.status = 'ready_for_pickup'
    AND o.assigned_driver_id IS NULL
    AND o.delivery_location IS NOT NULL
  ORDER BY o.created_at ASC;
END;
$$;

-- Function to get driver's active delivery
CREATE OR REPLACE FUNCTION get_driver_active_delivery(driver_id UUID)
RETURNS TABLE (
  order_id UUID,
  customer_phone VARCHAR(255),
  order_details TEXT,
  delivery_location GEOMETRY(Point, 4326),
  shop_location GEOMETRY(Point, 4326),
  shop_address VARCHAR(255),
  shop_name VARCHAR(255),
  status VARCHAR(50),
  assigned_at TIMESTAMP WITH TIME ZONE,
  merchant_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
    o.updated_at as assigned_at,
    o.merchant_id
  FROM orders o
  INNER JOIN merchants m ON o.merchant_id = m.id
  WHERE o.assigned_driver_id = driver_id
    AND o.status IN ('assigned', 'out_for_delivery')
  ORDER BY o.updated_at DESC
  LIMIT 1;
END;
$$;

-- Function to get driver dashboard summary
CREATE OR REPLACE FUNCTION get_driver_dashboard_summary(driver_id UUID)
RETURNS TABLE (
  driver_id UUID,
  driver_name VARCHAR(255),
  is_available BOOLEAN,
  active_deliveries INTEGER,
  today_deliveries INTEGER,
  current_location GEOMETRY(Point, 4326)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id as driver_id,
    d.name as driver_name,
    d.is_available,
    (SELECT COUNT(*) FROM orders WHERE assigned_driver_id = driver_id AND status IN ('assigned', 'out_for_delivery')) as active_deliveries,
    (SELECT COUNT(*) FROM orders WHERE assigned_driver_id = driver_id AND status = 'delivered' AND DATE(updated_at) = CURRENT_DATE) as today_deliveries,
    d.current_location
  FROM drivers d
  WHERE d.id = driver_id;
END;
$$;

-- Add comments for documentation
COMMENT ON FUNCTION get_available_orders_for_drivers IS 'Returns orders that are ready for pickup and not yet assigned to a driver';
COMMENT ON FUNCTION get_driver_active_delivery IS 'Returns the active delivery for a specific driver (assigned or out for delivery)';
COMMENT ON FUNCTION get_driver_dashboard_summary IS 'Returns summary statistics for a driver dashboard';
