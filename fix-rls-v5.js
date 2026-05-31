const { createClient } = require('@supabase/supabase-js');
const { Client } = require('pg');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

async function fixRLS() {
  try {
    console.log('Fixing RLS policies for registration...');
    
    // Extract connection details from Supabase URL
    // Format: https://[project-id].supabase.co
    const projectId = supabaseUrl.replace('https://', '').split('.')[0];
    console.log('Project ID:', projectId);
    
    // Use the Supabase client to get the database connection string
    // We need to use the service role key to get admin access
    const statements = [
      'ALTER TABLE driver_registration_requests DISABLE ROW LEVEL SECURITY',
      'ALTER TABLE vendor_registration_requests DISABLE ROW LEVEL SECURITY',
      'ALTER TABLE drivers DISABLE ROW LEVEL SECURITY',
      'ALTER TABLE merchants DISABLE ROW LEVEL SECURITY'
    ];
    
    // Try using the Supabase client's direct SQL execution
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    for (const sql of statements) {
      console.log('Executing:', sql);
      
      try {
        // Try using the Supabase client's internal SQL execution
        const { data, error } = await supabase.rpc('exec_sql', { sql });
        
        if (error) {
          console.error('Error:', error);
        } else {
          console.log('✅ Success');
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
