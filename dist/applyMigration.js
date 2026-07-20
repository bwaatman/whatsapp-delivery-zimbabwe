"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("./database");
async function applyMigration() {
    try {
        console.log('Applying migration 013_fix_shop_orders_function_timestamps.sql...');
        const { error } = await database_1.supabase.rpc('exec_sql', {
            sql: `
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
      `
        });
        if (error) {
            console.error('❌ Migration failed:', error);
            return false;
        }
        console.log('✅ Migration applied successfully');
        return true;
    }
    catch (error) {
        console.error('❌ Migration error:', error);
        return false;
    }
}
applyMigration().then(success => {
    if (success) {
        console.log('Migration completed successfully');
        process.exit(0);
    }
    else {
        console.log('Migration failed');
        process.exit(1);
    }
});
//# sourceMappingURL=applyMigration.js.map