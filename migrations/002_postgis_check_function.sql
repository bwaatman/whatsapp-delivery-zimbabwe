-- Function to check if PostGIS extension is enabled
CREATE OR REPLACE FUNCTION check_postgis_extension()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if PostGIS extension exists
  RETURN EXISTS (
    SELECT 1 
    FROM pg_extension 
    WHERE extname = 'postgis'
  );
END;
$$;
