-- Comprehensive 5-party ecosystem with admin approval system

-- Create admin users table
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add approval fields to merchants table (if columns don't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'merchants' AND column_name = 'registration_status'
    ) THEN
        ALTER TABLE merchants
        ADD COLUMN registration_status VARCHAR(50) DEFAULT 'pending' CHECK (registration_status IN ('pending', 'approved', 'rejected', 'suspended'));
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'merchants' AND column_name = 'approved_by'
    ) THEN
        ALTER TABLE merchants
        ADD COLUMN approved_by UUID REFERENCES admin_users(id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'merchants' AND column_name = 'approved_at'
    ) THEN
        ALTER TABLE merchants
        ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'merchants' AND column_name = 'rejection_reason'
    ) THEN
        ALTER TABLE merchants
        ADD COLUMN rejection_reason TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'merchants' AND column_name = 'business_license_number'
    ) THEN
        ALTER TABLE merchants
        ADD COLUMN business_license_number VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'merchants' AND column_name = 'business_description'
    ) THEN
        ALTER TABLE merchants
        ADD COLUMN business_description TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'merchants' AND column_name = 'registration_data'
    ) THEN
        ALTER TABLE merchants
        ADD COLUMN registration_data JSONB;
    END IF;
END $$;

-- Add approval fields to drivers table (if columns don't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'drivers' AND column_name = 'registration_status'
    ) THEN
        ALTER TABLE drivers
        ADD COLUMN registration_status VARCHAR(50) DEFAULT 'pending' CHECK (registration_status IN ('pending', 'approved', 'rejected', 'suspended'));
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'drivers' AND column_name = 'approved_by'
    ) THEN
        ALTER TABLE drivers
        ADD COLUMN approved_by UUID REFERENCES admin_users(id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'drivers' AND column_name = 'approved_at'
    ) THEN
        ALTER TABLE drivers
        ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'drivers' AND column_name = 'rejection_reason'
    ) THEN
        ALTER TABLE drivers
        ADD COLUMN rejection_reason TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'drivers' AND column_name = 'driver_license_number'
    ) THEN
        ALTER TABLE drivers
        ADD COLUMN driver_license_number VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'drivers' AND column_name = 'vehicle_type'
    ) THEN
        ALTER TABLE drivers
        ADD COLUMN vehicle_type VARCHAR(50);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'drivers' AND column_name = 'vehicle_registration'
    ) THEN
        ALTER TABLE drivers
        ADD COLUMN vehicle_registration VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'drivers' AND column_name = 'registration_data'
    ) THEN
        ALTER TABLE drivers
        ADD COLUMN registration_data JSONB;
    END IF;
END $$;

-- Create user authentication table for web dashboard logins
CREATE TABLE IF NOT EXISTS user_auth (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    user_type VARCHAR(50) NOT NULL CHECK (user_type IN ('vendor', 'driver')),
    user_id UUID NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create products table for vendors (only if merchants table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'merchants') THEN
        CREATE TABLE IF NOT EXISTS products (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            price DECIMAL(10, 2) NOT NULL,
            category VARCHAR(100),
            is_available BOOLEAN DEFAULT true,
            preparation_time_minutes INT DEFAULT 0,
            image_url TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    ELSE
        RAISE NOTICE 'Merchants table does not exist, skipping products table creation';
    END IF;
END $$;

-- Create product images table (only if products table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') THEN
        CREATE TABLE IF NOT EXISTS product_images (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
            image_url TEXT NOT NULL,
            is_primary BOOLEAN DEFAULT false,
            display_order INT DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    ELSE
        RAISE NOTICE 'Products table does not exist, skipping product_images table creation';
    END IF;
END $$;

-- Create vendor registration requests table (for admin review) - only if merchants table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'merchants') THEN
        CREATE TABLE IF NOT EXISTS vendor_registration_requests (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
            business_name VARCHAR(255) NOT NULL,
            business_address TEXT,
            business_phone VARCHAR(20),
            business_email VARCHAR(255),
            business_license_number VARCHAR(100),
            tax_id VARCHAR(100),
            business_description TEXT,
            operating_hours JSONB,
            shop_location GEOMETRY(Point, 4326),
            shop_address TEXT,
            registration_data JSONB,
            status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'under_review')),
            reviewed_by UUID REFERENCES admin_users(id),
            reviewed_at TIMESTAMP WITH TIME ZONE,
            rejection_reason TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    ELSE
        RAISE NOTICE 'Merchants table does not exist, skipping vendor_registration_requests table creation';
    END IF;
END $$;

-- Create driver registration requests table (for admin review) - only if drivers table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'drivers') THEN
        CREATE TABLE IF NOT EXISTS driver_registration_requests (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
            full_name VARCHAR(255) NOT NULL,
            phone VARCHAR(20) NOT NULL,
            email VARCHAR(255),
            driver_license_number VARCHAR(100),
            vehicle_type VARCHAR(50),
            vehicle_registration VARCHAR(100),
            vehicle_color VARCHAR(50),
            home_address TEXT,
            emergency_contact_name VARCHAR(255),
            emergency_contact_phone VARCHAR(20),
            registration_data JSONB,
            status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'under_review')),
            reviewed_by UUID REFERENCES admin_users(id),
            reviewed_at TIMESTAMP WITH TIME ZONE,
            rejection_reason TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    ELSE
        RAISE NOTICE 'Drivers table does not exist, skipping driver_registration_requests table creation';
    END IF;
END $$;

-- Add indexes for new tables (conditional on tables existing)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_users') THEN
        CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
        CREATE INDEX IF NOT EXISTS idx_admin_users_is_active ON admin_users(is_active);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_auth') THEN
        CREATE INDEX IF NOT EXISTS idx_user_auth_email ON user_auth(email);
        CREATE INDEX IF NOT EXISTS idx_user_auth_user_type ON user_auth(user_type);
        CREATE INDEX IF NOT EXISTS idx_user_auth_user_id ON user_auth(user_id);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') THEN
        BEGIN
            CREATE INDEX IF NOT EXISTS idx_products_merchant_id ON products(merchant_id);
        EXCEPTION WHEN undefined_column THEN
            RAISE NOTICE 'Column merchant_id does not exist in products table, skipping index creation';
        END;
        
        BEGIN
            CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
        EXCEPTION WHEN undefined_column THEN
            RAISE NOTICE 'Column category does not exist in products table, skipping index creation';
        END;
        
        BEGIN
            CREATE INDEX IF NOT EXISTS idx_products_is_available ON products(is_available);
        EXCEPTION WHEN undefined_column THEN
            RAISE NOTICE 'Column is_available does not exist in products table, skipping index creation';
        END;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'product_images') THEN
        BEGIN
            CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
        EXCEPTION WHEN undefined_column THEN
            RAISE NOTICE 'Column product_id does not exist in product_images table, skipping index creation';
        END;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vendor_registration_requests') THEN
        BEGIN
            CREATE INDEX IF NOT EXISTS idx_vendor_registration_requests_status ON vendor_registration_requests(status);
        EXCEPTION WHEN undefined_column THEN
            RAISE NOTICE 'Column status does not exist in vendor_registration_requests table, skipping index creation';
        END;
        
        BEGIN
            CREATE INDEX IF NOT EXISTS idx_vendor_registration_requests_merchant_id ON vendor_registration_requests(merchant_id);
        EXCEPTION WHEN undefined_column THEN
            RAISE NOTICE 'Column merchant_id does not exist in vendor_registration_requests table, skipping index creation';
        END;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'driver_registration_requests') THEN
        BEGIN
            CREATE INDEX IF NOT EXISTS idx_driver_registration_requests_status ON driver_registration_requests(status);
        EXCEPTION WHEN undefined_column THEN
            RAISE NOTICE 'Column status does not exist in driver_registration_requests table, skipping index creation';
        END;
        
        BEGIN
            CREATE INDEX IF NOT EXISTS idx_driver_registration_requests_driver_id ON driver_registration_requests(driver_id);
        EXCEPTION WHEN undefined_column THEN
            RAISE NOTICE 'Column driver_id does not exist in driver_registration_requests table, skipping index creation';
        END;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'merchants') THEN
        BEGIN
            CREATE INDEX IF NOT EXISTS idx_merchants_registration_status ON merchants(registration_status);
        EXCEPTION WHEN undefined_column THEN
            RAISE NOTICE 'Column registration_status does not exist in merchants table, skipping index creation';
        END;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'drivers') THEN
        BEGIN
            CREATE INDEX IF NOT EXISTS idx_drivers_registration_status ON drivers(registration_status);
        EXCEPTION WHEN undefined_column THEN
            RAISE NOTICE 'Column registration_status does not exist in drivers table, skipping index creation';
        END;
    END IF;
END $$;

-- Create function to approve vendor registration (only if tables exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vendor_registration_requests') 
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'merchants') THEN
        CREATE OR REPLACE FUNCTION approve_vendor_registration(request_id UUID, admin_id UUID)
        RETURNS BOOLEAN AS $func$
        BEGIN
            UPDATE vendor_registration_requests
            SET status = 'approved',
                reviewed_by = admin_id,
                reviewed_at = CURRENT_TIMESTAMP
            WHERE id = request_id;

            UPDATE merchants
            SET registration_status = 'approved',
                approved_by = admin_id,
                approved_at = CURRENT_TIMESTAMP,
                active = true
            WHERE id = (SELECT merchant_id FROM vendor_registration_requests WHERE id = request_id);

            RETURN FOUND;
        END;
        $func$ LANGUAGE plpgsql;
    ELSE
        RAISE NOTICE 'Required tables do not exist, skipping approve_vendor_registration function creation';
    END IF;
END $$;

-- Create function to reject vendor registration (only if tables exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vendor_registration_requests')
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'merchants') THEN
        CREATE OR REPLACE FUNCTION reject_vendor_registration(request_id UUID, admin_id UUID, reason TEXT)
        RETURNS BOOLEAN AS $func$
        BEGIN
            UPDATE vendor_registration_requests
            SET status = 'rejected',
                reviewed_by = admin_id,
                reviewed_at = CURRENT_TIMESTAMP,
                rejection_reason = reason
            WHERE id = request_id;

            UPDATE merchants
            SET registration_status = 'rejected',
                approved_by = admin_id,
                approved_at = CURRENT_TIMESTAMP,
                rejection_reason = reason,
                active = false
            WHERE id = (SELECT merchant_id FROM vendor_registration_requests WHERE id = request_id);

            RETURN FOUND;
        END;
        $func$ LANGUAGE plpgsql;
    ELSE
        RAISE NOTICE 'Required tables do not exist, skipping reject_vendor_registration function creation';
    END IF;
END $$;

-- Create function to approve driver registration (only if tables exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'driver_registration_requests')
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'drivers') THEN
        CREATE OR REPLACE FUNCTION approve_driver_registration(request_id UUID, admin_id UUID)
        RETURNS BOOLEAN AS $func$
        BEGIN
            UPDATE driver_registration_requests
            SET status = 'approved',
                reviewed_by = admin_id,
                reviewed_at = CURRENT_TIMESTAMP
            WHERE id = request_id;

            UPDATE drivers
            SET registration_status = 'approved',
                approved_by = admin_id,
                approved_at = CURRENT_TIMESTAMP,
                is_available = true
            WHERE id = (SELECT driver_id FROM driver_registration_requests WHERE id = request_id);

            RETURN FOUND;
        END;
        $func$ LANGUAGE plpgsql;
    ELSE
        RAISE NOTICE 'Required tables do not exist, skipping approve_driver_registration function creation';
    END IF;
END $$;

-- Create function to reject driver registration (only if tables exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'driver_registration_requests')
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'drivers') THEN
        CREATE OR REPLACE FUNCTION reject_driver_registration(request_id UUID, admin_id UUID, reason TEXT)
        RETURNS BOOLEAN AS $func$
        BEGIN
            UPDATE driver_registration_requests
            SET status = 'rejected',
                reviewed_by = admin_id,
                reviewed_at = CURRENT_TIMESTAMP,
                rejection_reason = reason
            WHERE id = request_id;

            UPDATE drivers
            SET registration_status = 'rejected',
                approved_by = admin_id,
                approved_at = CURRENT_TIMESTAMP,
                rejection_reason = reason,
                is_available = false
            WHERE id = (SELECT driver_id FROM driver_registration_requests WHERE id = request_id);

            RETURN FOUND;
        END;
        $func$ LANGUAGE plpgsql;
    ELSE
        RAISE NOTICE 'Required tables do not exist, skipping reject_driver_registration function creation';
    END IF;
END $$;

-- Create view for admin dashboard - pending registrations (only if tables exist)
DO $$
BEGIN
    BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vendor_registration_requests') 
           AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'driver_registration_requests')
           AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_users') THEN
            CREATE OR REPLACE VIEW admin_pending_registrations AS
            SELECT 
                'vendor' as registration_type,
                vr.id as request_id,
                vr.merchant_id as user_id,
                vr.business_name as name,
                vr.business_email as email,
                vr.business_phone as phone,
                vr.status,
                vr.created_at,
                a.name as reviewed_by_name
            FROM vendor_registration_requests vr
            LEFT JOIN admin_users a ON vr.reviewed_by = a.id
            WHERE vr.status = 'pending'

            UNION ALL

            SELECT 
                'driver' as registration_type,
                dr.id as request_id,
                dr.driver_id as user_id,
                dr.full_name as name,
                dr.email,
                dr.phone,
                dr.status,
                dr.created_at,
                a.name as reviewed_by_name
            FROM driver_registration_requests dr
            LEFT JOIN admin_users a ON dr.reviewed_by = a.id
            WHERE dr.status = 'pending';
        END IF;
    EXCEPTION WHEN undefined_column THEN
        RAISE NOTICE 'Required columns do not exist for admin_pending_registrations view, skipping view creation';
    END;
END $$;

-- Create view for vendor products with images (only if tables exist)
DO $$
BEGIN
    BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') 
           AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'merchants')
           AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'product_images') THEN
            CREATE OR REPLACE VIEW vendor_products_with_images AS
            SELECT 
                p.*,
                m.name as merchant_name,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'id', pi.id,
                            'image_url', pi.image_url,
                            'is_primary', pi.is_primary,
                            'display_order', pi.display_order
                        ) ORDER BY pi.display_order, pi.id
                    ) FILTER (WHERE pi.id IS NOT NULL),
                    '[]'::json
                ) as images
            FROM products p
            JOIN merchants m ON p.merchant_id = m.id
            LEFT JOIN product_images pi ON p.id = pi.product_id
            GROUP BY p.id, m.name;
        END IF;
    EXCEPTION WHEN undefined_column THEN
        RAISE NOTICE 'Required columns do not exist for vendor_products_with_images view, skipping view creation';
    END;
END $$;

-- Create view for admin dashboard summary (only if tables exist)
DO $$
BEGIN
    BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_users')
           AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'merchants')
           AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'drivers')
           AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders')
           AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') THEN
            CREATE OR REPLACE VIEW admin_dashboard_summary AS
            SELECT 
                (SELECT COUNT(*) FROM admin_users WHERE is_active = true) as active_admins,
                (SELECT COUNT(*) FROM merchants WHERE registration_status = 'pending') as pending_vendors,
                (SELECT COUNT(*) FROM merchants WHERE registration_status = 'approved' AND active = true) as active_vendors,
                (SELECT COUNT(*) FROM drivers WHERE registration_status = 'pending') as pending_drivers,
                (SELECT COUNT(*) FROM drivers WHERE registration_status = 'approved' AND is_available = true) as active_drivers,
                (SELECT COUNT(*) FROM orders WHERE status = 'pending') as pending_orders,
                (SELECT COUNT(*) FROM orders WHERE status = 'out_for_delivery') as active_deliveries,
                (SELECT COUNT(*) FROM products WHERE is_available = true) as active_products;
        END IF;
    EXCEPTION WHEN undefined_column THEN
        RAISE NOTICE 'Required columns do not exist for admin_dashboard_summary view, skipping view creation';
    END;
END $$;

-- Add RLS policies for new tables (conditional on tables existing)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_users') THEN
        ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_auth') THEN
        ALTER TABLE user_auth ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') THEN
        ALTER TABLE products ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'product_images') THEN
        ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vendor_registration_requests') THEN
        ALTER TABLE vendor_registration_requests ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'driver_registration_requests') THEN
        ALTER TABLE driver_registration_requests ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- RLS policies for admin_users (conditional on table existing)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_users') THEN
        DROP POLICY IF EXISTS "Admin users can view all admins" ON admin_users;
        CREATE POLICY "Admin users can view all admins" ON admin_users
            FOR SELECT USING (auth.role() = 'authenticated');

        DROP POLICY IF EXISTS "Admin users can insert admins" ON admin_users;
        CREATE POLICY "Admin users can insert admins" ON admin_users
            FOR INSERT WITH CHECK (auth.role() = 'authenticated');

        DROP POLICY IF EXISTS "Admin users can update admins" ON admin_users;
        CREATE POLICY "Admin users can update admins" ON admin_users
            FOR UPDATE USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- RLS policies for user_auth (conditional on table existing)
DO $$
BEGIN
    BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_auth') THEN
            DROP POLICY IF EXISTS "Users can view their own auth" ON user_auth;
            CREATE POLICY "Users can view their own auth" ON user_auth
                FOR SELECT USING (auth.uid()::text = user_id::text OR auth.role() = 'authenticated');

            DROP POLICY IF EXISTS "Users can insert their own auth" ON user_auth;
            CREATE POLICY "Users can insert their own auth" ON user_auth
                FOR INSERT WITH CHECK (auth.role() = 'authenticated');

            DROP POLICY IF EXISTS "Users can update their own auth" ON user_auth;
            CREATE POLICY "Users can update their own auth" ON user_auth
                FOR UPDATE USING (auth.uid()::text = user_id::text OR auth.role() = 'authenticated');
        END IF;
    EXCEPTION WHEN undefined_column THEN
        RAISE NOTICE 'Required columns do not exist for user_auth RLS policies, skipping policy creation';
    END;
END $$;

-- RLS policies for products (conditional on table existing)
DO $$
BEGIN
    BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') THEN
            DROP POLICY IF EXISTS "Merchants can view their products" ON products;
            CREATE POLICY "Merchants can view their products" ON products
                FOR SELECT USING (auth.uid()::text = merchant_id::text OR auth.role() = 'authenticated');

            DROP POLICY IF EXISTS "Merchants can insert their products" ON products;
            CREATE POLICY "Merchants can insert their products" ON products
                FOR INSERT WITH CHECK (auth.role() = 'authenticated');

            DROP POLICY IF EXISTS "Merchants can update their products" ON products;
            CREATE POLICY "Merchants can update their products" ON products
                FOR UPDATE USING (auth.uid()::text = merchant_id::text OR auth.role() = 'authenticated');

            DROP POLICY IF EXISTS "Merchants can delete their products" ON products;
            CREATE POLICY "Merchants can delete their products" ON products
                FOR DELETE USING (auth.uid()::text = merchant_id::text OR auth.role() = 'authenticated');
        END IF;
    EXCEPTION WHEN undefined_column THEN
        RAISE NOTICE 'Required columns do not exist for products RLS policies, skipping policy creation';
    END;
END $$;

-- RLS policies for product_images (conditional on table existing)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'product_images') THEN
        DROP POLICY IF EXISTS "Merchants can view their product images" ON product_images;
        CREATE POLICY "Merchants can view their product images" ON product_images
            FOR SELECT USING (auth.role() = 'authenticated');

        DROP POLICY IF EXISTS "Merchants can insert product images" ON product_images;
        CREATE POLICY "Merchants can insert product images" ON product_images
            FOR INSERT WITH CHECK (auth.role() = 'authenticated');

        DROP POLICY IF EXISTS "Merchants can delete product images" ON product_images;
        CREATE POLICY "Merchants can delete product images" ON product_images
            FOR DELETE USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- RLS policies for registration requests (conditional on tables existing)
DO $$
BEGIN
    BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vendor_registration_requests') THEN
            DROP POLICY IF EXISTS "Admins can view all registration requests" ON vendor_registration_requests;
            CREATE POLICY "Admins can view all registration requests" ON vendor_registration_requests
                FOR SELECT USING (auth.role() = 'authenticated');

            DROP POLICY IF EXISTS "Admins can update registration requests" ON vendor_registration_requests;
            CREATE POLICY "Admins can update registration requests" ON vendor_registration_requests
                FOR UPDATE USING (auth.role() = 'authenticated');
        END IF;
    EXCEPTION WHEN undefined_column THEN
        RAISE NOTICE 'Required columns do not exist for vendor_registration_requests RLS policies, skipping policy creation';
    END;
    
    BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'driver_registration_requests') THEN
            DROP POLICY IF EXISTS "Admins can view all driver registration requests" ON driver_registration_requests;
            CREATE POLICY "Admins can view all driver registration requests" ON driver_registration_requests
                FOR SELECT USING (auth.role() = 'authenticated');

            DROP POLICY IF EXISTS "Admins can update driver registration requests" ON driver_registration_requests;
            CREATE POLICY "Admins can update driver registration requests" ON driver_registration_requests
                FOR UPDATE USING (auth.role() = 'authenticated');
        END IF;
    EXCEPTION WHEN undefined_column THEN
        RAISE NOTICE 'Required columns do not exist for driver_registration_requests RLS policies, skipping policy creation';
    END;
END $$;

-- Add triggers for automatic timestamp updates on new tables (conditional on tables existing)
DO $$
BEGIN
    BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_users') THEN
            DROP TRIGGER IF EXISTS update_admin_users_updated_at ON admin_users;
            CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users
                FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        END IF;
    EXCEPTION WHEN undefined_function THEN
        RAISE NOTICE 'update_updated_at_column function does not exist, skipping admin_users trigger creation';
    END;
    
    BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_auth') THEN
            DROP TRIGGER IF EXISTS update_user_auth_updated_at ON user_auth;
            CREATE TRIGGER update_user_auth_updated_at BEFORE UPDATE ON user_auth
                FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        END IF;
    EXCEPTION WHEN undefined_function THEN
        RAISE NOTICE 'update_updated_at_column function does not exist, skipping user_auth trigger creation';
    END;
    
    BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') THEN
            DROP TRIGGER IF EXISTS update_products_updated_at ON products;
            CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
                FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        END IF;
    EXCEPTION WHEN undefined_function THEN
        RAISE NOTICE 'update_updated_at_column function does not exist, skipping products trigger creation';
    END;
    
    BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vendor_registration_requests') THEN
            DROP TRIGGER IF EXISTS update_vendor_registration_requests_updated_at ON vendor_registration_requests;
            CREATE TRIGGER update_vendor_registration_requests_updated_at BEFORE UPDATE ON vendor_registration_requests
                FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        END IF;
    EXCEPTION WHEN undefined_function THEN
        RAISE NOTICE 'update_updated_at_column function does not exist, skipping vendor_registration_requests trigger creation';
    END;
    
    BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'driver_registration_requests') THEN
            DROP TRIGGER IF EXISTS update_driver_registration_requests_updated_at ON driver_registration_requests;
            CREATE TRIGGER update_driver_registration_requests_updated_at BEFORE UPDATE ON driver_registration_requests
                FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        END IF;
    EXCEPTION WHEN undefined_function THEN
        RAISE NOTICE 'update_updated_at_column function does not exist, skipping driver_registration_requests trigger creation';
    END;
END $$;
