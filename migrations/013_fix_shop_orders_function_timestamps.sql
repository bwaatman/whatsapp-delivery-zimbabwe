-- Fix timestamp type mismatch in get_shop_orders function
-- The function was returning TIMESTAMP without time zone, but the actual columns are TIMESTAMP WITH TIME ZONE

-- First drop the existing function
DROP FUNCTION IF EXISTS get_shop_orders(UUID, VARCHAR);

-- Recreate the function with correct timestamp types
CREATE OR REPLACE FUNCTION get_shop_orders(shop_id UUID, status_filter VARCHAR DEFAULT NULL)
RETURNS TABLE (
    id UUID,
    customer_phone VARCHAR,
    status VARCHAR,
    order_details TEXT,
    delivery_location GEOMETRY,
    created_at TIMESTAMP WITH TIME ZONE,
    shop_confirmed_at TIMESTAMP WITH TIME ZONE,
    ready_for_pickup_at TIMESTAMP WITH TIME ZONE,
    assigned_driver_id UUID,
    estimated_delivery_time TIMESTAMP WITH TIME ZONE
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
