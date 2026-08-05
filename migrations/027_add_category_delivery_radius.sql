-- Add default delivery radius to business_categories table
-- Update "Other" category to "Retail & General Merchandise"
-- Set default delivery radii for all categories

-- Add default_delivery_radius_km column to business_categories table
ALTER TABLE business_categories
ADD COLUMN IF NOT EXISTS default_delivery_radius_km DECIMAL(10,2);

-- Add comment to document the purpose
COMMENT ON COLUMN business_categories.default_delivery_radius_km IS 'Default maximum delivery radius in kilometers for vendors in this category. Vendors can reduce their service radius but cannot exceed this value.';

-- Update "Other" to "Retail & General Merchandise"
UPDATE business_categories
SET name = 'Retail & General Merchandise',
    description = 'Retail stores and general merchandise',
    icon = '📦'
WHERE name = 'Other';

-- Set default delivery radii for all categories
UPDATE business_categories
SET default_delivery_radius_km = CASE
    WHEN name = 'Restaurant' THEN 5
    WHEN name = 'Grocery' THEN 8
    WHEN name = 'Pharmacy' THEN 10
    WHEN name = 'Beauty' THEN 20
    WHEN name = 'Pet Supplies' THEN 20
    WHEN name = 'Electronics' THEN 30
    WHEN name = 'Clothing' THEN 30
    WHEN name = 'Home & Garden' THEN 40
    WHEN name = 'Automotive' THEN 50
    WHEN name = 'Courier & Parcel Services' THEN 9999 -- Unlimited
    WHEN name = 'Retail & General Merchandise' THEN 20
    ELSE 20 -- Default fallback
END
WHERE default_delivery_radius_km IS NULL;

-- Create index for efficient filtering by delivery radius
CREATE INDEX IF NOT EXISTS idx_business_categories_delivery_radius ON business_categories(default_delivery_radius_km);
