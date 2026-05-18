-- Create PostgreSQL RPC function for spatial driver matching
-- This function uses PostGIS to find the closest available driver to a customer location

CREATE OR REPLACE FUNCTION match_closest_driver(
  customer_lat NUMERIC,
  customer_lng NUMERIC
)
RETURNS TABLE (
  id UUID,
  name VARCHAR(255),
  phone VARCHAR(255),
  current_location GEOMETRY(Point, 4326),
  is_available BOOLEAN,
  distance_km NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  customer_point GEOMETRY(Point, 4326);
BEGIN
  -- Create a point geometry for the customer location
  customer_point := ST_SetSRID(ST_MakePoint(customer_lng, customer_lat), 4326);
  
  -- Query available drivers and calculate distances
  RETURN QUERY
  SELECT 
    d.id,
    d.name,
    d.phone,
    d.current_location,
    d.is_available,
    -- Calculate distance in kilometers (PostGIS returns distance in SRID units, for 4326 it's degrees)
    -- Convert degrees to kilometers: 1 degree ≈ 111.32 km
    (ST_Distance(d.current_location, customer_point) * 111.32) as distance_km
  FROM drivers d
  WHERE d.is_available = TRUE
    AND d.current_location IS NOT NULL
  ORDER BY d.current_location <-> customer_point -- Use PostGIS distance operator for efficiency
  LIMIT 1;
  
  -- Log the matching attempt for debugging
  RAISE LOG 'Driver matching attempted for customer at (%, %)', customer_lat, customer_lng;
END;
$$;

-- Add comment for documentation
COMMENT ON FUNCTION match_closest_driver IS 'Finds the closest available driver to a customer location using PostGIS spatial operations. Returns driver details with distance in kilometers.';
