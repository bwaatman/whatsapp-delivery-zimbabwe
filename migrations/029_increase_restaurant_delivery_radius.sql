-- Increase default delivery radius for Restaurant category
-- The current 5km radius is too small for practical delivery

UPDATE business_categories
SET default_delivery_radius_km = 25
WHERE name = 'Restaurant';

-- Verify the update
SELECT name, default_delivery_radius_km 
FROM business_categories 
WHERE name = 'Restaurant';
