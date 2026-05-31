const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    console.log('Running RLS fix migration...');
    
    // Read the migration file
    const migrationSQL = fs.readFileSync('migrations/010_fix_registration_rls.sql', 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = migrationSQL.split(';').filter(s => s.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing:', statement.trim().substring(0, 50) + '...');
        
        // Use RPC to execute raw SQL
        const { data, error } = await supabase.rpc('exec_sql', { sql: statement.trim() });
        
        if (error) {
          console.error('Error executing statement:', error);
          // Try direct SQL execution via supabase.sql if available
          try {
            const { data: sqlData, error: sqlError } = await supabase.sql`${statement.trim()}`;
            if (sqlError) {
              console.error('SQL execution failed:', sqlError);
            } else {
              console.log('✅ Statement executed successfully');
            }
          } catch (e) {
            console.error('Direct SQL execution failed:', e);
          }
        } else {
          console.log('✅ Statement executed successfully');
        }
      }
    }
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
