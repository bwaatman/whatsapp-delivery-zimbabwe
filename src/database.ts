import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables (temporary hardcoded for testing)
const supabaseUrl = process.env.SUPABASE_URL || 'https://jchlsknqqazpuzupdljt.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_jKI5NNmAIL94XAzVq6-iMA_I2GBuJ17';

console.log('Environment check:');
console.log('SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
console.log('SUPABASE_ANON_KEY:', supabaseKey ? '✅ Set' : '❌ Missing');

if (!supabaseUrl || !supabaseKey) {
  throw new Error(`Missing Supabase environment variables. SUPABASE_URL: ${supabaseUrl ? 'set' : 'missing'}, SUPABASE_ANON_KEY: ${supabaseKey ? 'set' : 'missing'}`);
}

// Create Supabase client
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);

// Test database connection
export async function testDatabaseConnection() {
  try {
    console.log('Testing Supabase connection...');
    
    // Test basic connection by checking if we can access the database
    const { data, error } = await supabase
      .from('merchants')
      .select('count')
      .limit(1);

    if (error) {
      console.error('Database connection error:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Database connection successful');
    return { success: true, message: 'Connection established' };
  } catch (err) {
    console.error('Database connection failed:', err);
    return { success: false, error: 'Connection failed' };
  }
}

// Verify database schema exists
export async function verifyDatabaseSchema() {
  const schemaCheck = {
    merchants: false,
    drivers: false,
    orders: false,
    postgis: false
  };

  try {
    // Check if PostGIS extension is enabled
    const { data: postgisCheck, error: postgisError } = await supabase
      .rpc('check_postgis_extension');

    if (!postgisError) {
      schemaCheck.postgis = true;
      console.log('✅ PostGIS extension verified');
    } else {
      console.log('⚠️ PostGIS extension check failed (may need manual verification)');
    }

    // Check merchants table
    const { data: merchantsCheck, error: merchantsError } = await supabase
      .from('merchants')
      .select('id')
      .limit(1);

    if (!merchantsError) {
      schemaCheck.merchants = true;
      console.log('✅ Merchants table verified');
    } else {
      console.log('❌ Merchants table error:', merchantsError.message);
    }

    // Check drivers table
    const { data: driversCheck, error: driversError } = await supabase
      .from('drivers')
      .select('id')
      .limit(1);

    if (!driversError) {
      schemaCheck.drivers = true;
      console.log('✅ Drivers table verified');
    } else {
      console.log('❌ Drivers table error:', driversError.message);
    }

    // Check orders table
    const { data: ordersCheck, error: ordersError } = await supabase
      .from('orders')
      .select('id')
      .limit(1);

    if (!ordersError) {
      schemaCheck.orders = true;
      console.log('✅ Orders table verified');
    } else {
      console.log('❌ Orders table error:', ordersError.message);
    }

    return schemaCheck;
  } catch (error) {
    console.error('Schema verification failed:', error);
    return schemaCheck;
  }
}

// Test basic database operations
export async function testDatabaseOperations() {
  const results = {
    insert: false,
    select: false,
    update: false,
    spatial: false
  };

  try {
    // Test INSERT operation
    const { data: newMerchant, error: insertError } = await supabase
      .from('merchants')
      .insert({
        name: 'Test Merchant',
        contact_phone: '+263123456789',
        active: true
      })
      .select()
      .single();

    if (!insertError && newMerchant) {
      results.insert = true;
      console.log('✅ INSERT operation successful');

      // Test SELECT operation
      const { data: merchant, error: selectError } = await supabase
        .from('merchants')
        .select('*')
        .eq('id', newMerchant.id)
        .single();

      if (!selectError && merchant) {
        results.select = true;
        console.log('✅ SELECT operation successful');

        // Test UPDATE operation
        const { data: updatedMerchant, error: updateError } = await supabase
          .from('merchants')
          .update({ name: 'Updated Test Merchant' })
          .eq('id', newMerchant.id)
          .select()
          .single();

        if (!updateError && updatedMerchant) {
          results.update = true;
          console.log('✅ UPDATE operation successful');

          // Test spatial operation (insert a driver with location)
          const { data: newDriver, error: driverError } = await supabase
            .from('drivers')
            .insert({
              name: 'Test Driver',
              phone: '+263987654321',
              current_location: `POINT(31.053 -17.829)`, // Harare coordinates
              is_available: true
            })
            .select()
            .single();

          if (!driverError && newDriver) {
            results.spatial = true;
            console.log('✅ Spatial operation successful');

            // Clean up test data
            await supabase.from('drivers').delete().eq('id', newDriver.id);
          } else {
            console.log('❌ Spatial operation failed:', driverError?.message);
          }
        } else {
          console.log('❌ UPDATE operation failed:', updateError?.message);
        }
      } else {
        console.log('❌ SELECT operation failed:', selectError?.message);
      }

      // Clean up test data
      await supabase.from('merchants').delete().eq('id', newMerchant.id);
    } else {
      console.log('❌ INSERT operation failed:', insertError?.message);
    }
  } catch (error) {
    console.error('Database operations test failed:', error);
  }

  return results;
}
