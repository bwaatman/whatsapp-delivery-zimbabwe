-- Add categories, delivery time, and image support
-- This migration adds support for business categories, delivery times, and product images

-- Create business categories table
CREATE TABLE IF NOT EXISTS business_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert common business categories
INSERT INTO business_categories (name, description, icon) VALUES
('Restaurant', 'Food and dining establishments', '🍽️'),
('Grocery', 'Grocery stores and supermarkets', '🛒'),
('Pharmacy', 'Pharmacies and health products', '💊'),
('Electronics', 'Electronics and gadgets', '📱'),
('Clothing', 'Clothing and fashion', '👕'),
('Beauty', 'Beauty and personal care', '💄'),
('Home & Garden', 'Home improvement and garden supplies', '🏠'),
('Automotive', 'Auto parts and services', '🚗'),
('Pet Supplies', 'Pet food and supplies', '🐕'),
('Other', 'Other business types', '📦')
ON CONFLICT (name) DO NOTHING;
           
-- Add category_id to merchants table
ALTER TABLE merchants 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES business_categories(id);

-- Add category_id to drivers table
ALTER TABLE drivers 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES business_categories(id);

-- Create products table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'products') THEN
        CREATE TABLE products (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            description TEXT,
            price DECIMAL(10, 2) NOT NULL,
            category TEXT,
            is_available BOOLEAN DEFAULT true,
            preparation_time_minutes INTEGER DEFAULT 30,
            delivery_time INTEGER,
            delivery_time_unit TEXT DEFAULT 'minutes' CHECK (delivery_time_unit IN ('minutes', 'hours', 'days')),
            image_url TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Add indexes for products
        CREATE INDEX idx_products_merchant_id ON products(merchant_id);
        CREATE INDEX idx_products_category ON products(category);
        CREATE INDEX idx_products_available ON products(is_available);
        
        -- Add trigger for automatic timestamp update on products
        CREATE TRIGGER update_products_updated_at 
        BEFORE UPDATE ON products
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        
        -- Add RLS policy for products
        ALTER TABLE products ENABLE ROW LEVEL SECURITY;
        
        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Enable all operations for authenticated users on products" ON products;
        DROP POLICY IF EXISTS "Enable select for authenticated users on products" ON products;
        DROP POLICY IF EXISTS "Enable insert for authenticated users on products" ON products;
        DROP POLICY IF EXISTS "Enable update for authenticated users on products" ON products;
        DROP POLICY IF EXISTS "Enable delete for authenticated users on products" ON products;
        
        -- Create permissive policies that allow all operations
        CREATE POLICY "Enable select for authenticated users on products" ON products
            FOR SELECT USING (true);
        
        CREATE POLICY "Enable insert for authenticated users on products" ON products
            FOR INSERT WITH CHECK (true);
        
        CREATE POLICY "Enable update for authenticated users on products" ON products
            FOR UPDATE USING (true);
        
        CREATE POLICY "Enable delete for authenticated users on products" ON products
            FOR DELETE USING (true);
    ELSE
        -- If products table exists, add missing columns
        ALTER TABLE products ADD COLUMN IF NOT EXISTS merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE;
        ALTER TABLE products ADD COLUMN IF NOT EXISTS delivery_time INTEGER;
        ALTER TABLE products ADD COLUMN IF NOT EXISTS delivery_time_unit TEXT DEFAULT 'minutes' CHECK (delivery_time_unit IN ('minutes', 'hours', 'days'));
        ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT;
        ALTER TABLE products ADD COLUMN IF NOT EXISTS preparation_time_minutes INTEGER DEFAULT 30;
        
        -- Add indexes if they don't exist
        CREATE INDEX IF NOT EXISTS idx_products_merchant_id ON products(merchant_id);
        CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
        CREATE INDEX IF NOT EXISTS idx_products_available ON products(is_available);
        
        -- Add trigger if it doesn't exist
        IF NOT EXISTS (SELECT FROM pg_trigger WHERE tgname = 'update_products_updated_at') THEN
            CREATE TRIGGER update_products_updated_at 
            BEFORE UPDATE ON products
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        END IF;
        
        -- Add RLS if not enabled
        IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'products' AND rowsecurity = true) THEN
            ALTER TABLE products ENABLE ROW LEVEL SECURITY;
        END IF;
        
        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Enable all operations for authenticated users on products" ON products;
        DROP POLICY IF EXISTS "Enable select for authenticated users on products" ON products;
        DROP POLICY IF EXISTS "Enable insert for authenticated users on products" ON products;
        DROP POLICY IF EXISTS "Enable update for authenticated users on products" ON products;
        DROP POLICY IF EXISTS "Enable delete for authenticated users on products" ON products;
        
        -- Create permissive policies that allow all operations
        CREATE POLICY "Enable select for authenticated users on products" ON products
            FOR SELECT USING (true);
        
        CREATE POLICY "Enable insert for authenticated users on products" ON products
            FOR INSERT WITH CHECK (true);
        
        CREATE POLICY "Enable update for authenticated users on products" ON products
            FOR UPDATE USING (true);
        
        CREATE POLICY "Enable delete for authenticated users on products" ON products
            FOR DELETE USING (true);
    END IF;
END $$;
