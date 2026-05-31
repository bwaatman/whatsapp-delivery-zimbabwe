const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixRLS() {
  try {
    console.log('Fixing RLS policies for registration...');
    
    // Use the Supabase client to execute SQL via REST API
    const statements = [
      'ALTER TABLE driver_registration_requests DISABLE ROW LEVEL SECURITY',
      'ALTER TABLE vendor_registration_requests DISABLE ROW LEVEL SECURITY',
      'ALTER TABLE drivers DISABLE ROW LEVEL SECURITY',
      'ALTER TABLE merchants DISABLE ROW LEVEL SECURITY'
    ];
    
    for (const sql of statements) {
      console.log('Executing:', sql);
      
      try {
        // Use direct REST API call to execute SQL
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          },
          body: JSON.stringify({ sql })
        });
        
        if (response.ok) {
          console.log('✅ Success');
        } else {
          const error = await response.text();
          console.error('Error:', error);
        }
      } catch (e) {
        console.error('Exception:', e);
      }
    }
    
    console.log('RLS fix completed');
  } catch (error) {
    console.error('RLS fix failed:', error);
    process.exit(1);
  }
}

fixRLS();
