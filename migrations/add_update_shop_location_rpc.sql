-- Create RPC function to update shop location with proper PostGIS geometry handling
CREATE OR REPLACE FUNCTION update_shop_location(
  p_shop_id UUID,
  p_latitude NUMERIC,
  p_longitude NUMERIC,
  p_address TEXT DEFAULT NULL,
  p_accuracy NUMERIC DEFAULT NULL,
  p_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE merchants
  SET 
    shop_location = ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326),
    shop_address = COALESCE(p_address, shop_address),
    location_metadata = jsonb_build_object(
      'latitude', p_latitude,
      'longitude', p_longitude,
      'accuracy', p_accuracy,
      'timestamp', p_timestamp
    ),
    updated_at = NOW()
  WHERE id = p_shop_id;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error updating shop location: %', SQLERRM;
    RETURN FALSE;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_shop_location TO authenticated;
GRANT EXECUTE ON FUNCTION update_shop_location TO anon;
