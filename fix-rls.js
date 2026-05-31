const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixRLS() {
  try {
    console.log('Fixing RLS policies for registration...');
    
    // Disable RLS for registration tables to allow public registration
    const statements = [
      'ALTER TABLE driver_registration_requests DISABLE ROW LEVEL SECURITY',
      'ALTER TABLE vendor_registration_requests DISABLE ROW LEVEL SECURITY',
      'ALTER TABLE drivers DISABLE ROW LEVEL SECURITY',
      'ALTER TABLE merchants DISABLE ROW LEVEL SECURITY'
    ];
    
    for (const sql of statements) {
      console.log('Executing:', sql);
      const { data, error } = await supabase.rpc('exec_sql', { sql });
      
      if (error) {
        console.error('Error:', error);
        // Try alternative method
        try {
          const { error: altError } = await supabase.sql`${sql}`;
          if (altError) {
            console.error('Alternative method also failed:', altError);
          } else {
            console.log('✅ Success with alternative method');
          }
        } catch (e) {
          console.error('Alternative method exception:', e);
        }
      } else {
        console.log('✅ Success');
      }
    }
    
    console.log('RLS fix completed');
  } catch (error) {
    console.error('RLS fix failed:', error);
    process.exit(1);
  }
}

fixRLS();
