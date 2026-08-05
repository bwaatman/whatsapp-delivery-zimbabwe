-- Add PostGIS distance calculation functions for vendor discovery
-- These functions use ST_DistanceSphere for accurate distance calculations in kilometers

-- Function to calculate distance between a point and a shop location
CREATE OR REPLACE FUNCTION calculate_distance_from_point(
  lat NUMERIC,
  lng NUMERIC,
  shop_location GEOMETRY
)
RETURNS NUMERIC AS $$
BEGIN
  -- Calculate distance in kilometers using ST_DistanceSphere (returns meters, divide by 1000)
  RETURN ST_DistanceSphere(
    ST_SetSRID(ST_MakePoint(lng, lat), 4326),
    shop_location
  ) / 1000;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate distance between two points
CREATE OR REPLACE FUNCTION calculate_distance_between_points(
  lat1 NUMERIC,
  lng1 NUMERIC,
  lat2 NUMERIC,
  lng2 NUMERIC
)
RETURNS NUMERIC AS $$
BEGIN
  -- Calculate distance in kilometers using ST_DistanceSphere (returns meters, divide by 1000)
  RETURN ST_DistanceSphere(
    ST_SetSRID(ST_MakePoint(lng1, lat1), 4326),
    ST_SetSRID(ST_MakePoint(lng2, lat2), 4326)
  ) / 1000;
END;
$$ LANGUAGE plpgsql;

-- Function to find vendors within a specific radius using PostGIS
CREATE OR REPLACE FUNCTION find_vendors_within_radius(
  customer_lat NUMERIC,
  customer_lng NUMERIC,
  radius_km NUMERIC,
  filter_category_id UUID DEFAULT NULL
)
RETURNS TABLE (
  vendor_id UUID,
  vendor_name VARCHAR,
  contact_phone VARCHAR,
  shop_location GEOMETRY,
  shop_address TEXT,
  category_id UUID,
  category_name VARCHAR,
  category_icon TEXT,
  service_radius_km NUMERIC,
  is_open BOOLEAN,
  distance_km NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id AS vendor_id,
    m.name AS vendor_name,
    m.contact_phone,
    m.shop_location,
    m.shop_address,
    m.category_id,
    bc.name AS category_name,
    bc.icon AS category_icon,
    m.service_radius_km,
    m.is_open,
    ST_DistanceSphere(
      ST_SetSRID(ST_MakePoint(customer_lng, customer_lat), 4326),
      m.shop_location
    ) / 1000 AS distance_km
  FROM merchants m
  INNER JOIN business_categories bc ON m.category_id = bc.id
  WHERE m.registration_status = 'approved'
    AND m.active = true
    AND m.is_open = true
    AND m.shop_location IS NOT NULL
    AND (filter_category_id IS NULL OR m.category_id = filter_category_id)
    AND ST_DWithin(
      ST_SetSRID(ST_MakePoint(customer_lng, customer_lat), 4326),
      m.shop_location,
      radius_km * 1000  -- Convert km to meters for ST_DWithin
    )
  ORDER BY distance_km;
END;
$$ LANGUAGE plpgsql;

-- Add comment to document the functions
COMMENT ON FUNCTION calculate_distance_from_point IS 'Calculates distance in kilometers between a lat/lng point and a shop location geometry using PostGIS ST_DistanceSphere';
COMMENT ON FUNCTION calculate_distance_between_points IS 'Calculates distance in kilometers between two lat/lng points using PostGIS ST_DistanceSphere';
COMMENT ON FUNCTION find_vendors_within_radius IS 'Finds all approved, open vendors within a specified radius of a customer location, ordered by distance';
